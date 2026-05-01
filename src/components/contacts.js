/**
 * Contacts Section
 */
window.Sections.contacts = {
  async render() {
    const c = document.getElementById('contactsContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('contactsContent','⚙️','Configuración requerida',''); return; }
    showLoading('contactsContent');
    try {
      const res = await api.getContacts({ limit: 200 });
      const items = res.data || [];
      c.innerHTML = `
        <div class="toolbar">
          <input type="text" class="search-input" id="contactSearch" placeholder="Buscar por número o nombre..." oninput="Sections.contacts.filter()">
          <button class="btn btn-secondary btn-sm" onclick="Sections.contacts.render()">🔄</button>
        </div>
        <div class="card"><div class="table-wrap"><table>
          <thead><tr><th>Teléfono</th><th>WhatsApp</th><th>Nombre</th><th>Etiquetas</th><th>Estado</th><th>Última vez</th><th>DNC</th><th>Acciones</th></tr></thead>
          <tbody id="contactsTableBody">
            ${items.length===0?'<tr><td colspan="8" class="text-center text-muted">No hay contactos</td></tr>':
              items.map(ct => `<tr class="contact-row" data-search="${escapeHtml((ct.phone+' '+ct.whatsapp_name+' '+ct.display_name+' '+ct.tags).toLowerCase())}">
                <td><strong>${escapeHtml(ct.phone)}</strong></td>
                <td>${escapeHtml(ct.whatsapp_name)}</td>
                <td>${escapeHtml(ct.display_name)}</td>
                <td>${(ct.tags||'').split(',').filter(t=>t.trim()).map(t=>`<span class="badge badge-active" style="margin:1px">${escapeHtml(t.trim())}</span>`).join(' ')||'—'}</td>
                <td>${getBadgeHtml(ct.status)}</td>
                <td class="text-sm">${formatDate(ct.last_seen_at)}</td>
                <td>${String(ct.do_not_contact)==='true'?'<span class="badge badge-failed">DNC</span>':'—'}</td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="Sections.contacts.editModal('${escapeHtml(ct.contact_id)}','${escapeHtml(ct.display_name)}','${escapeHtml(ct.tags)}','${escapeHtml(ct.notes)}','${ct.do_not_contact}')">✏️</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table></div></div>
        <p class="text-sm text-muted mt-8">Total: ${res.total || items.length} contactos</p>
      `;
    } catch (err) { showEmpty('contactsContent','⚠️','Error',err.message); }
  },

  filter() {
    const q = (document.getElementById('contactSearch')?.value||'').toLowerCase();
    document.querySelectorAll('.contact-row').forEach(r => {
      r.style.display = !q || (r.dataset.search||'').includes(q) ? '' : 'none';
    });
  },

  editModal(id, name, tags, notes, dnc) {
    Modal.open('Editar contacto', `
      <div class="form-group"><label>Nombre para mostrar</label><input class="form-control" id="ctName" value="${escapeHtml(name)}"></div>
      <div class="form-group"><label>Etiquetas (separadas por coma)</label><input class="form-control" id="ctTags" value="${escapeHtml(tags)}"></div>
      <div class="form-group"><label>Notas</label><textarea class="form-control" id="ctNotes" rows="2">${escapeHtml(notes)}</textarea></div>
      <div class="form-group flex items-center gap-12">
        <label class="toggle"><input type="checkbox" id="ctDnc" ${String(dnc)==='true'?'checked':''}><span class="toggle-slider"></span></label>
        <span class="text-sm">No contactar (Do Not Contact)</span>
      </div>
      <input type="hidden" id="ctId" value="${id}">
    `, `<button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button><button class="btn btn-primary" onclick="Sections.contacts.saveEdit()">Guardar</button>`);
  },

  async saveEdit() {
    const id = document.getElementById('ctId').value;
    try {
      const res = await api.updateContact(id, {
        display_name: document.getElementById('ctName').value,
        tags: document.getElementById('ctTags').value,
        notes: document.getElementById('ctNotes').value,
        do_not_contact: String(document.getElementById('ctDnc').checked)
      });
      if (res.success) { Toast.success('Contacto actualizado'); Modal.close(); this.render(); }
      else Toast.error(res.error || 'Error');
    } catch (err) { Toast.error(err.message); }
  }
};
