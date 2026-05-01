/**
 * ============================================================
 * WA FLOW MANAGER — app.js v1.2
 * Auth sistema simplificado + SPA router + Toast + Modal
 * ============================================================
 */

// ── Auth System ─────────────────────────────────────────────
const Auth = {

  /** Llamado al cargar la página */
  init() {
    const savedUser = localStorage.getItem('wa_user_name');
    const hasUrl    = !!localStorage.getItem('wa_apps_script_url');
    const hasToken  = !!localStorage.getItem('wa_app_token');

    if (savedUser && hasUrl && hasToken) {
      // Sesión completa guardada → entrar directo
      this._enterPortal(savedUser);
    } else {
      // Mostrar login
      this._showLogin();
      // Si ya hay URL guardada, no mostrar el campo de URL
      if (!hasUrl) {
        document.getElementById('firstTimeSection').classList.add('open');
      }
      // Pre-rellenar usuario si lo recuerda
      if (savedUser) {
        const userInput = document.getElementById('loginUser');
        if (userInput) userInput.value = savedUser;
      }
    }
  },

  /** Muestra/oculta el campo de URL */
  toggleUrl(e) {
    if (e) e.preventDefault();
    const section = document.getElementById('firstTimeSection');
    section.classList.toggle('open');
  },

  /** Login: valida inputs y accede al portal */
  login() {
    const user     = (document.getElementById('loginUser')?.value  || '').trim();
    const password = (document.getElementById('loginPass')?.value  || '').trim();
    const urlInput = (document.getElementById('loginUrl')?.value   || '').trim();

    // Validaciones de campos
    if (!user) {
      this._showError('Por favor ingresa tu nombre de usuario.');
      document.getElementById('loginUser')?.focus();
      return;
    }
    if (!password) {
      this._showError('Por favor ingresa tu contraseña (APP_SECRET_TOKEN).');
      document.getElementById('loginPass')?.focus();
      return;
    }

    // Si escribieron una nueva URL, guardarla
    if (urlInput) {
      if (!urlInput.startsWith('http')) {
        this._showError('La URL de Apps Script no es válida. Debe empezar con https://');
        return;
      }
      api.setBaseUrl(urlInput);
    }

    // Si aún no hay URL configurada en ningún lado
    if (!api.baseUrl) {
      document.getElementById('firstTimeSection').classList.add('open');
      this._showError('Falta la URL de Google Apps Script. Haz clic en "Configura tu conexión" e ingrésala.');
      document.getElementById('loginUrl')?.focus();
      return;
    }

    // Guardar token y usuario
    api.setToken(password);
    localStorage.setItem('wa_user_name', user);

    // Entrar al portal directamente (sin verificación de ping)
    // Si el token es malo, cada sección mostrará su propio error de "Unauthorized"
    this._enterPortal(user);
  },

  /** Entra al portal y oculta el login */
  _enterPortal(userName) {
    // Ocultar login
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) loginScreen.classList.add('hidden');

    // Mostrar badge de usuario en sidebar
    const initials = (userName || 'U').substring(0, 2).toUpperCase();
    const avatarEl = document.getElementById('userAvatar');
    const nameEl   = document.getElementById('userName');
    const badgeEl  = document.getElementById('sidebarUser');
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl)   nameEl.textContent   = userName;
    if (badgeEl)  badgeEl.style.display = 'flex';

    // Limpiar error
    this._hideError();

    // Iniciar la aplicación
    App.init();
  },

  _showLogin() {
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) loginScreen.classList.remove('hidden');
  },

  /** Cierra sesión */
  logout() {
    if (!confirm('¿Cerrar sesión? Tendrás que volver a ingresar tu contraseña la próxima vez.')) return;

    const savedUrl = api.baseUrl; // Guardar la URL para no tener que volver a escribirla
    api.clearSession();
    localStorage.setItem('wa_apps_script_url', savedUrl); // Re-guardar solo la URL

    // Resetear UI del login
    const passInput = document.getElementById('loginPass');
    const btnLogin  = document.getElementById('loginBtn');
    if (passInput) passInput.value = '';
    if (btnLogin) { btnLogin.disabled = false; btnLogin.innerHTML = 'Ingresar al portal'; }

    // Ocultar badge sidebar
    const badgeEl = document.getElementById('sidebarUser');
    if (badgeEl) badgeEl.style.display = 'none';

    this._hideError();
    this._showLogin();
  },

  _showError(msg) {
    const el = document.getElementById('loginError');
    if (!el) return;
    el.textContent  = msg;
    el.style.display = 'block';
    // Re-trigger animation
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = '';
  },

  _hideError() {
    const el = document.getElementById('loginError');
    if (el) el.style.display = 'none';
  }
};

// ── SPA App ─────────────────────────────────────────────────
const App = {
  currentSection: 'dashboard',

  init() {
    this._bindNav();
    this._bindMobileToggle();
    const hash = (location.hash || '').slice(1) || 'dashboard';
    this._load(hash);
    window.addEventListener('hashchange', () => this._load(location.hash.slice(1) || 'dashboard'));
  },

  _bindNav() {
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        location.hash = item.dataset.section;
      });
    });
  },

  _bindMobileToggle() {
    const toggle  = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (!toggle || !sidebar) return;
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle) {
        sidebar.classList.remove('open');
      }
    });
  },

  _load(section) {
    if (!section) section = 'dashboard';
    this.currentSection = section;

    // Activar nav items
    document.querySelectorAll('.nav-item[data-section], .mobile-nav-item[data-section]').forEach(n => {
      n.classList.toggle('active', n.dataset.section === section);
    });

    // Mostrar sección correcta
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`section-${section}`);
    if (el) {
      el.classList.add('active');
      window.Sections?.[section]?.render?.();
    }

    // Cerrar sidebar móvil
    document.getElementById('sidebar')?.classList.remove('open');
  }
};

// ── Toast System ────────────────────────────────────────────
const Toast = {
  show(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error', 6000); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg)    { this.show(msg, 'info'); }
};

// ── Modal System ────────────────────────────────────────────
const Modal = {
  open(title, body, footer = '') {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    overlay.querySelector('.modal-header h3').textContent = title;
    overlay.querySelector('.modal-body').innerHTML        = body;
    overlay.querySelector('.modal-footer').innerHTML      = footer;
    overlay.classList.add('active');
    // Cerrar haciendo clic fuera
    overlay.onclick = (e) => { if (e.target === overlay) this.close(); };
  },
  close() {
    document.getElementById('modalOverlay')?.classList.remove('active');
  }
};

// ── Global Utilities ────────────────────────────────────────
function getBadgeHtml(status) {
  if (!status) return '';
  const s = String(status);
  const cls = s.replace(/\s+/g, '-').toLowerCase();
  return `<span class="badge badge-${cls}">${s}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric' })
         + ' ' + d.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' });
  } catch { return String(dateStr); }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function showLoading(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

function showEmpty(id, icon, title, desc) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${desc || ''}</p>
    </div>`;
}

// ── Section registry ─────────────────────────────────────────
window.Sections = {};

// ── Entry point ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => Auth.init());
