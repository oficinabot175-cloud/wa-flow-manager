/* WA POWER v2 — Envíos: Campañas, Programados y Plantillas */
(function () {
  'use strict';
  const { html, icon, fmt: F } = APP;
  const SAMPLE = { first_name: 'Rosa', whatsapp_name: 'Rosa Díaz', display_name: 'Rosa Díaz', greeting: 'Buenas tardes', agent: '', today: '', time: '', city: 'Lima', company: '' };
  APP.previewVars = (text) => String(text || '').replace(/\{\{\s*([a-z_0-9]+)\s*\}\}/gi, (m, k) => {
    k = k.toLowerCase();
    if (k === 'company_name') return APP.meta.company || 'tu empresa';
    if (k === 'agent') return APP.state.user.name.split(' ')[0];
    if (k === 'today') return new Date().toLocaleDateString('es-PE');
    if (k === 'time') return F.time(new Date());
    return SAMPLE[k] !== undefined ? SAMPLE[k] : m;
  });

  async function templatesOnce() {
    if (!APP._tplCache) { try { APP._tplCache = (await APP.api('templates', { status: 'active' })).data; } catch (e) { APP._tplCache = []; } }
    return APP._tplCache;
  }

  // ══ Campañas ══════════════════════════════════════════════════════════
  APP.view('campanas', {
    title: 'Campañas', min: 'supervisor',
    data: [],
    async render(el) {
      this.el = el;
      el.innerHTML = String(html`<div class="page">
        <header class="page-head">
          <div><h1>Campañas</h1><p class="lede">Mensajes a un grupo de contactos filtrado por etiquetas o etapa de venta.</p></div>
          <button class="btn btn-primary" type="button" data-act="cp-new">${icon('plus')}Nueva campaña</button>
        </header>
        <div class="callout">${icon('shield', 'sm')}<span>Los mensajes salen uno por uno, con pausas de unos segundos entre cada uno, para cuidar tu número de bloqueos. Quien pidió la baja o está marcado como No contactar nunca los recibe.</span></div>
        <section class="panel"><div class="table-wrap" id="cpTable"><div class="loading"><div class="spinner"></div></div></div></section>
      </div>`);
      await this.load();
    },
    async load() {
      this.data = (await APP.api('campaigns')).data;
      this.paint();
    },
    poll() { if (this.data.some((c) => c.status === 'sending' || c.status === 'scheduled')) this.load().catch(() => {}); },
    paint() {
      const box = document.getElementById('cpTable');
      if (!box) return;
      if (!this.data.length) {
        box.innerHTML = String(html`<div class="empty">${icon('megaphone')}<strong>Aún no hay campañas</strong><p>Arma una lista con etiquetas (por ejemplo "fibra" o "renovación"), escribe el mensaje y lánzala ahora o a una hora programada.</p><button class="btn btn-primary" type="button" data-act="cp-new">Crear la primera campaña</button></div>`);
        return;
      }
      box.innerHTML = String(html`<table class="table"><thead><tr><th>Campaña</th><th>Estado</th><th style="min-width:200px">Avance</th><th>Fecha</th><th class="actions"></th></tr></thead><tbody>
        ${this.data.map((c) => {
          const total = +c.total_recipients || 0, sent = +c.sent_count || 0, failed = +c.failed_count || 0;
          const pct = total ? Math.round((sent + failed) * 100 / total) : 0;
          const cls = { sending: 'petrol', scheduled: 'petrol', paused: 'lamp', completed: 'ok', cancelled: '' }[c.status] || '';
          const aud = [c.audience_filter ? 'Etiquetas: ' + c.audience_filter : 'Todos los contactos activos', c.audience_stage ? 'Etapa: ' + c.audience_stage : ''].filter(Boolean).join(' · ');
          return html`<tr>
            <td><div class="cell-main">${c.name}</div><div class="cell-sub">${aud}</div></td>
            <td><span class="pill ${cls}">${APP.labels.camp[c.status] || c.status}</span></td>
            <td>${c.status === 'draft' ? html`<span class="muted small">Sin lanzar</span>` : html`<div class="progress ${failed && !sent ? 'fail' : ''}"><i style="${'width:' + pct + '%'}"></i></div>
              <div class="cell-sub" style="margin-top:4px">${sent} de ${total} enviados${failed ? ' · ' + failed + ' fallidos' : ''}${c.pending ? ' · ' + c.pending + ' en cola' : ''}</div>`}</td>
            <td class="soft nowrap small">${c.status === 'scheduled' ? 'Sale ' + F.when(c.scheduled_at) : c.finished_at ? 'Terminó ' + F.when(c.finished_at) : c.started_at ? 'Inició ' + F.when(c.started_at) : 'Creada ' + F.date(c.created_at)}</td>
            <td class="actions"><div class="row" style="justify-content:flex-end">
              ${c.status === 'draft' ? html`<button class="btn btn-sm" type="button" data-act="cp-edit" data-id="${c.campaign_id}">Editar</button><button class="btn btn-primary btn-sm" type="button" data-act="cp-launch" data-id="${c.campaign_id}">${icon('play', 'sm')}Lanzar</button>` : ''}
              ${c.status === 'sending' || c.status === 'scheduled' ? html`<button class="btn btn-sm" type="button" data-act="cp-state" data-op="pause" data-id="${c.campaign_id}">${icon('pause', 'sm')}Pausar</button>` : ''}
              ${c.status === 'paused' ? html`<button class="btn btn-sm btn-lamp" type="button" data-act="cp-state" data-op="resume" data-id="${c.campaign_id}">${icon('play', 'sm')}Reanudar</button>` : ''}
              ${['sending', 'scheduled', 'paused'].includes(c.status) ? html`<button class="btn btn-ghost btn-sm" type="button" data-act="cp-state" data-op="cancel" data-id="${c.campaign_id}">Cancelar</button>` : ''}
              <button class="icon-btn sm" type="button" data-act="cp-dup" data-id="${c.campaign_id}" title="Duplicar" aria-label="Duplicar">${icon('copy', 'sm')}</button>
              ${!['sending', 'scheduled'].includes(c.status) ? html`<button class="icon-btn sm danger" type="button" data-act="cp-del" data-id="${c.campaign_id}" title="Eliminar" aria-label="Eliminar">${icon('trash', 'sm')}</button>` : ''}
            </div></td></tr>`;
        })}</tbody></table>`);
    },

    /** Asistente de 3 pasos: Audiencia → Mensaje → Envío */
    async wizard(c) {
      c = Object.assign({ name: '', description: '', audience_filter: '', audience_stage: '', message_template: '', file_url: '', scheduled_at: '' }, c || {});
      const st = { step: 1, data: c, count: null, sample: [], when: c.scheduled_at ? 'later' : 'now' };
      let tagsMap = {};
      try { tagsMap = (await APP.api('contacts', { limit: 1 })).tags; } catch (e) {}
      const tpls = await templatesOnce();
      const view = this;
      const m = APP.modal({ title: c.campaign_id ? 'Editar campaña' : 'Nueva campaña', size: 'xl', sticky: true, body: '', foot: html`<span></span>`, on: handlers() });
      const refreshAudience = APP.debounce(async () => {
        try {
          const r = await APP.api('previewCampaign', { audience_filter: st.data.audience_filter, audience_stage: st.data.audience_stage, message_template: st.data.message_template });
          st.count = r.count; st.sample = r.sample;
        } catch (e) { st.count = null; }
        const el = m.$('#audCount'); if (el) el.textContent = st.count === null ? '—' : st.count;
        const pv = m.$('#cpPreview'); if (pv) pv.innerHTML = String(previewHtml());
      }, 300);
      function stepsHtml() {
        return html`<div class="steps">${['Audiencia', 'Mensaje', 'Envío'].map((s, i) => html`<div class="step ${st.step === i + 1 ? 'on' : st.step > i + 1 ? 'done' : ''}"><b>${st.step > i + 1 ? '✓' : i + 1}</b>${s}</div>`)}</div>`;
      }
      function previewHtml() {
        const samples = st.sample.length ? st.sample : [{ name: 'Ejemplo', message: APP.previewVars(st.data.message_template) }];
        return html`<div class="preview-phone">${samples.map((s) => html`<div class="small muted">Para ${s.name}</div><div class="bubble out"><div class="wa-text">${s.message ? APP.wa(s.message) : html`<span class="muted">El mensaje aparecerá aquí.</span>`}</div>${st.data.file_url ? html`<div class="small muted" style="margin-top:4px">${icon('clip', 'sm')} Con imagen adjunta</div>` : ''}</div>`)}</div>`;
      }
      function paint() {
        const d = st.data;
        let body;
        if (st.step === 1) {
          const tags = Object.keys(tagsMap).sort();
          const chosen = d.audience_filter.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
          body = html`${stepsHtml()}
            <div class="grid-2" style="align-items:start">
              <div class="stack">
                <label class="field"><span>Etiquetas (reciben quienes tengan al menos una)</span><input class="input" data-input="cp-field" data-k="audience_filter" value="${d.audience_filter}" placeholder="Vacío = todos los contactos activos"></label>
                ${tags.length ? html`<div class="tags">${tags.map((t) => html`<button type="button" class="tag" data-act="cp-tag" data-t="${t}" aria-pressed="${chosen.includes(t.toLowerCase()) ? 'true' : 'false'}" style="${chosen.includes(t.toLowerCase()) ? 'background:var(--petrol-wash);border-color:var(--petrol);color:var(--petrol-ink);cursor:pointer' : 'cursor:pointer'}">${t} · ${tagsMap[t]}</button>`)}</div>` : ''}
                <label class="field"><span>Solo quienes tienen una oportunidad en la etapa</span><select class="select" data-change="cp-field" data-k="audience_stage"><option value="">Cualquier etapa (o sin oportunidad)</option>${APP.meta.stages.map((s) => html`<option ${d.audience_stage === s ? 'selected' : ''}>${s}</option>`)}</select></label>
              </div>
              <div class="panel" style="padding:18px"><div class="muted small">Contactos que recibirán la campaña</div><div class="audience-count" id="audCount">${st.count === null ? '…' : st.count}</div><p class="hint" style="margin-top:8px">Se excluyen automáticamente los inactivos, los grupos y quienes están marcados como No contactar.</p></div>
            </div>`;
        } else if (st.step === 2) {
          body = html`${stepsHtml()}
            <div class="grid-2" style="align-items:start">
              <div class="stack">
                <label class="field"><span>Partir de una plantilla</span><select class="select" data-change="cp-tpl"><option value="">Escribir desde cero</option>${tpls.map((t) => html`<option value="${t.template_id}">${t.name}</option>`)}</select></label>
                <label class="field"><span>Mensaje</span><textarea class="textarea" id="cpMsg" rows="7" data-input="cp-field" data-k="message_template" placeholder="{{greeting}} {{first_name}}, este mes tenemos…">${d.message_template}</textarea></label>
                ${APP.varChips('#cpMsg')}
                <div data-input="cp-file">${APP.fileField('file_url', d.file_url)}</div>
              </div>
              <div class="stack"><div class="small muted">Vista previa con contactos reales de la audiencia</div><div id="cpPreview">${previewHtml()}</div></div>
            </div>`;
        } else {
          const eta = Math.ceil((st.count || 0) * 11 / 60);
          body = html`${stepsHtml()}
            <div class="grid-2" style="align-items:start">
              <div class="stack">
                <label class="field"><span>Nombre de la campaña</span><input class="input" data-input="cp-field" data-k="name" value="${d.name}" placeholder="Promo fibra octubre" required></label>
                <label class="field"><span>Descripción interna (opcional)</span><input class="input" data-input="cp-field" data-k="description" value="${d.description}"></label>
                <div class="field"><span>Cuándo sale</span><div class="seg" role="group"><button type="button" data-act="cp-when" data-v="now" aria-pressed="${st.when === 'now' ? 'true' : 'false'}">Apenas la lance</button><button type="button" data-act="cp-when" data-v="later" aria-pressed="${st.when === 'later' ? 'true' : 'false'}">Fecha y hora</button></div></div>
                ${st.when === 'later' ? html`<label class="field"><span>Fecha y hora de inicio</span><input class="input" type="datetime-local" data-input="cp-field" data-k="scheduled_local" value="${d.scheduled_local || F.toLocalInput(d.scheduled_at)}"></label>` : ''}
              </div>
              <div class="panel" style="padding:18px"><div class="stack" style="gap:8px">
                <div class="spread"><span class="soft">Destinatarios</span><strong>${st.count === null ? '—' : st.count}</strong></div>
                <div class="spread"><span class="soft">Tiempo estimado</span><strong>${eta < 1 ? 'menos de 1 min' : '~' + eta + ' min'}</strong></div>
                <div class="spread"><span class="soft">Audiencia</span><span class="ellipsis" style="max-width:60%">${d.audience_filter || 'Todos'}${d.audience_stage ? ' · ' + d.audience_stage : ''}</span></div>
                <p class="hint">Puedes pausarla o cancelarla en cualquier momento desde la lista de campañas.</p>
              </div></div>
            </div>`;
        }
        m.body = body;
        m.$('.modal-foot').innerHTML = String(html`
          ${st.step > 1 ? html`<button class="btn left" type="button" data-act="cp-back">${icon('left', 'sm')}Atrás</button>` : html`<span class="left"></span>`}
          <button class="btn" type="button" data-act="layer-close">Cancelar</button>
          ${st.step < 3 ? html`<button class="btn btn-primary" type="button" data-act="cp-next">Siguiente${icon('right', 'sm')}</button>`
            : html`<button class="btn" type="button" data-act="cp-save" data-launch="0">Guardar borrador</button><button class="btn btn-primary" type="button" data-act="cp-save" data-launch="1">${icon('play', 'sm')}Guardar y lanzar</button>`}`);
      }
      function handlers() {
        return {
          'cp-field': (el) => { st.data[el.dataset.k] = el.value; if (['audience_filter', 'audience_stage', 'message_template'].includes(el.dataset.k)) refreshAudience(); if (el.dataset.k === 'audience_filter') { const chosen = el.value.split(',').map((t) => t.trim().toLowerCase()); APP.$$('[data-act="cp-tag"]', m.el).forEach((b) => { const on = chosen.includes(b.dataset.t.toLowerCase()); b.setAttribute('aria-pressed', on); b.style.cssText = on ? 'background:var(--petrol-wash);border-color:var(--petrol);color:var(--petrol-ink);cursor:pointer' : 'cursor:pointer'; }); } },
          'cp-tag': (el) => {
            const list = st.data.audience_filter.split(',').map((t) => t.trim()).filter(Boolean);
            const i = list.findIndex((t) => t.toLowerCase() === el.dataset.t.toLowerCase());
            if (i > -1) list.splice(i, 1); else list.push(el.dataset.t);
            st.data.audience_filter = list.join(', ');
            paint(); refreshAudience();
          },
          'cp-file': (el, e) => { const i = e.target; if (i && i.name === 'file_url') { st.data.file_url = i.value.trim(); const pv = m.$('#cpPreview'); if (pv) pv.innerHTML = String(previewHtml()); } },
          'cp-tpl': (sel) => { const t = tpls.find((x) => x.template_id === sel.value); if (!t) return; st.data.message_template = t.message; st.data.file_url = t.file_url || st.data.file_url; paint(); refreshAudience(); },
          'cp-when': (el) => { st.when = el.dataset.v; paint(); },
          'cp-back': () => { st.step--; paint(); },
          'cp-next': () => {
            if (st.step === 1 && st.count === 0) return APP.toast('Ningún contacto coincide con el filtro. Cambia las etiquetas o la etapa.', 'error');
            if (st.step === 2 && !st.data.message_template.trim()) return APP.toast('Escribe el mensaje de la campaña.', 'error');
            st.step++; paint();
          },
          'cp-save': async (el) => {
            const d = st.data;
            if (!d.name.trim()) return APP.toast('Ponle un nombre a la campaña.', 'error');
            const launch = el.dataset.launch === '1';
            const sched = st.when === 'later' ? F.fromLocalInput(d.scheduled_local || F.toLocalInput(d.scheduled_at)) : '';
            if (st.when === 'later' && !sched) return APP.toast('Elige la fecha y hora de inicio.', 'error');
            if (launch && !(await APP.confirm(`Se enviará "${d.name}" a ${st.count} contactos${sched ? ' desde el ' + F.when(sched) : ' ahora mismo'}.`, { ok: 'Lanzar campaña', title: 'Lanzar campaña' }))) return;
            const payload = { name: d.name, description: d.description, audience_filter: d.audience_filter, audience_stage: d.audience_stage, message_template: d.message_template, file_url: d.file_url, scheduled_at: sched };
            if (d.campaign_id) payload.campaign_id = d.campaign_id;
            const r = await APP.try('saveCampaign', payload);
            if (!r) return;
            if (launch) {
              const l = await APP.try('launchCampaign', { campaign_id: r.campaign_id, scheduled_at: sched });
              if (l) APP.toast(`Campaña en marcha: ${l.queued} mensajes en cola, unos ${l.eta_minutes} min.`, '', { long: true });
            } else APP.toast('Borrador guardado.');
            m.close();
            view.load();
          }
        };
      }
      paint();
      refreshAudience();
    },

    on: {
      'cp-new'() { this.wizard(); },
      'cp-edit'(el) { this.wizard(this.data.find((c) => c.campaign_id === el.dataset.id)); },
      async 'cp-launch'(el) {
        const c = this.data.find((x) => x.campaign_id === el.dataset.id);
        const p = await APP.try('previewCampaign', { audience_filter: c.audience_filter, audience_stage: c.audience_stage, message_template: c.message_template });
        if (!p) return;
        if (!(await APP.confirm(`Se enviará "${c.name}" a ${p.count} contactos${c.scheduled_at && new Date(c.scheduled_at) > new Date() ? ' desde el ' + F.when(c.scheduled_at) : ' ahora mismo'}.`, { ok: 'Lanzar campaña', title: 'Lanzar campaña' }))) return;
        const r = await APP.try('launchCampaign', { campaign_id: c.campaign_id });
        if (r) { APP.toast(`Campaña en marcha: ${r.queued} mensajes en cola, unos ${r.eta_minutes} min.`, '', { long: true }); this.load(); }
      },
      async 'cp-state'(el) {
        const op = el.dataset.op;
        if (op === 'cancel' && !(await APP.confirm('Los mensajes que aún no salieron ya no se enviarán.', { danger: true, ok: 'Cancelar campaña', title: 'Cancelar campaña' }))) return;
        if (await APP.try('campaignState', { campaign_id: el.dataset.id, op }, { pause: 'Campaña pausada.', resume: 'Campaña reanudada.', cancel: 'Campaña cancelada.' }[op])) this.load();
      },
      async 'cp-dup'(el) { if (await APP.try('duplicateCampaign', { campaign_id: el.dataset.id }, 'Copia creada como borrador.')) this.load(); },
      async 'cp-del'(el) {
        if (!(await APP.confirm('¿Eliminar esta campaña? Los mensajes ya enviados se conservan en el historial.', { danger: true, ok: 'Eliminar' }))) return;
        if (await APP.try('deleteCampaign', { campaign_id: el.dataset.id }, 'Campaña eliminada.')) this.load();
      }
    }
  });

  // ══ Programados ═══════════════════════════════════════════════════════
  APP.view('programados', {
    title: 'Programados',
    data: [],
    async render(el) {
      this.el = el;
      el.innerHTML = String(html`<div class="page">
        <header class="page-head">
          <div><h1>Mensajes programados</h1><p class="lede">Salen solos a la hora exacta, una vez o de forma repetida.</p></div>
          <button class="btn btn-primary" type="button" data-act="sc-new">${icon('plus')}Programar mensaje</button>
        </header>
        <section class="panel"><div class="table-wrap" id="scTable"><div class="loading"><div class="spinner"></div></div></div></section>
      </div>`);
      await this.load();
    },
    async load() { this.data = (await APP.api('schedules')).data; this.paint(); },
    paint() {
      const box = document.getElementById('scTable');
      if (!box) return;
      if (!this.data.length) {
        box.innerHTML = String(html`<div class="empty">${icon('clock')}<strong>Nada programado</strong><p>Recordatorios de pago, saludos de cumpleaños, avisos semanales… elige la hora y se envían solos. Desde WhatsApp también: <code>/prog mañana 9:00 999888777 texto</code></p><button class="btn btn-primary" type="button" data-act="sc-new">Programar mensaje</button></div>`);
        return;
      }
      box.innerHTML = String(html`<table class="table"><thead><tr><th>Mensaje</th><th>Para</th><th>Repite</th><th>Próximo envío</th><th>Estado</th><th class="actions"></th></tr></thead><tbody>
        ${this.data.map((s) => {
          const rec = String(s.recipients || '').split(',').filter(Boolean);
          const gn = s.group_names || [];
          const who = [gn.length ? gn.join(', ') : '', s.people_count ? (s.people_count === 1 && !gn.length ? F.phone(rec.find((x) => !x.includes('@'))) : F.plural(s.people_count, 'número', 'números')) : ''].filter(Boolean).join(' + ');
          const cls = { active: 'petrol', paused: 'lamp', completed: 'ok' }[s.status] || '';
          const label = { active: 'Activo', paused: 'Pausado', completed: 'Completado' }[s.status] || s.status;
          return html`<tr>
            <td style="max-width:360px"><div class="cell-main ellipsis">${s.title}</div><div class="cell-sub ellipsis">${s.file_url ? html`<span style="color:var(--petrol-ink)">${icon('image', 'sm')} Con imagen · </span>` : ''}${s.message_template}</div></td>
            <td class="soft" style="max-width:220px">${gn.length ? html`<span class="row" style="gap:4px">${icon('group', 'sm')}<span class="ellipsis">${who}</span></span>` : who}</td>
            <td class="soft nowrap">${s.recurrence_type === 'every_n_days' ? 'Cada ' + (s.recurrence_rule || 1) + ' días' : APP.labels.rec[s.recurrence_type] || s.recurrence_type}</td>
            <td class="nowrap">${s.next_run_at && s.status !== 'completed' ? F.when(s.next_run_at) : html`<span class="muted">${s.last_run_at ? 'Último: ' + F.when(s.last_run_at) : '—'}</span>`}</td>
            <td><span class="pill ${cls}">${label}</span></td>
            <td class="actions"><div class="row" style="justify-content:flex-end">
              <button class="btn btn-sm" type="button" data-act="sc-run" data-id="${s.schedule_id}" title="Enviar ahora sin cambiar la programación">${icon('send', 'sm')}Enviar ahora</button>
              ${s.status === 'active' ? html`<button class="icon-btn sm" type="button" data-act="sc-state" data-op="pause" data-id="${s.schedule_id}" title="Pausar" aria-label="Pausar">${icon('pause', 'sm')}</button>` : s.status === 'paused' ? html`<button class="icon-btn sm" type="button" data-act="sc-state" data-op="resume" data-id="${s.schedule_id}" title="Reanudar" aria-label="Reanudar">${icon('play', 'sm')}</button>` : ''}
              <button class="icon-btn sm" type="button" data-act="sc-edit" data-id="${s.schedule_id}" title="Editar" aria-label="Editar">${icon('edit', 'sm')}</button>
              <button class="icon-btn sm danger" type="button" data-act="sc-del" data-id="${s.schedule_id}" title="Eliminar" aria-label="Eliminar">${icon('trash', 'sm')}</button>
            </div></td></tr>`;
        })}</tbody></table>`);
    },
    async edit(s) {
      s = s || {};
      const isNew = !s.schedule_id;
      const tpls = await templatesOnce();
      let tagsMap = {};
      try { tagsMap = (await APP.api('contacts', { limit: 1 })).tags; } catch (e) {}
      const groups = await APP.groups(true);
      const recs = String(s.recipients || '').split(',').filter(Boolean);
      const selGroups = recs.filter((r) => r.includes('@g.us'));
      const people = recs.filter((r) => !r.includes('@g.us'));
      let start = s.next_run_at || s.start_datetime;
      if (!start) { const d = new Date(Date.now() + 3600000); d.setMinutes(0, 0, 0); start = d.toISOString(); }
      APP.modal({
        title: isNew ? 'Programar mensaje' : 'Editar programación', size: 'lg',
        body: html`<form id="scForm" data-submit="sc-save" class="stack">
          <label class="field"><span>Título (solo para ti)</span><input class="input" name="title" value="${s.title || ''}" placeholder="Recordatorio de pago mensual" required autofocus></label>
          <div class="field"><span>Grupos de WhatsApp</span>${APP.groupPicker(groups, selGroups.length ? selGroups : (s.preGroup ? [s.preGroup] : []))}</div>
          <label class="field"><span>Números</span><textarea class="textarea" name="recipients" rows="2" placeholder="999 888 777, 51988777666…">${people.join(', ')}</textarea></label>
          ${Object.keys(tagsMap).length ? html`<div class="row small"><span class="muted">Agregar por etiqueta:</span><select class="select sm" data-change="sc-addtag" style="width:auto"><option value="">Elegir…</option>${Object.keys(tagsMap).sort().map((t) => html`<option value="${t}">${t} (${tagsMap[t]})</option>`)}</select></div>` : ''}
          <label class="field"><span>Plantilla</span><select class="select" data-change="sc-tpl"><option value="">Escribir un mensaje propio</option>${tpls.map((t) => html`<option value="${t.template_id}">${t.name}</option>`)}</select></label>
          <label class="field"><span>Mensaje</span><textarea class="textarea" id="scMsg" name="message_template" rows="4">${s.message_template || ''}</textarea></label>
          ${APP.varChips('#scMsg')}
          <div class="fields">
            <label class="field"><span>Primer envío</span><input class="input" type="datetime-local" name="start_local" value="${F.toLocalInput(start)}" required></label>
            <label class="field"><span>Repetir</span><select class="select" name="recurrence_type" data-change="sc-rec">${Object.keys(APP.labels.rec).map((k) => html`<option value="${k}" ${(s.recurrence_type || 'once') === k ? 'selected' : ''}>${APP.labels.rec[k]}</option>`)}</select></label>
            <label class="field" id="scN" ${s.recurrence_type === 'every_n_days' ? '' : 'hidden'}><span>Cada cuántos días</span><input class="input" type="number" min="1" name="recurrence_rule" value="${s.recurrence_rule || 7}"></label>
          </div>
          <div class="fields">${APP.fileField('file_url', s.file_url)}${APP.fileField('document_url', s.document_url)}</div>
          <p class="hint">Sale a la hora indicada (con un margen de hasta un minuto), zona horaria de Lima. Con imagen, el mensaje va como pie de foto.</p>
        </form>`,
        foot: html`<button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn btn-primary" type="submit" form="scForm">${isNew ? 'Programar' : 'Guardar'}</button>`,
        on: {
          'sc-rec': (sel) => { sel.form.querySelector('#scN').hidden = sel.value !== 'every_n_days'; },
          'sc-tpl': (sel) => { const t = tpls.find((x) => x.template_id === sel.value); if (t) { sel.form.message_template.value = t.message; if (t.file_url) { sel.form.file_url.value = t.file_url; sel.form.file_url.dispatchEvent(new Event('input', { bubbles: true })); } } },
          'sc-addtag': async (sel) => {
            if (!sel.value) return;
            const r = await APP.try('contacts', { tag: sel.value, limit: 500 });
            if (r) {
              const ta = sel.form.recipients;
              const cur = ta.value.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
              const add = r.data.filter((c) => c.do_not_contact !== 'true').map((c) => c.phone).filter((p) => !cur.includes(p));
              ta.value = cur.concat(add).join(', ');
              APP.toast(F.plural(add.length, 'número agregado', 'números agregados') + '.');
            }
            sel.value = '';
          },
          'sc-save': async (form) => {
            const v = APP.formData(form);
            const gs = APP.$$('input[name=groups]:checked', form).map((c) => c.value);
            delete v.groups;
            v.recipients = [v.recipients].concat(gs).filter(Boolean).join(', ');
            if (!v.recipients) return APP.toast('Elige al menos un grupo o escribe un número.', 'error');
            if (!v.message_template && !v.file_url && !v.document_url) return APP.toast('Escribe el mensaje o adjunta un archivo.', 'error');
            v.start_datetime = F.fromLocalInput(v.start_local);
            delete v.start_local;
            if (!isNew) v.schedule_id = s.schedule_id;
            const r = await APP.try('saveSchedule', v, (x) => 'Programado para ' + F.when(x.next_run_at) + '.');
            if (!r) return;
            form.closest('.overlay')._close();
            APP.views.programados.load();
          }
        }
      });
    },
    on: {
      'sc-new'() { this.edit(); },
      'sc-new-group'(el) { this.edit({ preGroup: el.dataset.id }); },
      'sc-edit'(el) { this.edit(this.data.find((s) => s.schedule_id === el.dataset.id)); },
      async 'sc-run'(el) {
        const s = this.data.find((x) => x.schedule_id === el.dataset.id);
        if (!(await APP.confirm(`Se enviará "${s.title}" ahora mismo. La próxima fecha programada no cambia.`, { ok: 'Enviar ahora' }))) return;
        el.disabled = true;
        const r = await APP.try('runSchedule', { schedule_id: s.schedule_id }, (x) => x.note || `Enviados: ${x.sent}${x.failed ? ' · fallidos: ' + x.failed : ''}.`);
        el.disabled = false;
        if (r) this.load();
      },
      async 'sc-state'(el) { if (await APP.try('scheduleState', { schedule_id: el.dataset.id, op: el.dataset.op }, el.dataset.op === 'pause' ? 'Programación pausada.' : 'Programación reanudada.')) this.load(); },
      async 'sc-del'(el) {
        if (!(await APP.confirm('¿Eliminar esta programación?', { danger: true, ok: 'Eliminar' }))) return;
        if (await APP.try('deleteSchedule', { schedule_id: el.dataset.id }, 'Programación eliminada.')) this.load();
      }
    }
  });

  // ══ Grupos de WhatsApp ════════════════════════════════════════════════
  APP.view('grupos', {
    title: 'Grupos',
    data: [],
    async render(el) {
      this.el = el;
      el.innerHTML = String(html`<div class="page">
        <header class="page-head">
          <div><h1>Grupos de WhatsApp</h1><p class="lede">Envía o programa mensajes, con imagen incluida, a los grupos donde está tu número.</p></div>
          ${APP.can('supervisor') ? html`<button class="btn btn-primary" type="button" data-act="gr-new">${icon('plus')}Agregar grupo</button>` : ''}
        </header>
        <div class="callout lamp">${icon('alert', 'sm')}<span><strong>Importante:</strong> el número conectado a TextMeBot debe ser miembro del grupo. Si envías a un grupo donde no está, WhatsApp puede bloquear tu número. Nunca lo retires de un grupo al que le programas mensajes.</span></div>
        <section class="panel"><div class="table-wrap" id="grTable"><div class="loading"><div class="spinner"></div></div></div></section>
        <section class="panel"><div class="panel-head"><h2>Cómo agregar un grupo</h2></div><div class="panel-body">
          <div class="grid-3">
            <div class="stack" style="gap:6px"><strong>Con el enlace de invitación</strong><p class="soft small">En WhatsApp abre el grupo › Invitar mediante enlace › Copiar enlace. Pégalo en "Agregar grupo" y WA Power obtiene el ID y el nombre desde TextMeBot.</p></div>
            <div class="stack" style="gap:6px"><strong>Automáticamente</strong><p class="soft small">Cuando alguien escribe en un grupo donde está tu número, el grupo aparece aquí solo. Sus mensajes no se guardan ni reciben respuestas del bot.</p></div>
            <div class="stack" style="gap:6px"><strong>Desde tu WhatsApp</strong><p class="soft small">Envía <code>/grupo https://chat.whatsapp.com/…</code> para registrarlo y <code>/grupos</code> para ver la lista. Luego <code>/prog lunes 8:00 g1 texto</code>.</p></div>
          </div></div></section>
      </div>`);
      await this.load();
    },
    async load() {
      this.data = await APP.groups(true);
      const box = document.getElementById('grTable');
      if (!box) return;
      if (!this.data.length) { box.innerHTML = String(html`<div class="empty">${icon('group')}<strong>Aún no hay grupos</strong><p>Agrega uno con su enlace de invitación para empezar a programarle mensajes.</p>${APP.can('supervisor') ? html`<button class="btn btn-primary" type="button" data-act="gr-new">Agregar grupo</button>` : ''}</div>`); return; }
      const SRC = { invite: 'Por enlace', manual: 'Por ID', detected: 'Detectado' };
      box.innerHTML = String(html`<table class="table"><thead><tr><th>Grupo</th><th>Origen</th><th>Programados</th><th>Último envío</th><th class="actions"></th></tr></thead><tbody>
        ${this.data.map((g) => html`<tr>
          <td><div class="row"><span class="avatar sm" style="background:var(--petrol-wash);color:var(--petrol-ink)">${icon('group', 'sm')}</span><div style="min-width:0"><div class="cell-main ellipsis">${g.name || 'Sin nombre'}</div><div class="cell-sub ellipsis"><code style="font-size:11.5px">${g.group_id}</code></div></div></div></td>
          <td class="soft">${SRC[g.source] || g.source}</td>
          <td>${g.scheduled ? html`<span class="pill petrol">${g.scheduled}</span>` : html`<span class="muted">—</span>`}</td>
          <td class="soft nowrap">${g.last_sent_at ? F.ago(g.last_sent_at) : 'Nunca'}</td>
          <td class="actions"><div class="row" style="justify-content:flex-end">
            <button class="btn btn-sm" type="button" data-act="gr-send" data-id="${g.group_id}">${icon('send', 'sm')}Enviar</button>
            <button class="btn btn-sm" type="button" data-act="gr-prog" data-id="${g.group_id}">${icon('clock', 'sm')}Programar</button>
            ${APP.can('supervisor') ? html`<button class="icon-btn sm" type="button" data-act="gr-edit" data-id="${g.group_id}" aria-label="Renombrar">${icon('edit', 'sm')}</button><button class="icon-btn sm danger" type="button" data-act="gr-del" data-id="${g.group_id}" aria-label="Quitar">${icon('trash', 'sm')}</button>` : ''}
          </div></td></tr>`)}
      </tbody></table>`);
    },
    edit(g) {
      const isNew = !g;
      g = g || {};
      APP.modal({
        title: isNew ? 'Agregar grupo' : 'Renombrar grupo',
        body: html`<form id="grForm" data-submit="gr-save" class="stack">
          ${isNew ? html`<div class="seg" role="group"><button type="button" data-act="gr-mode" data-m="invite" aria-pressed="true">Con enlace de invitación</button><button type="button" data-act="gr-mode" data-m="id" aria-pressed="false">Con el ID</button></div>
            <label class="field" id="grInvite"><span>Enlace de invitación</span><input class="input" name="invite" placeholder="https://chat.whatsapp.com/AbCdEf123…" autofocus><span class="hint">TextMeBot devuelve el ID y el nombre. Tu número debe estar dentro del grupo.</span></label>
            <label class="field" id="grId" hidden><span>ID del grupo</span><input class="input" name="group_id" placeholder="120363012345678901@g.us"><span class="hint">Si ya lo conoces (por ejemplo, el que usa tu robot de reportes).</span></label>` : html`<p class="small muted"><code>${g.group_id}</code></p>`}
          <label class="field"><span>Nombre para reconocerlo ${isNew ? html`<span class="muted" style="font-weight:400">· opcional</span>` : ''}</span><input class="input" name="name" value="${g.name || ''}" placeholder="Equipo de ventas"></label>
          <label class="field"><span>Notas <span class="muted" style="font-weight:400">· opcional</span></span><input class="input" name="notes" value="${g.notes || ''}" placeholder="Para qué se usa"></label>
        </form>`,
        foot: html`<button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn btn-primary" type="submit" form="grForm">${isNew ? 'Agregar grupo' : 'Guardar'}</button>`,
        on: {
          'gr-mode': (b) => { const f = b.closest('.overlay'); APP.$$('[data-act="gr-mode"]', f).forEach((x) => x.setAttribute('aria-pressed', x === b)); f.querySelector('#grInvite').hidden = b.dataset.m !== 'invite'; f.querySelector('#grId').hidden = b.dataset.m !== 'id'; },
          'gr-save': async (form) => {
            const v = APP.formData(form);
            if (!isNew) v.group_id = g.group_id;
            else if (!form.querySelector('#grInvite').hidden) { delete v.group_id; if (!v.invite) return APP.toast('Pega el enlace de invitación.', 'error'); }
            else { delete v.invite; if (!v.group_id) return APP.toast('Escribe el ID del grupo.', 'error'); }
            const btn = form.closest('.overlay').querySelector('[type=submit]');
            btn.disabled = true; btn.textContent = isNew ? 'Consultando a TextMeBot…' : 'Guardando…';
            const r = await APP.try('saveGroup', v, (x) => 'Grupo listo: ' + (x.data.name || x.data.group_id));
            btn.disabled = false; btn.textContent = isNew ? 'Agregar grupo' : 'Guardar';
            if (r) { form.closest('.overlay')._close(); APP.views.grupos.load(); }
          }
        }
      });
    },
    on: {
      'gr-new'() { this.edit(); },
      'gr-edit'(el) { this.edit(this.data.find((g) => g.group_id === el.dataset.id)); },
      'gr-send'(el) { APP.acts.compose({ dataset: { groups: el.dataset.id } }); },
      'gr-prog'(el) { APP.views.programados.edit({ preGroup: el.dataset.id }); },
      async 'gr-del'(el) {
        const g = this.data.find((x) => x.group_id === el.dataset.id);
        if (!(await APP.confirm('Se quita "' + (g.name || g.group_id) + '" de la lista. No sales del grupo en WhatsApp. Los programados que lo incluyan seguirán enviándole mensajes hasta que los edites.', { danger: true, ok: 'Quitar de la lista' }))) return;
        if (await APP.try('deleteGroup', { group_id: g.group_id }, 'Grupo quitado de la lista.')) this.load();
      }
    }
  });

  // ══ Plantillas y respuestas rápidas ═══════════════════════════════════
  const CATS = { atencion: 'Atención', seguimiento: 'Seguimiento', ventas: 'Ventas', marketing: 'Marketing', notificación: 'Avisos', general: 'General' };
  APP.view('plantillas', {
    title: 'Plantillas',
    data: [], cat: '', q: '',
    async render(el) {
      this.el = el;
      el.innerHTML = String(html`<div class="page">
        <header class="page-head">
          <div><h1>Plantillas y respuestas rápidas</h1><p class="lede">En la bandeja escribe <code>/</code> y el atajo para insertarlas. Desde WhatsApp: <code>/q 2 atajo</code>.</p></div>
          ${APP.can('supervisor') ? html`<button class="btn btn-primary" type="button" data-act="tp-new">${icon('plus')}Nueva plantilla</button>` : ''}
        </header>
        <div class="toolbar">
          <div class="search">${icon('search')}<input class="input" type="search" placeholder="Buscar plantilla" data-input="tp-q" aria-label="Buscar plantillas"></div>
          <div class="seg" role="group" aria-label="Categoría" id="tpCats"></div>
        </div>
        <div class="tpl-grid" id="tpGrid"><div class="loading"><div class="spinner"></div></div></div>
      </div>`);
      await this.load();
    },
    async load() { this.data = (await APP.api('templates')).data; APP._tplCache = null; this.paint(); },
    paint() {
      const cats = Array.from(new Set(this.data.map((t) => t.category || 'general')));
      const segs = document.getElementById('tpCats');
      if (segs) segs.innerHTML = String(html`<button type="button" data-act="tp-cat" data-c="" aria-pressed="${!this.cat ? 'true' : 'false'}">Todas</button>${cats.map((c) => html`<button type="button" data-act="tp-cat" data-c="${c}" aria-pressed="${this.cat === c ? 'true' : 'false'}">${CATS[c] || c}</button>`)}`);
      const q = this.q.toLowerCase();
      const list = this.data.filter((t) => (!this.cat || t.category === this.cat) && (!q || (t.name + ' ' + t.message + ' ' + t.shortcut).toLowerCase().includes(q)));
      const box = document.getElementById('tpGrid');
      if (!box) return;
      if (!list.length) { box.innerHTML = String(html`<div class="panel" style="grid-column:1/-1"><div class="empty">${icon('template')}<strong>Sin plantillas</strong><p>Guarda aquí los mensajes que repites a diario: saludo, pedido de datos, horario, seguimiento…</p></div></div>`); return; }
      box.innerHTML = String(html`${list.map((t) => html`<article class="panel tpl ${t.status === 'inactive' ? 'muted' : ''}">
        <div class="spread"><strong>${t.name}</strong>${t.shortcut ? html`<code>/${t.shortcut}</code>` : ''}</div>
        <div class="row small"><span class="tag">${CATS[t.category] || t.category}</span>${t.status === 'inactive' ? html`<span class="pill">Inactiva</span>` : ''}${t.file_url ? html`<span class="muted">${icon('clip', 'sm')} imagen</span>` : ''}</div>
        <p>${t.message}</p>
        <div class="foot"><span class="small muted">${F.plural(+t.uses || 0, 'uso', 'usos')}</span><div class="row">
          <button class="btn btn-sm" type="button" data-act="tp-use" data-id="${t.template_id}">${icon('send', 'sm')}Usar</button>
          ${APP.can('supervisor') ? html`<button class="icon-btn sm" type="button" data-act="tp-edit" data-id="${t.template_id}" title="Editar" aria-label="Editar">${icon('edit', 'sm')}</button><button class="icon-btn sm danger" type="button" data-act="tp-del" data-id="${t.template_id}" title="Eliminar" aria-label="Eliminar">${icon('trash', 'sm')}</button>` : ''}
        </div></div></article>`)}`);
    },
    edit(t) {
      t = t || {};
      const isNew = !t.template_id;
      APP.modal({
        title: isNew ? 'Nueva plantilla' : 'Editar plantilla', size: 'lg',
        body: html`<form id="tpForm" data-submit="tp-save" class="grid-2" style="align-items:start">
          <div class="stack">
            <label class="field"><span>Nombre</span><input class="input" name="name" value="${t.name || ''}" required placeholder="Pedir datos" autofocus></label>
            <div class="fields">
              <label class="field"><span>Atajo</span><input class="input" name="shortcut" value="${t.shortcut || ''}" placeholder="datos" pattern="[a-zA-Z0-9_-]*"><span class="hint">Escribes /datos en la bandeja.</span></label>
              <label class="field"><span>Categoría</span><select class="select" name="category">${Object.keys(CATS).map((k) => html`<option value="${k}" ${(t.category || 'atencion') === k ? 'selected' : ''}>${CATS[k]}</option>`)}</select></label>
            </div>
            <label class="field"><span>Mensaje</span><textarea class="textarea" id="tpMsg" name="message" rows="6" required data-input="tp-prev">${t.message || ''}</textarea></label>
            ${APP.varChips('#tpMsg')}
            ${APP.fileField('file_url', t.file_url)}${APP.fileField('document_url', t.document_url)}
            <label class="check"><input type="checkbox" name="active" ${t.status !== 'inactive' ? 'checked' : ''}>Activa</label>
          </div>
          <div class="stack"><span class="small muted">Así la verá el cliente</span><div class="preview-phone"><div class="bubble out"><div class="wa-text" id="tpPrev">${APP.wa(APP.previewVars(t.message || ''))}</div></div></div>
            <p class="hint">*negrita*, _cursiva_ y ~tachado~ funcionan como en WhatsApp.</p></div>
        </form>`,
        foot: html`<button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn btn-primary" type="submit" form="tpForm">${isNew ? 'Crear plantilla' : 'Guardar'}</button>`,
        on: {
          'tp-prev': (ta) => { ta.form.querySelector('#tpPrev').innerHTML = String(APP.wa(APP.previewVars(ta.value))); },
          'tp-save': async (form) => {
            const v = APP.formData(form);
            v.status = v.active === 'true' ? 'active' : 'inactive';
            delete v.active;
            if (!isNew) v.template_id = t.template_id;
            const r = await APP.try('saveTemplate', v, isNew ? 'Plantilla creada.' : 'Plantilla guardada.');
            if (!r) return;
            form.closest('.overlay')._close();
            APP.views.plantillas.load();
            APP.views.bandeja.tpls = null;
          }
        }
      });
    },
    on: {
      'tp-q': APP.debounce(function (el) { const v = APP.views.plantillas; v.q = el.value.trim(); v.paint(); }, 150),
      'tp-cat'(el) { this.cat = el.dataset.c; this.paint(); },
      'tp-new'() { this.edit(); },
      'tp-edit'(el) { this.edit(this.data.find((t) => t.template_id === el.dataset.id)); },
      'tp-use'(el) { APP.acts.compose({ dataset: { tpl: el.dataset.id } }); },
      async 'tp-del'(el) {
        if (!(await APP.confirm('¿Eliminar esta plantilla?', { danger: true, ok: 'Eliminar' }))) return;
        if (await APP.try('deleteTemplate', { template_id: el.dataset.id }, 'Plantilla eliminada.')) this.load();
      }
    }
  });
})();
