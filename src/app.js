/**
 * ============================================================
 * WA FLOW MANAGER — Main Application Controller
 * SPA router, toast system, modal system
 * ============================================================
 */

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
        const section = item.dataset.section;
        location.hash = section;
      });
    });
  },

  bindMobileToggle() {
    const toggle = document.getElementById('sidebarToggle');
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

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`.nav-item[data-section="${section}"]`).forEach(n => n.classList.add('active'));

    // Update mobile nav
    document.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`.mobile-nav-item[data-section="${section}"]`).forEach(n => n.classList.add('active'));

    // Show section
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`section-${section}`);
    if (el) {
      el.classList.add('active');
      // Call section renderer
      if (window.Sections && window.Sections[section]) {
        window.Sections[section].render();
      }
    }

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('open');
  }
};

// ── Toast System ────────────────────────────────
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
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    return icons[type] || 'ℹ';
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error', 6000); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'info'); }
};

// ── Modal System ────────────────────────────────
const Modal = {
  open(title, contentHtml, footerHtml = '') {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    overlay.querySelector('.modal-header h3').textContent = title;
    overlay.querySelector('.modal-body').innerHTML = contentHtml;
    overlay.querySelector('.modal-footer').innerHTML = footerHtml;
    overlay.classList.add('active');
  },
  close() {
    document.getElementById('modalOverlay')?.classList.remove('active');
  }
};

// ── Utility Functions ───────────────────────────
function getBadgeHtml(status) {
  if (!status) return '';
  const cls = status.replace(/\s+/g, '-').toLowerCase();
  return `<span class="badge badge-${cls}">${status}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
           ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
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

function maskSecret(str) {
  if (!str || str.length < 4) return '****';
  return str.substring(0, 3) + '•'.repeat(Math.max(str.length - 3, 4));
}

// ── Section Registry ────────────────────────────
window.Sections = {};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
