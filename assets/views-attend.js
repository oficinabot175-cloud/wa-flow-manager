/* WA POWER v2 — Atención: Mesa de atención, Bandeja y ficha del contacto */
(function () {
  'use strict';
  const { html, icon, fmt: F } = APP;

  // ══ Ficha del contacto (se usa en la bandeja y en el panel lateral de Contactos) ══
  const splitTags = (s) => String(s || '').split(',').map((t) => t.trim()).filter(Boolean);
  const SOURCE = { whatsapp: 'Escribió por WhatsApp', manual: 'Creado a mano', import: 'Importado', campaign: 'Campaña' };

  APP.profileHtml = function (r, opts) {
    opts = opts || {};
    const c = r.contact || null;
    const name = (c && (c.display_name || c.whatsapp_name)) || F.phone(r.phone);
    const dnc = c && c.do_not_contact === 'true';
    const deals = r.deals || [], notes = r.notes || [];
    const tasks = (r.tasks || []).filter((t) => t.status === 'open');
    const now = new Date().toISOString();
    return html`
      <div class="profile-top">
        <div class="spread" style="width:100%">${APP.avatar(name, 'lg')}
          ${opts.inInbox ? html`<button class="icon-btn" type="button" data-act="toggle-profile" aria-label="Cerrar ficha">${icon('x')}</button>` : ''}</div>
        <div><h3>${name}</h3><div class="muted small">${F.phone(r.phone)}</div></div>
        <div class="row wrap">
          ${dnc ? html`<span class="pill alert">No contactar</span>` : ''}
          ${c && c.status === 'inactive' ? html`<span class="pill">Inactivo</span>` : ''}
          ${c && c.owner ? html`<span class="pill petrol">${icon('assign', 'sm')}${c.owner}</span>` : ''}
        </div>
        <div class="row wrap">
          ${!opts.inInbox ? html`<button class="btn btn-primary btn-sm" type="button" data-act="pf-chat">${icon('inbox', 'sm')}Abrir chat</button>` : ''}
          <button class="btn btn-sm" type="button" data-act="pf-edit">${icon('edit', 'sm')}${c ? 'Editar datos' : 'Guardar como contacto'}</button>
        </div>
      </div>
      ${c ? html`<section class="profile-sec"><h4>Datos</h4>
        <dl class="kv">
          <dt>Empresa</dt><dd>${c.company || '—'}</dd>
          <dt>Correo</dt><dd>${c.email || '—'}</dd>
          <dt>Ciudad</dt><dd>${c.city || '—'}</dd>
          <dt>Origen</dt><dd>${SOURCE[c.source] || c.source || '—'}</dd>
          <dt>Desde</dt><dd>${F.date(c.first_seen_at || c.created_at)}</dd>
          <dt>Escribió</dt><dd>${c.last_inbound_at ? F.ago(c.last_inbound_at) : '—'}</dd>
        </dl>
        ${c.notes ? html`<p class="small soft">${c.notes}</p>` : ''}
      </section>` : ''}
      <section class="profile-sec"><h4>Etiquetas</h4>
        ${splitTags(c && c.tags).length ? html`<div class="tags">${splitTags(c.tags).map((t) => html`<span class="tag">${t}<button type="button" data-act="pf-tag-del" data-t="${t}" aria-label="${'Quitar ' + t}">×</button></span>`)}</div>` : ''}
        <form class="row" data-submit="pf-tag-add"><input class="input sm" name="t" placeholder="Agregar etiqueta" aria-label="Nueva etiqueta" list="tagSuggest" autocomplete="off"><button class="btn btn-sm" type="submit">Agregar</button></form>
      </section>
      <section class="profile-sec"><h4>Oportunidades <button class="btn btn-ghost btn-sm" type="button" data-act="pf-deal-new">${icon('plus', 'sm')}Nueva</button></h4>
        ${deals.length ? deals.map((d) => html`<div class="mini-card clickable" data-act="pf-deal" data-id="${d.deal_id}" role="button" tabindex="0">
          <div class="spread"><strong class="ellipsis">${d.title}</strong><span class="num">${F.money(d.value)}</span></div>
          <div class="row small"><span class="pill ${d.status === 'won' ? 'ok' : d.status === 'lost' ? '' : 'petrol'}">${d.stage}</span>${d.product ? html`<span class="muted ellipsis">${d.product}</span>` : ''}</div>
        </div>`) : html`<p class="small muted">Aún no hay oportunidades con este contacto.</p>`}
      </section>
      <section class="profile-sec"><h4>Tareas <button class="btn btn-ghost btn-sm" type="button" data-act="pf-task-new">${icon('plus', 'sm')}Nueva</button></h4>
        ${tasks.length ? tasks.map((t) => html`<div class="row small" style="align-items:flex-start">
          <button class="icon-btn sm" type="button" data-act="pf-task-done" data-id="${t.task_id}" title="Marcar como hecha" aria-label="${'Completar ' + t.title}">${icon('tasks', 'sm')}</button>
          <div class="grow"><div>${t.title}</div>${t.due_at ? html`<div class="${t.due_at < now ? 'wait hot' : 'muted'}" style="font-weight:500">${F.when(t.due_at)}</div>` : ''}</div>
        </div>`) : html`<p class="small muted">Sin tareas pendientes.</p>`}
      </section>
      <section class="profile-sec"><h4>Notas internas</h4>
        <form class="stack" style="gap:6px" data-submit="pf-note">
          <textarea class="textarea" name="body" rows="2" placeholder="Solo la ve tu equipo, nunca el cliente" aria-label="Nueva nota" style="min-height:60px"></textarea>
          <div><button class="btn btn-sm" type="submit">Guardar nota</button></div>
        </form>
        ${notes.map((n) => html`<div class="note">${n.body}<div class="meta"><span>${n.author} · ${F.ago(n.created_at)}</span><button class="icon-btn sm" type="button" data-act="pf-note-del" data-id="${n.note_id}" aria-label="Borrar nota">${icon('trash', 'sm')}</button></div></div>`)}
      </section>
      <section class="profile-sec"><h4>Respuestas automáticas</h4>
        <div class="seg bot-seg" role="group" aria-label="Respuestas automáticas en este chat">
          ${[['', 'Automático'], ['on', 'Siempre'], ['off', 'Nunca']].map((o) => html`<button type="button" data-act="pf-bot" data-v="${o[0]}" aria-pressed="${((c && c.bot) || '') === o[0] ? 'true' : 'false'}">${o[1]}</button>`)}
        </div>
        <p class="small ${r.bot && r.bot.ok ? 'soft' : ''}" style="${r.bot && !r.bot.ok ? 'color:var(--lamp-ink)' : ''}">${icon('bot', 'sm')} ${r.bot ? r.bot.text : ''}</p>
        <p class="hint">Automático sigue la regla general: etiquetas excluidas y silencio mientras un asesor atiende. "Nunca" sirve para familia, proveedores o chats personales.</p>
      </section>
      ${c ? html`<section class="profile-sec">
        <label class="switch"><input type="checkbox" data-change="pf-dnc" ${dnc ? 'checked' : ''}><span class="track"></span><span class="small">No contactar: no recibe campañas ni respuestas automáticas</span></label>
      </section>` : ''}`;
  };

  // Contexto de la ficha visible (bandeja o panel lateral) y sus acciones
  APP.profileCtx = null;
  const ctx = () => APP.profileCtx || {};
  const reloadProfile = () => ctx().reload && ctx().reload();
  async function patchContact(changes, msg) {
    const c = ctx().contact;
    const r = await APP.try('saveContact', c ? Object.assign({ contact_id: c.contact_id }, changes) : Object.assign({ phone: ctx().phone }, changes), msg);
    if (r) reloadProfile();
  }
  const mergeTags = (a, b) => { const m = new Map(); splitTags(a).concat(splitTags(b)).forEach((t) => m.set(t.toLowerCase(), t)); return Array.from(m.values()).join(', '); };
  Object.assign(APP.acts, {
    'pf-tag-add': (form) => { const t = form.t.value.trim(); if (!t) return; patchContact({ tags: mergeTags(ctx().contact && ctx().contact.tags, t) }, 'Etiqueta agregada.'); },
    'pf-tag-del': (el) => patchContact({ tags: splitTags(ctx().contact.tags).filter((t) => t !== el.dataset.t).join(', ') }, 'Etiqueta quitada.'),
    'pf-bot': (el) => patchContact({ bot: el.dataset.v }, { '': 'El chat sigue la regla general del bot.', on: 'El bot siempre responderá en este chat.', off: 'El bot no responderá en este chat.' }[el.dataset.v]),
    'pf-dnc': (el) => patchContact({ do_not_contact: el.checked ? 'true' : 'false' }, el.checked ? 'Marcado como No contactar.' : 'Puede volver a recibir mensajes.'),
    'pf-note': async (form) => { const body = form.body.value.trim(); if (!body) return; if (await APP.try('addNote', { phone: ctx().phone, body }, 'Nota guardada.')) reloadProfile(); },
    'pf-note-del': async (el) => { if (await APP.confirm('¿Borrar esta nota?', { danger: true, ok: 'Borrar' }) && await APP.try('deleteNote', { note_id: el.dataset.id })) reloadProfile(); },
    'pf-edit': () => APP.views.contactos.edit(ctx().contact || { phone: ctx().phone }, reloadProfile),
    'pf-deal-new': () => { const c = ctx().contact || {}; APP.views.embudo.edit({ phone: ctx().phone, contact_name: c.display_name || c.whatsapp_name || '' }, reloadProfile); },
    'pf-deal': (el) => APP.views.embudo.edit((ctx().deals || []).find((d) => d.deal_id === el.dataset.id), reloadProfile),
    'pf-task-new': () => APP.views.tareas.edit({ phone: ctx().phone }, reloadProfile),
    'pf-task-done': async (el) => { if (await APP.try('saveTask', { task_id: el.dataset.id, status: 'done' }, 'Tarea completada.')) reloadProfile(); },
    'pf-chat': (el) => { const ov = el.closest('.overlay'); if (ov) ov._close(); APP.go('bandeja/' + ctx().phone); },
    'open-chat': (el) => APP.go('bandeja/' + el.dataset.phone),
    'open-profile': (el) => APP.openProfile(el.dataset.phone)
  });

  /** Ficha en panel lateral (desde Contactos, Tareas, Oportunidades…) */
  APP.openProfile = function (phone) {
    const prev = APP.profileCtx;
    const m = APP.modal({ side: true, title: 'Ficha del contacto', body: html`<div class="loading"><div class="spinner"></div></div>`, onClose: () => { APP.profileCtx = prev; } });
    const load = async () => {
      try {
        const r = await APP.api('conversation', { phone, limit: 1 });
        APP.profileCtx = { phone: r.phone, contact: r.contact, deals: r.deals, reload: load };
        m.body = APP.profileHtml(r, {});
      } catch (e) { m.body = html`<div class="empty">${icon('alert')}<p>${e.message}</p></div>`; }
    };
    load();
  };

  // ══ Mesa de atención ══════════════════════════════════════════════════
  APP.view('mesa', {
    title: 'Mesa de atención',
    async render(el) {
      this.el = el;
      await APP.swr('dashboard', {}, (d) => { if (!APP.alive(el)) return; this.data = d; this.paint(); });
    },
    poll() { if (APP.alive(this.el)) APP.swr('dashboard', {}, (d) => { if (!APP.alive(this.el)) return; this.data = d; this.paint(); }).catch(() => {}); },
    tick() { if (APP.alive(this.el) && this.data) this.paint(); },
    paint() {
      if (!APP.alive(this.el)) return;
      const d = this.data, t = d.today, q = d.queue, h = d.health;
      const first = (d.me && d.me.name ? d.me.name : '').split(' ')[0];
      const lede = q.length
        ? html`${F.plural(t.waiting, 'persona espera', 'personas esperan')} respuesta · la más antigua hace <span class="wait ${F.waitMin(q[0].waiting_since) >= 30 ? 'hot' : ''}">${F.wait(q[0].waiting_since)}</span>`
        : 'Nadie espera respuesta en este momento.';
      const S0 = (APP.meta.settings && APP.meta.settings.settings) || {};
      const won = (S0.WON_STAGE || {}).value || 'Ganado', lost = (S0.LOST_STAGE || {}).value || 'Perdido';
      const healthRows = [
        [h.api_key, 'TextMeBot conectado', 'Falta la API key', 'configuracion'],
        [h.triggers && h.triggers.installed && h.triggers.healthy !== false, 'Envíos automáticos activos', h.triggers && h.triggers.installed ? 'Sin actividad reciente' : 'Proceso automático apagado', 'configuracion'],
        [h.webhook_secret, 'Mensajes entrantes protegidos', 'Webhook sin clave', 'configuracion'],
        [h.bot, 'Bot respondiendo', 'Bot apagado', 'automatizacion']
      ];
      this.el.innerHTML = String(html`<div class="page">
        <header class="page-head desk-head">
          <div><h1>${t.greeting}${first ? ', ' + first : ''}</h1><p class="lede">${lede}</p></div>
          <div class="row"><button class="btn" type="button" data-act="go" data-to="bandeja">${icon('inbox')}Abrir bandeja</button></div>
        </header>
        <div class="desk-grid">
          <section class="panel" aria-labelledby="qTitle">
            <div class="panel-head"><h2 id="qTitle">Esperando respuesta</h2><span class="muted">${t.human ? F.plural(t.human, 'pide asesor', 'piden asesor') : 'ordenado por tiempo de espera'}</span></div>
            ${q.length ? html`<div>${q.map((c, i) => html`<div class="queue-row ${i === 0 && F.waitMin(c.waiting_since) >= 30 ? 'oldest' : ''}">
                ${APP.lamp(c.waiting_since, i === 0)}
                ${APP.avatar(c.name)}
                <div class="who"><strong>${c.name}${c.status === 'needs-human' ? html` <span class="pill lamp" style="margin-left:4px">${icon('flag', 'sm')}Pide asesor</span>` : ''}</strong><span>${c.last_message || '—'}</span></div>
                ${APP.waitBadge(c.waiting_since)}
                <button class="btn btn-sm" type="button" data-act="open-chat" data-phone="${c.phone}">Responder</button>
              </div>`)}</div>`
              : html`<div class="queue-clear"><span class="ok-mark">${icon('check')}</span><div><strong>Todo al día</strong><p class="soft small">Cuando alguien escriba y el bot no pueda resolverlo, aparecerá aquí con su tiempo de espera.</p></div></div>`}
          </section>
          <div class="stack" style="gap:18px">
            <section class="panel"><div class="panel-head"><h2>Hoy</h2><span class="muted">${new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
              <div class="panel-body"><dl class="today-list">
                <dt>Mensajes recibidos</dt><dd>${t.received}</dd>
                <dt>Mensajes enviados</dt><dd>${t.sent}</dd>
                <dt>Resueltos por el bot</dt><dd>${t.auto}</dd>
                <dt>Contactos nuevos</dt><dd>${t.new_contacts}</dd>
                ${t.failed ? html`<dt style="color:var(--alert-ink)">Envíos fallidos</dt><dd style="color:var(--alert-ink)">${t.failed}</dd>` : ''}
              </dl></div></section>
            <section class="panel"><div class="panel-head"><h2>Tareas de hoy</h2><a href="#/tareas" class="small">Ver todas</a></div>
              ${d.tasks.length ? html`<div class="list">${d.tasks.map((x) => html`<div class="list-row">
                  <button class="icon-btn sm" type="button" data-act="desk-task-done" data-id="${x.task_id}" title="Marcar como hecha" aria-label="${'Completar ' + x.title}">${icon('tasks', 'sm')}</button>
                  <div class="grow"><div class="ellipsis">${x.title}</div><div class="meta"><span class="${x.due_at < new Date().toISOString() ? 'wait hot' : ''}" style="font-weight:500">${F.when(x.due_at)}</span>${x.contact_name ? ' · ' + x.contact_name : ''}</div></div>
                </div>`)}</div>` : html`<div class="panel-body"><p class="small muted">No tienes tareas para hoy.</p></div>`}
            </section>
            <section class="panel"><div class="panel-head"><h2>Estado del sistema</h2>${h.queue_pending ? html`<span class="muted">${F.plural(h.queue_pending, 'mensaje en cola', 'mensajes en cola')}</span>` : ''}</div>
              <div class="panel-body">${healthRows.map((r) => html`<div class="health-row">
                ${r[0] ? html`<span style="color:var(--ok)">${icon('check', 'sm')}</span>` : html`<span style="color:var(--lamp-ink)">${icon('alert', 'sm')}</span>`}
                <span>${r[0] ? r[1] : r[2]}</span>
                ${r[0] ? '' : html`<a class="state small" href="${'#/' + r[3]}">Revisar</a>`}
              </div>`)}</div></section>
          </div>
        </div>
        <section class="panel"><div class="panel-head"><h2>Embudo de ventas</h2><span class="muted">${F.plural(t.deals_open, 'oportunidad abierta', 'oportunidades abiertas')} por ${F.money(t.deals_value)}</span></div>
          <div class="panel-body"><a class="pipe-strip" href="#/embudo" style="text-decoration:none;color:inherit">${d.pipeline.map((p) => html`<div class="pipe-cell ${p.stage === won ? 'won' : p.stage === lost ? 'lost' : 'open'}"><span class="muted">${p.stage}</span><strong>${p.count}</strong><span class="muted">${F.money(p.value)}</span></div>`)}</a></div></section>
        <div class="grid-2">
          <section class="panel"><div class="panel-head"><h2>Próximos envíos programados</h2><a href="#/programados" class="small">Ver todos</a></div>
            ${d.schedules.length ? html`<div class="list">${d.schedules.map((s) => html`<div class="list-row">${icon('clock')}<div class="grow"><div class="ellipsis">${s.title}</div><div class="meta">${APP.labels.rec[s.recurrence_type] || s.recurrence_type} · ${F.plural(s.recipients, 'destinatario', 'destinatarios')}</div></div><span class="nowrap small">${F.when(s.next_run_at)}</span></div>`)}</div>`
              : html`<div class="panel-body"><p class="small muted">Nada programado.</p></div>`}</section>
          <section class="panel"><div class="panel-head"><h2>Campañas en curso</h2>${APP.can('supervisor') ? html`<a href="#/campanas" class="small">Ver todas</a>` : ''}</div>
            ${d.campaigns.length ? html`<div class="list">${d.campaigns.map((c) => html`<div class="list-row" style="flex-direction:column;align-items:stretch;gap:6px">
                <div class="spread"><strong class="ellipsis">${c.name}</strong><span class="pill ${c.status === 'paused' ? 'lamp' : 'petrol'}">${APP.labels.camp[c.status]}</span></div>
                <div class="progress"><i style="${'width:' + (c.total ? Math.round((c.sent + c.failed) * 100 / c.total) : 0) + '%'}"></i></div>
                <div class="meta">${c.sent} de ${c.total} enviados${c.failed ? ' · ' + c.failed + ' fallidos' : ''}</div></div>`)}</div>`
              : html`<div class="panel-body"><p class="small muted">No hay campañas enviándose.</p></div>`}</section>
        </div>
      </div>`);
    },
    on: {
      go(el) { APP.go(el.dataset.to); },
      async 'desk-task-done'(el) { if (await APP.try('saveTask', { task_id: el.dataset.id, status: 'done' }, 'Tarea completada.')) this.poll(); }
    }
  });

  // ══ Bandeja ═══════════════════════════════════════════════════════════
  const MEDIA = { image: '📷 Foto', audio: '🎤 Nota de voz', video: '🎥 Video', sticker: '💟 Sticker', document: '📄 Documento', location: '📍 Ubicación', contact: '👤 Contacto', media: '📎 Archivo multimedia' };
  const FILTERS = [['open', 'Abiertas'], ['waiting', 'Sin responder', 'lamp'], ['human', 'Piden asesor'], ['mine', 'Mías']];
  const MORE = [['unread', 'Sin leer'], ['pending', 'Pendientes'], ['resolved', 'Atendidas'], ['all', 'Todas']];

  APP.view('bandeja', {
    title: 'Bandeja', flush: true,
    filter: 'open', q: '', phone: '', list: [], counts: {}, chat: null, tpls: null, tplId: '', qr: null,
    async render(el, args) {
      this.el = el;
      this.phone = args[0] ? String(args[0]) : '';
      el.innerHTML = String(html`<div class="inbox ${this.phone ? 'show-chat' : ''}" id="inboxRoot">
        <section class="inbox-list" aria-label="Conversaciones">
          <div class="inbox-list-head">
            <div class="toolbar"><div class="search" style="max-width:none">${icon('search')}<input class="input" type="search" placeholder="Buscar nombre, número o etiqueta" value="${this.q}" data-input="q" aria-label="Buscar conversaciones"></div></div>
            <div class="chips" id="convChips" role="toolbar" aria-label="Filtros"></div>
          </div>
          <div class="conv-scroll" id="convList"><div class="loading"><div class="spinner"></div></div></div>
        </section>
        <section class="chat" id="chatPane" aria-label="Conversación"></section>
        <aside class="profile" id="profilePane" aria-label="Ficha del contacto"></aside>
      </div>`);
      this.paintEmptyChat();
      let hoverT = null;
      el.querySelector('#convList').addEventListener('mouseover', (e) => {
        const c = e.target.closest('.conv');
        if (!c || c.dataset.phone === this.phone) return;
        clearTimeout(hoverT);
        hoverT = setTimeout(() => APP.prefetch('conversation', { phone: c.dataset.phone }), 140);
      });
      if (!this.tpls) APP.api('templates', { status: 'active' }).then((r) => { this.tpls = r.data; }).catch(() => { this.tpls = []; });
      await this.loadList();
      if (this.phone) this.openChat(this.phone);
    },
    leave() { this.phone = ''; APP.profileCtx = null; },
    root() { return document.getElementById('inboxRoot'); },

    async loadList(silent) {
      const f = this.filter, q = this.q;
      try {
        await APP.swr('conversations', { filter: f, q: q }, (r) => {
          if (f !== this.filter || q !== this.q || !this.root()) return;
          this.list = r.data; this.counts = r.counts;
          this.paintChips(); this.paintList();
        });
      } catch (e) { if (!silent) APP.toast(e.message, 'error'); }
    },
    tick() { if (this.root()) this.paintList(); },
    paintChips() {
      const c = this.counts;
      const n = { open: c.all - c.resolved, waiting: c.waiting, human: c.human, unread: c.unread, mine: c.mine, pending: c.pending, resolved: c.resolved, all: c.all };
      const box = document.getElementById('convChips');
      const inMore = MORE.some((f) => f[0] === this.filter);
      if (box) box.innerHTML = String(html`${FILTERS.map((f) => html`<button class="chip ${f[2] || ''}" type="button" data-act="filter" data-f="${f[0]}" aria-pressed="${this.filter === f[0] ? 'true' : 'false'}">${f[1]} <b>${n[f[0]] || 0}</b></button>`)}
        <select class="chip chip-select ${inMore ? 'on' : ''}" data-change="filter-more" aria-label="Más filtros"><option value="">Más…</option>${MORE.map((f) => html`<option value="${f[0]}" ${this.filter === f[0] ? 'selected' : ''}>${f[1]} (${n[f[0]] || 0})</option>`)}</select>`);
    },
    paintList() {
      const box = document.getElementById('convList');
      if (!box) return;
      if (!this.list.length) {
        box.innerHTML = String(html`<div class="empty">${icon('inbox')}<strong>${this.q ? 'Sin resultados' : 'No hay conversaciones aquí'}</strong><p>${this.q ? 'Prueba con otro nombre o número.' : this.filter === 'waiting' ? 'Nadie espera respuesta. Buen trabajo.' : 'Cuando lleguen mensajes por WhatsApp aparecerán en esta lista.'}</p></div>`);
        return;
      }
      box.innerHTML = String(html`${this.list.map((c) => this.convRow(c))}`);
    },
    convRow(c) {
      const waiting = !!c.waiting_since;
      return html`<div class="conv ${c.phone === this.phone ? 'active' : ''} ${c.unread ? 'unread' : ''}" data-act="open-conv" data-phone="${c.phone}" role="button" tabindex="0">
        ${APP.avatar(c.name)}
        <div style="min-width:0"><div class="conv-top"><span class="conv-name">${c.name}</span></div>
          <div class="conv-snip">${c.last_direction === 'out' ? 'Tú: ' : ''}${c.last_message || ''}</div></div>
        <div class="conv-side"><span>${F.short(c.last_message_at)}</span>
          <div class="flags">
            ${c.bot === 'off' ? html`<span title="Bot apagado en este chat" style="color:var(--ink-3);display:inline-flex" class="bot-off-ico">${icon('bot', 'sm')}</span>` : ''}
            ${c.status === 'needs-human' ? html`<span title="Pide asesor" style="color:var(--lamp-ink);display:inline-flex">${icon('flag', 'sm')}</span>` : ''}
            ${waiting ? html`${APP.lamp(c.waiting_since)}${APP.waitBadge(c.waiting_since)}` : c.unread ? html`<span class="unread-n">${c.unread}</span>` : c.status === 'resolved' ? html`<span style="color:var(--ok);display:inline-flex" title="Atendida">${icon('check', 'sm')}</span>` : ''}
          </div></div>
      </div>`;
    },
    paintEmptyChat() {
      const p = document.getElementById('chatPane');
      if (p) p.innerHTML = String(html`<div class="chat-empty"><div class="stack" style="align-items:center;gap:8px">${icon('inbox', 'lg')}<strong style="color:var(--ink)">Elige una conversación</strong><p class="small" style="max-width:34ch">Las que tienen lámpara ámbar esperan respuesta; la cifra es cuánto tiempo llevan esperando.</p></div></div>`);
      const pr = document.getElementById('profilePane');
      if (pr) pr.innerHTML = '';
      const root = this.root();
      if (root) root.classList.add('no-profile');
    },

    async openChat(phone, silent) {
      this.phone = phone;
      history.replaceState(null, '', '#/bandeja/' + encodeURIComponent(phone));
      const root = this.root();
      if (!root) return;
      root.classList.add('show-chat');
      root.classList.remove('no-profile');
      APP.$$('.conv', root).forEach((x) => x.classList.toggle('active', x.dataset.phone === phone));
      const cachedChat = APP.cacheGet('conversation', { phone });
      if (!silent && !cachedChat) {
        const item = this.list.find((x) => x.phone === phone);
        document.getElementById('chatPane').innerHTML = String(html`<header class="chat-head"><button class="icon-btn back-btn" type="button" data-act="back" aria-label="Volver">${icon('left')}</button>${APP.avatar(item ? item.name : phone)}<div class="who"><strong>${item ? item.name : F.phone(phone)}</strong><span>Cargando conversación…</span></div></header><div class="chat-scroll"><div class="chat-empty"><div class="spinner"></div></div></div>`);
      }
      const show = (r) => {
        if (this.phone !== phone || !this.root()) return;
        this.chat = r;
        this.older = [];
        APP.profileCtx = { phone: r.phone, contact: r.contact, deals: r.deals, reload: () => { APP.cacheClear(); this.openChat(r.phone, true); } };
        const sameChat = document.getElementById('compText') && document.getElementById('chatPane').dataset.phone === phone;
        this.paintChat(sameChat ? this.readComposer() : null);
        document.getElementById('chatPane').dataset.phone = phone;
        document.getElementById('profilePane').innerHTML = String(APP.profileHtml(r, { inInbox: true }));
      };
      let r;
      try { r = await APP.swr('conversation', { phone }, show); }
      catch (e) { APP.toast(e.message, 'error'); return; }
      if (this.phone !== phone) return;
      const item = this.list.find((x) => x.phone === phone);
      if (item && item.unread) {
        item.unread = 0;
        APP.api('markRead', { phone }).catch(() => {});
        this.paintList();
      }
    },
    readComposer() {
      const $ = (id) => document.getElementById(id);
      const x = $('compExtra');
      const val = (n) => { const i = x && x.querySelector('input[name=' + n + ']'); return i ? i.value : ''; };
      return { text: $('compText').value, file: val('file_url'), doc: val('document_url'), at: $('compAt') ? $('compAt').value : '', extra: x && !x.hidden };
    },
    paintChat(draft) {
      const r = this.chat, c = r.contact || {}, cv = r.conversation || {};
      const name = c.display_name || c.whatsapp_name || F.phone(r.phone);
      const st = cv.status === 'active' || !cv.status ? 'open' : cv.status;
      const dnc = c.do_not_contact === 'true';
      let lastDay = '', rows = [];
      if (r.more) rows.push(html`<button class="btn btn-sm load-older" type="button" data-act="older">${icon('refresh', 'sm')}Ver mensajes anteriores</button>`);
      (this.older || []).concat(r.messages).forEach((m) => {
        const day = F.day(m.at);
        if (day !== lastDay) { rows.push(html`<div class="day-sep">${day}</div>`); lastDay = day; }
        rows.push(this.bubble(m));
      });
      document.getElementById('chatPane').innerHTML = String(html`
        <header class="chat-head">
          <button class="icon-btn back-btn" type="button" data-act="back" aria-label="Volver a la lista">${icon('left')}</button>
          ${APP.avatar(name)}
          <div class="who"><strong>${name}</strong><span>${F.phone(r.phone)} · ${APP.labels.conv[st] || st}${cv.waiting_since ? ' · esperando ' + F.wait(cv.waiting_since) : ''}</span></div>
          <span class="bot-state ${r.bot && r.bot.ok ? 'on' : 'off'}" title="${r.bot ? r.bot.text : ''}">${icon('bot', 'sm')}<span class="hide-sm">${r.bot && r.bot.ok ? 'Bot activo' : 'Bot en silencio'}</span></span>
          <div class="chat-actions">
            ${st !== 'resolved'
              ? html`<button class="btn btn-sm" type="button" data-act="set-status" data-s="resolved" title="Sale de la lista de pendientes">${icon('check', 'sm')}<span class="hide-sm">Marcar atendida</span></button>`
              : html`<button class="btn btn-sm" type="button" data-act="set-status" data-s="open">Reabrir</button>`}
            ${st !== 'pending' && st !== 'resolved' ? html`<button class="btn btn-ghost btn-sm" type="button" data-act="set-status" data-s="pending" title="Para retomar luego">Pendiente</button>` : ''}
            <select class="select sm" data-change="assign" aria-label="Asignar a" style="width:auto;max-width:136px">
              <option value="">Sin asignar</option>
              ${APP.meta.users.map((u) => html`<option value="${u.name}" ${cv.assigned_to === u.name ? 'selected' : ''}>${u.name}</option>`)}
              ${cv.assigned_to && !APP.meta.users.some((u) => u.name === cv.assigned_to) ? html`<option selected>${cv.assigned_to}</option>` : ''}
            </select>
            <button class="icon-btn" type="button" data-act="toggle-profile" title="Ficha del contacto" aria-label="Ficha del contacto">${icon('users')}</button>
          </div>
        </header>
        <div class="chat-scroll" id="chatScroll">${rows.length ? rows : html`<div class="chat-empty"><p class="small">Aún no hay mensajes con este número. Escribe el primero abajo.</p></div>`}</div>
        <div class="composer" id="composer">
          ${dnc ? html`<div class="callout alert">${icon('alert', 'sm')}<span>Este contacto pidió no recibir mensajes. Desactiva "No contactar" en su ficha para escribirle.</span></div>` : ''}
          <div class="popover qr-pop" id="qrPop" hidden></div>
          <div class="composer-extra" id="compExtra" ${draft && draft.extra ? '' : 'hidden'}>
            ${APP.fileField('file_url', draft ? draft.file : '')}${APP.fileField('document_url', draft ? draft.doc : '')}
            <label class="field" style="grid-column:1/-1;max-width:280px"><span>Enviar más tarde <span class="muted" style="font-weight:400">· opcional</span></span><input class="input sm" id="compAt" type="datetime-local" value="${draft ? draft.at : ''}"></label>
          </div>
          <div class="composer-row">
            <div class="composer-tools">
              <button class="icon-btn" type="button" data-act="qr-toggle" title="Respuestas rápidas" aria-label="Respuestas rápidas">${icon('template')}</button>
              <button class="icon-btn" type="button" data-act="comp-extra" title="Adjuntar o programar" aria-label="Adjuntar o programar">${icon('clip')}</button>
            </div>
            <textarea id="compText" rows="1" placeholder="Mensaje · / para respuestas rápidas" title="Enter envía · Shift + Enter, nueva línea · {{first_name}} pone el nombre del cliente" aria-label="Mensaje" data-input="comp-input" data-keydown="comp-key" ${dnc ? 'disabled' : ''}>${draft ? draft.text : ''}</textarea>
            <button class="btn btn-primary" type="button" data-act="comp-send" id="compSend" ${dnc ? 'disabled' : ''}>${icon('send')}<span class="hide-sm">Enviar</span></button>
          </div>
        </div>`);
      const sc = document.getElementById('chatScroll');
      sc.scrollTop = sc.scrollHeight;
      this.autosize();
    },
    bubble(m) {
      const out = m.dir === 'out', failed = m.status === 'failed', auto = out && m.source === 'auto';
      const src = out ? [APP.labels.source[m.source] || '', m.agent && m.source !== 'auto' ? m.agent : ''].filter(Boolean).join(' · ') : '';
      return html`<div class="bubble ${out ? 'out' : ''} ${auto ? 'auto' : ''} ${failed ? 'failed' : ''} ${m.pending ? 'pending' : ''}">
        ${m.body ? html`<div class="wa-text">${APP.wa(m.body)}</div>` : (!m.file_url && !m.document_url && !m.audio_url && m.type && m.type !== 'text' ? html`<div class="media-note">${MEDIA[m.type] || MEDIA.media}<span>Ábrelo en tu WhatsApp para verlo</span></div>` : '')}
        ${m.file_url ? html`<a class="att" href="${APP.safeUrl(m.file_url)}" target="_blank" rel="noopener">${icon('clip', 'sm')}Imagen o archivo</a>` : ''}
        ${m.document_url ? html`<a class="att" href="${APP.safeUrl(m.document_url)}" target="_blank" rel="noopener">${icon('template', 'sm')}Documento</a>` : ''}
        ${failed ? html`<div class="err">No se entregó: ${m.error || 'error desconocido'} · <a href="#" data-act="retry" data-id="${m.id}">Reintentar</a></div>` : ''}
        <div class="bubble-meta">${src ? html`<span class="src">${src}</span>` : ''}<span>${m.pending ? 'Enviando…' : F.time(m.at)}</span>${out && !failed && !m.pending ? icon('check', 'sm') : ''}</div>
      </div>`;
    },
    autosize() {
      const ta = document.getElementById('compText');
      if (!ta) return;
      ta.style.height = 'auto';
      ta.style.height = Math.min(180, ta.scrollHeight + 2) + 'px';
    },

    // Respuestas rápidas
    qrMatches(q) {
      q = q.toLowerCase();
      return (this.tpls || []).filter((t) => !q || (t.shortcut || '').startsWith(q) || t.name.toLowerCase().includes(q)).slice(0, 8);
    },
    showQr(q) {
      const pop = document.getElementById('qrPop');
      if (!pop) return;
      const items = this.qrMatches(q);
      this.qr = { items, idx: 0 };
      if (!items.length) {
        pop.innerHTML = String(html`<div class="qr-item" style="cursor:default"><span></span><span>${(this.tpls || []).length ? 'Ningún atajo empieza con "/' + q + '".' : 'Aún no hay plantillas. Créalas en Plantillas.'}</span></div>`);
      } else {
        pop.innerHTML = String(html`${items.map((t, i) => html`<div class="qr-item ${i === 0 ? 'on' : ''}" data-act="qr-pick" data-i="${i}"><code>/${t.shortcut || '—'}</code><strong>${t.name}</strong><span>${t.message}</span></div>`)}`);
      }
      pop.hidden = false;
    },
    hideQr() { const pop = document.getElementById('qrPop'); if (pop) pop.hidden = true; this.qr = null; },
    pickQr(i) {
      const t = this.qr && this.qr.items[i];
      if (!t) return;
      const ta = document.getElementById('compText');
      ta.value = t.message;
      this.tplId = t.template_id;
      if (t.file_url || t.document_url) {
        const x = document.getElementById('compExtra');
        x.hidden = false;
        [['file_url', t.file_url], ['document_url', t.document_url]].forEach(([n, v]) => { const i = x.querySelector('input[name=' + n + ']'); i.value = v || ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
      }
      this.hideQr();
      ta.focus();
      this.autosize();
    },

    async send() {
      const ta = document.getElementById('compText');
      const d0 = this.readComposer();
      const file = d0.file.trim(), doc = d0.doc.trim(), at = d0.at;
      const text = ta.value.trim();
      if (!text && !file && !doc) { ta.focus(); return; }
      const btn = document.getElementById('compSend');
      btn.disabled = true;
      const phone = this.phone;
      const payload = { recipient: phone, message: text, file_url: file, document_url: doc, source: this.tplId ? 'quick-reply' : 'manual', template_id: this.tplId };
      if (at) payload.send_at = F.fromLocalInput(at);
      if (!at) {
        const sc = document.getElementById('chatScroll');
        sc.insertAdjacentHTML('beforeend', String(this.bubble({ dir: 'out', body: text, file_url: file, pending: true, source: 'manual', agent: APP.state.user.name })));
        sc.scrollTop = sc.scrollHeight;
      }
      ta.value = '';
      this.autosize();
      let ok = true;
      try {
        const r = await APP.api('sendMessage', payload);
        if (r.queued) APP.toast('Mensaje programado para ' + F.when(r.send_at) + '.');
        this.tplId = '';
        const x = document.getElementById('compExtra');
        if (x) { APP.$$('input', x).forEach((i) => { if (i.type !== 'file') i.value = ''; }); APP.$$('.file-prev', x).forEach((p) => { p.innerHTML = ''; }); x.hidden = true; }
      } catch (e) { ok = false; APP.toast(e.message, 'error'); }
      if (this.phone === phone) await this.openChat(phone, true);
      if (!ok && this.phone === phone && !document.getElementById('compText').value) document.getElementById('compText').value = text;
      this.loadList(true);
    },

    poll() {
      if (!this.root()) return;
      const prev = this.list.find((x) => x.phone === this.phone);
      const prevAt = prev ? prev.last_message_at : '';
      this.loadList(true).then(() => {
        if (!this.phone) return;
        const now = this.list.find((x) => x.phone === this.phone);
        if (now && now.last_message_at !== prevAt) this.openChat(this.phone, true);
      });
    },

    on: {
      filter(el) { this.filter = el.dataset.f; this.loadList(); },
      'filter-more'(el) { this.filter = el.value || 'open'; this.loadList(); },
      q: APP.debounce(function (el) { const v = APP.views.bandeja; v.q = el.value.trim(); v.loadList(); }, 250),
      'open-conv'(el) { this.openChat(el.dataset.phone); },
      async older() {
        const r = this.chat, all = (this.older || []).concat(r.messages);
        if (!all.length) return;
        const btn = document.querySelector('.load-older');
        if (btn) { btn.disabled = true; btn.textContent = 'Cargando…'; }
        const res = await APP.try('conversation', { phone: this.phone, before: all[0].at });
        if (!res || this.chat !== r) return;
        const sc = document.getElementById('chatScroll');
        const fromBottom = sc.scrollHeight - sc.scrollTop;
        this.older = res.messages.concat(this.older || []);
        r.more = res.more;
        this.paintChat(this.readComposer());
        sc.scrollTop = document.getElementById('chatScroll').scrollHeight - fromBottom;
        const sc2 = document.getElementById('chatScroll'); sc2.scrollTop = sc2.scrollHeight - fromBottom;
      },
      back() {
        this.phone = '';
        history.replaceState(null, '', '#/bandeja');
        const root = this.root();
        root.classList.remove('show-chat', 'show-profile');
        APP.$$('.conv', root).forEach((x) => x.classList.remove('active'));
        this.paintEmptyChat();
      },
      'toggle-profile'() { this.root().classList.toggle('show-profile'); },
      async 'set-status'(el) {
        const s = el.dataset.s;
        const msg = { resolved: 'Conversación atendida.', pending: 'Marcada como pendiente.', open: 'Conversación reabierta.' }[s];
        if (await APP.try('setConversationStatus', { phone: this.phone, status: s }, msg)) { this.openChat(this.phone, true); this.loadList(true); }
      },
      async assign(el) {
        if (await APP.try('assignConversation', { phone: this.phone, assigned_to: el.value }, el.value ? 'Asignada a ' + el.value + '.' : 'Sin asignar.')) this.loadList(true);
      },
      'comp-extra'() { const x = document.getElementById('compExtra'); x.hidden = !x.hidden; if (!x.hidden) x.querySelector('input[type=url]').focus(); },
      'qr-toggle'() { const pop = document.getElementById('qrPop'); if (pop && !pop.hidden) this.hideQr(); else this.showQr(''); },
      'qr-pick'(el) { this.pickQr(+el.dataset.i); },
      'comp-input'(el) {
        this.autosize();
        const m = /^\/(\S*)$/.exec(el.value);
        if (m) this.showQr(m[1]); else if (this.qr) this.hideQr();
        if (!el.value) this.tplId = '';
      },
      'comp-key'(el, e) {
        if (this.qr && this.qr.items.length) {
          const n = this.qr.items.length;
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            this.qr.idx = (this.qr.idx + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
            APP.$$('.qr-item', document.getElementById('qrPop')).forEach((x, i) => x.classList.toggle('on', i === this.qr.idx));
            return;
          }
          if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); this.pickQr(this.qr.idx); return; }
        }
        if (e.key === 'Escape' && this.qr) { e.stopPropagation(); this.hideQr(); return; }
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); this.send(); }
      },
      'comp-send'() { this.send(); },
      async retry(el) {
        const m = this.chat.messages.find((x) => x.id === el.dataset.id);
        if (!m) return;
        if (await APP.try('sendMessage', { recipient: this.phone, message: m.body, file_url: m.file_url, document_url: m.document_url }, 'Mensaje reenviado.')) this.openChat(this.phone, true);
        else this.openChat(this.phone, true);
      }
    }
  });
})();
