/**
 * Contacts Section — with create, edit, search, DNC toggle
 */
window.Sections.contacts = {
  async render() {
    const c = document.getElementById('contactsContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('contactsContent','⚙️','Configuración requerida','Configura el backend primero.'); return; }
    showLoading('contactsContent');
    try {
      const res = await api.getContacts({ limit: 200 });
      const items = res.data || [];
      c.innerHTML = `
        <div class="toolbar">
          <input type="text" class="search-input" id="contactSearch" placeholder="Buscar por número o nombre..." oninput="Sections.contacts.filter()">
          <button class="btn btn-primary" id="btnNuevoContacto" onclick="Sections.contacts.showCreateForm()">➕ Nuevo contacto</button>
          <button class="btn btn-secondary btn-sm" onclick="Sections.contacts.render()">🔄 Actualizar</button>
        </div>
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Teléfono</th>
                  <th>WhatsApp</th>
                  <th>Nombre</th>
                  <th>Etiquetas</th>
                  <th>Estado</th>
                  <th>Última vez</th>
                  <th>DNC</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="contactsTableBody">
                ${items.length === 0
                  ? '<tr><td colspan="8" class="text-center text-muted" style="padding:40px">No hay contactos aún. Agrega uno con el botón ➕</td></tr>'
                  : items.map(ct => `
                    <tr class="contact-row" data-search="${escapeHtml(((ct.phone||'') + ' ' + (ct.whatsapp_name||'') + ' ' + (ct.display_name||'')).toLowerCase())}">
                      <td><strong>${escapeHtml(ct.phone)}</strong></td>
                      <td>${escapeHtml(ct.whatsapp_name)}</td>
                      <td>${escapeHtml(ct.display_name)}</td>
                      <td>${(String(ct.tags||'')).split(',').filter(t=>t.trim()).map(t=>`<span class="badge badge-active" style="margin:1px">${escapeHtml(t.trim())}</span>`).join(' ')||'—'}</td>
                      <td>${getBadgeHtml(ct.status||'active')}</td>
                      <td class="text-sm">${formatDate(ct.last_seen_at)}</td>
                      <td>${String(ct.do_not_contact)==='true'?'<span class="badge badge-failed">DNC</span>':'—'}</td>
                      <td>
                        <button class="btn btn-sm btn-secondary" onclick="Sections.contacts.editModal('${escapeHtml(ct.contact_id)}','${escapeHtml(ct.display_name||'')}','${escapeHtml(ct.tags||'')}','${escapeHtml(ct.notes||'')}','${ct.do_not_contact}')">✏️ Editar</button>
                      </td>
                    </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-sm text-muted mt-8">Total: ${res.total || items.length} contactos</p>
      `;
    } catch (err) {
      showEmpty('contactsContent','⚠️','Error al cargar contactos', err.message);
    }
  },

  filter() {
    const q = (document.getElementById('contactSearch')?.value || '').toLowerCase();
    document.querySelectorAll('.contact-row').forEach(r => {
      r.style.display = !q || (r.dataset.search || '').includes(q) ? '' : 'none';
    });
  },

  showCreateForm() {
    Modal.open('➕ Nuevo contacto', `
      <div class="form-group">
        <label>Teléfono <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="newCtPhone" placeholder="51999888777" type="tel">
        <div class="form-hint">Incluye código de país sin + ni espacios (ej: 51 para Perú)</div>
      </div>
      <div class="form-group">
        <label>Nombre WhatsApp</label>
        <input class="form-control" id="newCtWaName" placeholder="Como aparece en WhatsApp">
      </div>
      <div class="form-group">
        <label>Nombre para mostrar</label>
        <input class="form-control" id="newCtName" placeholder="Nombre interno o alias">
      </div>
      <div class="form-group">
        <label>Etiquetas</label>
        <input class="form-control" id="newCtTags" placeholder="cliente, interesado, proveedor">
        <div class="form-hint">Separadas por coma. Sirven para filtrar campañas.</div>
      </div>
      <div class="form-group">
        <label>Estado</label>
        <select class="form-control" id="newCtStatus">
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>
      <div class="form-group">
        <label>Notas internas</label>
        <textarea class="form-control" id="newCtNotes" rows="2" placeholder="Observaciones, recordatorios..."></textarea>
      </div>
    `,
    `<button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
     <button class="btn btn-primary" id="btnGuardarContacto" onclick="Sections.contacts.saveNew()">✅ Crear contacto</button>`);
  },

  async saveNew() {
    const phone = (document.getElementById('newCtPhone')?.value || '').replace(/\D/g, '').trim();
    const waName = document.getElementById('newCtWaName')?.value?.trim() || '';
    const name = document.getElementById('newCtName')?.value?.trim() || '';
    const tags = document.getElementById('newCtTags')?.value?.trim() || '';
    const status = document.getElementById('newCtStatus')?.value || 'active';
    const notes = document.getElementById('newCtNotes')?.value?.trim() || '';

    if (!phone) { Toast.error('El teléfono es obligatorio'); return; }
    if (phone.length < 7) { Toast.error('El teléfono parece muy corto. Incluye código de país.'); return; }

    const btn = document.getElementById('btnGuardarContacto');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    try {
      const res = await api.createContact({ phone, whatsapp_name: waName, display_name: name, tags, status, notes });
      if (res.success) {
        Toast.success(`Contacto ${phone} creado correctamente`);
        Modal.close();
        this.render();
      } else {
        Toast.error(res.error || 'Error al crear contacto');
        if (btn) { btn.disabled = false; btn.textContent = '✅ Crear contacto'; }
      }
    } catch (err) {
      Toast.error(err.message);
      if (btn) { btn.disabled = false; btn.textContent = '✅ Crear contacto'; }
    }
  },

  editModal(id, name, tags, notes, dnc) {
    Modal.open('✏️ Editar contacto', `
      <div class="form-group">
        <label>Nombre para mostrar</label>
        <input class="form-control" id="ctName" value="${escapeHtml(name)}">
      </div>
      <div class="form-group">
        <label>Etiquetas (separadas por coma)</label>
        <input class="form-control" id="ctTags" value="${escapeHtml(tags)}">
      </div>
      <div class="form-group">
        <label>Notas</label>
        <textarea class="form-control" id="ctNotes" rows="2">${escapeHtml(notes)}</textarea>
      </div>
      <div class="form-group" style="display:flex;align-items:center;gap:12px">
        <label class="toggle">
          <input type="checkbox" id="ctDnc" ${String(dnc)==='true'?'checked':''}>
          <span class="toggle-slider"></span>
        </label>
        <span class="text-sm">🚫 No contactar (Do Not Contact) — no recibirá mensajes automáticos</span>
      </div>
      <input type="hidden" id="ctId" value="${id}">
    `,
    `<button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
     <button class="btn btn-primary" onclick="Sections.contacts.saveEdit()">💾 Guardar cambios</button>`);
  },

  async saveEdit() {
    const id = document.getElementById('ctId')?.value;
    if (!id) return;
    try {
      const res = await api.updateContact(id, {
        display_name: document.getElementById('ctName').value,
        tags: document.getElementById('ctTags').value,
        notes: document.getElementById('ctNotes').value,
        do_not_contact: String(document.getElementById('ctDnc').checked)
      });
      if (res.success) { Toast.success('Contacto actualizado'); Modal.close(); this.render(); }
      else Toast.error(res.error || 'Error al actualizar');
    } catch (err) { Toast.error(err.message); }
  }
};
