/**
 * Automations Section — Rule builder
 */
window.Sections.automations = {
  async render() {
    const c = document.getElementById('automationsContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('automationsContent','⚙️','Configuración requerida',''); return; }
    showLoading('automationsContent');
    try {
      const res = await api.getRules();
      const rules = res.data || [];
      c.innerHTML = `
        <div class="toolbar">
          <button class="btn btn-primary" onclick="Sections.automations.showForm()">➕ Nueva regla</button>
          <button class="btn btn-secondary btn-sm" onclick="Sections.automations.render()">🔄</button>
        </div>
        <div class="card"><div class="table-wrap"><table>
          <thead><tr><th>Prioridad</th><th>Nombre</th><th>Palabra clave</th><th>Match</th><th>Respuesta</th><th>Marca estado</th><th>Activa</th><th>Acciones</th></tr></thead>
          <tbody>${rules.length === 0 ? '<tr><td colspan="8" class="text-center text-muted">No hay reglas</td></tr>' :
            rules.map(r => `<tr>
              <td>${r.priority}</td>
              <td><strong>${escapeHtml(r.rule_name)}</strong></td>
              <td><code>${escapeHtml(r.keyword)}</code></td>
              <td>${getBadgeHtml(r.match_type)}</td>
              <td class="truncate" style="max-width:200px">${escapeHtml(r.response_template)}</td>
              <td>${r.mark_status ? getBadgeHtml(r.mark_status) : '—'}</td>
              <td>
                <label class="toggle"><input type="checkbox" ${String(r.enabled)==='true'?'checked':''} onchange="Sections.automations.toggleRule('${escapeHtml(r.rule_id)}',this.checked)"><span class="toggle-slider"></span></label>
              </td>
              <td class="flex gap-8">
                <button class="btn btn-sm btn-secondary" onclick="Sections.automations.showTest('${escapeHtml(r.rule_id)}')">🧪</button>
                <button class="btn btn-sm btn-danger" onclick="Sections.automations.del('${escapeHtml(r.rule_id)}')">🗑️</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table></div></div>
      `;
    } catch (err) { showEmpty('automationsContent','⚠️','Error',err.message); }
  },

  showForm() {
    Modal.open('Nueva regla de automatización', `
      <div class="form-group"><label>Nombre de la regla</label><input class="form-control" id="rName"></div>
      <div class="form-row">
        <div class="form-group"><label>Prioridad (1=más alta)</label><input type="number" class="form-control" id="rPriority" value="10"></div>
        <div class="form-group"><label>Tipo de match</label><select class="form-control" id="rMatchType">
          <option value="contains">Contiene</option><option value="exact">Exacto</option><option value="starts_with">Inicia con</option><option value="ends_with">Termina con</option><option value="regex">Regex</option>
        </select></div>
      </div>
      <div class="form-group"><label>Palabra clave</label><input class="form-control" id="rKeyword" placeholder="hola"></div>
      <div class="form-group"><label>Respuesta</label><textarea class="form-control" id="rResponse" rows="3" placeholder="Hola {{whatsapp_name}}, gracias por escribirnos."></textarea>
        <div class="form-hint">Variables: {{whatsapp_name}}, {{company_name}}, {{today}}, {{time}}, {{phone}}</div></div>
      <div class="form-row">
        <div class="form-group"><label>Etiquetas a agregar</label><input class="form-control" id="rTags" placeholder="prospecto,interesado"></div>
        <div class="form-group"><label>Marcar estado</label><select class="form-control" id="rMarkStatus">
          <option value="">Ninguno</option><option value="needs-human">Requiere humano</option><option value="resolved">Atendido</option><option value="do_not_contact">No contactar</option>
        </select></div>
      </div>
    `, `<button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button><button class="btn btn-primary" onclick="Sections.automations.create()">Crear regla</button>`);
  },

  async create() {
    try {
      const res = await api.createRule({
        rule_name: document.getElementById('rName').value,
        priority: document.getElementById('rPriority').value,
        match_type: document.getElementById('rMatchType').value,
        keyword: document.getElementById('rKeyword').value,
        response_template: document.getElementById('rResponse').value,
        tags_to_add: document.getElementById('rTags').value,
        mark_status: document.getElementById('rMarkStatus').value
      });
      if (res.success) { Toast.success('Regla creada'); Modal.close(); this.render(); }
      else Toast.error(res.error);
    } catch (err) { Toast.error(err.message); }
  },

  async toggleRule(id, enabled) {
    try { await api.updateRule(id, { enabled: String(enabled) }); Toast.success(enabled ? 'Regla activada' : 'Regla desactivada'); }
    catch (err) { Toast.error(err.message); }
  },

  async del(id) {
    if (!confirm('¿Eliminar esta regla?')) return;
    try { await api.deleteRule(id); Toast.success('Regla eliminada'); this.render(); }
    catch (err) { Toast.error(err.message); }
  },

  showTest(ruleId) {
    Modal.open('Probar regla', `
      <div class="form-group"><label>Mensaje de prueba</label><input class="form-control" id="testMsg" placeholder="Escribe un mensaje de prueba..."></div>
      <div id="testResult" class="mt-16"></div>
    `, `<button class="btn btn-secondary" onclick="Modal.close()">Cerrar</button><button class="btn btn-primary" onclick="Sections.automations.runTest('${ruleId}')">Probar</button>`);
  },

  async runTest(ruleId) {
    const msg = document.getElementById('testMsg')?.value;
    if (!msg) { Toast.warning('Escribe un mensaje'); return; }
    const el = document.getElementById('testResult');
    try {
      const res = await api.testRule(ruleId, msg);
      el.innerHTML = `<div class="card" style="background:${res.matched?'#F0FFF4':'#FEF2F2'}">
        <p><strong>${res.matched ? '✅ Coincide' : '❌ No coincide'}</strong></p>
        ${res.matched ? `<p class="text-sm mt-8"><strong>Respuesta:</strong></p><div class="preview-box mt-8">${escapeHtml(res.response)}</div>` : ''}
        <p class="text-sm text-muted mt-8">Match type: ${res.matchType} | Keyword: "${res.keyword}"</p>
      </div>`;
    } catch (err) { el.innerHTML = `<p class="text-sm" style="color:var(--danger)">${err.message}</p>`; }
  }
};
