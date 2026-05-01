/**
 * Scheduler Section
 */
window.Sections.scheduler = {
  async render() {
    const c = document.getElementById('schedulerContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('schedulerContent','⚙️','Configuración requerida',''); return; }
    showLoading('schedulerContent');
    try {
      const res = await api.getSchedules();
      const items = res.data || [];
      c.innerHTML = `
        <div class="toolbar">
          <button class="btn btn-primary" onclick="Sections.scheduler.showForm()">➕ Nueva programación</button>
          <button class="btn btn-secondary" onclick="Sections.scheduler.runNow()">▶️ Ejecutar scheduler</button>
          <button class="btn btn-secondary btn-sm" onclick="Sections.scheduler.render()">🔄</button>
        </div>
        <div class="card"><div class="table-wrap"><table>
          <thead><tr><th>Título</th><th>Destinatarios</th><th>Recurrencia</th><th>Próximo envío</th><th>Último envío</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>${items.length === 0 ? '<tr><td colspan="7" class="text-center text-muted">No hay programaciones</td></tr>' :
            items.map(s => `<tr>
              <td><strong>${escapeHtml(s.title)}</strong></td>
              <td class="text-sm">${escapeHtml((s.recipients||'').substring(0,30))}</td>
              <td>${getBadgeHtml(s.recurrence_type)}</td>
              <td class="text-sm">${formatDate(s.next_run_at)}</td>
              <td class="text-sm">${formatDate(s.last_run_at)}</td>
              <td>${getBadgeHtml(s.status)}</td>
              <td><button class="btn btn-sm btn-danger" onclick="Sections.scheduler.del('${escapeHtml(s.schedule_id)}')">🗑️</button></td>
            </tr>`).join('')}
          </tbody>
        </table></div></div>
      `;
    } catch (err) { showEmpty('schedulerContent','⚠️','Error',err.message); }
  },

  showForm() {
    Modal.open('Nueva programación', `
      <div class="form-group"><label>Título</label><input class="form-control" id="schTitle"></div>
      <div class="form-group"><label>Destinatarios (separados por coma)</label><input class="form-control" id="schRecipients" placeholder="51999888777,51998877666"></div>
      <div class="form-group"><label>Mensaje</label><textarea class="form-control" id="schMessage" rows="3"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Fecha y hora de inicio</label><input type="datetime-local" class="form-control" id="schDatetime"></div>
        <div class="form-group"><label>Recurrencia</label><select class="form-control" id="schRecurrence">
          <option value="once">Una vez</option><option value="daily">Diario</option><option value="weekly">Semanal</option><option value="monthly">Mensual</option><option value="every_n_days">Cada N días</option>
        </select></div>
      </div>
      <div class="form-group"><label>Cada N días (si aplica)</label><input type="number" class="form-control" id="schNDays" value="1"></div>
      <div class="form-group"><label>URL imagen (opcional)</label><input class="form-control" id="schFile"></div>
    `, `<button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button><button class="btn btn-primary" onclick="Sections.scheduler.create()">Crear</button>`);
  },

  async create() {
    try {
      const res = await api.createSchedule({
        title: document.getElementById('schTitle').value,
        recipients: document.getElementById('schRecipients').value,
        message_template: document.getElementById('schMessage').value,
        start_datetime: new Date(document.getElementById('schDatetime').value).toISOString(),
        recurrence_type: document.getElementById('schRecurrence').value,
        recurrence_rule: document.getElementById('schNDays').value,
        file_url: document.getElementById('schFile').value
      });
      if (res.success) { Toast.success('Programación creada'); Modal.close(); this.render(); }
      else Toast.error(res.error);
    } catch (err) { Toast.error(err.message); }
  },

  async del(id) {
    if (!confirm('¿Eliminar esta programación?')) return;
    try { await api.deleteSchedule(id); Toast.success('Eliminada'); this.render(); }
    catch (err) { Toast.error(err.message); }
  },

  async runNow() {
    try {
      const res = await api.runSchedulerManual();
      Toast.success(`Scheduler ejecutado. Procesados: ${res.processed || 0}, Errores: ${res.errors || 0}`);
      this.render();
    } catch (err) { Toast.error(err.message); }
  }
};
