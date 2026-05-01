/**
 * Templates Section
 */
window.Sections.templates = {
  async render() {
    const c = document.getElementById('templatesContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('templatesContent','⚙️','Configuración requerida',''); return; }
    showLoading('templatesContent');
    try {
      const res = await api.getTemplates();
      const items = res.data || [];
      c.innerHTML = `
        <div class="toolbar">
          <button class="btn btn-primary" onclick="Sections.templates.showForm()">➕ Nueva plantilla</button>
          <button class="btn btn-secondary btn-sm" onclick="Sections.templates.render()">🔄</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">
          ${items.length===0?'<div class="card"><div class="empty-state"><p>No hay plantillas</p></div></div>':
            items.map(t => `
              <div class="card">
                <div class="card-header">
                  <h3>${escapeHtml(t.name)}</h3>
                  <span class="badge badge-active">${escapeHtml(t.category)}</span>
                </div>
                <div class="preview-box" style="font-size:12.5px;min-height:60px">${escapeHtml(t.message)}</div>
                ${t.file_url ? `<p class="text-sm mt-8">📷 ${escapeHtml(t.file_url)}</p>` : ''}
                ${t.document_url ? `<p class="text-sm mt-8">📄 ${escapeHtml(t.document_url)}</p>` : ''}
                <div class="flex gap-8 mt-16">
                  <button class="btn btn-sm btn-secondary" onclick="Sections.templates.edit('${escapeHtml(t.template_id)}','${escapeHtml(t.name)}','${escapeHtml(t.category)}',\`${escapeHtml(t.message)}\`)">✏️ Editar</button>
                  <button class="btn btn-sm btn-danger" onclick="Sections.templates.del('${escapeHtml(t.template_id)}')">🗑️</button>
                </div>
              </div>
            `).join('')}
        </div>
      `;
    } catch (err) { showEmpty('templatesContent','⚠️','Error',err.message); }
  },

  showForm(id, name, cat, msg) {
    Modal.open(id ? 'Editar plantilla' : 'Nueva plantilla', `
      <div class="form-group"><label>Nombre</label><input class="form-control" id="tplName" value="${escapeHtml(name||'')}"></div>
      <div class="form-group"><label>Categoría</label><select class="form-control" id="tplCat">
        <option value="general" ${cat==='general'?'selected':''}>General</option>
        <option value="seguimiento" ${cat==='seguimiento'?'selected':''}>Seguimiento</option>
        <option value="notificación" ${cat==='notificación'?'selected':''}>Notificación</option>
        <option value="marketing" ${cat==='marketing'?'selected':''}>Marketing</option>
        <option value="soporte" ${cat==='soporte'?'selected':''}>Soporte</option>
      </select></div>
      <div class="form-group"><label>Mensaje</label><textarea class="form-control" id="tplMsg" rows="4">${escapeHtml(msg||'')}</textarea>
        <div class="form-hint">Variables: {{whatsapp_name}}, {{company_name}}, {{today}}, {{time}}</div></div>
      <div class="form-group"><label>URL imagen (opcional)</label><input class="form-control" id="tplFile"></div>
      <div class="form-group"><label>URL documento (opcional)</label><input class="form-control" id="tplDoc"></div>
      <input type="hidden" id="tplId" value="${id||''}">
    `, `<button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button><button class="btn btn-primary" onclick="Sections.templates.save()">Guardar</button>`);
  },

  edit(id, name, cat, msg) { this.showForm(id, name, cat, msg); },

  async save() {
    const id = document.getElementById('tplId').value;
    const data = {
      name: document.getElementById('tplName').value,
      category: document.getElementById('tplCat').value,
      message: document.getElementById('tplMsg').value,
      file_url: document.getElementById('tplFile').value,
      document_url: document.getElementById('tplDoc').value
    };
    try {
      const res = id ? await api.updateTemplate(id, data) : await api.createTemplate(data);
      if (res.success) { Toast.success(id ? 'Plantilla actualizada' : 'Plantilla creada'); Modal.close(); this.render(); }
      else Toast.error(res.error);
    } catch (err) { Toast.error(err.message); }
  },

  async del(id) {
    if (!confirm('¿Eliminar plantilla?')) return;
    try { await api.deleteTemplate(id); Toast.success('Eliminada'); this.render(); }
    catch (err) { Toast.error(err.message); }
  }
};
