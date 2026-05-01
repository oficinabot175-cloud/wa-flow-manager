/**
 * Scheduler Section — Programa envíos automáticos
 */
window.Sections.scheduler = {
  async render() {
    const c = document.getElementById('schedulerContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('schedulerContent','⚙️','Configuración requerida','Configura el backend primero.'); return; }
    showLoading('schedulerContent');
    try {
      const res = await api.getSchedules();
      const items = res.data || [];

      c.innerHTML = `
        <div class="toolbar">
          <button class="btn btn-primary" onclick="Sections.scheduler.showForm()">➕ Nueva programación</button>
          <button class="btn btn-secondary" onclick="Sections.scheduler.runNow()">▶️ Ejecutar ahora</button>
          <button class="btn btn-secondary btn-sm" onclick="Sections.scheduler.render()">🔄</button>
        </div>
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Destinatarios</th>
                  <th>Mensaje</th>
                  <th>Recurrencia</th>
                  <th>Próximo envío</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${items.length === 0
                  ? '<tr><td colspan="7" class="text-center text-muted" style="padding:40px">No hay programaciones aún</td></tr>'
                  : items.map(s => {
                      // Safely convert recipients to string for display
                      let recip = '';
                      if (s.recipients) {
                        recip = Array.isArray(s.recipients)
                          ? s.recipients.join(', ')
                          : String(s.recipients);
                      }
                      const recipShort = recip.length > 35 ? recip.substring(0, 35) + '...' : recip;

                      // Safely convert message
                      let msg = s.message_template ? String(s.message_template) : '';
                      const msgShort = msg.length > 40 ? msg.substring(0, 40) + '...' : msg;

                      return `<tr>
                        <td><strong>${escapeHtml(String(s.title || ''))}</strong></td>
                        <td class="text-sm">${escapeHtml(recipShort)}</td>
                        <td class="text-sm text-muted">${escapeHtml(msgShort)}</td>
                        <td>${getBadgeHtml(String(s.recurrence_type || 'once'))}</td>
                        <td class="text-sm">${formatDate(s.next_run_at)}</td>
                        <td>${getBadgeHtml(String(s.status || 'pending'))}</td>
                        <td>
                          <button class="btn btn-sm btn-danger" onclick="Sections.scheduler.del('${escapeHtml(String(s.schedule_id))}')">🗑️</button>
                        </td>
                      </tr>`;
                    }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-sm text-muted mt-8">Total: ${items.length} programaciones</p>
      `;
    } catch (err) {
      showEmpty('schedulerContent', '⚠️', 'Error al cargar programaciones', err.message);
    }
  },

  showForm() {
    // Set default datetime to now + 1 hour
    const dt = new Date(Date.now() + 3600000);
    const dtLocal = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    Modal.open('➕ Nueva programación', `
      <div class="form-group">
        <label>Título de la programación <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="schTitle" placeholder="Ej: Recordatorio semanal">
      </div>
      <div class="form-group">
        <label>Destinatarios <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="schRecipients" placeholder="51999888777, 51998877666">
        <div class="form-hint">Números separados por coma, con código de país</div>
      </div>
      <div class="form-group">
        <label>Mensaje <span style="color:var(--danger)">*</span></label>
        <textarea class="form-control" id="schMessage" rows="4" placeholder="Hola {{whatsapp_name}}, te recordamos..."></textarea>
        <div class="form-hint">Variables disponibles: {{whatsapp_name}}, {{company_name}}, {{today}}, {{time}}</div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Fecha y hora de inicio</label>
          <input type="datetime-local" class="form-control" id="schDatetime" value="${dtLocal}">
        </div>
        <div class="form-group">
          <label>Recurrencia</label>
          <select class="form-control" id="schRecurrence" onchange="Sections.scheduler.toggleNDays()">
            <option value="once">Una sola vez</option>
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="every_n_days">Cada N días</option>
          </select>
        </div>
      </div>
      <div class="form-group" id="nDaysGroup" style="display:none">
        <label>Cada cuántos días</label>
        <input type="number" class="form-control" id="schNDays" value="7" min="1">
      </div>
      <div class="form-group">
        <label>URL de imagen adjunta (opcional)</label>
        <input type="url" class="form-control" id="schFile" placeholder="https://...">
      </div>
    `,
    `<button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
     <button class="btn btn-primary" onclick="Sections.scheduler.create()">✅ Crear programación</button>`);
  },

  toggleNDays() {
    const rec = document.getElementById('schRecurrence')?.value;
    const grp = document.getElementById('nDaysGroup');
    if (grp) grp.style.display = rec === 'every_n_days' ? '' : 'none';
  },

  async create() {
    const title = document.getElementById('schTitle')?.value?.trim();
    const recipients = document.getElementById('schRecipients')?.value?.trim();
    const message = document.getElementById('schMessage')?.value?.trim();
    const datetimeVal = document.getElementById('schDatetime')?.value;

    if (!title) { Toast.error('El título es obligatorio'); return; }
    if (!recipients) { Toast.error('Debes ingresar al menos un destinatario'); return; }
    if (!message) { Toast.error('El mensaje es obligatorio'); return; }

    let startDatetime;
    try {
      startDatetime = datetimeVal ? new Date(datetimeVal).toISOString() : new Date().toISOString();
    } catch (e) {
      startDatetime = new Date().toISOString();
    }

    try {
      const res = await api.createSchedule({
        title,
        recipients,
        message_template: message,
        start_datetime: startDatetime,
        recurrence_type: document.getElementById('schRecurrence')?.value || 'once',
        recurrence_rule: document.getElementById('schNDays')?.value || '1',
        file_url: document.getElementById('schFile')?.value?.trim() || ''
      });

      if (res.success) {
        Toast.success('Programación creada correctamente');
        Modal.close();
        this.render();
      } else {
        Toast.error(res.error || 'Error al crear programación');
      }
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async del(id) {
    if (!confirm('¿Eliminar esta programación? Esta acción no se puede deshacer.')) return;
    try {
      await api.deleteSchedule(id);
      Toast.success('Programación eliminada');
      this.render();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async runNow() {
    Toast.info('Ejecutando scheduler...');
    try {
      const res = await api.runSchedulerManual();
      if (res.success !== false) {
        Toast.success(`✅ Ejecutado. Procesados: ${res.processed || 0} | Errores: ${res.errors || 0}`);
      } else {
        Toast.error(res.error || 'Error al ejecutar');
      }
      this.render();
    } catch (err) {
      Toast.error(err.message);
    }
  }
};
