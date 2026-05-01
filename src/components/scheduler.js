/**
 * Scheduler Section — Programa envíos con selector de contactos
 */
window.Sections.scheduler = {
  _contacts: [], // cache de contactos

  async render() {
    const c = document.getElementById('schedulerContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('schedulerContent','⚙️','Configuración requerida','Inicia sesión para continuar.'); return; }
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
                  ? '<tr><td colspan="7" class="text-center text-muted" style="padding:40px">No hay programaciones aún. Crea una con el botón ➕</td></tr>'
                  : items.map(s => {
                      let recip = Array.isArray(s.recipients) ? s.recipients.join('; ') : String(s.recipients || '');
                      const recipShort = recip.length > 40 ? recip.substring(0, 40) + '…' : recip;
                      let msg = String(s.message_template || '');
                      const msgShort = msg.length > 45 ? msg.substring(0, 45) + '…' : msg;
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
      showEmpty('schedulerContent', '⚠️', 'Error al cargar', err.message);
    }
  },

  async showForm() {
    // Precargar contactos para el selector
    try {
      const res = await api.getContacts({ limit: 500 });
      this._contacts = (res.data || []).filter(ct => String(ct.do_not_contact) !== 'true');
    } catch (e) {
      this._contacts = [];
    }

    const dt = new Date(Date.now() + 3600000);
    const dtLocal = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const contactOptions = this._contacts.length > 0
      ? this._contacts.map(ct => `
          <label class="contact-check-item" style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer;border:1px solid var(--border);margin-bottom:6px">
            <input type="checkbox" class="schContactCheck" value="${escapeHtml(ct.phone)}" style="width:16px;height:16px;accent-color:var(--accent-green)">
            <span>
              <strong>${escapeHtml(ct.display_name || ct.whatsapp_name || ct.phone)}</strong>
              <span class="text-muted" style="font-size:11px"> — ${escapeHtml(ct.phone)}</span>
              ${ct.tags ? `<span class="badge badge-active" style="font-size:9px;margin-left:4px">${escapeHtml(ct.tags)}</span>` : ''}
            </span>
          </label>`).join('')
      : '<p class="text-sm text-muted">No hay contactos registrados aún.</p>';

    Modal.open('➕ Nueva programación', `
      <style>
        .recipient-tabs { display:flex; gap:0; border-bottom:1px solid var(--border); margin-bottom:16px; }
        .recipient-tab { padding:8px 18px; font-size:13px; font-weight:500; color:var(--text-secondary); cursor:pointer; border-bottom:2px solid transparent; transition:all .15s; }
        .recipient-tab.active { color:var(--accent-green); border-bottom-color:var(--accent-green); font-weight:600; }
        .recipient-panel { display:none; }
        .recipient-panel.active { display:block; }
        .contact-check-list { max-height:200px; overflow-y:auto; padding:4px 2px; }
        .search-contacts { width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:8px; font-family:inherit; font-size:13px; margin-bottom:10px; outline:none; }
        .search-contacts:focus { border-color:var(--accent-green); }
        .select-all-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
      </style>

      <div class="form-group">
        <label>Título <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="schTitle" placeholder="Ej: Recordatorio semanal">
      </div>

      <div class="form-group">
        <label>Destinatarios <span style="color:var(--danger)">*</span></label>
        <div class="recipient-tabs">
          <div class="recipient-tab active" onclick="Sections.scheduler.switchTab('manual')" id="tabManual">✍️ Manual</div>
          <div class="recipient-tab" onclick="Sections.scheduler.switchTab('contacts')" id="tabContacts">👥 Seleccionar contactos (${this._contacts.length})</div>
        </div>

        <!-- Panel Manual -->
        <div class="recipient-panel active" id="panelManual">
          <textarea class="form-control" id="schRecipientsManual" rows="3"
            placeholder="Escribe los números separados por punto y coma (;)&#10;Ej: 51999888777;51998877666;51997766555"></textarea>
          <div class="form-hint">Formato: número completo con código de país, separados por <strong>;</strong></div>
        </div>

        <!-- Panel Contactos registrados -->
        <div class="recipient-panel" id="panelContacts">
          <div class="select-all-row">
            <span class="text-sm text-muted" id="selectedCount">0 seleccionados</span>
            <div style="display:flex;gap:8px">
              <button class="btn btn-sm btn-secondary" type="button" onclick="Sections.scheduler.selectAll(true)">Todos</button>
              <button class="btn btn-sm btn-secondary" type="button" onclick="Sections.scheduler.selectAll(false)">Ninguno</button>
            </div>
          </div>
          <input type="text" class="search-contacts" placeholder="🔍 Buscar contacto..." oninput="Sections.scheduler.filterContacts(this.value)">
          <div class="contact-check-list" id="contactCheckList">
            ${contactOptions}
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Mensaje <span style="color:var(--danger)">*</span></label>
        <textarea class="form-control" id="schMessage" rows="4" placeholder="Hola {{whatsapp_name}}, te recordamos..."></textarea>
        <div class="form-hint">Variables: {{whatsapp_name}}, {{company_name}}, {{today}}, {{time}}</div>
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

    // Bind checkbox counter
    setTimeout(() => {
      document.querySelectorAll('.schContactCheck').forEach(cb => {
        cb.addEventListener('change', () => this.updateSelectedCount());
      });
    }, 100);
  },

  switchTab(tab) {
    document.getElementById('tabManual').classList.toggle('active', tab === 'manual');
    document.getElementById('tabContacts').classList.toggle('active', tab === 'contacts');
    document.getElementById('panelManual').classList.toggle('active', tab === 'manual');
    document.getElementById('panelContacts').classList.toggle('active', tab === 'contacts');
  },

  filterContacts(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#contactCheckList .contact-check-item').forEach(item => {
      item.style.display = !q || item.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  selectAll(checked) {
    document.querySelectorAll('.schContactCheck').forEach(cb => { cb.checked = checked; });
    this.updateSelectedCount();
  },

  updateSelectedCount() {
    const count = document.querySelectorAll('.schContactCheck:checked').length;
    const el = document.getElementById('selectedCount');
    if (el) el.textContent = `${count} seleccionados`;
  },

  toggleNDays() {
    const rec = document.getElementById('schRecurrence')?.value;
    const grp = document.getElementById('nDaysGroup');
    if (grp) grp.style.display = rec === 'every_n_days' ? '' : 'none';
  },

  getRecipientsString() {
    const manualPanel   = document.getElementById('panelManual');
    const contactsPanel = document.getElementById('panelContacts');

    if (manualPanel?.classList.contains('active')) {
      // Modo manual: separados por ;
      return (document.getElementById('schRecipientsManual')?.value || '')
        .split(';').map(n => n.replace(/\D/g,'').trim()).filter(n => n.length > 5).join(',');
    } else {
      // Modo contactos: checkboxes seleccionados
      return Array.from(document.querySelectorAll('.schContactCheck:checked')).map(cb => cb.value).join(',');
    }
  },

  async create() {
    const title     = document.getElementById('schTitle')?.value?.trim();
    const recipients = this.getRecipientsString();
    const message   = document.getElementById('schMessage')?.value?.trim();
    const dtVal     = document.getElementById('schDatetime')?.value;

    if (!title)      { Toast.error('El título es obligatorio'); return; }
    if (!recipients) { Toast.error('Debes seleccionar o ingresar al menos un destinatario'); return; }
    if (!message)    { Toast.error('El mensaje es obligatorio'); return; }

    let startDatetime;
    try { startDatetime = dtVal ? new Date(dtVal).toISOString() : new Date().toISOString(); }
    catch (e) { startDatetime = new Date().toISOString(); }

    try {
      const res = await api.createSchedule({
        title, recipients, message_template: message,
        start_datetime: startDatetime,
        recurrence_type: document.getElementById('schRecurrence')?.value || 'once',
        recurrence_rule: document.getElementById('schNDays')?.value || '1',
        file_url: document.getElementById('schFile')?.value?.trim() || ''
      });
      if (res.success) { Toast.success('Programación creada correctamente'); Modal.close(); this.render(); }
      else Toast.error(res.error || 'Error al crear');
    } catch (err) { Toast.error(err.message); }
  },

  async del(id) {
    if (!confirm('¿Eliminar esta programación?')) return;
    try { await api.deleteSchedule(id); Toast.success('Eliminada'); this.render(); }
    catch (err) { Toast.error(err.message); }
  },

  async runNow() {
    Toast.info('Ejecutando scheduler...');
    try {
      const res = await api.runSchedulerManual();
      Toast.success(`✅ Ejecutado. Procesados: ${res.processed || 0} | Errores: ${res.errors || 0}`);
      this.render();
    } catch (err) { Toast.error(err.message); }
  }
};
