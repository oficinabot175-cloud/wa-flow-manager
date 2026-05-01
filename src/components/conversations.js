/**
 * Conversations Section — Chat view con fix de .charAt
 */
window.Sections.conversations = {
  selectedPhone: null,

  async render() {
    const c = document.getElementById('conversationsContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('conversationsContent','⚙️','Configuración requerida','Inicia sesión primero.'); return; }
    showLoading('conversationsContent');
    try {
      const res = await api.getConversations({ limit: 50 });
      const convs = res.data || [];

      // Actualizar badge de pendientes en sidebar
      const pending = convs.filter(cv => cv.status === 'pending' || cv.status === 'needs-human').length;
      const badge = document.getElementById('pendingBadge');
      if (badge) { badge.textContent = pending || ''; badge.style.display = pending ? '' : 'none'; }

      c.innerHTML = `
        <div class="chat-layout">
          <div class="chat-contacts">
            <div class="search-box">
              <input type="text" class="form-control" placeholder="🔍 Buscar contacto..."
                oninput="Sections.conversations.filterContacts(this.value)">
            </div>
            <div id="contactList">
              ${convs.length === 0
                ? '<div class="empty-state" style="padding:40px"><p class="text-sm text-muted">No hay conversaciones aún</p></div>'
                : convs.map(cv => {
                    // FIX: usar String() para evitar error .charAt
                    const nameStr  = String(cv.whatsapp_name || cv.phone || '?');
                    const initial  = nameStr.charAt(0).toUpperCase();
                    const searchKey = (nameStr + ' ' + String(cv.phone || '')).toLowerCase();
                    return `
                      <div class="contact-item" data-phone="${escapeHtml(String(cv.phone))}"
                           data-search="${escapeHtml(searchKey)}"
                           onclick="Sections.conversations.openChat('${escapeHtml(String(cv.phone))}')">
                        <div class="contact-avatar">${initial}</div>
                        <div class="contact-info">
                          <div class="name">${escapeHtml(nameStr)}</div>
                          <div class="last-msg">${escapeHtml(String(cv.last_message || '').substring(0, 42))}</div>
                        </div>
                        <div style="text-align:right;flex-shrink:0">
                          <div class="time">${cv.last_message_at ? formatDate(cv.last_message_at).split(' ')[1] : ''}</div>
                          ${(cv.status === 'pending' || cv.status === 'needs-human')
                            ? `<span class="badge badge-${cv.status}" style="font-size:9px;margin-top:4px">${cv.status}</span>`
                            : ''}
                        </div>
                      </div>`;
                  }).join('')}
            </div>
          </div>
          <div class="chat-panel" id="chatPanel">
            <div class="chat-empty">
              <div style="text-align:center">
                <div style="font-size:48px;margin-bottom:12px">💬</div>
                <p>Selecciona una conversación</p>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      showEmpty('conversationsContent','⚠️','Error', err.message);
    }
  },

  filterContacts(q) {
    q = (q || '').toLowerCase();
    document.querySelectorAll('.contact-item').forEach(item => {
      item.style.display = !q || (item.dataset.search || '').includes(q) ? '' : 'none';
    });
  },

  async openChat(phone) {
    this.selectedPhone = phone;
    document.querySelectorAll('.contact-item').forEach(i =>
      i.classList.toggle('active', i.dataset.phone === phone));

    const panel = document.getElementById('chatPanel');
    panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
      const res  = await api.getConversationByPhone(phone);
      const conv = res.conversation || {};
      const msgs = res.messages   || [];

      // FIX: String() en toda operación de avatar/nombre
      const nameStr = String(conv.whatsapp_name || phone || '?');
      const initial = nameStr.charAt(0).toUpperCase();

      panel.innerHTML = `
        <div class="chat-header">
          <div class="contact-avatar">${initial}</div>
          <div style="flex:1;min-width:0">
            <strong>${escapeHtml(nameStr)}</strong>
            <div class="text-sm text-muted">${escapeHtml(String(phone))}</div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <button class="btn btn-sm btn-secondary"
              onclick="Sections.conversations.markStatus('${escapeHtml(String(phone))}','resolved')">✓ Atendido</button>
            <button class="btn btn-sm btn-secondary"
              onclick="Sections.conversations.markStatus('${escapeHtml(String(phone))}','pending')">⏳ Pendiente</button>
          </div>
        </div>
        <div class="chat-messages" id="chatMessages">
          ${msgs.length === 0
            ? '<div class="text-center text-muted text-sm" style="padding:40px">Sin mensajes aún</div>'
            : msgs.map(m => `
                <div class="chat-bubble ${m.direction === 'incoming' ? 'incoming' : 'outgoing'}">
                  <div>${escapeHtml(String(m.message || ''))}</div>
                  ${m.file_url ? `<div><a href="${escapeHtml(String(m.file_url))}" target="_blank" style="font-size:11px">📎 Adjunto</a></div>` : ''}
                  <div class="bubble-time">${formatDate(m.timestamp)}${m.source ? ' · ' + m.source : ''}</div>
                </div>`).join('')}
        </div>
        <div class="chat-input-area">
          <input type="text" class="form-control" id="chatInput"
            placeholder="Escribe un mensaje y presiona Enter..."
            onkeypress="if(event.key==='Enter')Sections.conversations.sendReply()">
          <button class="btn btn-primary" onclick="Sections.conversations.sendReply()">Enviar ➤</button>
        </div>
      `;

      const msgEl = document.getElementById('chatMessages');
      if (msgEl) msgEl.scrollTop = msgEl.scrollHeight;

    } catch (err) {
      panel.innerHTML = `<div class="chat-empty"><p>⚠️ Error: ${escapeHtml(err.message)}</p></div>`;
    }
  },

  async sendReply() {
    const input = document.getElementById('chatInput');
    if (!input || !input.value.trim() || !this.selectedPhone) return;
    const msg = input.value.trim();
    input.value = '';
    try {
      const res = await api.sendMessage({ recipient: this.selectedPhone, message: msg });
      if (res.success) { Toast.success('Mensaje enviado'); this.openChat(this.selectedPhone); }
      else Toast.error(res.error || 'Error al enviar');
    } catch (err) { Toast.error(err.message); }
  },

  async markStatus(phone, status) {
    try {
      await api.markConversationStatus(phone, status);
      Toast.success('Estado actualizado: ' + status);
      this.render();
    } catch (err) { Toast.error(err.message); }
  }
};
