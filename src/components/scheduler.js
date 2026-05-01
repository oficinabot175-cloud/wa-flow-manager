/**
 * Scheduler Section — con selector de plantillas + botones de variables
 */
window.Sections.scheduler = {
  _contacts: [],
  _templates: [],

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
          <button class="btn btn-secondary" onclick="Sections.scheduler.runNow()">▶️ Ejecutar ahora</button>
          <button class="btn btn-secondary btn-sm" onclick="Sections.scheduler.render()" title="Actualizar lista">🔄</button>
        </div>
        <div class="info-box" style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:12.5px;color:#1D4ED8">
          ⏰ <strong>Ejecución automática:</strong> Para que los mensajes se envíen solos, debes activar el trigger en Apps Script.
          Ve al editor de Apps Script → selecciona la función <code style="background:#DBEAFE;padding:1px 6px;border-radius:4px">createSchedulerTrigger</code> → click en ▶️ Ejecutar. Solo se hace una vez.
        </div>
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th>Título</th><th>Destinatarios</th><th>Mensaje</th>
                <th>Recurrencia</th><th>Próximo envío</th><th>Estado</th><th>Acciones</th>
              </tr></thead>
              <tbody>
                ${items.length === 0
                  ? '<tr><td colspan="7" class="text-center text-muted" style="padding:40px">No hay programaciones. Crea una con ➕</td></tr>'
                  : items.map(s => {
                      const recip = Array.isArray(s.recipients) ? s.recipients.join('; ') : String(s.recipients || '');
                      const recipShort = recip.length > 35 ? recip.substring(0, 35) + '…' : recip;
                      const msg = String(s.message_template || '');
                      const msgShort = msg.length > 45 ? msg.substring(0, 45) + '…' : msg;
                      return `<tr>
                        <td><strong>${escapeHtml(String(s.title || ''))}</strong></td>
                        <td class="text-sm">${escapeHtml(recipShort)}</td>
                        <td class="text-sm text-muted">${escapeHtml(msgShort)}</td>
                        <td>${getBadgeHtml(String(s.recurrence_type || 'once'))}</td>
                        <td class="text-sm">${formatDate(s.next_run_at)}</td>
                        <td>${getBadgeHtml(String(s.status || 'active'))}</td>
                        <td><button class="btn btn-sm btn-danger" onclick="Sections.scheduler.del('${escapeHtml(String(s.schedule_id))}')">🗑️</button></td>
                      </tr>`;
                    }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-sm text-muted mt-8">Total: ${items.length} programaciones</p>
      `;
    } catch (err) {
      showEmpty('schedulerContent','⚠️','Error',err.message);
    }
  },

  async showForm() {
    // Cargar contactos y plantillas en paralelo
    try {
      const [ctRes, tplRes] = await Promise.all([
        api.getContacts({ limit: 500 }),
        api.getTemplates()
      ]);
      this._contacts  = (ctRes.data  || []).filter(ct => String(ct.do_not_contact) !== 'true');
      this._templates = (tplRes.data || []).filter(t => String(t.status) === 'active');
    } catch (e) {
      this._contacts = []; this._templates = [];
    }

    const dt      = new Date(Date.now() + 3600000);
    const dtLocal = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const contactItems = this._contacts.length > 0
      ? this._contacts.map(ct => `
          <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;cursor:pointer;border:1px solid var(--border);margin-bottom:6px;transition:background .1s"
                 onmouseover="this.style.background='var(--border-light)'" onmouseout="this.style.background=''">
            <input type="checkbox" class="schContactCheck" value="${escapeHtml(ct.phone)}"
                   data-name="${escapeHtml(ct.display_name || ct.whatsapp_name || ct.phone)}"
                   style="width:15px;height:15px;accent-color:var(--accent-green)" onchange="Sections.scheduler.updateCount()">
            <span style="flex:1;min-width:0">
              <strong style="font-size:13px">${escapeHtml(ct.display_name || ct.whatsapp_name || ct.phone)}</strong>
              <span class="text-muted" style="font-size:11px"> — ${escapeHtml(ct.phone)}</span>
              ${ct.tags ? `<span class="badge badge-active" style="font-size:9px;margin-left:4px">${escapeHtml(String(ct.tags).split(',')[0])}</span>` : ''}
            </span>
          </label>`)
        .join('')
      : '<p class="text-sm text-muted">No hay contactos registrados.</p>';

    const templateOptions = this._templates.length > 0
      ? `<option value="">— Escribe un mensaje propio —</option>` +
        this._templates.map(t => `<option value="${escapeHtml(String(t.template_id))}"
          data-msg="${escapeHtml(String(t.message || ''))}">${escapeHtml(String(t.name || ''))}</option>`).join('')
      : '<option value="">No hay plantillas activas</option>';

    Modal.open('➕ Nueva programación', `
      <style>
        .sch-tabs{display:flex;border-bottom:1px solid var(--border);margin-bottom:12px}
        .sch-tab{padding:8px 16px;font-size:13px;font-weight:500;color:var(--text-secondary);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s}
        .sch-tab.active{color:var(--accent-green);border-color:var(--accent-green);font-weight:600}
        .sch-panel{display:none}.sch-panel.active{display:block}
        .var-btn{padding:4px 10px;border:1px solid var(--border);border-radius:20px;background:var(--bg);font-size:11.5px;cursor:pointer;font-family:var(--font);transition:all .15s;margin:3px 2px;display:inline-block}
        .var-btn:hover{background:var(--accent-green);color:#fff;border-color:var(--accent-green)}
        .ct-list{max-height:180px;overflow-y:auto;padding:2px}
        .ct-search{width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-family:var(--font);font-size:13px;margin-bottom:8px;outline:none}
        .ct-search:focus{border-color:var(--accent-green)}
      </style>

      <div class="form-group">
        <label>Título <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="schTitle" placeholder="Ej: Recordatorio semanal clientes">
      </div>

      <!-- Destinatarios con tabs -->
      <div class="form-group">
        <label>Destinatarios <span style="color:var(--danger)">*</span></label>
        <div class="sch-tabs">
          <div class="sch-tab active" id="tabManual" onclick="Sections.scheduler.tab('manual')">✍️ Manual</div>
          <div class="sch-tab" id="tabContacts" onclick="Sections.scheduler.tab('contacts')">👥 Mis contactos (${this._contacts.length})</div>
        </div>
        <div class="sch-panel active" id="panelManual">
          <textarea class="form-control" id="schRecipientsManual" rows="2"
            placeholder="Escribe números separados por punto y coma (;)&#10;Ej: 51999888777;51998877666"></textarea>
          <div class="form-hint">Código de país incluido, separados por <strong>;</strong></div>
        </div>
        <div class="sch-panel" id="panelContacts">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span class="text-sm text-muted" id="schSelectedCount">0 seleccionados</span>
            <div style="display:flex;gap:6px">
              <button class="btn btn-sm btn-secondary" type="button" onclick="Sections.scheduler.selectAll(true)">Todos</button>
              <button class="btn btn-sm btn-secondary" type="button" onclick="Sections.scheduler.selectAll(false)">Ninguno</button>
            </div>
          </div>
          <input type="text" class="ct-search" placeholder="🔍 Buscar contacto..."
                 oninput="Sections.scheduler.filterCt(this.value)">
          <div class="ct-list" id="ctCheckList">${contactItems}</div>
        </div>
      </div>

      <!-- Plantilla o mensaje propio -->
      <div class="form-group">
        <label>Usar plantilla (opcional)</label>
        <select class="form-control" id="schTemplateSelect" onchange="Sections.scheduler.loadTemplate()">
          ${templateOptions}
        </select>
      </div>

      <div class="form-group">
        <label>Mensaje <span style="color:var(--danger)">*</span></label>
        <textarea class="form-control" id="schMessage" rows="4"
          placeholder="Hola {{whatsapp_name}}, te recordamos que..."></textarea>
        <div class="form-hint" style="margin-top:8px">
          <strong>Variables disponibles (click para insertar):</strong><br>
          <button class="var-btn" type="button" onclick="Sections.scheduler.insertVar('{{whatsapp_name}}')">{{whatsapp_name}}</button>
          <button class="var-btn" type="button" onclick="Sections.scheduler.insertVar('{{company_name}}')">{{company_name}}</button>
          <button class="var-btn" type="button" onclick="Sections.scheduler.insertVar('{{today}}')">{{today}}</button>
          <button class="var-btn" type="button" onclick="Sections.scheduler.insertVar('{{time}}')">{{time}}</button>
          <button class="var-btn" type="button" onclick="Sections.scheduler.insertVar('{{phone}}')">{{phone}}</button>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Fecha y hora de inicio</label>
          <input type="datetime-local" class="form-control" id="schDatetime" value="${dtLocal}">
        </div>
        <div class="form-group">
          <label>Recurrencia</label>
          <select class="form-control" id="schRecurrence" onchange="Sections.scheduler.toggleN()">
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

  tab(which) {
    document.getElementById('tabManual').classList.toggle('active', which === 'manual');
    document.getElementById('tabContacts').classList.toggle('active', which === 'contacts');
    document.getElementById('panelManual').classList.toggle('active', which === 'manual');
    document.getElementById('panelContacts').classList.toggle('active', which === 'contacts');
  },

  filterCt(q) {
    q = q.toLowerCase();
    document.querySelectorAll('#ctCheckList label').forEach(l => {
      l.style.display = !q || l.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  selectAll(checked) {
    document.querySelectorAll('.schContactCheck').forEach(cb => { cb.checked = checked; });
    this.updateCount();
  },

  updateCount() {
    const n = document.querySelectorAll('.schContactCheck:checked').length;
    const el = document.getElementById('schSelectedCount');
    if (el) el.textContent = `${n} seleccionado${n !== 1 ? 's' : ''}`;
  },

  loadTemplate() {
    const sel = document.getElementById('schTemplateSelect');
    const opt = sel?.options[sel.selectedIndex];
    const msg = opt?.getAttribute('data-msg') || '';
    if (msg) {
      const ta = document.getElementById('schMessage');
      if (ta) ta.value = msg;
    }
  },

  insertVar(varStr) {
    const ta = document.getElementById('schMessage');
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    ta.value = ta.value.substring(0, start) + varStr + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + varStr.length;
    ta.focus();
  },

  toggleN() {
    const v = document.getElementById('schRecurrence')?.value;
    const g = document.getElementById('nDaysGroup');
    if (g) g.style.display = v === 'every_n_days' ? '' : 'none';
  },

  getRecipients() {
    const manual = document.getElementById('panelManual');
    if (manual?.classList.contains('active')) {
      return (document.getElementById('schRecipientsManual')?.value || '')
        .split(';').map(n => n.replace(/\D/g,'').trim()).filter(n => n.length > 5).join(',');
    }
    return Array.from(document.querySelectorAll('.schContactCheck:checked')).map(cb => cb.value).join(',');
  },

  async create() {
    const title      = document.getElementById('schTitle')?.value?.trim();
    const recipients = this.getRecipients();
    const message    = document.getElementById('schMessage')?.value?.trim();
    const dtVal      = document.getElementById('schDatetime')?.value;

    if (!title)      { Toast.error('El título es obligatorio'); return; }
    if (!recipients) { Toast.error('Selecciona o ingresa al menos un destinatario'); return; }
    if (!message)    { Toast.error('El mensaje es obligatorio'); return; }

    let startDatetime;
    try { startDatetime = dtVal ? new Date(dtVal).toISOString() : new Date().toISOString(); }
    catch { startDatetime = new Date().toISOString(); }

    try {
      const res = await api.createSchedule({
        title, recipients, message_template: message,
        start_datetime: startDatetime,
        recurrence_type: document.getElementById('schRecurrence')?.value || 'once',
        recurrence_rule: document.getElementById('schNDays')?.value || '1',
        file_url: document.getElementById('schFile')?.value?.trim() || ''
      });
      if (res.success) { Toast.success('Programación creada'); Modal.close(); this.render(); }
      else Toast.error(res.error || 'Error');
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
      Toast.success(`✅ Procesados: ${res.processed || 0} | Errores: ${res.errors || 0}`);
      this.render();
    } catch (err) { Toast.error(err.message); }
  }
};
