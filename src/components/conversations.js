/**
 * Conversations Section — Chat-style view
 */
window.Sections.conversations = {
  selectedPhone: null,

  async render() {
    const c = document.getElementById('conversationsContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('conversationsContent','⚙️','Configuración requerida','Configura el backend primero.'); return; }
    showLoading('conversationsContent');
    try {
      const res = await api.getConversations({ limit: 50 });
      const convs = res.data || [];
      c.innerHTML = `
        <div class="chat-layout">
          <div class="chat-contacts">
            <div class="search-box"><input type="text" class="form-control" placeholder="Buscar contacto..." oninput="Sections.conversations.filterContacts(this.value)"></div>
            <div id="contactList">
              ${convs.length === 0 ? '<div class="empty-state" style="padding:30px"><p class="text-sm">No hay conversaciones</p></div>' :
                convs.map(cv => `
                  <div class="contact-item" data-phone="${escapeHtml(cv.phone)}" data-search="${escapeHtml((cv.phone+' '+cv.whatsapp_name).toLowerCase())}" onclick="Sections.conversations.openChat('${escapeHtml(cv.phone)}')">
                    <div class="contact-avatar">${(cv.whatsapp_name || cv.phone || '?').charAt(0).toUpperCase()}</div>
                    <div class="contact-info">
                      <div class="name">${escapeHtml(cv.whatsapp_name || cv.phone)}</div>
                      <div class="last-msg">${escapeHtml((cv.last_message || '').substring(0, 40))}</div>
                    </div>
                    <div style="text-align:right">
                      <div class="time">${cv.last_message_at ? formatDate(cv.last_message_at).split(' ')[1] : ''}</div>
                      ${cv.status === 'pending' || cv.status === 'needs-human' ? `<span class="badge badge-${cv.status}" style="font-size:9px;margin-top:4px">${cv.status}</span>` : ''}
                    </div>
                  </div>
                `).join('')}
            </div>
          </div>
          <div class="chat-panel" id="chatPanel">
            <div class="chat-empty">Selecciona una conversación para ver los mensajes</div>
          </div>
        </div>
      `;
    } catch (err) { showEmpty('conversationsContent','⚠️','Error',err.message); }
  },

  filterContacts(q) {
    q = q.toLowerCase();
    document.querySelectorAll('.contact-item').forEach(item => {
      item.style.display = !q || (item.dataset.search || '').includes(q) ? '' : 'none';
    });
  },

  async openChat(phone) {
    this.selectedPhone = phone;
    document.querySelectorAll('.contact-item').forEach(i => i.classList.toggle('active', i.dataset.phone === phone));
    const panel = document.getElementById('chatPanel');
    panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
      const res = await api.getConversationByPhone(phone);
      const conv = res.conversation || {};
      const msgs = res.messages || [];

      panel.innerHTML = `
        <div class="chat-header">
          <div class="contact-avatar">${(conv.whatsapp_name || phone).charAt(0).toUpperCase()}</div>
          <div><strong>${escapeHtml(conv.whatsapp_name || phone)}</strong><div class="text-sm text-muted">${escapeHtml(phone)}</div></div>
          <div style="margin-left:auto;display:flex;gap:8px">
            <button class="btn btn-sm btn-secondary" onclick="Sections.conversations.markStatus('${escapeHtml(phone)}','resolved')">✓ Atendido</button>
            <button class="btn btn-sm btn-secondary" onclick="Sections.conversations.markStatus('${escapeHtml(phone)}','pending')">⏳ Pendiente</button>
          </div>
        </div>
        <div class="chat-messages" id="chatMessages">
          ${msgs.length === 0 ? '<div class="text-center text-muted text-sm">No hay mensajes</div>' :
            msgs.map(m => `
              <div class="chat-bubble ${m.direction === 'incoming' ? 'incoming' : 'outgoing'}">
                <div>${escapeHtml(m.message)}</div>
                ${m.file_url ? `<div><a href="${escapeHtml(m.file_url)}" target="_blank" style="font-size:11px">📎 Archivo adjunto</a></div>` : ''}
                <div class="bubble-time">${formatDate(m.timestamp)} ${m.source ? '· ' + m.source : ''}</div>
              </div>
            `).join('')}
        </div>
        <div class="chat-input-area">
          <input type="text" class="form-control" id="chatInput" placeholder="Escribe un mensaje..." onkeypress="if(event.key==='Enter')Sections.conversations.sendReply()">
          <button class="btn btn-primary" onclick="Sections.conversations.sendReply()">Enviar</button>
        </div>
      `;

      // Scroll to bottom
      const msgContainer = document.getElementById('chatMessages');
      if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;

    } catch (err) {
      panel.innerHTML = `<div class="chat-empty">Error: ${escapeHtml(err.message)}</div>`;
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
      Toast.success('Estado actualizado a: ' + status);
    } catch (err) { Toast.error(err.message); }
  }
};
