/**
 * Settings Section
 */
window.Sections.settings = {
  async render() {
    const c = document.getElementById('settingsContent');
    if (!c) return;
    const currentUrl = api.baseUrl || '';
    const hasUrl = !!currentUrl;

    c.innerHTML = `
      <div class="grid-2">
        <div>
          <div class="card mb-16">
            <div class="card-header"><h3>🔗 Conexión al Backend</h3></div>
            <div class="form-group">
              <label>URL de Google Apps Script (Web App)</label>
              <input type="url" class="form-control" id="setAppsUrl" value="${escapeHtml(currentUrl)}" placeholder="https://script.google.com/macros/s/.../exec">
              <div class="form-hint">Pega aquí la URL de tu Apps Script desplegado como Web App</div>
            </div>
            <div class="form-group">
              <label>APP_SECRET_TOKEN</label>
              <input type="password" class="form-control" id="setAppToken" value="${api.token||''}" placeholder="Token de seguridad">
            </div>
            <div class="flex gap-8">
              <button class="btn btn-primary" onclick="Sections.settings.saveConnection()">💾 Guardar conexión</button>
              <button class="btn btn-secondary" onclick="Sections.settings.testConnection()">🔌 Test conexión</button>
            </div>
            <div id="connResult" class="mt-8"></div>
          </div>

          <div class="card mb-16">
            <div class="card-header"><h3>🤖 TextMeBot API</h3></div>
            <div class="form-group">
              <label>API Key (se guarda en el backend)</label>
              <input type="password" class="form-control" id="setApiKey" placeholder="Tu API key de TextMeBot">
              <div class="form-hint">Se enviará al backend y se guardará en PropertiesService</div>
            </div>
            <div class="flex gap-8">
              <button class="btn btn-primary" onclick="Sections.settings.saveApiKey()">💾 Guardar API Key</button>
              <button class="btn btn-secondary" onclick="Sections.settings.testTextMeBot()">📡 Test TextMeBot</button>
            </div>
            <div id="tmResult" class="mt-8"></div>
          </div>

          <div class="card">
            <div class="card-header"><h3>🗄️ Base de datos</h3></div>
            <p class="text-sm text-muted mb-16">Ejecuta setupDatabase para crear todas las hojas, encabezados y datos de ejemplo en tu Google Sheet.</p>
            <button class="btn btn-primary" onclick="Sections.settings.setupDb()">🏗️ Ejecutar setupDatabase</button>
            <div id="dbResult" class="mt-8"></div>
          </div>
        </div>

        <div>
          <div class="card mb-16">
            <div class="card-header"><h3>⚙️ Configuración General</h3></div>
            <div class="form-group"><label>Nombre de empresa</label><input class="form-control" id="setCmpName" placeholder="Mi Empresa"></div>
            <div class="form-group"><label>Zona horaria</label><input class="form-control" id="setTimezone" placeholder="America/Lima"></div>
            <div class="form-group"><label>Delay entre mensajes (segundos)</label><input type="number" class="form-control" id="setRateLimit" value="3"></div>
            <div class="form-group"><label>Mensaje fallback global</label><textarea class="form-control" id="setFallback" rows="2" placeholder="Gracias por tu mensaje..."></textarea></div>
            <button class="btn btn-primary" onclick="Sections.settings.saveGeneral()">💾 Guardar configuración</button>
          </div>

          <div class="card">
            <div class="card-header"><h3>📋 Instrucciones del Webhook</h3></div>
            <ol style="font-size:13px;line-height:2;padding-left:18px;color:var(--text-secondary)">
              <li>Despliega tu Apps Script como Web App (acceso: "Cualquiera")</li>
              <li>Copia la URL de la Web App</li>
              <li>Pégala arriba en "URL de Google Apps Script"</li>
              <li>Configura tu webhook en TextMeBot:<br>
                <code style="font-size:11px;background:#F1F5F9;padding:4px 8px;border-radius:4px">https://api.textmebot.com/webhook.php?apikey=TU_API_KEY</code></li>
              <li>TextMeBot te pedirá la URL del webhook → usa la URL de tu Web App</li>
              <li>¡Listo! Los mensajes entrantes se guardarán automáticamente</li>
            </ol>
          </div>
        </div>
      </div>
    `;

    // Load current settings if connected
    if (hasUrl) this.loadCurrentSettings();
  },

  async loadCurrentSettings() {
    try {
      const res = await api.getSettings();
      const settings = {};
      (res.data || []).forEach(s => { settings[s.key] = s.value; });
      if (settings.COMPANY_NAME) document.getElementById('setCmpName').value = settings.COMPANY_NAME;
      if (settings.DEFAULT_TIMEZONE) document.getElementById('setTimezone').value = settings.DEFAULT_TIMEZONE;
      if (settings.RATE_LIMIT_SECONDS) document.getElementById('setRateLimit').value = settings.RATE_LIMIT_SECONDS;
      if (settings.DEFAULT_FALLBACK_MESSAGE) document.getElementById('setFallback').value = settings.DEFAULT_FALLBACK_MESSAGE;
    } catch(e) {}
  },

  saveConnection() {
    const url = document.getElementById('setAppsUrl').value.trim();
    const token = document.getElementById('setAppToken').value.trim();
    if (!url) { Toast.error('Ingresa la URL del Apps Script'); return; }
    api.setBaseUrl(url);
    api.setToken(token);
    Toast.success('Conexión guardada');
  },

  async testConnection() {
    this.saveConnection();
    const el = document.getElementById('connResult');
    el.innerHTML = '<span class="text-sm"><span class="status-dot checking"></span>Probando...</span>';
    try {
      const res = await api.ping();
      if (res.success) el.innerHTML = '<span class="text-sm"><span class="status-dot online"></span>Conexión exitosa ✓</span>';
      else el.innerHTML = `<span class="text-sm" style="color:var(--danger)">Error: ${res.error}</span>`;
    } catch (err) { el.innerHTML = `<span class="text-sm" style="color:var(--danger)">Error: ${err.message}</span>`; }
  },

  async saveApiKey() {
    const key = document.getElementById('setApiKey').value.trim();
    if (!key) { Toast.error('Ingresa la API key'); return; }
    try {
      await api.saveSetting('TEXTMEBOT_API_KEY', key, 'TextMeBot API Key');
      Toast.success('API Key guardada en el backend');
    } catch (err) { Toast.error(err.message); }
  },

  async testTextMeBot() {
    const el = document.getElementById('tmResult');
    el.innerHTML = '<span class="text-sm"><span class="status-dot checking"></span>Probando TextMeBot...</span>';
    try {
      const res = await api.testTextMeBot();
      if (res.success) el.innerHTML = `<span class="text-sm"><span class="status-dot online"></span>TextMeBot OK (HTTP ${res.responseCode})</span>`;
      else el.innerHTML = `<span class="text-sm" style="color:var(--danger)">${res.error}</span>`;
    } catch (err) { el.innerHTML = `<span class="text-sm" style="color:var(--danger)">${err.message}</span>`; }
  },

  async setupDb() {
    const el = document.getElementById('dbResult');
    el.innerHTML = '<span class="text-sm"><span class="status-dot checking"></span>Creando base de datos...</span>';
    try {
      const res = await api.setupDatabase();
      if (res.success) {
        el.innerHTML = `<span class="text-sm" style="color:var(--success)">✓ ${res.message}</span>`;
        Toast.success('Base de datos configurada');
      } else el.innerHTML = `<span class="text-sm" style="color:var(--danger)">${res.error}</span>`;
    } catch (err) { el.innerHTML = `<span class="text-sm" style="color:var(--danger)">${err.message}</span>`; }
  },

  async saveGeneral() {
    try {
      const fields = [
        ['COMPANY_NAME', document.getElementById('setCmpName').value],
        ['DEFAULT_TIMEZONE', document.getElementById('setTimezone').value],
        ['RATE_LIMIT_SECONDS', document.getElementById('setRateLimit').value],
        ['DEFAULT_FALLBACK_MESSAGE', document.getElementById('setFallback').value]
      ];
      for (const [k, v] of fields) {
        if (v) await api.saveSetting(k, v);
      }
      Toast.success('Configuración guardada');
    } catch (err) { Toast.error(err.message); }
  }
};
