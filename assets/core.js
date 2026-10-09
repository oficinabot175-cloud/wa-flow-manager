/* WA POWER v2 — núcleo del portal
   Todo el HTML se arma con html`` que escapa cada valor (la v1 insertaba nombres de clientes dentro de
   onclick="..." y un nombre malicioso podía ejecutar código). Los eventos usan data-act + delegación. */
(function () {
  'use strict';
  const APP = window.APP = { views: {}, acts: {}, state: { url: '', token: '', user: null, demo: false }, meta: { stages: [], currency: 'S/', company: '', users: [] } };

  // ── HTML seguro ────────────────────────────────────────────────────────
  class Safe { constructor(s) { this.s = s; } toString() { return this.s; } }
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ESC[c]);
  const toH = (v) => v == null || v === false ? '' : v instanceof Safe ? v.s : Array.isArray(v) ? v.map(toH).join('') : esc(v);
  const html = (str, ...vals) => new Safe(str.reduce((o, s, i) => o + s + (i < vals.length ? toH(vals[i]) : ''), ''));
  const raw = (s) => new Safe(String(s));
  const icon = (n, cls) => raw(`<svg class="i ${cls || ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`);
  Object.assign(APP, { html, raw, esc, icon });

  // ── Formatos ───────────────────────────────────────────────────────────
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const pad = (n) => String(n).padStart(2, '0');
  const D = (iso) => { const d = iso instanceof Date ? iso : new Date(iso); return isNaN(d) ? null : d; };
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const F = APP.fmt = {
    time: (iso) => { const d = D(iso); return d ? pad(d.getHours()) + ':' + pad(d.getMinutes()) : ''; },
    dt: (iso) => { const d = D(iso); return d ? pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + F.time(d) : '—'; },
    date: (iso) => { const d = D(iso); return d ? d.getDate() + ' ' + MONTHS[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '') : '—'; },
    when: (iso) => {
      const d = D(iso); if (!d) return '—';
      const now = new Date(), tmr = new Date(now.getTime() + 864e5), yst = new Date(now.getTime() - 864e5);
      if (sameDay(d, now)) return 'hoy ' + F.time(d);
      if (sameDay(d, tmr)) return 'mañana ' + F.time(d);
      if (sameDay(d, yst)) return 'ayer ' + F.time(d);
      return F.date(d) + ' ' + F.time(d);
    },
    day: (iso) => {
      const d = D(iso); if (!d) return '';
      const now = new Date();
      if (sameDay(d, now)) return 'Hoy';
      if (sameDay(d, new Date(now.getTime() - 864e5))) return 'Ayer';
      return DAYS[d.getDay()].replace(/^./, (c) => c.toUpperCase()) + ' ' + d.getDate() + ' de ' + ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][d.getMonth()];
    },
    ago: (iso) => {
      const d = D(iso); if (!d) return '';
      const m = Math.round((Date.now() - d.getTime()) / 60000);
      if (m < 1) return 'ahora';
      if (m < 60) return 'hace ' + m + ' min';
      if (m < 1440) return 'hace ' + Math.floor(m / 60) + ' h';
      if (m < 2880) return 'ayer';
      return F.date(d);
    },
    short: (iso) => { const d = D(iso); if (!d) return ''; return sameDay(d, new Date()) ? F.time(d) : (Date.now() - d < 6 * 864e5 ? DAYS[d.getDay()].slice(0, 3) : pad(d.getDate()) + '/' + pad(d.getMonth() + 1)); },
    waitMin: (iso) => { const d = D(iso); return d ? Math.max(0, Math.round((Date.now() - d.getTime()) / 60000)) : 0; },
    wait: (iso) => { const m = F.waitMin(iso); if (m < 60) return m + ' min'; if (m < 1440) return Math.floor(m / 60) + ' h ' + pad(m % 60); return Math.floor(m / 1440) + ' d'; },
    money: (v) => APP.meta.currency + ' ' + Math.round(parseFloat(v) || 0).toLocaleString('es-PE'),
    phone: (p) => { p = String(p || ''); if (p.includes('@')) return 'Grupo'; if (p.length === 11 && p.startsWith('51')) return '+51 ' + p.slice(2, 5) + ' ' + p.slice(5, 8) + ' ' + p.slice(8); return p ? '+' + p : ''; },
    initials: (n) => { const w = String(n || '?').replace(/[^\p{L}\p{N}\s]/gu, '').trim().split(/\s+/); return ((w[0] || '?')[0] + (w[1] ? w[1][0] : '')).toUpperCase(); },
    hue: (n) => { let h = 0; for (const c of String(n || '')) h = (h * 31 + c.charCodeAt(0)) % 997; return h % 6; },
    toLocalInput: (iso) => { const d = D(iso); return d ? d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : ''; },
    fromLocalInput: (v) => (v ? new Date(v).toISOString() : ''),
    plural: (n, one, many) => n + ' ' + (n === 1 ? one : many)
  };
  /** Formato de WhatsApp (*negrita*, _cursiva_, ~tachado~) sobre texto ya escapado. */
  APP.wa = (text) => raw(esc(text)
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?:;])/g, '$1<strong>$2</strong>')
    .replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,!?:;])/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])~([^~\n]+)~(?=$|[\s).,!?:;])/g, '$1<s>$2</s>'));
  APP.safeUrl = (u) => (/^https?:\/\//i.test(String(u || '')) ? String(u) : '#');
  APP.avatar = (name, size) => html`<span class="avatar ${size || ''}" data-h="${F.hue(name)}" aria-hidden="true">${F.initials(name)}</span>`;
  APP.waitBadge = (iso, pulse) => { const m = F.waitMin(iso); const hot = m >= 30; return html`<span class="wait ${hot ? 'hot' : ''}">${F.wait(iso)}</span>`; };
  APP.lamp = (iso, pulse) => { const m = F.waitMin(iso); return html`<span class="lamp-dot ${m >= 30 ? 'hot' : ''} ${pulse && m >= 30 ? 'pulse' : ''}" title="Esperando respuesta"></span>`; };
  APP.labels = {
    conv: { open: 'Abierta', pending: 'Pendiente', 'needs-human': 'Requiere humano', resolved: 'Atendida' },
    source: { auto: 'Bot', campaign: 'Campaña', scheduler: 'Programado', command: 'Desde WhatsApp', 'quick-reply': 'Respuesta rápida', system: 'Sistema', 'command-reply': 'Sistema', manual: '', template: 'Plantilla' },
    role: { admin: 'Administrador', supervisor: 'Supervisor', agent: 'Asesor' },
    rec: { once: 'Una vez', daily: 'Diario', weekdays: 'Lunes a viernes', mon_sat: 'Lunes a sábado', weekly: 'Semanal', monthly: 'Mensual', every_n_days: 'Cada N días' },
    camp: { draft: 'Borrador', scheduled: 'Programada', sending: 'Enviando', paused: 'Pausada', completed: 'Terminada', cancelled: 'Cancelada' }
  };
  APP.convPill = (st) => {
    const cls = { 'needs-human': 'lamp', pending: 'petrol', resolved: 'ok' }[st] || '';
    return html`<span class="pill ${cls}">${APP.labels.conv[st] || st}</span>`;
  };
  APP.can = (role) => ({ agent: 1, supervisor: 2, admin: 3 }[(APP.state.user || {}).role] || 0) >= ({ agent: 1, supervisor: 2, admin: 3 }[role] || 9);
  APP.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms || 250); }; };
  APP.$ = (sel, root) => (root || document).querySelector(sel);
  APP.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  APP.formData = (form) => {
    const o = {};
    new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; });
    APP.$$('input[type=checkbox][name]', form).forEach((c) => { if (!c.dataset.multi) o[c.name] = c.checked ? 'true' : 'false'; });
    return o;
  };

  // ── API ────────────────────────────────────────────────────────────────
  const SKEY = 'wap_session';
  function saveSession() {
    try { localStorage.setItem(SKEY, JSON.stringify({ url: APP.state.url, token: APP.state.token, user: APP.state.user, demo: APP.state.demo })); } catch (e) {}
  }
  function loadSession() { try { return JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { return null; } }

  // Lecturas: se guardan en memoria para mostrar al instante al volver a una pantalla.
  // Cualquier escritura (guardar, enviar, borrar…) vacía la memoria para no mostrar datos viejos.
  const READS = new Set(['dashboard', 'conversations', 'conversation', 'contacts', 'deals', 'tasks', 'templates', 'campaigns', 'schedules', 'rules', 'analytics', 'audit', 'commands', 'settings', 'users', 'groups', 'search', 'previewCampaign', 'me', 'poll', 'testRule', 'ping']);
  const SOFT = new Set(['markRead', 'login', 'logout', 'simulateCommand']);
  const memo = new Map();
  const inflight = new Map();
  const keyOf = (action, params) => action + '|' + JSON.stringify(params || {});
  APP.cacheClear = () => memo.clear();
  APP.cacheGet = (action, params) => { const e = memo.get(keyOf(action, params)); return e ? e.data : null; };

  async function rawCall(action, params) {
    const body = Object.assign({ action, token: APP.state.token }, params || {});
    let data;
    if (APP.state.demo) {
      data = await window.DEMO.call(body);
    } else {
      if (!APP.state.url) throw new Error('Falta la URL de Apps Script.');
      let res;
      const ctl = window.AbortController ? new AbortController() : null;
      const timer = setTimeout(() => ctl && ctl.abort(), action === 'runSchedule' || action === 'runTick' ? 120000 : 45000);
      try {
        res = await fetch(APP.state.url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', signal: ctl ? ctl.signal : undefined });
      } catch (e) {
        throw new Error(e && e.name === 'AbortError' ? 'Apps Script tardó demasiado en responder. Intenta de nuevo.' : 'No hay conexión con Apps Script. Revisa tu internet o la URL.');
      } finally { clearTimeout(timer); }
      const txt = await res.text();
      try { data = JSON.parse(txt); } catch (e) {
        throw new Error(/<html/i.test(txt) ? 'Apps Script devolvió una página en vez de datos: publica una nueva versión de la Web App con acceso "Cualquier persona".' : 'Respuesta no válida del servidor.');
      }
    }
    if (data.code === 'unauthorized' && action !== 'login') { APP.expired(); throw new Error(data.error); }
    if (!data.success) { const err = new Error(data.error || 'Algo salió mal.'); err.code = data.code; throw err; }
    return data;
  }

  APP.api = function (action, params) {
    const isRead = READS.has(action);
    if (!isRead) {
      if (!SOFT.has(action)) memo.clear();
      return rawCall(action, params);
    }
    const k = keyOf(action, params);
    if (inflight.has(k)) return inflight.get(k);
    const p = rawCall(action, params).then((d) => {
      if (action !== 'poll' && action !== 'search') memo.set(k, { data: d, at: Date.now() });
      return d;
    }).finally(() => inflight.delete(k));
    inflight.set(k, p);
    return p;
  };

  /**
   * Mostrar primero lo que ya se tiene y luego actualizar (stale-while-revalidate).
   * cb(datos, desdeMemoria) se llama 1 o 2 veces. Devuelve los datos frescos.
   */
  APP.swr = async function (action, params, cb) {
    const k = keyOf(action, params);
    const old = memo.get(k);
    if (old) cb(old.data, true);
    const fresh = await APP.api(action, params);
    if (!old || JSON.stringify(old.data) !== JSON.stringify(fresh)) cb(fresh, false);
    return fresh;
  };
  /** Pide en segundo plano para que la próxima vez sea instantáneo. */
  APP.prefetch = (action, params) => { if (!memo.has(keyOf(action, params))) APP.api(action, params).catch(() => {}); };
  /** Llama a la API mostrando el error como aviso; devuelve null si falla. */
  APP.try = async function (action, params, okMsg) {
    try { const r = await APP.api(action, params); if (okMsg) APP.toast(typeof okMsg === 'function' ? okMsg(r) : okMsg); return r; }
    catch (e) { APP.toast(e.message, 'error'); return null; }
  };

  // ── Avisos ─────────────────────────────────────────────────────────────
  APP.toast = function (msg, type, opts) {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = String(html`<span class="toast-ico">${icon(type === 'error' ? 'alert' : type === 'lamp' ? 'inbox' : 'check')}</span><span class="toast-msg">${msg}</span>`);
    while (box.children.length > 2) box.firstElementChild.remove();
    if (opts && opts.onClick) el.addEventListener('click', () => { opts.onClick(); el.remove(); });
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, type === 'error' ? 6500 : (opts && opts.long ? 8000 : 3800));
  };

  // ── Capas (modal, panel lateral, confirmación) ─────────────────────────
  const layers = [];
  APP.modal = function (o) {
    const ov = document.createElement('div');
    ov.className = 'overlay' + (o.side ? ' side' : '');
    const box = o.side ? 'drawer' : 'modal ' + (o.size || '');
    ov.innerHTML = String(html`<div class="${box}" role="dialog" aria-modal="true" aria-label="${o.title || ''}">
      ${o.title !== undefined ? html`<div class="modal-head">${o.headExtra || ''}<h2>${o.title}</h2><button class="icon-btn" type="button" data-act="layer-close" aria-label="Cerrar">${icon('x')}</button></div>` : ''}
      <div class="modal-body">${o.body || ''}</div>
      ${o.foot ? html`<div class="modal-foot">${o.foot}</div>` : ''}
    </div>`);
    ov._on = o.on || {};
    ov._onClose = o.onClose;
    ov.addEventListener('mousedown', (e) => { if (e.target === ov && !o.sticky) ov._down = true; });
    ov.addEventListener('mouseup', (e) => { if (e.target === ov && ov._down) close(); ov._down = false; });
    document.getElementById('layer').appendChild(ov);
    const prevFocus = document.activeElement;
    layers.push(ov);
    function close(v) {
      if (!ov.isConnected) return;
      ov.remove();
      layers.splice(layers.indexOf(ov), 1);
      if (ov._onClose) ov._onClose(v);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    }
    ov._close = close;
    const ctl = { el: ov, close, $: (s) => ov.querySelector(s), $$: (s) => APP.$$(s, ov), set body(v) { ov.querySelector('.modal-body').innerHTML = String(v); } };
    ov._ctl = ctl;
    setTimeout(() => { const f = ov.querySelector('[autofocus], .modal-body input:not([type=hidden]), .modal-body textarea, .modal-body select, button'); if (f) f.focus(); }, 30);
    if (o.onOpen) o.onOpen(ctl);
    return ctl;
  };
  APP.closeTop = () => { const top = layers[layers.length - 1]; if (top) top._close(); };
  APP.confirm = (text, opts) => new Promise((resolve) => {
    opts = opts || {};
    APP.modal({
      title: opts.title || 'Confirmar', size: '', body: html`<p class="soft">${text}</p>`,
      foot: html`<button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" type="button" data-act="confirm-ok">${opts.ok || 'Confirmar'}</button>`,
      on: { 'confirm-ok': (el) => { resolve(true); el.closest('.overlay')._close(true); } },
      onClose: (v) => { if (v !== true) resolve(false); }
    });
  });
  APP.prompt = (title, label, value, opts) => new Promise((resolve) => {
    let done = false;
    APP.modal({
      title, body: html`<form data-submit="prompt-ok" id="promptForm"><label class="field"><span>${label}</span><input class="input" name="v" value="${value || ''}" placeholder="${(opts && opts.placeholder) || ''}" autofocus></label></form>`,
      foot: html`<button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn btn-primary" type="submit" form="promptForm">${(opts && opts.ok) || 'Guardar'}</button>`,
      on: { 'prompt-ok': (form) => { done = true; resolve(form.v.value.trim()); form.closest('.overlay')._close(); } },
      onClose: () => { if (!done) resolve(null); }
    });
  });

  // ── Delegación de eventos ──────────────────────────────────────────────
  function handlerFor(el, key) {
    const ov = el.closest('.overlay');
    if (ov && ov._on && ov._on[key]) return ov._on[key];
    if (APP.cur && APP.cur.on && APP.cur.on[key]) return APP.cur.on[key].bind(APP.cur);
    return APP.acts[key];
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const h = handlerFor(el, el.dataset.act);
    if (h) { if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault(); h(el, e); }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-submit]');
    if (!f) return;
    e.preventDefault();
    const h = handlerFor(f, f.dataset.submit);
    if (h) h(f, e);
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const h = handlerFor(el, el.dataset.change);
    if (h) h(el, e);
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-input]');
    if (!el) return;
    const h = handlerFor(el, el.dataset.input);
    if (h) h(el, e);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && APP.state.user) { e.preventDefault(); APP.acts.palette(); return; }
    if (e.key === 'Escape' && layers.length) { e.preventDefault(); APP.closeTop(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role=button][data-act]')) { e.preventDefault(); e.target.click(); return; }
    const el = e.target.closest && e.target.closest('[data-keydown]');
    if (el) { const h = handlerFor(el, el.dataset.keydown); if (h) h(el, e); }
  });
  document.addEventListener('error', (e) => { const t = e.target; if (t && t.tagName === 'IMG' && t.closest('.thumb')) t.closest('.thumb').classList.add('broken'); }, true);
  APP.acts['layer-close'] = (el) => { const ov = el.closest('.overlay'); if (ov) ov._close(); };

  // ── Enrutador ──────────────────────────────────────────────────────────
  APP.view = (name, def) => { APP.views[name] = def; };
  APP.go = (path) => { if (location.hash === '#/' + path) APP.route(); else location.hash = '#/' + path; };
  APP.route = async function () {
    if (!APP.state.user) return;
    const parts = (location.hash.replace(/^#\/?/, '') || 'mesa').split('/').map(decodeURIComponent);
    let name = parts[0];
    let v = APP.views[name];
    if (!v || (v.min && !APP.can(v.min))) { name = 'mesa'; v = APP.views.mesa; }
    while (layers.length) layers[layers.length - 1]._close();
    if (APP.cur && APP.cur !== v && APP.cur.leave) APP.cur.leave();
    APP.cur = v;
    APP.$$('.nav-item').forEach((a) => a.classList.toggle('active', a.dataset.route === name));
    document.getElementById('viewTitle').textContent = v.title;
    document.title = (APP._badge ? '(' + APP._badge + ') ' : '') + v.title + ' · WA Power';
    const host = document.getElementById('view');
    host.className = 'view' + (v.flush ? ' flush' : '');
    host.scrollTop = 0;
    document.getElementById('app').classList.remove('nav-open');
    APP.$$('.tab-item').forEach((a) => a.classList.toggle('active', a.dataset.route === name || (a.dataset.route === 'mas' && !['mesa', 'bandeja', 'contactos', 'tareas'].includes(name))));
    // Contenedor nuevo por cada visita: si una respuesta lenta llega tarde, escribe en un
    // contenedor que ya no está en pantalla y no pisa la sección actual.
    const el = document.createElement('div');
    el.className = 'view-inner';
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    host.replaceChildren(el);
    v._name = name;
    try { await v.render(el, parts.slice(1)); }
    catch (e) { if (el.isConnected) el.innerHTML = String(html`<div class="page"><div class="panel"><div class="empty">${icon('alert')}<strong>No se pudo cargar esta sección</strong><p>${e.message}</p><button class="btn" data-act="reload">Reintentar</button></div></div></div>`); }
  };
  APP.alive = (el) => !!(el && el.isConnected);
  APP.acts.reload = () => APP.route();
  window.addEventListener('hashchange', () => APP.route());

  // ── Sesión ─────────────────────────────────────────────────────────────
  APP.boot = async function () {
    let theme = '';
    try { theme = localStorage.getItem('wap_theme') || ''; } catch (e) {}
    applyTheme(theme);
    const s = loadSession();
    if (window.__WAP_AUTODEMO) return APP.acts.demo();
    if (s && s.demo) return APP.acts.demo();
    if (s && s.token && s.url) {
      Object.assign(APP.state, { url: s.url, token: s.token, user: s.user });
      try { const r = await APP.api('me'); APP.state.user = r.user; return enter(); }
      catch (e) { APP.state.token = ''; }
    }
    showLogin(s);
  };

  function showLogin(s) {
    document.getElementById('app').hidden = true;
    const lg = document.getElementById('login');
    lg.hidden = false;
    const f = lg.querySelector('form');
    if (s && s.url) f.url.value = s.url; else document.getElementById('loginConn').open = true;
    if (s && s.user) f.user.value = s.user.name || '';
    setTimeout(() => (f.user.value ? f.password : f.user).focus(), 50);
  }

  APP.acts.login = async (form) => {
    const d = APP.formData(form);
    const err = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    err.hidden = true;
    const url = d.url || (loadSession() || {}).url || '';
    if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) {
      document.getElementById('loginConn').open = true;
      err.textContent = 'Pega la URL de tu aplicación web de Apps Script (empieza con https://script.google.com/macros/s/…).';
      err.hidden = false;
      return;
    }
    btn.disabled = true; btn.textContent = 'Verificando…';
    APP.state.url = url; APP.state.demo = false; APP.state.token = '';
    try {
      const r = await APP.api('login', { user: d.user, password: d.password });
      APP.state.token = r.token; APP.state.user = r.user;
      saveSession();
      form.password.value = '';
      enter();
    } catch (e) {
      err.textContent = e.message; err.hidden = false;
    } finally { btn.disabled = false; btn.textContent = 'Ingresar'; }
  };

  APP.expired = () => {
    if (APP.state.demo) return;
    APP.state.token = ''; saveSession(); stopPoll();
    APP.toast('Tu sesión venció. Vuelve a ingresar.', 'error');
    showLogin(loadSession());
  };

  APP.acts.logout = async () => {
    if (!(await APP.confirm('¿Cerrar la sesión en este navegador?', { ok: 'Cerrar sesión' }))) return;
    if (!APP.state.demo) APP.api('logout').catch(() => {});
    stopPoll();
    const url = APP.state.demo ? (loadSession() || {}).prevUrl || '' : APP.state.url;
    Object.assign(APP.state, { token: '', user: APP.state.user, demo: false, url });
    saveSession();
    location.hash = '';
    showLogin(loadSession());
  };

  async function enter() {
    document.getElementById('login').hidden = true;
    document.getElementById('app').hidden = false;
    const u = APP.state.user;
    document.getElementById('meName').textContent = u.name;
    document.getElementById('meRole').textContent = APP.labels.role[u.role] || u.role;
    const av = document.getElementById('meAvatar');
    av.textContent = F.initials(u.name); av.dataset.h = F.hue(u.name);
    APP.$$('.nav-item[data-min]').forEach((a) => { a.hidden = !APP.can(a.dataset.min); });
    document.getElementById('demoBanner').hidden = !APP.state.demo;
    if (window.__WAP_AUTODEMO) { const a = document.querySelector('[data-act="demo-exit"]'); if (a) { a.textContent = 'Reiniciar la demo'; a.dataset.act = 'demo-restart'; } }
    APP.$$('.demo-only').forEach((b) => { b.hidden = !APP.state.demo; });
    APP.prefetch('dashboard');
    await APP.loadMeta();
    APP.route();
    startPoll();
    setTimeout(() => { APP.prefetch('conversations', { filter: 'open', q: '' }); APP.prefetch('templates', { status: 'active' }); }, 1200);
  }

  APP.loadMeta = async function () {
    try {
      const s = await APP.api('settings', {});
      APP.meta.stages = s.stages || [];
      APP.meta.currency = s.settings.CURRENCY.value || 'S/';
      APP.meta.company = s.settings.COMPANY_NAME.value || '';
      APP.meta.users = s.users || [];
      APP.meta.settings = s;
      APP.meta.subtitle = (s.settings.PORTAL_SUBTITLE && s.settings.PORTAL_SUBTITLE.value) || 'WhatsApp Corporativo';
      document.getElementById('navCompany').textContent = APP.meta.subtitle;
      setBot(s.settings.BOT_ENABLED.value === 'true');
    } catch (e) { APP.toast(e.message, 'error'); }
  };

  function setBot(on) {
    const b = document.getElementById('botSwitch');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    document.getElementById('botLabel').textContent = on ? 'Bot encendido' : 'Bot apagado';
    APP.meta.bot = on;
  }
  APP.setBot = setBot;
  APP.acts['toggle-bot'] = async () => {
    if (!APP.can('admin')) return APP.toast('Solo un administrador puede encender o apagar el bot.', 'error');
    const on = !APP.meta.bot;
    const r = await APP.try('saveSettings', { values: { BOT_ENABLED: on ? 'true' : 'false' } }, on ? 'Bot encendido: responde automáticamente.' : 'Bot apagado: los mensajes quedan esperando en la bandeja.');
    if (r) setBot(on);
  };

  // ── Tema ───────────────────────────────────────────────────────────────
  function applyTheme(t) {
    if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  }
  APP.setTheme = (t) => { applyTheme(t); try { localStorage.setItem('wap_theme', t); } catch (e) {} };
  APP.getTheme = () => { try { return localStorage.getItem('wap_theme') || ''; } catch (e) { return ''; } };
  APP.acts.theme = () => {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('wap_theme', next); } catch (e) {}
  };

  // ── Menú móvil ─────────────────────────────────────────────────────────
  APP.acts['tab-more'] = () => document.getElementById('app').classList.add('nav-open');
  APP.acts['nav-open'] = () => document.getElementById('app').classList.add('nav-open');
  APP.acts['nav-close'] = () => document.getElementById('app').classList.remove('nav-open');

  // ── Novedades cada 20 s ────────────────────────────────────────────────
  let pollTimer = null, pollSince = '', pollV = '', polling = false;
  function startPoll() { stopPoll(); pollSince = new Date().toISOString(); pollV = ''; poll(); pollTimer = setInterval(poll, 15000); }
  function stopPoll() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }
  APP.pollNow = () => { pollV = ''; return poll(); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && APP.state.user) poll(); });

  // Sonido corto al llegar un mensaje (se apaga en Configuración › Mi cuenta)
  let audioCtx = null;
  APP.soundOn = () => { try { return localStorage.getItem('wap_sound') !== 'off'; } catch (e) { return true; } };
  APP.chime = () => {
    if (!APP.soundOn()) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime;
      [[880, 0], [1320, 0.12]].forEach(([f, d]) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.18, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.25);
        o.connect(g); g.connect(audioCtx.destination); o.start(t + d); o.stop(t + d + 0.3);
      });
    } catch (e) {}
  };
  async function poll() {
    if ((document.hidden && !APP.state.demo) || polling) return;
    polling = true;
    let r;
    try { r = await APP.api('poll', { since: pollSince, v: pollV }); } catch (e) { polling = false; return; }
    polling = false;
    pollSince = r.now;
    if (r.unchanged) { if (APP.cur && APP.cur.tick) APP.cur.tick(); return; }
    if (pollV) memo.clear(); // cambió algo en el servidor: lo guardado en memoria ya no sirve
    pollV = r.v || '';
    const tb = document.getElementById('tabInbox');
    if (tb) { tb.hidden = !r.counts.waiting; tb.textContent = r.counts.waiting; }
    const w = r.counts.waiting;
    const ci = document.getElementById('cntInbox');
    ci.hidden = !w; ci.textContent = w;
    const ct = document.getElementById('cntTasks');
    ct.hidden = !r.tasks_due; ct.textContent = r.tasks_due;
    APP._badge = w || 0;
    document.title = (w ? '(' + w + ') ' : '') + (APP.cur ? APP.cur.title : '') + ' · WA Power';
    if (APP.meta.bot !== r.bot) setBot(r.bot);
    (r.fresh || []).forEach((m) => {
      const viewing = APP.cur === APP.views.bandeja && APP.views.bandeja.phone === m.phone;
      if (viewing) return;
      APP.toast(html`<strong>${m.name}</strong> ${(m.body || '').slice(0, 80)}`, 'lamp', { onClick: () => APP.go('bandeja/' + m.phone) });
      APP.chime();
      if (window.Notification && Notification.permission === 'granted' && document.hidden) {
        try { const n = new Notification(m.name, { body: m.body, tag: m.phone }); n.onclick = () => { window.focus(); APP.go('bandeja/' + m.phone); }; } catch (e) {}
      }
    });
    if (APP.cur && APP.cur.poll) APP.cur.poll(r);
  }

  // ── Paleta Ctrl+K ──────────────────────────────────────────────────────
  const NAV = [
    ['mesa', 'Mesa de atención', 'desk'], ['bandeja', 'Bandeja', 'inbox'], ['contactos', 'Contactos', 'users'], ['embudo', 'Oportunidades', 'board'],
    ['tareas', 'Tareas', 'tasks'], ['campanas', 'Campañas', 'megaphone', 'supervisor'], ['programados', 'Programados', 'clock'], ['plantillas', 'Plantillas', 'template'],
    ['automatizacion', 'Automatización', 'bolt', 'supervisor'], ['analitica', 'Analítica', 'chart', 'supervisor'], ['whatsapp', 'Comandos por WhatsApp', 'terminal'], ['configuracion', 'Configuración', 'sliders']
  ];
  APP.acts.palette = () => {
    if (document.querySelector('.palette')) return;
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = String(html`<div class="palette" role="dialog" aria-label="Buscar"><div class="palette-input">${icon('search')}<input placeholder="Buscar contacto, oportunidad o sección…" aria-label="Buscar" autocomplete="off"><kbd>Esc</kbd></div><div class="palette-list"></div></div>`);
    document.getElementById('layer').appendChild(ov);
    layers.push(ov);
    ov._close = () => { ov.remove(); layers.splice(layers.indexOf(ov), 1); };
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) ov._close(); });
    const input = ov.querySelector('input'), list = ov.querySelector('.palette-list');
    let items = [], idx = 0, searching = false, enterPending = false;
    const actions = [
      ['Nuevo mensaje', 'send', () => APP.acts.compose()],
      ['Nuevo contacto', 'users', () => APP.views.contactos.edit()],
      ['Nueva tarea', 'tasks', () => APP.views.tareas.edit()],
      ['Nueva oportunidad', 'board', () => APP.views.embudo.edit()]
    ];
    function paint(results) {
      const q = input.value.trim().toLowerCase();
      items = [];
      const groups = [];
      const navHits = NAV.filter((n) => (!n[3] || APP.can(n[3])) && (!q || n[1].toLowerCase().includes(q)));
      const actHits = actions.filter((a) => !q || a[0].toLowerCase().includes(q));
      if (results && results.contacts.length) groups.push(['Contactos', results.contacts.map((c) => ({ label: c.name, sub: F.phone(c.phone), ico: 'users', run: () => APP.go('bandeja/' + c.phone) }))]);
      if (results && results.deals.length) groups.push(['Oportunidades', results.deals.map((d) => ({ label: d.title, sub: d.stage + ' · ' + F.money(d.value), ico: 'board', run: () => APP.views.embudo.edit(d.deal_id) }))]);
      if (results && results.tasks.length) groups.push(['Tareas', results.tasks.map((t) => ({ label: t.title, sub: t.due_at ? F.when(t.due_at) : '', ico: 'tasks', run: () => APP.go('tareas') }))]);
      if (actHits.length) groups.push(['Acciones', actHits.map((a) => ({ label: a[0], ico: a[1], run: a[2] }))]);
      if (navHits.length) groups.push(['Ir a', navHits.map((n) => ({ label: n[1], ico: n[2], run: () => APP.go(n[0]) }))]);
      let h = '';
      groups.forEach(([g, arr]) => {
        h += String(html`<div class="palette-group">${g}</div>`);
        arr.forEach((it) => { h += String(html`<div class="palette-item" data-i="${items.length}">${icon(it.ico)}<span>${it.label}</span><span class="muted">${it.sub || ''}</span></div>`); items.push(it); });
      });
      list.innerHTML = h || String(html`<div class="empty"><p>Sin resultados para "${input.value}".</p></div>`);
      idx = 0; mark();
    }
    function mark() { APP.$$('.palette-item', list).forEach((el, i) => el.classList.toggle('on', i === idx)); const on = list.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' }); }
    function run(i) { const it = items[i]; if (!it) return; ov._close(); it.run(); }
    const search = APP.debounce(async () => {
      const q = input.value.trim();
      if (q.length < 2) { searching = false; return paint(null); }
      try { const r = await APP.api('search', { q }); if (input.value.trim() === q) paint(r); } catch (e) { paint(null); }
      searching = false;
      if (enterPending) { enterPending = false; if (items.length) run(0); }
    }, 200);
    input.addEventListener('input', () => { searching = input.value.trim().length >= 2; paint(null); search(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(idx + 1, items.length - 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(idx - 1, 0); mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (searching && idx === 0) enterPending = true; else run(idx); }
    });
    list.addEventListener('click', (e) => { const it = e.target.closest('.palette-item'); if (it) run(+it.dataset.i); });
    paint(null);
    input.focus();
  };

  // ── Nuevo mensaje (global) ─────────────────────────────────────────────
  APP.varChips = (target) => html`<div class="var-chips" data-target="${target}">${['first_name', 'whatsapp_name', 'greeting', 'company_name', 'agent', 'today', 'time', 'city', 'company'].map((v) => html`<button type="button" data-act="insert-var" data-v="${'{{' + v + '}}'}">${'{{' + v + '}}'}</button>`)}</div>`;
  APP.acts['insert-var'] = (el) => {
    const box = el.closest('.var-chips');
    const ta = document.querySelector(box.dataset.target);
    if (!ta) return;
    const s = ta.selectionStart || ta.value.length, e2 = ta.selectionEnd || s;
    ta.value = ta.value.slice(0, s) + el.dataset.v + ta.value.slice(e2);
    ta.focus(); ta.selectionStart = ta.selectionEnd = s + el.dataset.v.length;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  };

  APP.acts.compose = async (el) => {
    const pre = (el && el.dataset && el.dataset.to) || '';
    const preGroups = (el && el.dataset && el.dataset.groups) ? el.dataset.groups.split(',') : [];
    const preTpl = (el && el.dataset && el.dataset.tpl) || '';
    let tpls = [];
    try { tpls = (await APP.api('templates', { status: 'active' })).data; } catch (e) {}
    const groups = await APP.groups();
    APP.modal({
      title: 'Nuevo mensaje', size: 'lg',
      body: html`<form id="composeForm" data-submit="compose-send" class="stack">
        <label class="field"><span>Para</span><textarea class="textarea" name="recipient" rows="2" placeholder="999 888 777, 51988777666… (uno o varios, separados por coma o línea)">${pre}</textarea>
        <span class="hint">Números de 9 dígitos reciben el código 51 automáticamente. Con varios destinatarios los mensajes salen uno a uno desde la cola.</span></label>
        ${groups.length ? html`<div class="field"><span>Grupos</span>${APP.groupPicker(groups, preGroups)}</div>` : ''}
        <label class="field"><span>Plantilla</span><select class="select" name="template_id" data-change="compose-tpl"><option value="">Escribir un mensaje propio</option>${tpls.map((t) => html`<option value="${t.template_id}">${t.name}${t.shortcut ? ' · /' + t.shortcut : ''}</option>`)}</select></label>
        <label class="field"><span>Mensaje</span><textarea class="textarea" id="composeMsg" name="message" rows="5" required placeholder="{{greeting}} {{first_name}}, …"></textarea></label>
        ${APP.varChips('#composeMsg')}
        <div class="fields">${APP.fileField('file_url', '')}${APP.fileField('document_url', '')}</div>
        <label class="field" style="max-width:280px"><span>Enviar más tarde <span class="muted" style="font-weight:400">· opcional</span></span><input class="input" name="send_at" type="datetime-local"></label>
      </form>`,
      foot: html`<button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn btn-primary" type="submit" form="composeForm">${icon('send')}Enviar</button>`,
      onOpen: (m) => { if (preTpl) { const sel = m.$('[name=template_id]'); sel.value = preTpl; sel.dispatchEvent(new Event('change', { bubbles: true })); } },
      on: {
        'compose-tpl': (sel) => { const t = tpls.find((x) => x.template_id === sel.value); const f = sel.form; if (t) { f.message.value = t.message; [['file_url', t.file_url], ['document_url', t.document_url]].forEach(([k, v]) => { f[k].value = v || ''; f[k].dispatchEvent(new Event('input', { bubbles: true })); }); } },
        'compose-send': async (form) => {
          const d = APP.formData(form);
          const gs = APP.$$('input[name=groups]:checked', form).map((c) => c.value);
          delete d.groups;
          d.recipient = [d.recipient].concat(gs).filter(Boolean).join(', ');
          if (!d.recipient) return APP.toast('Escribe al menos un número o elige un grupo.', 'error');
          if (d.send_at) d.send_at = F.fromLocalInput(d.send_at);
          const btn = form.closest('.overlay').querySelector('[type=submit]');
          btn.disabled = true;
          const r = await APP.try('sendMessage', d);
          btn.disabled = false;
          if (!r) return;
          APP.toast(r.queued ? F.plural(r.queued, 'mensaje en cola', 'mensajes en cola') + (d.send_at ? ' para ' + F.when(r.send_at) : '') : 'Mensaje enviado.');
          form.closest('.overlay')._close();
          if (APP.cur && APP.cur.poll) APP.pollNow();
        }
      }
    });
  };

  // ── Adjuntos: URL pública o archivo subido a tu Google Drive ──────────
  const KINDS = {
    file_url: ['Imagen o video', 'image/jpeg,image/png,image/webp,image/gif,video/mp4', 'Sale como foto con el texto de pie'],
    document_url: ['Documento', 'application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx', 'PDF u Office, sale como archivo adjunto'],
    audio_url: ['Audio', 'audio/mpeg,audio/mp3,audio/ogg,audio/aac,audio/mp4', 'MP3 u OGG, sale como audio']
  };
  APP.fileField = (name, value, opts) => {
    const k = KINDS[name];
    const id = 'ff_' + name + '_' + Math.random().toString(36).slice(2, 7);
    return html`<div class="field file-field" data-ff="${id}">
      <span>${(opts && opts.label) || k[0]} <span class="muted" style="font-weight:400">· opcional</span></span>
      <div class="row">
        <input class="input" name="${name}" id="${id}" type="url" value="${value || ''}" placeholder="Pega un enlace público o sube un archivo" data-input="file-url" data-kind="${name}">
        <label class="btn btn-sm file-btn" title="${k[2]}">${icon('upload', 'sm')}<span>Subir</span><input type="file" accept="${k[1]}" data-change="file-pick" data-target="${id}" data-kind="${name}" hidden></label>
      </div>
      <div class="file-prev" id="${id + '_p'}">${APP.filePreview(name, value)}</div>
    </div>`;
  };
  APP.filePreview = (kind, url) => {
    if (!url) return '';
    const safe = /^(https?:|data:(image|audio|video|application)\/)/i.test(url) ? url : '';
    if (!safe) return html`<span class="hint">El enlace debe empezar con https://</span>`;
    if (kind === 'file_url' && (/^data:image\//.test(url) || /\.(jpe?g|png|webp|gif)(\?|$)|thumbnail\?|googleusercontent|drive\.google\.com/i.test(url))) {
      const src = /drive\.google\.com\/uc\?export=download&id=([\w-]+)/.exec(url);
      return html`<div class="thumb"><img src="${src ? 'https://drive.google.com/thumbnail?id=' + src[1] + '&sz=w400' : url}" alt="Vista previa del adjunto" loading="lazy"><button type="button" class="icon-btn sm" data-act="file-clear" aria-label="Quitar adjunto">${icon('x', 'sm')}</button></div>`;
    }
    return html`<div class="row small"><span class="tag">${icon(kind === 'audio_url' ? 'phone' : 'template', 'sm')}${kind === 'audio_url' ? 'Audio adjunto' : kind === 'document_url' ? 'Documento adjunto' : 'Archivo adjunto'}</span><button type="button" class="btn btn-ghost btn-sm" data-act="file-clear">Quitar</button></div>`;
  };
  function compressImage(file) {
    return new Promise((resolve) => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 350 * 1024) return resolve(file);
      const img = new Image();
      img.onload = () => {
        const max = 1600, sc = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((b) => resolve(b && b.size < file.size ? new File([b], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', 0.85);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }
  const toB64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
  APP.acts['file-pick'] = async (input) => {
    const f = input.files && input.files[0];
    if (!f) return;
    const target = document.getElementById(input.dataset.target);
    const prev = document.getElementById(input.dataset.target + '_p');
    const btn = input.closest('.file-btn');
    btn.classList.add('busy');
    prev.innerHTML = String(html`<span class="hint">Subiendo ${f.name}…</span>`);
    try {
      const file = await compressImage(f);
      if (file.size > 15 * 1024 * 1024) throw new Error('El archivo supera 15 MB.');
      const r = await APP.api('uploadFile', { name: file.name, mime: file.type || f.type, data: await toB64(file) });
      target.value = r.url;
      prev.innerHTML = String(APP.filePreview(input.dataset.kind, r.preview_url && input.dataset.kind === 'file_url' ? r.preview_url : r.url));
      target.dispatchEvent(new Event('input', { bubbles: true }));
      APP.toast('Archivo listo: ' + r.name);
    } catch (e) { prev.innerHTML = ''; APP.toast(e.message, 'error'); }
    btn.classList.remove('busy');
    input.value = '';
  };
  APP.acts['file-url'] = APP.debounce((input) => {
    const prev = document.getElementById(input.id + '_p');
    if (prev) prev.innerHTML = String(APP.filePreview(input.dataset.kind, input.value.trim()));
  }, 350);
  APP.acts['file-clear'] = (el) => {
    const box = el.closest('.file-field');
    const input = box.querySelector('input[type=url]');
    input.value = ''; box.querySelector('.file-prev').innerHTML = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // ── Grupos (caché corta para los selectores) ───────────────────────────
  APP.groups = async (fresh) => {
    if (!fresh && APP._groups && Date.now() - APP._groups.at < 60000) return APP._groups.data;
    try { const r = await APP.api('groups'); APP._groups = { at: Date.now(), data: r.data }; return r.data; } catch (e) { return []; }
  };
  APP.groupPicker = (groups, selected) => groups.length
    ? html`<div class="group-picks">${groups.map((g) => html`<label class="check group-pick"><input type="checkbox" data-multi="1" name="groups" value="${g.group_id}" ${selected.includes(g.group_id) ? 'checked' : ''}>${icon('users', 'sm')}<span>${g.name || 'Grupo sin nombre'}</span></label>`)}</div>`
    : html`<p class="hint">Aún no tienes grupos registrados. Agrégalos en <a href="#/grupos">Grupos</a> con su enlace de invitación.</p>`;

  // ── Modo demo ──────────────────────────────────────────────────────────
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar ' + src)); document.head.appendChild(s); });
  }
  APP.acts.demo = async () => {
    try {
      if (!window.DEMO) {
        await loadScript('demo/gas-shim.js');
        await loadScript('demo/backend.js');
        await loadScript('demo/demo.js');
      }
      const prev = loadSession() || {};
      const r = window.DEMO.init();
      Object.assign(APP.state, { demo: true, token: r.token, user: r.user });
      try { localStorage.setItem(SKEY, JSON.stringify({ demo: true, prevUrl: prev.url || prev.prevUrl || '' })); } catch (e) {}
      enter();
    } catch (e) { APP.toast(e.message, 'error'); }
  };
  APP.acts['demo-exit'] = () => {
    const s = loadSession() || {};
    try { localStorage.setItem(SKEY, JSON.stringify({ url: s.prevUrl || '' })); } catch (e) {}
    stopPoll();
    Object.assign(APP.state, { demo: false, token: '', user: null });
    location.hash = '';
    if (window.__WAP_AUTODEMO) { window.__WAP_AUTODEMO = false; }
    showLogin(loadSession());
  };
  APP.acts['demo-inbound'] = () => window.DEMO && window.DEMO.inboundDialog();
  APP.acts['demo-restart'] = () => { location.hash = ''; location.reload(); };
})();
