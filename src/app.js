/**
 * ============================================================
 * WA FLOW MANAGER — app.js v1.1
 * SPA router + Auth system + Toast + Modal + Utilities
 * ============================================================
 */

// ── Auth System ─────────────────────────────────────────────
const Auth = {
  init() {
    const savedUser = localStorage.getItem('wa_user_name');
    const hasConfig  = api.isConfigured();

    if (hasConfig && savedUser) {
      // Ya está logueado → mostrar portal directamente
      this.showPortal(savedUser);
    } else {
      // Mostrar pantalla de login
      document.getElementById('loginScreen').classList.remove('hidden');
    }
  },

  toggleFirstTime() {
    const el = document.getElementById('firstTimeFields');
    el.style.display = el.style.display === 'none' ? '' : 'none';
  },

  async login() {
    const user     = (document.getElementById('loginUser')?.value || '').trim();
    const password = (document.getElementById('loginPass')?.value || '').trim();
    const urlField = document.getElementById('loginUrl')?.value?.trim();

    // Validaciones básicas
    if (!user)     { this.showError('Ingresa tu nombre de usuario'); return; }
    if (!password) { this.showError('Ingresa tu contraseña / token de acceso'); return; }

    // Si hay una nueva URL, guardarla
    if (urlField) api.setBaseUrl(urlField);

    // Si aún no hay URL configurada
    if (!api.baseUrl) {
      document.getElementById('firstTimeFields').style.display = '';
      this.showError('Es la primera vez. Ingresa la URL de tu Apps Script (haz clic en "Configura tu conexión")');
      return;
    }

    // Guardar token y nombre
    api.setToken(password);
    localStorage.setItem('wa_user_name', user);

    // Verificar conexión
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Verificando...';
    this.hideError();

    try {
      const res = await api.ping();
      if (res && res.success) {
        this.showPortal(user);
      } else {
        api.clearSession();
        this.showError('Token o URL incorrectos. Verifica tus datos.');
        btn.disabled = false;
        btn.textContent = 'Ingresar al portal';
      }
    } catch (err) {
      api.clearSession();
      this.showError('No se pudo conectar al backend. Verifica la URL de Apps Script.');
      btn.disabled = false;
      btn.textContent = 'Ingresar al portal';
    }
  },

  showPortal(userName) {
    // Ocultar login
    document.getElementById('loginScreen').classList.add('hidden');

    // Mostrar nombre de usuario en sidebar
    const initials = (userName || 'U').substring(0, 2).toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent   = userName;

    // Iniciar la aplicación
    App.init();
  },

  logout() {
    if (!confirm('¿Cerrar sesión? Tendrás que volver a ingresar tu contraseña.')) return;
    api.clearSession();
    localStorage.removeItem('wa_user_name');

    // Resetear formulario de login
    const btn = document.getElementById('loginBtn');
    if (btn) { btn.disabled = false; btn.textContent = 'Ingresar al portal'; }
    document.getElementById('loginPass').value = '';
    this.hideError();

    // Mostrar login
    document.getElementById('loginScreen').classList.remove('hidden');
  },

  showError(msg) {
    const el = document.getElementById('loginError');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  },

  hideError() {
    const el = document.getElementById('loginError');
    if (el) el.style.display = 'none';
  }
};

// ── SPA App ─────────────────────────────────────────────────
const App = {
  currentSection: 'dashboard',

  init() {
    this.bindNavigation();
    this.bindMobileToggle();
    this.loadSection(location.hash.slice(1) || 'dashboard');
    window.addEventListener('hashchange', () => this.loadSection(location.hash.slice(1)));
  },

  bindNavigation() {
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        location.hash = item.dataset.section;
      });
    });
  },

  bindMobileToggle() {
    const toggle  = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
      document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle) {
          sidebar.classList.remove('open');
        }
      });
    }
  },

  loadSection(section) {
    if (!section) section = 'dashboard';
    this.currentSection = section;

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`.nav-item[data-section="${section}"]`).forEach(n => n.classList.add('active'));
    document.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`.mobile-nav-item[data-section="${section}"]`).forEach(n => n.classList.add('active'));

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`section-${section}`);
    if (el) {
      el.classList.add('active');
      if (window.Sections && window.Sections[section]) {
        window.Sections[section].render();
      }
    }

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
    toast.innerHTML = `<span>${this.getIcon(type)}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut .3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  getIcon(type) {
    return { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }[type] || 'ℹ';
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error', 6000); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg)    { this.show(msg, 'info'); }
};

// ── Modal System ────────────────────────────────────────────
const Modal = {
  open(title, contentHtml, footerHtml = '') {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    overlay.querySelector('.modal-header h3').textContent = title;
    overlay.querySelector('.modal-body').innerHTML        = contentHtml;
    overlay.querySelector('.modal-footer').innerHTML      = footerHtml;
    overlay.classList.add('active');
  },
  close() {
    document.getElementById('modalOverlay')?.classList.remove('active');
  }
};

// ── Utilities ───────────────────────────────────────────────
function getBadgeHtml(status) {
  if (!status) return '';
  const cls = String(status).replace(/\s+/g, '-').toLowerCase();
  return `<span class="badge badge-${cls}">${status}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return String(dateStr);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
           ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  } catch { return String(dateStr); }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showLoading(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

function showEmpty(containerId, icon, title, desc) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${desc}</p></div>`;
}

// ── Section Registry ────────────────────────────────────────
window.Sections = {};

// ── Bootstrap ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => Auth.init());
