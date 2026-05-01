/**
 * Send Message Section
 */
window.Sections.send = {
  async render() {
    const c = document.getElementById('sendContent');
    if (!c) return;
    if (!api.isConfigured()) { showEmpty('sendContent','⚙️','Configuración requerida','Configura el backend primero.'); return; }

    // Load templates for selector
    let templateOptions = '<option value="">— Sin plantilla —</option>';
    try {
      const tplRes = await api.getTemplates();
      (tplRes.data || []).forEach(t => {
        templateOptions += `<option value="${escapeHtml(t.template_id)}" data-msg="${escapeHtml(t.message)}" data-file="${escapeHtml(t.file_url||'')}" data-doc="${escapeHtml(t.document_url||'')}" data-audio="${escapeHtml(t.audio_url||'')}">${escapeHtml(t.name)} (${escapeHtml(t.category)})</option>`;
      });
    } catch(e) {}

    c.innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3>Componer mensaje</h3></div>
          <div class="form-group">
            <label>Destinatario (con código de país)</label>
            <input type="text" class="form-control" id="sendRecipient" placeholder="51999888777">
            <div class="form-hint">Incluye código de país sin + ni espacios</div>
          </div>
          <div class="form-group">
            <label>Plantilla (opcional)</label>
            <select class="form-control" id="sendTemplate" onchange="Sections.send.loadTemplate()">${templateOptions}</select>
          </div>
          <div class="form-group">
            <label>Mensaje</label>
            <textarea class="form-control" id="sendMessage" rows="5" placeholder="Escribe tu mensaje aquí..." oninput="Sections.send.updatePreview()"></textarea>
            <div class="form-hint">Variables: {{whatsapp_name}}, {{company_name}}, {{today}}, {{time}}</div>
          </div>
          <div class="form-group">
            <label>URL de imagen (opcional)</label>
            <input type="url" class="form-control" id="sendFileUrl" placeholder="https://...">
          </div>
          <div class="form-group">
            <label>URL de documento (opcional)</label>
            <input type="url" class="form-control" id="sendDocUrl" placeholder="https://...pdf">
          </div>
          <div class="form-group">
            <label>URL de audio (opcional)</label>
            <input type="url" class="form-control" id="sendAudioUrl" placeholder="https://...mp3">
          </div>
          <div class="flex gap-8">
            <button class="btn btn-primary" onclick="Sections.send.sendNow()">📤 Enviar ahora</button>
            <button class="btn btn-secondary" onclick="Sections.send.clearForm()">🗑️ Limpiar</button>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-header"><h3>Vista previa</h3></div>
            <div class="preview-box" id="sendPreview">El mensaje aparecerá aquí...</div>
          </div>
        </div>
      </div>
    `;
  },

  loadTemplate() {
    const sel = document.getElementById('sendTemplate');
    const opt = sel.options[sel.selectedIndex];
    if (opt.value) {
      document.getElementById('sendMessage').value = opt.dataset.msg || '';
      document.getElementById('sendFileUrl').value = opt.dataset.file || '';
      document.getElementById('sendDocUrl').value = opt.dataset.doc || '';
      document.getElementById('sendAudioUrl').value = opt.dataset.audio || '';
      this.updatePreview();
    }
  },

  updatePreview() {
    const msg = document.getElementById('sendMessage')?.value || '';
    const preview = document.getElementById('sendPreview');
    if (preview) preview.textContent = msg || 'El mensaje aparecerá aquí...';
  },

  async sendNow() {
    const recipient = document.getElementById('sendRecipient')?.value?.trim();
    const message = document.getElementById('sendMessage')?.value?.trim();
    if (!recipient) { Toast.error('Ingresa un destinatario'); return; }
    if (!message) { Toast.error('Ingresa un mensaje'); return; }

    try {
      const res = await api.sendMessage({
        recipient, message,
        file_url: document.getElementById('sendFileUrl')?.value?.trim() || '',
        document_url: document.getElementById('sendDocUrl')?.value?.trim() || '',
        audio_url: document.getElementById('sendAudioUrl')?.value?.trim() || ''
      });
      if (res.success) { Toast.success('Mensaje enviado correctamente'); this.clearForm(); }
      else Toast.error(res.error || 'Error al enviar');
    } catch (err) { Toast.error(err.message); }
  },

  clearForm() {
    ['sendRecipient','sendMessage','sendFileUrl','sendDocUrl','sendAudioUrl'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    document.getElementById('sendTemplate').selectedIndex = 0;
    this.updatePreview();
  }
};
