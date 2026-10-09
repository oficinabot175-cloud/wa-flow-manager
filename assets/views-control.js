/* WA POWER v2 — Control: Automatización, Analítica, Comandos por WhatsApp, Configuración */
(function () {
  'use strict';
  const { html, icon, fmt: F } = APP;
  const S = () => (APP.meta.settings && APP.meta.settings.settings) || {};
  const sv = (k) => (S()[k] || {}).value || '';

  // ══ Automatización ════════════════════════════════════════════════════
  const MATCH = { word: 'Palabra o frase completa', contains: 'Contiene el texto', exact: 'Mensaje exacto', starts_with: 'Empieza con', ends_with: 'Termina con', regex: 'Expresión regular' };
  const TRIGGER = { keyword: 'Cuando el mensaje contiene…', first_message: 'Primer mensaje de un contacto nuevo', any: 'Cualquier mensaje' };
  const MARK = { '': 'No cambiar', 'needs-human': 'Pide asesor (queda esperando)', pending: 'Pendiente', resolved: 'Atendida', do_not_contact: 'No contactar (baja)' };
  const DAYS = [['1', 'Lun'], ['2', 'Mar'], ['3', 'Mié'], ['4', 'Jue'], ['5', 'Vie'], ['6', 'Sáb'], ['7', 'Dom']];

  APP.view('automatizacion', {
    title: 'Automatización', min: 'supervisor',
    tab: 'rules', rules: [],
    async render(el) {
      this.el = el;
      el.innerHTML = String(html`<div class="page" style="max-width:1080px">
        <header class="page-head">
          <div><h1>Automatización</h1><p class="lede">Qué responde el bot, cuándo avisa a un asesor y qué hace fuera de horario.</p></div>
          <button class="btn btn-primary" type="button" data-act="ru-new" id="ruNewBtn">${icon('plus')}Nueva regla</button>
        </header>
        <div class="tabs" role="tablist"><button type="button" role="tab" data-act="au-tab" data-t="rules" aria-selected="${this.tab === 'rules'}">Reglas de respuesta</button><button type="button" role="tab" data-act="au-tab" data-t="scope" aria-selected="${this.tab === 'scope'}">A quién responde</button><button type="button" role="tab" data-act="au-tab" data-t="bot" aria-selected="${this.tab === 'bot'}">Bienvenida y horario</button></div>
        <div id="auBody"></div>
      </div>`);
      await this.paintTab();
    },
    async paintTab() {
      const box = document.getElementById('auBody');
      if (!box) return;
      document.getElementById('ruNewBtn').hidden = this.tab !== 'rules';
      if (this.tab === 'rules') {
        box.innerHTML = String(html`<div class="stack" style="gap:18px">
          <section class="panel"><div class="panel-head"><h2>Probar un mensaje</h2><span class="muted">no envía nada</span></div><div class="panel-body">
            <form class="tester" data-submit="ru-test"><input class="input" name="t" placeholder="Escribe lo que mandaría un cliente, por ejemplo: hola, ¿cuánto cuesta la fibra?" aria-label="Mensaje de prueba"><input class="input" name="phone" placeholder="Número (opcional)" style="max-width:190px" inputmode="tel" aria-label="Probar como este contacto" title="Prueba como si escribiera este contacto: aplica sus etiquetas y si el bot está apagado en su chat"><button class="btn" type="submit">Probar</button></form>
            <div class="tester-out" id="ruOut"></div></div></section>
          <section class="panel"><div class="panel-head"><h2>Reglas</h2><span class="muted">Se revisan en orden: gana la primera que coincide</span></div><div id="ruList"><div class="loading"><div class="spinner"></div></div></div></section>
        </div>`);
        await this.loadRules();
      } else if (this.tab === 'scope') this.paintScope();
      else this.paintBot();
    },
    paintScope() {
      const box = document.getElementById('auBody');
      const admin = APP.can('admin');
      const dis = admin ? '' : 'disabled';
      const scope = sv('BOT_SCOPE') || 'all';
      box.innerHTML = String(html`<form class="stack" style="gap:18px" data-submit="scope-save">
        ${admin ? '' : html`<div class="callout lamp">${icon('alert', 'sm')}<span>Solo un administrador puede cambiar estos ajustes.</span></div>`}
        <section class="panel"><div class="panel-head"><h2>Cómo decide el bot si responde</h2></div><div class="panel-body">
          <ol class="decide">
            <li><strong>Bot general</strong><span>Si está apagado, nadie recibe respuestas automáticas.</span></li>
            <li><strong>El chat</strong><span>Cada contacto puede estar en Automático, Siempre o Nunca (desde su ficha, Contactos o <code>/bot 2 off</code>).</span></li>
            <li><strong>Las etiquetas</strong><span>Excluidas nunca reciben bot; en modo "solo permitidos", únicamente las permitidas.</span></li>
            <li><strong>Un asesor atendiendo</strong><span>Si alguien del equipo respondió hace poco, el bot no interrumpe.</span></li>
            <li><strong>Cada regla</strong><span>Puede limitarse a ciertas etiquetas o excluir otras.</span></li>
          </ol></div></section>
        <section class="panel">
          <div class="setting"><div><h3>A quién responde</h3><p class="desc">Elige si el bot atiende a todos o solo a quienes marques.</p></div><span></span>
            <div class="body stack" style="gap:8px">
              <label class="radio-card ${scope === 'all' ? 'on' : ''}"><input type="radio" name="BOT_SCOPE" value="all" ${scope === 'all' ? 'checked' : ''} ${dis} data-change="scope-mode"><span><strong>A todos, salvo los excluidos</strong><span class="soft small">Ideal para atención y ventas: responde a clientes nuevos y conocidos.</span></span></label>
              <label class="radio-card ${scope === 'allowlist' ? 'on' : ''}"><input type="radio" name="BOT_SCOPE" value="allowlist" ${scope === 'allowlist' ? 'checked' : ''} ${dis} data-change="scope-mode"><span><strong>Solo a los permitidos</strong><span class="soft small">El bot solo responde a contactos con las etiquetas que indiques o marcados como "Siempre".</span></span></label>
            </div></div>
          <div class="setting"><div><h3>Etiquetas que nunca reciben bot</h3><p class="desc">Por ejemplo familia, personal, proveedor, equipo.</p></div><span></span>
            <div class="body"><input class="input" name="BOT_EXCLUDE_TAGS" value="${sv('BOT_EXCLUDE_TAGS')}" placeholder="familia, personal, proveedor" ${dis}></div></div>
          <div class="setting" id="onlyTagsRow" ${scope === 'allowlist' ? '' : 'hidden'}><div><h3>Etiquetas permitidas</h3><p class="desc">En modo "solo permitidos", el bot responde a quienes tengan al menos una.</p></div><span></span>
            <div class="body"><input class="input" name="BOT_ONLY_TAGS" value="${sv('BOT_ONLY_TAGS')}" placeholder="prospecto, cliente" ${dis}></div></div>
          <div class="setting"><div><h3>Silencio cuando atiende un asesor</h3><p class="desc">Minutos que el bot se calla en un chat después de que alguien del equipo responde. 0 = no se calla.</p></div>
            <div class="row"><input class="input" type="number" min="0" name="HUMAN_TAKEOVER_MIN" value="${sv('HUMAN_TAKEOVER_MIN')}" style="width:96px" ${dis} aria-label="Minutos de silencio"><span class="small muted">min</span></div></div>
          ${admin ? html`<div class="modal-foot"><button class="btn btn-primary" type="submit">Guardar cambios</button></div>` : ''}
        </section>
        <section class="panel"><div class="panel-head"><h2>Chats sin bot</h2><a class="small" href="#" data-act="go-nobot">Ver en Contactos</a></div><div class="panel-body"><p class="soft small">Los contactos marcados como "Nunca" aparecen con el filtro "Sin bot" en Contactos. Desde ahí puedes devolverlos a lo normal en bloque.</p></div></section>
      </form>`);
    },
    async loadRules() { await APP.swr('rules', {}, (r) => { this.rules = r.data; this.paintRules(); }); },
    paintRules() {
      const box = document.getElementById('ruList');
      if (!box) return;
      if (!this.rules.length) { box.innerHTML = String(html`<div class="empty">${icon('bolt')}<strong>Sin reglas</strong><p>Crea la primera: por ejemplo, cuando alguien escriba "precio", responder con tus planes.</p></div>`); return; }
      box.innerHTML = String(html`${this.rules.map((r) => {
        const kws = String(r.keyword || '').split(',').map((k) => k.trim()).filter(Boolean);
        const acts = [];
        if (r.tags_to_add) acts.push(html`<span class="pill">${icon('tag', 'sm')}${r.tags_to_add}</span>`);
        if (r.mark_status) acts.push(html`<span class="pill ${r.mark_status === 'needs-human' ? 'lamp' : r.mark_status === 'do_not_contact' ? 'alert' : ''}">${MARK[r.mark_status] || r.mark_status}</span>`);
        if (r.deal_stage) acts.push(html`<span class="pill petrol">${icon('board', 'sm')}${r.deal_stage}</span>`);
        if (r.assign_to) acts.push(html`<span class="pill">${icon('assign', 'sm')}${r.assign_to}</span>`);
        if (r.notify_admin === 'true') acts.push(html`<span class="pill lamp">Avisa a tu WhatsApp</span>`);
        if (r.only_tags) acts.push(html`<span class="pill">Solo: ${r.only_tags}</span>`);
        if (r.except_tags) acts.push(html`<span class="pill">Excepto: ${r.except_tags}</span>`);
        return html`<div class="rule ${r.enabled === 'true' ? '' : 'off'}">
          <span class="prio" title="Prioridad">${r.priority}</span>
          <div style="min-width:0">
            <div class="rule-title"><strong>${r.rule_name}</strong>${r.enabled !== 'true' ? html`<span class="pill">Apagada</span>` : ''}<span class="small muted">${r.trigger_type === 'keyword' || !r.trigger_type ? MATCH[r.match_type] || r.match_type : TRIGGER[r.trigger_type]}</span></div>
            ${kws.length && (r.trigger_type || 'keyword') === 'keyword' ? html`<div class="tags" style="margin-top:6px">${kws.slice(0, 8).map((k) => html`<span class="tag">${k}</span>`)}${kws.length > 8 ? html`<span class="small muted">+${kws.length - 8}</span>` : ''}</div>` : ''}
            ${r.response_template ? html`<div class="rule-resp">↳ ${r.response_template}</div>` : html`<div class="rule-resp muted">Sin respuesta automática (solo acciones)</div>`}
            ${acts.length ? html`<div class="rule-acts">${acts}</div>` : ''}
            <div class="small muted" style="margin-top:6px">${F.plural(+r.hits || 0, 'vez usada', 'veces usada')}${r.last_hit_at ? ' · última ' + F.ago(r.last_hit_at) : ''}</div>
          </div>
          <div class="row">
            <label class="switch" title="${r.enabled === 'true' ? 'Apagar regla' : 'Encender regla'}"><input type="checkbox" data-change="ru-toggle" data-id="${r.rule_id}" ${r.enabled === 'true' ? 'checked' : ''} aria-label="${'Regla ' + r.rule_name + ' encendida'}"><span class="track"></span></label>
            <button class="icon-btn sm" type="button" data-act="ru-edit" data-id="${r.rule_id}" title="Editar" aria-label="Editar">${icon('edit', 'sm')}</button>
            <button class="icon-btn sm danger" type="button" data-act="ru-del" data-id="${r.rule_id}" title="Eliminar" aria-label="Eliminar">${icon('trash', 'sm')}</button>
          </div></div>`;
      })}`);
    },
    paintBot() {
      const box = document.getElementById('auBody');
      const admin = APP.can('admin');
      const days = sv('BH_DAYS').split(',');
      const sw = (k, label) => html`<label class="switch"><input type="checkbox" name="${k}" ${sv(k) === 'true' ? 'checked' : ''} ${admin ? '' : 'disabled'}><span class="track"></span><span class="sr">${label}</span></label>`;
      box.innerHTML = String(html`<form class="panel" data-submit="bot-save" id="botForm">
        ${admin ? '' : html`<div class="panel-body" style="padding-top:14px"><div class="callout lamp">${icon('alert', 'sm')}<span>Solo un administrador puede cambiar estos ajustes.</span></div></div>`}
        <div class="setting"><div><h3>Respuestas automáticas</h3><p class="desc">Apagado, nadie recibe respuestas del bot: todo queda esperando en la bandeja. También con <code>/bot off</code> desde WhatsApp.</p></div>${sw('BOT_ENABLED', 'Bot encendido')}</div>
        <div class="setting"><div><h3>Bienvenida a contactos nuevos</h3><p class="desc">Se envía la primera vez que alguien escribe, si ninguna regla respondió.</p></div>${sw('WELCOME_ENABLED', 'Bienvenida activa')}
          <div class="body"><textarea class="textarea" name="WELCOME_MESSAGE" id="wMsg" rows="2" ${admin ? '' : 'disabled'}>${sv('WELCOME_MESSAGE')}</textarea></div></div>
        <div class="setting"><div><h3>Fuera de horario</h3><p class="desc">Responde una vez cada 12 horas por contacto cuando escriben fuera del horario de atención.</p></div>${sw('AWAY_ENABLED', 'Mensaje fuera de horario activo')}
          <div class="body stack">
            <div class="row wrap" style="gap:14px"><div class="days" role="group" aria-label="Días de atención">${DAYS.map((d) => html`<label><input type="checkbox" data-multi="1" name="bh_day" value="${d[0]}" ${days.includes(d[0]) ? 'checked' : ''} ${admin ? '' : 'disabled'}><span>${d[1]}</span></label>`)}</div>
              <label class="row small">de <input class="input sm" type="time" name="BH_START" value="${sv('BH_START')}" style="width:auto" ${admin ? '' : 'disabled'}> a <input class="input sm" type="time" name="BH_END" value="${sv('BH_END')}" style="width:auto" ${admin ? '' : 'disabled'}></label></div>
            <textarea class="textarea" name="AWAY_MESSAGE" rows="2" ${admin ? '' : 'disabled'}>${sv('AWAY_MESSAGE')}</textarea>
          </div></div>
        <div class="setting"><div><h3>Cuando ninguna regla coincide</h3><p class="desc">Por defecto el mensaje solo queda esperando a un asesor. Actívalo para responder algo (una vez cada 12 horas por contacto).</p></div>${sw('FALLBACK_ENABLED', 'Respuesta por defecto activa')}
          <div class="body"><textarea class="textarea" name="DEFAULT_FALLBACK_MESSAGE" rows="2" ${admin ? '' : 'disabled'}>${sv('DEFAULT_FALLBACK_MESSAGE')}</textarea></div></div>
        <div class="setting"><div><h3>No repetir la misma respuesta</h3><p class="desc">Minutos que deben pasar para que una regla vuelva a responder al mismo contacto. Evita conversaciones en bucle.</p></div>
          <input class="input" type="number" min="0" name="AUTO_REPLY_COOLDOWN_MIN" value="${sv('AUTO_REPLY_COOLDOWN_MIN')}" style="width:96px" ${admin ? '' : 'disabled'} aria-label="Minutos"></div>
        <div class="setting"><div><h3>Ignorar grupos</h3><p class="desc">Los mensajes de grupos no se guardan ni reciben respuestas.</p></div>${sw('IGNORE_GROUPS', 'Ignorar grupos')}</div>
        <div class="setting"><div><h3>Comandos por WhatsApp</h3><p class="desc">Permite que los usuarios con teléfono registrado operen el sistema escribiendo /ayuda, /p, /r…</p></div>${sw('COMMANDS_ENABLED', 'Comandos activos')}</div>
        ${admin ? html`<div class="modal-foot"><button class="btn btn-primary" type="submit">Guardar cambios</button></div>` : ''}
      </form>`);
    },
    editRule(r) {
      r = r || { enabled: 'true', priority: String((this.rules.length + 1) * 1), match_type: 'word', trigger_type: 'keyword', cooldown_minutes: '60' };
      const isNew = !r.rule_id;
      APP.modal({
        title: isNew ? 'Nueva regla' : 'Editar regla', size: 'lg',
        body: html`<form id="ruForm" data-submit="ru-save" class="stack">
          <div class="fields"><label class="field"><span>Nombre</span><input class="input" name="rule_name" value="${r.rule_name || ''}" required placeholder="Consulta de precios" autofocus></label>
            <label class="field"><span>Prioridad</span><input class="input" type="number" min="1" name="priority" value="${r.priority}"><span class="hint">1 se revisa primero.</span></label></div>
          <div class="fields"><label class="field"><span>Se activa</span><select class="select" name="trigger_type" data-change="ru-trig">${Object.keys(TRIGGER).map((k) => html`<option value="${k}" ${(r.trigger_type || 'keyword') === k ? 'selected' : ''}>${TRIGGER[k]}</option>`)}</select></label>
            <label class="field" id="ruMatchF" ${(r.trigger_type || 'keyword') === 'keyword' ? '' : 'hidden'}><span>Cómo comparar</span><select class="select" name="match_type">${Object.keys(MATCH).map((k) => html`<option value="${k}" ${r.match_type === k ? 'selected' : ''}>${MATCH[k]}</option>`)}</select></label></div>
          <label class="field" id="ruKwF" ${(r.trigger_type || 'keyword') === 'keyword' ? '' : 'hidden'}><span>Palabras clave</span><input class="input" name="keyword" value="${r.keyword || ''}" placeholder="precio, precios, cuánto cuesta, tarifa"><span class="hint">Separadas por coma. No importan mayúsculas ni tildes.</span></label>
          <label class="field"><span>Respuesta</span><textarea class="textarea" id="ruMsg" name="response_template" rows="4" placeholder="Vacío = no responde, solo aplica las acciones">${r.response_template || ''}</textarea></label>
          ${APP.varChips('#ruMsg')}
          <label class="field"><span>Imagen o archivo con la respuesta (URL, opcional)</span><input class="input" type="url" name="file_url" value="${r.file_url || ''}"></label>
          <h3 style="margin-top:4px">Además</h3>
          <div class="fields">
            <label class="field"><span>Agregar etiquetas</span><input class="input" name="tags_to_add" value="${r.tags_to_add || ''}" placeholder="interesado"></label>
            <label class="field"><span>Estado de la conversación</span><select class="select" name="mark_status">${Object.keys(MARK).map((k) => html`<option value="${k}" ${(r.mark_status || '') === k ? 'selected' : ''}>${MARK[k]}</option>`)}</select></label>
          </div>
          <div class="fields">
            <label class="field"><span>Crear o mover oportunidad a</span><select class="select" name="deal_stage"><option value="">No crear</option>${APP.meta.stages.map((s) => html`<option ${r.deal_stage === s ? 'selected' : ''}>${s}</option>`)}</select></label>
            <label class="field"><span>Asignar a</span><select class="select" name="assign_to">${APP.userOptions(r.assign_to, 'Nadie')}</select></label>
            <label class="field"><span>No repetir antes de (min)</span><input class="input" type="number" min="0" name="cooldown_minutes" value="${r.cooldown_minutes || ''}" placeholder="60"></label>
          </div>
          <h3 style="margin-top:4px">Para quién aplica</h3>
          <div class="fields">
            <label class="field"><span>Solo contactos con estas etiquetas</span><input class="input" name="only_tags" value="${r.only_tags || ''}" placeholder="Vacío = todos"></label>
            <label class="field"><span>Excepto contactos con estas etiquetas</span><input class="input" name="except_tags" value="${r.except_tags || ''}" placeholder="cliente, vip"></label>
          </div>
          <label class="check"><input type="checkbox" name="notify_admin" ${r.notify_admin === 'true' ? 'checked' : ''}>Avisarme por WhatsApp cuando se active</label>
          <label class="check"><input type="checkbox" name="enabled" ${r.enabled === 'true' ? 'checked' : ''}>Regla encendida</label>
        </form>`,
        foot: html`<button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn btn-primary" type="submit" form="ruForm">${isNew ? 'Crear regla' : 'Guardar'}</button>`,
        on: {
          'ru-trig': (sel) => { const kw = sel.value === 'keyword'; sel.form.querySelector('#ruKwF').hidden = !kw; sel.form.querySelector('#ruMatchF').hidden = !kw; },
          'ru-save': async (form) => {
            const v = APP.formData(form);
            if (!isNew) v.rule_id = r.rule_id;
            if (await APP.try('saveRule', v, isNew ? 'Regla creada.' : 'Regla guardada.')) { form.closest('.overlay')._close(); APP.views.automatizacion.loadRules(); }
          }
        }
      });
    },
    on: {
      'au-tab'(el) { this.tab = el.dataset.t; APP.$$('[data-act="au-tab"]').forEach((b) => b.setAttribute('aria-selected', b === el)); this.paintTab(); },
      'ru-new'() { this.editRule(); },
      'scope-mode'(el) { document.getElementById('onlyTagsRow').hidden = el.value !== 'allowlist'; APP.$$('.radio-card').forEach((c) => c.classList.toggle('on', c.querySelector('input').checked)); },
      'go-nobot'() { APP.views.contactos.status = 'nobot'; APP.go('contactos'); },
      async 'scope-save'(form) {
        const v = { BOT_SCOPE: form.querySelector('input[name=BOT_SCOPE]:checked').value, BOT_EXCLUDE_TAGS: form.BOT_EXCLUDE_TAGS.value, BOT_ONLY_TAGS: form.BOT_ONLY_TAGS ? form.BOT_ONLY_TAGS.value : '', HUMAN_TAKEOVER_MIN: form.HUMAN_TAKEOVER_MIN.value };
        if (await APP.try('saveSettings', { values: v }, 'Ajustes guardados.')) await APP.loadMeta();
      },
      'ru-edit'(el) { this.editRule(this.rules.find((r) => r.rule_id === el.dataset.id)); },
      async 'ru-toggle'(el) {
        const r = this.rules.find((x) => x.rule_id === el.dataset.id);
        const res = await APP.try('saveRule', { rule_id: r.rule_id, enabled: el.checked ? 'true' : 'false' }, el.checked ? 'Regla encendida.' : 'Regla apagada.');
        if (res) { r.enabled = el.checked ? 'true' : 'false'; this.paintRules(); } else el.checked = !el.checked;
      },
      async 'ru-del'(el) {
        const r = this.rules.find((x) => x.rule_id === el.dataset.id);
        if (!(await APP.confirm('¿Eliminar la regla "' + r.rule_name + '"?', { danger: true, ok: 'Eliminar' }))) return;
        if (await APP.try('deleteRule', { rule_id: r.rule_id }, 'Regla eliminada.')) this.loadRules();
      },
      async 'ru-test'(form) {
        const t = form.t.value.trim();
        if (!t) return;
        const r = await APP.try('testRule', { test_message: t, phone: form.phone.value.trim() });
        const out = document.getElementById('ruOut');
        if (!r || !out) return;
        if (r.blocked) { out.innerHTML = String(html`<div class="callout lamp">${icon('bot', 'sm')}<span>No habría respuesta automática: ${r.blocked_text}</span></div>`); return; }
        out.innerHTML = String(r.matched
          ? html`<div class="stack" style="gap:8px"><div class="callout ok">${icon('check', 'sm')}<span>Coincide con <strong>${r.rule_name}</strong>${r.mark_status ? ' · ' + (MARK[r.mark_status] || r.mark_status) : ''}</span></div>${r.response ? html`<div class="preview-phone"><div class="bubble"><div class="wa-text">${t}</div></div><div class="bubble out auto"><div class="wa-text">${APP.wa(r.response)}</div><div class="bubble-meta"><span class="src">Bot</span></div></div></div>` : ''}</div>`
          : html`<div class="callout lamp">${icon('alert', 'sm')}<span>Ninguna regla coincide. El mensaje quedará esperando a un asesor${sv('FALLBACK_ENABLED') === 'true' ? ' y se enviará la respuesta por defecto' : ''}${r.in_hours === false && sv('AWAY_ENABLED') === 'true' ? '; ahora estás fuera de horario, así que saldría el mensaje de fuera de horario' : ''}.</span></div>`);
      },
      async 'bot-save'(form) {
        const v = {};
        ['BOT_ENABLED', 'WELCOME_ENABLED', 'AWAY_ENABLED', 'FALLBACK_ENABLED', 'IGNORE_GROUPS', 'COMMANDS_ENABLED'].forEach((k) => { v[k] = form[k].checked ? 'true' : 'false'; });
        ['WELCOME_MESSAGE', 'AWAY_MESSAGE', 'DEFAULT_FALLBACK_MESSAGE', 'BH_START', 'BH_END', 'AUTO_REPLY_COOLDOWN_MIN'].forEach((k) => { v[k] = form[k].value; });
        v.BH_DAYS = APP.$$('input[name=bh_day]:checked', form).map((c) => c.value).join(',');
        if (await APP.try('saveSettings', { values: v }, 'Ajustes del bot guardados.')) { await APP.loadMeta(); }
      }
    }
  });

  // ══ Analítica ═════════════════════════════════════════════════════════
  function barChart(series) {
    const W = 760, H = 220, pl = 30, pb = 24, pt = 8;
    const max = Math.max(4, ...series.map((s) => Math.max(s.in, s.out)));
    const step = Math.ceil(max / 4);
    const top = step * 4;
    const n = series.length, gw = (W - pl) / n, bw = Math.max(3, Math.min(14, gw * 0.32));
    const y = (v) => pt + (H - pb - pt) * (1 - v / top);
    let g = '';
    for (let i = 0; i <= 4; i++) { const v = step * i; g += `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; }
    const every = Math.ceil(n / 10);
    series.forEach((s, i) => {
      const x = pl + gw * i + gw / 2;
      g += `<rect x="${x - bw - 1}" y="${y(s.in)}" width="${bw}" height="${Math.max(0, H - pb - y(s.in))}" rx="2" fill="var(--petrol)"><title>${s.day}: ${s.in} recibidos</title></rect>`;
      g += `<rect x="${x + 1}" y="${y(s.out)}" width="${bw}" height="${Math.max(0, H - pb - y(s.out))}" rx="2" fill="var(--lamp)"><title>${s.day}: ${s.out} enviados (${s.auto} del bot)</title></rect>`;
      if (i % every === 0 || i === n - 1) g += `<text x="${x}" y="${H - 6}" text-anchor="middle">${s.day.slice(8, 10)}/${s.day.slice(5, 7)}</text>`;
    });
    return APP.raw(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mensajes por día">${g}</svg>`);
  }
  const SRC = { manual: 'Asesores (portal)', auto: 'Bot', campaign: 'Campañas', scheduler: 'Programados', command: 'Desde WhatsApp', 'quick-reply': 'Respuestas rápidas' };

  APP.view('analitica', {
    title: 'Analítica', min: 'supervisor', days: 14,
    async render(el) {
      this.el = el;
      await APP.swr('analytics', { days: this.days }, (r) => { if (APP.alive(el)) this.paint(el, r); });
    },
    paint(el, r) {
      const t = r.totals;
      const botPct = t.out ? Math.round(t.auto * 100 / t.out) : 0;
      const maxHeat = Math.max(1, ...r.heatmap.flat());
      const maxFunnel = Math.max(1, ...r.funnel.map((f) => f.count));
      const maxRule = Math.max(1, ...r.top_rules.map((x) => x.count));
      const srcTotal = Object.values(r.by_source).reduce((a, b) => a + b, 0) || 1;
      el.innerHTML = String(html`<div class="page">
        <header class="page-head">
          <div><h1>Analítica</h1><p class="lede">Cómo se está atendiendo y vendiendo por WhatsApp.</p></div>
          <div class="seg" role="group" aria-label="Periodo">${[7, 14, 30, 90].map((d) => html`<button type="button" data-act="an-days" data-d="${d}" aria-pressed="${this.days === d ? 'true' : 'false'}">${d} días</button>`)}</div>
        </header>
        <section class="panel"><div class="kpis">
          <div class="kpi"><strong>${t.in}</strong><span>Mensajes recibidos</span></div>
          <div class="kpi"><strong>${t.out}</strong><span>Mensajes enviados</span></div>
          <div class="kpi"><strong>${botPct}%</strong><span>Enviados por el bot</span></div>
          <div class="kpi"><strong>${r.response.median_min === null ? '—' : r.response.median_min + ' min'}</strong><span>Tiempo típico de respuesta</span></div>
          <div class="kpi"><strong>${r.response.within_15_pct === null ? '—' : r.response.within_15_pct + '%'}</strong><span>Respondidos en 15 min</span></div>
          <div class="kpi"><strong>${r.new_contacts}</strong><span>Contactos nuevos</span></div>
          <div class="kpi"><strong>${F.money(r.won.value)}</strong><span>${F.plural(r.won.count, 'venta ganada', 'ventas ganadas')}</span></div>
        </div></section>
        <section class="panel chart"><div class="panel-head"><h2>Mensajes por día</h2><div class="legend"><span><i style="background:var(--petrol)"></i>Recibidos</span><span><i style="background:var(--lamp)"></i>Enviados</span>${t.failed ? html`<span style="color:var(--alert-ink)">${t.failed} fallidos</span>` : ''}</div></div>
          <div class="panel-body">${barChart(r.series)}</div></section>
        <div class="grid-2">
          <section class="panel"><div class="panel-head"><h2>Cuándo escriben tus clientes</h2><span class="muted">más oscuro = más mensajes</span></div><div class="panel-body">
            <div class="heat" role="img" aria-label="Mensajes por día de la semana y hora">
              <span></span>${Array.from({ length: 24 }, (_, h) => html`<span class="h">${h % 3 === 0 ? h : ''}</span>`)}
              ${r.heatmap.map((row, d) => html`<span>${DAYS[d][1]}</span>${row.map((v, h) => html`<span class="c" title="${DAYS[d][1] + ' ' + h + ':00 · ' + v + ' mensajes'}" style="${'opacity:' + (v ? (0.12 + 0.88 * v / maxHeat).toFixed(2) : 0.06)}"></span>`)}`)}
            </div></div></section>
          <section class="panel"><div class="panel-head"><h2>Embudo de ventas</h2><span class="muted">${F.plural(r.lost.count, 'perdida', 'perdidas')} en el periodo</span></div><div class="panel-body"><div class="bars">
            ${r.funnel.map((f) => html`<div class="bar-row"><span class="ellipsis">${f.stage}</span><div class="track"><i style="${'width:' + Math.round(f.count * 100 / maxFunnel) + '%'}"></i></div><span class="v">${f.count} · ${F.money(f.value)}</span></div>`)}
          </div></div></section>
        </div>
        <div class="grid-2">
          <section class="panel"><div class="panel-head"><h2>Reglas más usadas</h2></div><div class="panel-body">
            ${r.top_rules.length ? html`<div class="bars">${r.top_rules.map((x) => html`<div class="bar-row"><span class="ellipsis">${x.name}</span><div class="track"><i style="${'width:' + Math.round(x.count * 100 / maxRule) + '%;background:var(--lamp)'}"></i></div><span class="v">${x.count}</span></div>`)}</div>` : html`<p class="small muted">Sin datos en el periodo.</p>`}
          </div></section>
          <section class="panel"><div class="panel-head"><h2>Quién envía los mensajes</h2></div><div class="panel-body"><div class="bars">
            ${Object.keys(r.by_source).sort((a, b) => r.by_source[b] - r.by_source[a]).map((k) => html`<div class="bar-row"><span class="ellipsis">${SRC[k] || k}</span><div class="track"><i style="${'width:' + Math.round(r.by_source[k] * 100 / srcTotal) + '%'}"></i></div><span class="v">${r.by_source[k]}</span></div>`)}
            ${!Object.keys(r.by_source).length ? html`<p class="small muted">Sin envíos en el periodo.</p>` : ''}
          </div></div></section>
        </div>
        ${r.campaigns.length ? html`<section class="panel"><div class="panel-head"><h2>Últimas campañas</h2></div><div class="table-wrap"><table class="table"><thead><tr><th>Campaña</th><th>Destinatarios</th><th>Enviados</th><th>Fallidos</th><th>Estado</th></tr></thead><tbody>
          ${r.campaigns.map((c) => html`<tr><td class="cell-main">${c.name}</td><td>${c.total}</td><td>${c.sent}</td><td>${c.failed ? html`<span style="color:var(--alert-ink)">${c.failed}</span>` : 0}</td><td><span class="pill">${APP.labels.camp[c.status] || c.status}</span></td></tr>`)}
        </tbody></table></div></section>` : ''}
      </div>`);
    },
    on: { 'an-days'(el) { this.days = +el.dataset.d; APP.route(); } }
  });

  // ══ Comandos por WhatsApp ═════════════════════════════════════════════
  APP.view('whatsapp', {
    title: 'Comandos por WhatsApp',
    log: [],
    async render(el) {
      this.el = el;
      const cat = await APP.api('commands');
      const me = APP.state.user;
      const myUser = APP.meta.users.find((u) => u.name === me.name);
      const phone = me.phone || (myUser && myUser.phone) || '';
      if (!this.log.length) this.log = [{ dir: 'in', text: '*WA Power* listo. Prueba con /hoy, /p o /ayuda. Esta ventana simula tu WhatsApp.' }];
      el.innerHTML = String(html`<div class="page">
        <header class="page-head"><div><h1>Opera desde tu WhatsApp</h1><p class="lede">Escríbele al número conectado a TextMeBot desde tu celular. Todo lo que empieza con <code>/</code> es un comando; lo demás se trata como un cliente normal.</p></div></header>
        ${phone ? html`<div class="callout ok">${icon('check', 'sm')}<span>Tu celular registrado es <strong>${F.phone(phone)}</strong>. Los comandos que envíes desde ese número funcionarán.</span></div>`
          : html`<div class="callout lamp">${icon('alert', 'sm')}<span>Aún no tienes un celular registrado. ${APP.can('admin') ? html`Agrégalo en <a href="#/configuracion/usuarios">Configuración › Usuarios</a>.` : 'Pídele a un administrador que lo agregue a tu usuario.'}</span></div>`}
        <div class="cmd-grid">
          <section class="panel"><div class="panel-head"><h2>Comandos</h2><span class="muted">toca uno para probarlo</span></div><div class="panel-body stack" style="gap:18px">
            ${cat.groups.map((g) => html`<div><h3 style="margin-bottom:6px">${g[0]}</h3><div class="cmd-list">${g[1].map((c) => html`<div class="cmd-row"><code class="clickable" data-act="cm-fill" data-c="${c[0].split(' · ')[0]}" role="button" tabindex="0" title="Probar en el simulador">${c[0]}</code><span class="soft">${c[1]}</span></div>`)}</div></div>`)}
            <p class="hint">"#2" es el número de la lista que te devuelve /p o /buscar (vale una hora). También puedes usar el teléfono (999888777) o el nombre del contacto. Las fechas se entienden en español: "mañana 10:00", "viernes 9", "30/09 15:30", "en 45 min".</p>
          </div></section>
          <section class="stack">
            <div class="phone-sim">
              <div class="chat-head" style="height:52px"><span class="brand-mark sm"><svg class="i"><use href="#i-mark"/></svg></span><div class="who"><strong>WA Power</strong><span>simulador · las acciones son reales</span></div></div>
              <div class="chat-scroll" id="cmLog">${this.logHtml()}</div>
              <form class="composer" data-submit="cm-send" style="padding:10px"><div class="composer-row"><input class="input" name="t" id="cmInput" placeholder="/p" autocomplete="off" aria-label="Comando"><button class="btn btn-primary" type="submit" aria-label="Enviar comando">${icon('send')}</button></div></form>
            </div>
            <p class="hint">Aquí se ejecuta de verdad: <code>/r</code> y <code>/e</code> envían mensajes a clientes, <code>/lanzar</code> pide confirmación antes de mandar una campaña. La respuesta solo aparece en esta ventana.</p>
          </section>
        </div>
      </div>`);
      const lg = document.getElementById('cmLog'); lg.scrollTop = lg.scrollHeight;
    },
    logHtml() { return html`${this.log.map((m) => html`<div class="bubble ${m.dir === 'out' ? 'out' : ''}"><div class="wa-text">${APP.wa(m.text)}</div></div>`)}`; },
    on: {
      'cm-fill'(el) { const i = document.getElementById('cmInput'); i.value = el.dataset.c; i.focus(); i.setSelectionRange(i.value.length, i.value.length); },
      async 'cm-send'(form) {
        const t = form.t.value.trim();
        if (!t) return;
        const text = t.startsWith('/') ? t : '/' + t;
        this.log.push({ dir: 'out', text });
        form.t.value = '';
        const lg = document.getElementById('cmLog');
        lg.innerHTML = String(this.logHtml()); lg.scrollTop = lg.scrollHeight;
        try { const r = await APP.api('simulateCommand', { text }); this.log.push({ dir: 'in', text: r.reply || '(sin respuesta)' }); }
        catch (e) { this.log.push({ dir: 'in', text: '⚠️ ' + e.message }); }
        this.log = this.log.slice(-40);
        lg.innerHTML = String(this.logHtml()); lg.scrollTop = lg.scrollHeight;
        APP.pollNow();
      }
    }
  });

  // ══ Configuración ═════════════════════════════════════════════════════
  const TABS = [['conexion', 'Conexión', 'admin'], ['general', 'General', 'admin'], ['embudo', 'Etapas del embudo', 'admin'], ['usuarios', 'Usuarios', 'admin'], ['auditoria', 'Actividad', 'admin'], ['cuenta', 'Mi cuenta', 'agent']];
  APP.view('configuracion', {
    title: 'Configuración',
    async render(el, args) {
      this.el = el;
      const tabs = TABS.filter((t) => APP.can(t[2]));
      this.tab = tabs.some((t) => t[0] === args[0]) ? args[0] : tabs[0][0];
      el.innerHTML = String(html`<div class="page" style="max-width:980px">
        <header class="page-head"><div><h1>Configuración</h1><p class="lede">Conexión con WhatsApp, equipo y preferencias.</p></div><span class="muted small">WA Power v${(APP.meta.settings || {}).version || '2'}</span></header>
        <div class="tabs" role="tablist">${tabs.map((t) => html`<button type="button" role="tab" data-act="cf-tab" data-t="${t[0]}" aria-selected="${this.tab === t[0]}">${t[1]}</button>`)}</div>
        <div id="cfBody"><div class="loading"><div class="spinner"></div></div></div>
      </div>`);
      await this.paint();
    },
    async paint() {
      const box = document.getElementById('cfBody');
      history.replaceState(null, '', '#/configuracion/' + this.tab);
      if (this.tab === 'conexion') {
        const s = await APP.api('settings');
        APP.meta.settings = s;
        const h = s.health, tr = h.triggers || {};
        box.innerHTML = String(html`<div class="stack" style="gap:18px">
          <section class="panel"><div class="panel-head"><h2>TextMeBot</h2>${s.secrets.TEXTMEBOT_API_KEY ? html`<span class="pill ok">${icon('check', 'sm')}API key guardada</span>` : html`<span class="pill alert">Falta la API key</span>`}</div><div class="panel-body stack">
            <p class="soft small">La API key queda guardada en las propiedades de Apps Script y nunca vuelve al navegador.</p>
            <form class="row" data-submit="cf-key"><input class="input" type="password" name="v" placeholder="${s.secrets.TEXTMEBOT_API_KEY ? 'Escribe una nueva para reemplazarla' : 'Pega tu API key de TextMeBot'}" autocomplete="off" aria-label="API key de TextMeBot"><button class="btn btn-primary" type="submit">Guardar</button></form>
            <form class="row" data-submit="cf-test"><input class="input" name="phone" placeholder="Número para la prueba (tu celular)" value="${APP.state.user.phone || ''}" inputmode="tel" aria-label="Número de prueba"><button class="btn" type="submit">${icon('send', 'sm')}Enviar mensaje de prueba</button></form>
          </div></section>
          <section class="panel"><div class="panel-head"><h2>Tu número y los avisos</h2>${s.settings.NOTIFY_GROUP.value ? html`<span class="pill ok">${icon('group', 'sm')}Avisos al grupo</span>` : ''}</div><div class="panel-body stack">
            <p class="soft small">WhatsApp no te muestra lo que tu propio número se envía a sí mismo. Si el número del bot es tu número personal, crea un grupo en WhatsApp (por ejemplo "WA Power · Avisos", solo contigo o con tu equipo), agrégalo en <a href="#/grupos">Grupos</a> y elígelo aquí: ahí te llegarán los avisos de "pide asesor", los recordatorios de tareas y el resumen diario.</p>
            <form class="stack" data-submit="cf-own" style="gap:12px">
              <div class="fields">
                <label class="field"><span>Número conectado a TextMeBot</span><input class="input" name="BOT_NUMBER" value="${s.settings.BOT_NUMBER.value}" placeholder="51943206279" inputmode="tel"><span class="hint">Se detecta solo con el primer mensaje que llegue. Nunca se le envían mensajes.</span></label>
                <label class="field"><span>Grupo de avisos</span><select class="select" name="NOTIFY_GROUP"><option value="">Ninguno: avisar al celular de cada usuario</option>${(s.groups || []).map((g) => html`<option value="${g.group_id}" ${s.settings.NOTIFY_GROUP.value === g.group_id ? 'selected' : ''}>${g.name || g.group_id}</option>`)}</select><span class="hint">${(s.groups || []).length ? 'En ese grupo también puedes escribir comandos como /hoy o /p.' : 'Primero agrega el grupo en la sección Grupos.'}</span></label>
              </div>
              <div><button class="btn btn-primary" type="submit">Guardar</button></div>
            </form>
          </div></section>
          <section class="panel"><div class="panel-head"><h2>Mensajes entrantes</h2>${h.webhook_secret ? html`<span class="pill ok">${icon('shield', 'sm')}Protegido con clave</span>` : html`<span class="pill lamp">Sin clave</span>`}</div><div class="panel-body stack">
            <p class="soft small">Para que los mensajes de tus clientes lleguen a la bandeja, TextMeBot debe avisar a esta dirección. Incluye una clave: sin ella nadie puede inyectar mensajes falsos.</p>
            ${s.webhook_url ? html`<div class="copy-field"><input class="input" readonly value="${s.webhook_url}" id="whUrl" aria-label="URL del webhook"><button class="btn" type="button" data-act="cf-copy">${icon('copy', 'sm')}Copiar</button></div>` : html`<div class="callout lamp">${icon('alert', 'sm')}<span>Publica la aplicación web en Apps Script para obtener la dirección.</span></div>`}
            <ol class="soft small" style="margin:0;padding-left:18px;line-height:1.8">
              <li>Abre <a href="${s.textmebot_webhook_setup}" target="_blank" rel="noopener">api.textmebot.com/webhook.php</a> e inicia sesión con tu API key.</li>
              <li>Pega la dirección de arriba como Webhook URL y guarda.</li>
              <li>Escríbele a tu número desde otro celular: el mensaje debe aparecer en la Bandeja en menos de 20 segundos.</li>
            </ol>
            <div><button class="btn btn-ghost btn-sm" type="button" data-act="cf-rotate">${icon('refresh', 'sm')}Generar una clave nueva</button></div>
          </div></section>
          <section class="panel"><div class="panel-head"><h2>Envíos automáticos</h2>${tr.installed ? html`<span class="pill ${tr.healthy === false ? 'lamp' : 'ok'}">${tr.healthy === false ? 'Sin actividad reciente' : 'Activo'}</span>` : html`<span class="pill alert">Apagado</span>`}</div><div class="panel-body stack">
            <p class="soft small">Revisa cada minuto si hay programados, campañas o recordatorios por enviar. Solo trabaja cuando hay algo pendiente, así cuida tu cuota diaria de Google.</p>
            <dl class="kv" style="grid-template-columns:170px 1fr"><dt>Última revisión</dt><dd>${tr.last_tick_at ? F.when(tr.last_tick_at) + ' (' + F.ago(tr.last_tick_at) + ')' : 'Nunca'}</dd><dt>Próxima revisión con trabajo</dt><dd>${tr.next_wake_at ? F.when(tr.next_wake_at) : '—'}</dd><dt>Mensajes en cola</dt><dd>${h.queue_pending}</dd><dt>Fallidos hoy</dt><dd>${h.failed_today}</dd></dl>
            <div class="row wrap"><button class="btn" type="button" data-act="cf-trig">${tr.installed ? 'Reinstalar' : 'Activar envíos automáticos'}</button><button class="btn btn-ghost" type="button" data-act="cf-tick">${icon('play', 'sm')}Revisar ahora</button></div>
          </div></section>
          <section class="panel"><div class="panel-head"><h2>Clave maestra</h2></div><div class="panel-body stack">
            <p class="soft small">Entra siempre como administrador. Guárdala en un lugar seguro y úsala solo para emergencias; cada persona debería tener su propio usuario.</p>
            <form class="row" data-submit="cf-master"><input class="input" type="password" name="v" placeholder="Nueva clave maestra (mínimo 10 caracteres)" autocomplete="new-password" aria-label="Nueva clave maestra"><button class="btn" type="submit">Cambiar</button></form>
          </div></section>
        </div>`);
      } else if (this.tab === 'general') {
        const s = await APP.api('settings');
        const f = (k, label, type, hint, extra) => html`<label class="field"><span>${label}</span><input class="input" name="${k}" type="${type || 'text'}" value="${s.settings[k].value}" ${extra || ''}>${hint ? html`<span class="hint">${hint}</span>` : ''}</label>`;
        box.innerHTML = String(html`<form class="panel" data-submit="cf-general"><div class="panel-body stack" style="padding-top:16px">
          <div class="fields">${f('PORTAL_SUBTITLE', 'Nombre bajo el logo del portal', 'text', 'Ej. WhatsApp Corporativo')}${f('COMPANY_NAME', 'Empresa en los mensajes', 'text', 'Lo que ven tus clientes con {{company_name}}.')}${f('CURRENCY', 'Moneda', 'text', 'Ej. S/ o US$')}</div>
          <div class="fields">${f('DEFAULT_TIMEZONE', 'Zona horaria', 'text', 'America/Lima')}${f('DEFAULT_COUNTRY_CODE', 'Código de país', 'text', 'Se agrega a números de 9 dígitos.')}</div>
          <div class="fields">${f('RATE_LIMIT_SECONDS', 'Pausa entre mensajes (s)', 'number', 'TextMeBot recomienda 5 o más.', 'min="5"')}${f('CAMPAIGN_DELAY_SECONDS', 'Pausa entre mensajes de campaña (s)', 'number', 'Más pausa = menos riesgo de bloqueo. Recomendado: 8 o más.')}</div>
          <div class="fields"><label class="field"><span>Resumen diario por WhatsApp</span><select class="select" name="DIGEST_ENABLED"><option value="true" ${s.settings.DIGEST_ENABLED.value === 'true' ? 'selected' : ''}>Enviar a los administradores</option><option value="false" ${s.settings.DIGEST_ENABLED.value !== 'true' ? 'selected' : ''}>No enviar</option></select></label>${f('DIGEST_HOUR', 'Hora del resumen (0 a 23)', 'number', '', 'min="0" max="23"')}</div>
        </div><div class="modal-foot"><button class="btn btn-primary" type="submit">Guardar cambios</button></div></form>`);
      } else if (this.tab === 'embudo') {
        const s = await APP.api('settings');
        this.stages = s.stages.slice();
        this.won = s.settings.WON_STAGE.value; this.lost = s.settings.LOST_STAGE.value;
        this.paintStages();
      } else if (this.tab === 'usuarios') {
        const r = await APP.api('users');
        this.users = r.data;
        box.innerHTML = String(html`<div class="stack">
          <div class="spread"><p class="soft small" style="max-width:62ch">Cada persona entra con su propio usuario. El teléfono permite usar comandos por WhatsApp y recibir recordatorios y avisos.</p><button class="btn btn-primary" type="button" data-act="us-new">${icon('plus')}Nuevo usuario</button></div>
          <section class="panel"><div class="table-wrap"><table class="table"><thead><tr><th>Usuario</th><th>Rol</th><th>Teléfono para comandos</th><th>Último ingreso</th><th class="actions"></th></tr></thead><tbody>
            ${r.data.length ? r.data.map((u) => html`<tr><td><div class="row">${APP.avatar(u.name, 'sm')}<div><div class="cell-main">${u.name}${u.active === 'false' ? html` <span class="pill">Inactivo</span>` : ''}</div><div class="cell-sub">${u.email || ''}</div></div></div></td>
              <td>${APP.labels.role[u.role] || u.role}</td><td class="soft">${u.phone ? F.phone(u.phone) : '—'}</td><td class="soft">${u.last_login_at ? F.ago(u.last_login_at) : 'Nunca'}</td>
              <td class="actions"><button class="icon-btn sm" type="button" data-act="us-edit" data-id="${u.user_id}" aria-label="Editar">${icon('edit', 'sm')}</button><button class="icon-btn sm danger" type="button" data-act="us-del" data-id="${u.user_id}" aria-label="Eliminar">${icon('trash', 'sm')}</button></td></tr>`)
              : html`<tr><td colspan="5"><div class="empty"><p>Aún no hay usuarios. Mientras tanto se entra con la clave maestra.</p></div></td></tr>`}
          </tbody></table></div></section>
          <div class="callout"><span><strong>Roles.</strong> Asesor: bandeja, contactos, oportunidades, tareas y programados. Supervisor: además campañas, reglas, plantillas y analítica. Administrador: todo, incluida esta configuración.</span></div>
        </div>`);
      } else if (this.tab === 'auditoria') {
        box.innerHTML = String(html`<div class="stack"><div class="toolbar"><div class="search">${icon('search')}<input class="input" type="search" placeholder="Buscar por usuario, acción o dato" data-input="au-q" aria-label="Buscar actividad"></div></div><section class="panel"><div class="table-wrap" id="auTable"></div></section></div>`);
        this.loadAudit('');
      } else {
        const u = APP.state.user;
        box.innerHTML = String(html`<div class="stack" style="gap:18px">
          <section class="panel"><div class="panel-head"><h2>Tu sesión</h2></div><div class="panel-body"><dl class="kv" style="grid-template-columns:140px 1fr"><dt>Usuario</dt><dd>${u.name}</dd><dt>Rol</dt><dd>${APP.labels.role[u.role] || u.role}</dd><dt>Servidor</dt><dd class="small" style="overflow-wrap:anywhere">${APP.state.demo ? 'Demo en este navegador' : APP.state.url}</dd></dl></div></section>
          ${u.user_id !== 'MASTER' && !APP.state.demo ? html`<section class="panel"><div class="panel-head"><h2>Cambiar mi contraseña</h2></div><div class="panel-body">
            <form class="fields" data-submit="cf-pass"><label class="field"><span>Contraseña actual</span><input class="input" type="password" name="current" required autocomplete="current-password"></label><label class="field"><span>Nueva contraseña</span><input class="input" type="password" name="next" minlength="6" required autocomplete="new-password"></label><div class="field" style="justify-content:flex-end"><button class="btn btn-primary" type="submit">Cambiar</button></div></form>
          </div></section>` : u.user_id === 'MASTER' && !APP.state.demo ? html`<div class="callout lamp">${icon('alert', 'sm')}<span>Entraste con la clave maestra. <a href="#" data-act="cf-first-admin">Crea tu usuario de administrador</a> para entrar con tu nombre y contraseña.</span></div>` : ''}
          <section class="panel"><div class="panel-head"><h2>Apariencia</h2></div><div class="panel-body"><div class="seg" role="group" aria-label="Tema">${[['', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map((o) => html`<button type="button" data-act="cf-theme" data-v="${o[0]}" aria-pressed="${APP.getTheme() === o[0] ? 'true' : 'false'}">${o[1]}</button>`)}</div><p class="hint" style="margin-top:8px">Automático sigue el modo claro u oscuro de tu iPhone o computadora.</p></div></section>
          <section class="panel"><div class="panel-head"><h2>Avisos en este dispositivo</h2></div><div class="panel-body stack">
            <div class="setting" style="padding:0"><div><h3>Sonido al llegar un mensaje</h3><p class="desc">Un tono corto cuando escribe un cliente.</p></div><label class="switch"><input type="checkbox" data-change="cf-sound" ${APP.soundOn() ? 'checked' : ''}><span class="track"></span><span class="sr">Sonido</span></label></div>
            <div class="setting" style="padding:0;border:0"><div><h3>Notificaciones</h3><p class="desc">Aviso del sistema cuando llega un mensaje y el portal está en otra pestaña.</p></div><button class="btn" type="button" data-act="cf-notif">${window.Notification && Notification.permission === 'granted' ? 'Activadas' : 'Activar'}</button></div>
          </div></section>
          <section class="panel"><div class="panel-head"><h2>Usar como app en el iPhone</h2></div><div class="panel-body"><p class="soft small">Abre el portal en Safari › botón Compartir › <strong>Agregar a inicio</strong>. Se abrirá a pantalla completa, como una app. En Android: menú ⋮ › <strong>Agregar a la pantalla principal</strong>.</p></div></section>
        </div>`);
      }
    },
    paintStages() {
      const box = document.getElementById('cfBody');
      box.innerHTML = String(html`<form class="panel" data-submit="st-save"><div class="panel-body stack" style="padding-top:16px">
        <p class="soft small">El orden es el recorrido de una venta. Si cambias el nombre de una etapa, las oportunidades que estaban en ella no se mueven solas.</p>
        <div class="list" style="border:1px solid var(--line);border-radius:8px">${this.stages.map((s, i) => html`<div class="list-row"><span class="prio" style="width:26px;height:26px;border-radius:50%;background:var(--sunk);display:grid;place-items:center;font-size:12px;font-weight:700">${i + 1}</span>
          <input class="input sm grow" value="${s}" data-input="st-name" data-i="${i}" aria-label="${'Etapa ' + (i + 1)}">
          ${s === this.won ? html`<span class="pill ok">Ganada</span>` : s === this.lost ? html`<span class="pill">Perdida</span>` : ''}
          <button class="icon-btn sm" type="button" data-act="st-move" data-i="${i}" data-d="-1" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>${icon('left', 'sm')}</button>
          <button class="icon-btn sm" type="button" data-act="st-move" data-i="${i}" data-d="1" aria-label="Bajar" ${i === this.stages.length - 1 ? 'disabled' : ''}>${icon('right', 'sm')}</button>
          <button class="icon-btn sm danger" type="button" data-act="st-del" data-i="${i}" aria-label="Quitar">${icon('x', 'sm')}</button></div>`)}</div>
        <div class="row"><input class="input sm" id="stNew" placeholder="Nueva etapa" style="max-width:240px" aria-label="Nueva etapa"><button class="btn btn-sm" type="button" data-act="st-add">${icon('plus', 'sm')}Agregar</button></div>
        <div class="fields"><label class="field"><span>Etapa que cuenta como venta ganada</span><select class="select" name="won">${this.stages.map((s) => html`<option ${s === this.won ? 'selected' : ''}>${s}</option>`)}</select></label>
          <label class="field"><span>Etapa que cuenta como perdida</span><select class="select" name="lost">${this.stages.map((s) => html`<option ${s === this.lost ? 'selected' : ''}>${s}</option>`)}</select></label></div>
      </div><div class="modal-foot"><button class="btn btn-primary" type="submit">Guardar etapas</button></div></form>`);
    },
    async loadAudit(q) {
      const r = await APP.try('audit', { q, limit: 300 });
      const box = document.getElementById('auTable');
      if (!r || !box) return;
      box.innerHTML = String(html`<table class="table"><thead><tr><th>Cuándo</th><th>Quién</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>
        ${r.data.slice(0, 200).map((a) => html`<tr><td class="nowrap soft small">${F.dt(a.timestamp)}</td><td class="nowrap">${a.actor}</td><td><code>${a.action}</code></td><td class="small soft" style="max-width:420px;overflow-wrap:anywhere">${[a.entity_id, a.details_json].filter(Boolean).join(' · ').slice(0, 220)}</td></tr>`)}
      </tbody></table>`);
    },
    editUser(u) {
      u = u || { role: 'agent', active: 'true' };
      const isNew = !u.user_id;
      APP.modal({
        title: isNew ? 'Nuevo usuario' : 'Editar usuario',
        body: html`<form id="usForm" data-submit="us-save" class="stack">
          <label class="field"><span>Nombre</span><input class="input" name="name" value="${u.name || ''}" required autofocus placeholder="Ana Ruiz"><span class="hint">Con este nombre inicia sesión.</span></label>
          <div class="fields"><label class="field"><span>Correo (opcional)</span><input class="input" type="email" name="email" value="${u.email || ''}"></label>
            <label class="field"><span>Rol</span><select class="select" name="role">${['agent', 'supervisor', 'admin'].map((r) => html`<option value="${r}" ${u.role === r ? 'selected' : ''}>${APP.labels.role[r]}</option>`)}</select></label></div>
          <label class="field"><span>Celular para comandos y recordatorios</span><input class="input" name="phone" value="${u.phone || ''}" inputmode="tel" placeholder="943 206 279"><span class="hint">Desde este número podrá escribir /p, /r, /tarea… al WhatsApp conectado.</span></label>
          <label class="field"><span>${isNew ? 'Contraseña' : 'Nueva contraseña (vacío = no cambiar)'}</span><input class="input" type="password" name="password" autocomplete="new-password" ${isNew ? 'required minlength="6"' : ''}></label>
          <label class="check"><input type="checkbox" name="active" ${u.active !== 'false' ? 'checked' : ''}>Puede ingresar</label>
        </form>`,
        foot: html`<button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn btn-primary" type="submit" form="usForm">${isNew ? 'Crear usuario' : 'Guardar'}</button>`,
        on: {
          'us-save': async (form) => {
            const v = APP.formData(form);
            if (!isNew) v.user_id = u.user_id;
            if (!v.password) delete v.password;
            if (await APP.try('saveUser', v, isNew ? 'Usuario creado.' : 'Usuario guardado.')) { form.closest('.overlay')._close(); await APP.loadMeta(); APP.views.configuracion.paint(); }
          }
        }
      });
    },
    on: {
      'cf-tab'(el) { this.tab = el.dataset.t; APP.$$('[data-act="cf-tab"]').forEach((b) => b.setAttribute('aria-selected', b === el)); this.paint(); },
      async 'cf-key'(form) { const v = form.v.value.trim(); if (!v) return; if (await APP.try('saveSecret', { key: 'TEXTMEBOT_API_KEY', value: v }, 'API key guardada.')) this.paint(); },
      async 'cf-master'(form) {
        const v = form.v.value.trim();
        if (!v) return;
        if (!(await APP.confirm('La clave maestra anterior dejará de funcionar. Las sesiones abiertas siguen activas.', { ok: 'Cambiar clave' }))) return;
        if (await APP.try('saveSecret', { key: 'APP_SECRET_TOKEN', value: v }, 'Clave maestra cambiada.')) form.v.value = '';
      },
      async 'cf-test'(form) { const b = form.querySelector('button'); b.disabled = true; await APP.try('testTextMeBot', { phone: form.phone.value }, (r) => r.message); b.disabled = false; },
      'cf-copy'() { const i = document.getElementById('whUrl'); i.select(); (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).then(() => APP.toast('Dirección copiada.'), () => { document.execCommand('copy'); APP.toast('Dirección copiada.'); }); },
      async 'cf-rotate'() {
        if (!(await APP.confirm('La dirección actual dejará de funcionar. Tendrás que pegar la nueva en TextMeBot.', { ok: 'Generar clave nueva', danger: true }))) return;
        if (await APP.try('rotateWebhookKey', {}, 'Clave nueva generada. Actualízala en TextMeBot.')) this.paint();
      },
      async 'cf-trig'() { if (await APP.try('installTriggers', {}, (r) => r.message)) this.paint(); },
      async 'cf-tick'(el) { el.disabled = true; const r = await APP.try('runTick', {}); el.disabled = false; if (r) { const x = r.report || {}; APP.toast(x.skipped ? 'Nada pendiente por ahora.' : `Revisión lista: ${x.sent || 0} enviados, ${x.schedules || 0} programados, ${x.reminders || 0} recordatorios.`); this.paint(); } },
      async 'cf-general'(form) { if (await APP.try('saveSettings', { values: APP.formData(form) }, 'Cambios guardados.')) APP.loadMeta(); },
      async 'cf-pass'(form) { if (await APP.try('changePassword', { current: form.current.value, next: form.next.value }, 'Contraseña cambiada.')) form.reset(); },
      'cf-first-admin'() { APP.firstAdmin(); },
      'cf-theme'(el) { APP.setTheme(el.dataset.v); APP.$$('[data-act="cf-theme"]').forEach((b) => b.setAttribute('aria-pressed', b === el ? 'true' : 'false')); },
      'cf-sound'(el) { try { localStorage.setItem('wap_sound', el.checked ? 'on' : 'off'); } catch (e) {} if (el.checked) APP.chime(); },
      async 'cf-own'(form) {
        const v = { BOT_NUMBER: form.BOT_NUMBER.value.replace(/\D/g, ''), NOTIFY_GROUP: form.NOTIFY_GROUP.value };
        if (v.BOT_NUMBER.length === 9) v.BOT_NUMBER = '51' + v.BOT_NUMBER;
        if (await APP.try('saveSettings', { values: v }, v.NOTIFY_GROUP ? 'Listo: los avisos llegarán al grupo.' : 'Guardado.')) { await APP.loadMeta(); this.paint(); }
      },
      'cf-notif'(el) {
        if (!window.Notification) return APP.toast('Este navegador no permite avisos.', 'error');
        Notification.requestPermission().then((p) => { el.textContent = p === 'granted' ? 'Avisos activados' : 'Activar avisos'; APP.toast(p === 'granted' ? 'Avisos activados.' : 'El navegador bloqueó los avisos. Actívalos en la configuración del sitio.', p === 'granted' ? '' : 'error'); });
      },
      'st-name'(el) { const old = this.stages[+el.dataset.i]; this.stages[+el.dataset.i] = el.value; if (this.won === old) this.won = el.value; if (this.lost === old) this.lost = el.value; },
      'st-move'(el) { const i = +el.dataset.i, j = i + +el.dataset.d; [this.stages[i], this.stages[j]] = [this.stages[j], this.stages[i]]; this.paintStages(); },
      'st-del'(el) { if (this.stages.length <= 2) return APP.toast('El embudo necesita al menos 2 etapas.', 'error'); this.stages.splice(+el.dataset.i, 1); this.paintStages(); },
      'st-add'() { const i = document.getElementById('stNew'); const v = i.value.trim(); if (!v) return; if (this.stages.includes(v)) return APP.toast('Esa etapa ya existe.', 'error'); const at = this.stages.indexOf(this.won); this.stages.splice(at > -1 ? at : this.stages.length, 0, v); this.paintStages(); },
      async 'st-save'(form) {
        const stages = this.stages.map((s) => s.trim()).filter(Boolean);
        if (await APP.try('saveSettings', { values: { PIPELINE_STAGES: JSON.stringify(stages), WON_STAGE: form.won.value, LOST_STAGE: form.lost.value } }, 'Etapas guardadas.')) { await APP.loadMeta(); this.paint(); }
      },
      'us-new'() { this.editUser(); },
      'us-edit'(el) { this.editUser(this.users.find((u) => u.user_id === el.dataset.id)); },
      async 'us-del'(el) {
        const u = this.users.find((x) => x.user_id === el.dataset.id);
        if (!(await APP.confirm('¿Eliminar a ' + u.name + '? Ya no podrá ingresar ni usar comandos.', { danger: true, ok: 'Eliminar usuario' }))) return;
        if (await APP.try('deleteUser', { user_id: u.user_id }, 'Usuario eliminado.')) { await APP.loadMeta(); this.paint(); }
      },
      'au-q': APP.debounce(function (el) { APP.views.configuracion.loadAudit(el.value.trim()); }, 300)
    }
  });
})();
