/**
 * Inbox Section
 */
window.Sections.inbox = {
  async render() {
    const c = document.getElementById('inboxContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('inboxContent','⚙️','Configuración requerida','Configura el backend primero.'); return; }
    showLoading('inboxContent');
    try {
      const res = await api.getInbox({ limit: 100 });
      const msgs = res.data || [];
      c.innerHTML = `
        <div class="toolbar">
          <input type="text" class="search-input" id="inboxSearch" placeholder="Buscar por número, nombre o mensaje..." oninput="Sections.inbox.filter()">
          <select class="filter-select" id="inboxStatusFilter" onchange="Sections.inbox.filter()"><option value="">Todos los estados</option><option value="received">Recibidos</option><option value="auto-replied">Auto-respondidos</option><option value="pending">Pendientes</option></select>
          <button class="btn btn-secondary btn-sm" onclick="Sections.inbox.render()">🔄 Actualizar</button>
        </div>
        <div class="card"><div class="table-wrap"><table>
          <thead><tr><th>Fecha</th><th>De</th><th>Nombre</th><th>Mensaje</th><th>Estado</th><th>Regla</th><th>Acciones</th></tr></thead>
          <tbody id="inboxTableBody">
            ${msgs.length === 0 ? '<tr><td colspan="7" class="text-center text-muted">No hay mensajes</td></tr>' : msgs.map(m => `
              <tr class="inbox-row" data-search="${escapeHtml((m.from + ' ' + m.from_name + ' ' + m.message).toLowerCase())}">
                <td class="text-sm">${formatDate(m.timestamp || m.created_at)}</td>
                <td><strong>${escapeHtml(m.from)}</strong></td>
                <td>${escapeHtml(m.from_name)}</td>
                <td class="truncate" style="max-width:250px">${escapeHtml(m.message)}${m.file_url ? ` <a href="${escapeHtml(m.file_url)}" target="_blank">📎</a>` : ''}</td>
                <td>${getBadgeHtml(m.status)}</td>
                <td class="text-sm text-muted">${escapeHtml(m.matched_rule_id || '—')}</td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="location.hash='conversations';setTimeout(()=>Sections.conversations.openChat('${escapeHtml(m.from)}'),300)">💬</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table></div></div>
        <p class="text-sm text-muted mt-8">Total: ${res.total || msgs.length} mensajes</p>
      `;
      this._data = msgs;
    } catch (err) {
      showEmpty('inboxContent','⚠️','Error',err.message);
    }
  },
  filter() {
    const q = (document.getElementById('inboxSearch')?.value || '').toLowerCase();
    const s = document.getElementById('inboxStatusFilter')?.value || '';
    document.querySelectorAll('.inbox-row').forEach(row => {
      const text = row.dataset.search || '';
      const badge = row.querySelector('.badge')?.textContent?.toLowerCase() || '';
      const matchText = !q || text.includes(q);
      const matchStatus = !s || badge.includes(s);
      row.style.display = matchText && matchStatus ? '' : 'none';
    });
  }
};
