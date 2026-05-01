/**
 * Campaigns Section
 */
window.Sections.campaigns = {
  async render() {
    const c = document.getElementById('campaignsContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('campaignsContent','⚙️','Configuración requerida',''); return; }
    showLoading('campaignsContent');
    try {
      const res = await api.getCampaigns();
      const items = res.data || [];
      c.innerHTML = `
        <div class="toolbar">
          <button class="btn btn-primary" onclick="Sections.campaigns.showForm()">➕ Nueva campaña</button>
          <button class="btn btn-secondary btn-sm" onclick="Sections.campaigns.render()">🔄</button>
        </div>
        <div class="card"><div class="table-wrap"><table>
          <thead><tr><th>Nombre</th><th>Audiencia</th><th>Destinatarios</th><th>Enviados</th><th>Fallidos</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>${items.length===0?'<tr><td colspan="7" class="text-center text-muted">No hay campañas</td></tr>':
            items.map(cp => `<tr>
              <td><strong>${escapeHtml(cp.name)}</strong><div class="text-sm text-muted">${escapeHtml(cp.description||'')}</div></td>
              <td>${escapeHtml(cp.audience_filter||'Todos')}</td>
              <td>${cp.total_recipients}</td>
              <td>${cp.sent_count}</td>
              <td>${cp.failed_count}</td>
              <td>${getBadgeHtml(cp.status)}</td>
              <td class="flex gap-8">
                ${cp.status==='draft'?`<button class="btn btn-sm btn-primary" onclick="Sections.campaigns.execute('${escapeHtml(cp.campaign_id)}')">🚀 Enviar</button>`:''}
                <button class="btn btn-sm btn-danger" onclick="Sections.campaigns.del('${escapeHtml(cp.campaign_id)}')">🗑️</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table></div></div>
      `;
    } catch (err) { showEmpty('campaignsContent','⚠️','Error',err.message); }
  },

  showForm() {
    Modal.open('Nueva campaña', `
      <div class="form-group"><label>Nombre</label><input class="form-control" id="cmpName"></div>
      <div class="form-group"><label>Descripción</label><input class="form-control" id="cmpDesc"></div>
      <div class="form-group"><label>Filtro de audiencia (etiqueta)</label><input class="form-control" id="cmpAudience" placeholder="Dejar vacío para todos los contactos"></div>
      <div class="form-group"><label>Mensaje</label><textarea class="form-control" id="cmpMessage" rows="4" placeholder="Hola {{whatsapp_name}}, ..."></textarea></div>
    `, `<button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button><button class="btn btn-primary" onclick="Sections.campaigns.create()">Crear</button>`);
  },

  async create() {
    try {
      const res = await api.createCampaign({
        name: document.getElementById('cmpName').value,
        description: document.getElementById('cmpDesc').value,
        audience_filter: document.getElementById('cmpAudience').value,
        message_template: document.getElementById('cmpMessage').value
      });
      if (res.success) { Toast.success('Campaña creada'); Modal.close(); this.render(); }
      else Toast.error(res.error);
    } catch (err) { Toast.error(err.message); }
  },

  async execute(id) {
    if (!confirm('¿Ejecutar esta campaña? Se enviarán mensajes a todos los destinatarios filtrados.')) return;
    Toast.info('Ejecutando campaña...');
    try {
      const res = await api.executeCampaign(id);
      if (res.success) Toast.success(`Campaña ejecutada. Enviados: ${res.sent}, Fallidos: ${res.failed}`);
      else Toast.error(res.error);
      this.render();
    } catch (err) { Toast.error(err.message); }
  },

  async del(id) {
    if (!confirm('¿Eliminar campaña?')) return;
    try { await api.deleteCampaign(id); Toast.success('Eliminada'); this.render(); }
    catch (err) { Toast.error(err.message); }
  }
};
