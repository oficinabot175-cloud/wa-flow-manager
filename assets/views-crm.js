/* WA POWER v2 — CRM: Contactos, Oportunidades (embudo) y Tareas */
(function () {
  'use strict';
  const { html, icon, fmt: F } = APP;
  const userOptions = (sel, blank) => html`${blank !== false ? html`<option value="">${blank || 'Sin asignar'}</option>` : ''}${APP.meta.users.map((u) => html`<option value="${u.name}" ${u.name === sel ? 'selected' : ''}>${u.name}</option>`)}${sel && !APP.meta.users.some((u) => u.name === sel) ? html`<option selected>${sel}</option>` : ''}`;
  APP.userOptions = userOptions;

  function download(name, text, type) {
    const blob = new Blob(['\ufeff' + text], { type: type || 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  APP.download = download;

  // ══ Contactos ═════════════════════════════════════════════════════════
  APP.view('contactos', {
    title: 'Contactos',
    q: '', tag: '', status: '', sel: new Set(), data: [], total: 0, tags: {},
    async render(el) {
      this.el = el;
      this.sel = new Set();
      el.innerHTML = String(html`<div class="page">
        <header class="page-head">
          <div><h1>Contactos</h1><p class="lede" id="ctLede">Tu base de clientes y prospectos.</p></div>
          <div class="row wrap">
            ${APP.can('supervisor') ? html`<button class="btn" type="button" data-act="ct-import">${icon('upload')}Importar CSV</button><button class="btn" type="button" data-act="ct-export">${icon('download')}Exportar</button>` : ''}
            <button class="btn btn-primary" type="button" data-act="ct-new">${icon('plus')}Nuevo contacto</button>
          </div>
        </header>
        <div class="toolbar">
          <div class="search">${icon('search')}<input class="input" type="search" placeholder="Nombre, número, empresa, correo…" value="${this.q}" data-input="ct-q" aria-label="Buscar contactos"></div>
          <select class="select" data-change="ct-tag" id="ctTag" aria-label="Filtrar por etiqueta"><option value="">Todas las etiquetas</option></select>
          <select class="select" data-change="ct-status" aria-label="Filtrar por estado">
            ${[['', 'Todos'], ['active', 'Activos'], ['inactive', 'Inactivos'], ['nobot', 'Sin bot'], ['dnc', 'No contactar']].map((o) => html`<option value="${o[0]}" ${this.status === o[0] ? 'selected' : ''}>${o[1]}</option>`)}
          </select>
        </div>
        <div id="ctBulk"></div>
        <section class="panel"><div class="table-wrap" id="ctTable"><div class="loading"><div class="spinner"></div></div></div></section>
      </div>`);
      await this.load();
    },
    async load() {
      const r = await APP.api('contacts', { q: this.q, tag: this.tag, status: this.status, limit: 400 });
      this.data = r.data; this.total = r.total; this.tags = r.tags;
      const tagSel = document.getElementById('ctTag');
      if (tagSel) tagSel.innerHTML = String(html`<option value="">Todas las etiquetas</option>${Object.keys(r.tags).sort().map((t) => html`<option value="${t}" ${this.tag === t ? 'selected' : ''}>${t} (${r.tags[t]})</option>`)}`);
      const lede = document.getElementById('ctLede');
      if (lede) lede.textContent = F.plural(r.total, 'contacto', 'contactos') + (this.q || this.tag || this.status ? ' con este filtro' : '') + ' · ' + F.plural(Object.keys(r.tags).length, 'etiqueta', 'etiquetas');
      this.paint();
    },
    paint() {
      const box = document.getElementById('ctTable');
      if (!box) return;
      if (!this.data.length) {
        box.innerHTML = String(html`<div class="empty">${icon('users')}<strong>${this.q || this.tag || this.status ? 'Nadie coincide con el filtro' : 'Aún no hay contactos'}</strong><p>${this.q || this.tag || this.status ? 'Cambia la búsqueda o la etiqueta.' : 'Se crean solos cuando alguien te escribe. También puedes importarlos desde un CSV.'}</p></div>`);
        this.paintBulk();
        return;
      }
      const all = this.data.every((c) => this.sel.has(c.contact_id));
      box.innerHTML = String(html`<table class="table">
        <thead><tr>
          <th style="width:36px"><input type="checkbox" class="check" data-change="ct-all" ${all ? 'checked' : ''} aria-label="Seleccionar todos"></th>
          <th>Contacto</th><th>Etiquetas</th><th>Oportunidad</th><th>Responsable</th><th>Última actividad</th><th class="actions"><span class="sr">Acciones</span></th>
        </tr></thead>
        <tbody>${this.data.map((c) => {
          const name = c.display_name || c.whatsapp_name || F.phone(c.phone);
          const tags = String(c.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
          return html`<tr class="clickable ${this.sel.has(c.contact_id) ? 'is-selected' : ''}" data-act="ct-open" data-phone="${c.phone}">
            <td data-stop="1"><input type="checkbox" data-change="ct-sel" data-id="${c.contact_id}" ${this.sel.has(c.contact_id) ? 'checked' : ''} aria-label="${'Seleccionar ' + name}" style="width:16px;height:16px;accent-color:var(--petrol)"></td>
            <td><div class="row">${APP.avatar(name, 'sm')}<div style="min-width:0"><div class="cell-main ellipsis">${name}${c.do_not_contact === 'true' ? html` <span class="pill alert">No contactar</span>` : ''}${c.bot === 'off' ? html` <span class="pill" title="El bot no responde a este contacto">Sin bot</span>` : ''}</div><div class="cell-sub">${F.phone(c.phone)}${c.company ? ' · ' + c.company : ''}</div></div></div></td>
            <td><div class="tags">${tags.slice(0, 3).map((t) => html`<span class="tag">${t}</span>`)}${tags.length > 3 ? html`<span class="muted small">+${tags.length - 3}</span>` : ''}</div></td>
            <td>${c.stage ? html`<span class="pill petrol">${c.stage}</span>` : html`<span class="muted">—</span>`}</td>
            <td class="soft">${c.owner || '—'}</td>
            <td class="soft nowrap">${F.ago(c.last_seen_at || c.created_at)}</td>
            <td class="actions" data-stop="1">
              <button class="icon-btn sm" type="button" data-act="open-chat" data-phone="${c.phone}" title="Abrir chat" aria-label="Abrir chat">${icon('inbox', 'sm')}</button>
              <button class="icon-btn sm" type="button" data-act="ct-edit" data-id="${c.contact_id}" title="Editar" aria-label="Editar">${icon('edit', 'sm')}</button>
            </td></tr>`;
        })}</tbody></table>
        ${this.total > this.data.length ? html`<p class="small muted" style="padding:10px 12px">Mostrando ${this.data.length} de ${this.total}. Usa la búsqueda o las etiquetas para acotar.</p>` : ''}`);
      this.paintBulk();
    },
    paintBulk() {
      const b = document.getElementById('ctBulk');
      if (!b) return;
      const n = this.sel.size;
      b.innerHTML = n ? String(html`<div class="bulkbar"><span>${F.plural(n, 'seleccionado', 'seleccionados')}</span>
        <button class="btn btn-sm" type="button" data-act="ct-bulk-msg">${icon('send', 'sm')}Enviar mensaje</button>
        ${APP.can('supervisor') ? html`<button class="btn btn-sm" type="button" data-act="ct-bulk" data-op="add_tag">${icon('tag', 'sm')}Agregar etiqueta</button>
        <button class="btn btn-sm" type="button" data-act="ct-bulk" data-op="remove_tag">Quitar etiqueta</button>
        <button class="btn btn-sm" type="button" data-act="ct-bulk" data-op="owner">${icon('assign', 'sm')}Asignar</button>
        <button class="btn btn-sm" type="button" data-act="ct-bulk" data-op="bot" data-v="off">${icon('bot', 'sm')}Sin bot</button>
        <button class="btn btn-sm" type="button" data-act="ct-bulk" data-op="bot" data-v="">Bot normal</button>
        <button class="btn btn-sm btn-danger" type="button" data-act="ct-bulk" data-op="dnc">No contactar</button>` : ''}
        <button class="btn btn-ghost btn-sm" type="button" data-act="ct-clear" style="margin-left:auto">Quitar selección</button></div>`) : '';
    },

    /** Crear o editar contacto. onSaved se llama al guardar. */
    edit(c, onSaved) {
      c = c || {};
      const isNew = !c.contact_id;
      APP.modal({
        title: isNew ? 'Nuevo contacto' : 'Editar contacto', size: 'lg',
        body: html`<form id="ctForm" data-submit="ct-save" class="stack">
          <div class="fields">
            <label class="field"><span>Teléfono</span><input class="input" name="phone" value="${c.phone || ''}" ${isNew ? 'required' : 'disabled'} placeholder="999 888 777" inputmode="tel"><span class="hint">${isNew ? 'Con 9 dígitos se agrega el 51 de Perú.' : 'El número no se puede cambiar.'}</span></label>
            <label class="field"><span>Nombre</span><input class="input" name="display_name" value="${c.display_name || c.whatsapp_name || ''}" placeholder="Cómo lo llamas tú" autofocus></label>
          </div>
          <div class="fields">
            <label class="field"><span>Empresa</span><input class="input" name="company" value="${c.company || ''}"></label>
            <label class="field"><span>Correo</span><input class="input" name="email" type="email" value="${c.email || ''}"></label>
            <label class="field"><span>Ciudad o distrito</span><input class="input" name="city" value="${c.city || ''}"></label>
          </div>
          <div class="fields">
            <label class="field"><span>Etiquetas</span><input class="input" name="tags" value="${c.tags || ''}" placeholder="cliente, fibra, vip"><span class="hint">Separadas por coma. Sirven para filtrar y armar campañas.</span></label>
            <label class="field"><span>Responsable</span><select class="select" name="owner">${userOptions(c.owner)}</select></label>
            <label class="field"><span>Estado</span><select class="select" name="status"><option value="active" ${c.status !== 'inactive' ? 'selected' : ''}>Activo</option><option value="inactive" ${c.status === 'inactive' ? 'selected' : ''}>Inactivo</option></select></label>
            <label class="field"><span>Respuestas automáticas</span><select class="select" name="bot">${[['', 'Automático (regla general)'], ['on', 'Siempre responder'], ['off', 'Nunca responder']].map((o) => html`<option value="${o[0]}" ${(c.bot || '') === o[0] ? 'selected' : ''}>${o[1]}</option>`)}</select></label>
          </div>
          <div class="fields">
            <label class="field"><span>Campo libre 1 <span class="muted">({{custom_1}})</span></span><input class="input" name="custom_1" value="${c.custom_1 || ''}" placeholder="Ej. plan actual"></label>
            <label class="field"><span>Campo libre 2 <span class="muted">({{custom_2}})</span></span><input class="input" name="custom_2" value="${c.custom_2 || ''}" placeholder="Ej. fecha de renovación"></label>
          </div>
          <label class="field"><span>Observaciones</span><textarea class="textarea" name="notes" rows="2">${c.notes || ''}</textarea></label>
          <label class="check"><input type="checkbox" name="do_not_contact" ${c.do_not_contact === 'true' ? 'checked' : ''}>No contactar (no recibe campañas ni respuestas automáticas)</label>
        </form>`,
        foot: html`${!isNew && APP.can('supervisor') ? html`<button class="btn btn-danger left" type="button" data-act="ct-del">${icon('trash', 'sm')}Eliminar</button>` : ''}
          <button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn btn-primary" type="submit" form="ctForm">${isNew ? 'Crear contacto' : 'Guardar cambios'}</button>`,
        on: {
          'ct-save': async (form) => {
            const d = APP.formData(form);
            if (!isNew) { d.contact_id = c.contact_id; delete d.phone; }
            const r = await APP.try('saveContact', d, isNew ? 'Contacto creado.' : 'Cambios guardados.');
            if (!r) return;
            form.closest('.overlay')._close();
            if (onSaved) onSaved(r.data); else if (APP.cur === APP.views.contactos) APP.views.contactos.load();
          },
          'ct-del': async (el) => {
            if (!(await APP.confirm('Se eliminará el contacto. Su historial de mensajes se conserva.', { danger: true, ok: 'Eliminar contacto', title: 'Eliminar contacto' }))) return;
            if (await APP.try('deleteContact', { contact_id: c.contact_id }, 'Contacto eliminado.')) { el.closest('.overlay')._close(); if (APP.cur === APP.views.contactos) APP.views.contactos.load(); }
          }
        }
      });
    },

    on: {
      'ct-q': APP.debounce(function (el) { const v = APP.views.contactos; v.q = el.value.trim(); v.load(); }, 280),
      'ct-tag'(el) { this.tag = el.value; this.load(); },
      'ct-status'(el) { this.status = el.value; this.load(); },
      'ct-open'(el, e) { if (e.target.closest('[data-stop]')) return; APP.openProfile(el.dataset.phone); },
      'ct-new'() { this.edit(); },
      'ct-edit'(el) { this.edit(this.data.find((c) => c.contact_id === el.dataset.id)); },
      'ct-sel'(el) { if (el.checked) this.sel.add(el.dataset.id); else this.sel.delete(el.dataset.id); el.closest('tr').classList.toggle('is-selected', el.checked); this.paintBulk(); },
      'ct-all'(el) { this.data.forEach((c) => (el.checked ? this.sel.add(c.contact_id) : this.sel.delete(c.contact_id))); this.paint(); },
      'ct-clear'() { this.sel.clear(); this.paint(); },
      'ct-bulk-msg'() {
        const phones = this.data.filter((c) => this.sel.has(c.contact_id) && c.do_not_contact !== 'true').map((c) => c.phone);
        APP.acts.compose({ dataset: { to: phones.join(', ') } });
      },
      async 'ct-bulk'(el) {
        const op = el.dataset.op;
        let value = 'true';
        if (op === 'add_tag' || op === 'remove_tag') { value = await APP.prompt(op === 'add_tag' ? 'Agregar etiqueta' : 'Quitar etiqueta', 'Etiqueta', '', { placeholder: 'vip', ok: op === 'add_tag' ? 'Agregar' : 'Quitar' }); if (!value) return; }
        if (op === 'owner') { value = await APP.prompt('Asignar responsable', 'Nombre del usuario', APP.state.user.name, { ok: 'Asignar' }); if (!value) return; }
        if (op === 'bot') value = el.dataset.v;
        if (op === 'dnc' && !(await APP.confirm('Estos contactos dejarán de recibir campañas y respuestas automáticas.', { ok: 'Marcar No contactar', danger: true }))) return;
        const r = await APP.try('bulkContacts', { ids: Array.from(this.sel).join(','), op, value }, (x) => F.plural(x.updated, 'contacto actualizado', 'contactos actualizados') + '.');
        if (r) { this.sel.clear(); this.load(); }
      },
      async 'ct-export'() {
        const r = await APP.try('exportContacts', {});
        if (r) { download(r.filename, r.csv); APP.toast('Archivo ' + r.filename + ' descargado.'); }
      },
      'ct-import'() {
        APP.modal({
          title: 'Importar contactos desde CSV', size: 'lg',
          body: html`<form id="impForm" data-submit="imp-go" class="stack">
            <p class="soft">Sube un archivo CSV exportado de Excel o Google Sheets. Se reconocen columnas como <code>teléfono</code>, <code>nombre</code>, <code>etiquetas</code>, <code>email</code>, <code>empresa</code>, <code>ciudad</code> y <code>notas</code>. Si el número ya existe, se actualiza sin duplicarse.</p>
            <label class="field"><span>Archivo</span><input class="input" type="file" name="file" accept=".csv,text/csv" data-change="imp-file" style="padding-top:6px"></label>
            <label class="field"><span>O pega el contenido</span><textarea class="textarea" name="csv" rows="6" placeholder="telefono;nombre;etiquetas&#10;999888777;Rosa Díaz;fibra, lima"></textarea></label>
            <label class="field"><span>Etiqueta para todos (opcional)</span><input class="input" name="tag" placeholder="feria-octubre"></label>
          </form>`,
          foot: html`<button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn btn-primary" type="submit" form="impForm">${icon('upload', 'sm')}Importar</button>`,
          on: {
            'imp-file': (input) => {
              const f = input.files && input.files[0];
              if (!f) return;
              const rd = new FileReader();
              rd.onload = () => { input.form.csv.value = String(rd.result); };
              rd.readAsText(f, 'UTF-8');
            },
            'imp-go': async (form) => {
              const csv = form.csv.value;
              if (!csv.trim()) return APP.toast('Elige un archivo o pega el contenido.', 'error');
              const r = await APP.try('importContacts', { csv, tag: form.tag.value.trim() });
              if (!r) return;
              APP.toast(`Importación lista: ${r.created} nuevos, ${r.updated} actualizados${r.skipped ? ', ' + r.skipped + ' filas sin número válido' : ''}.`, '', { long: true });
              form.closest('.overlay')._close();
              APP.views.contactos.load();
            }
          }
        });
      }
    }
  });

  // ══ Oportunidades (embudo) ═════════════════════════════════════════════
  APP.view('embudo', {
    title: 'Oportunidades',
    q: '', owner: '', data: [], stages: [],
    async render(el) {
      this.el = el;
      el.innerHTML = String(html`<div class="page" style="max-width:none">
        <header class="page-head">
          <div><h1>Oportunidades</h1><p class="lede" id="dlLede">Arrastra cada tarjeta a la etapa en la que está la venta.</p></div>
          <button class="btn btn-primary" type="button" data-act="dl-new">${icon('plus')}Nueva oportunidad</button>
        </header>
        <div class="toolbar">
          <div class="search">${icon('search')}<input class="input" type="search" placeholder="Título, producto o cliente" value="${this.q}" data-input="dl-q" aria-label="Buscar oportunidades"></div>
          <select class="select" data-change="dl-owner" aria-label="Filtrar por responsable">${userOptions(this.owner, 'Todos los responsables')}</select>
        </div>
        <div class="board" id="board"><div class="loading"><div class="spinner"></div></div></div>
      </div>`);
      await this.load();
    },
    async load() {
      const r = await APP.api('deals', { q: this.q, owner: this.owner });
      this.data = r.data; this.stages = r.stages; this.won = r.won_stage; this.lost = r.lost_stage;
      this.paint();
    },
    paint() {
      const board = document.getElementById('board');
      if (!board) return;
      const open = this.data.filter((d) => d.status === 'open');
      const month = new Date().toISOString().slice(0, 7);
      const wonMonth = this.data.filter((d) => d.status === 'won' && String(d.closed_at).slice(0, 7) === month);
      const lede = document.getElementById('dlLede');
      if (lede) lede.textContent = F.plural(open.length, 'oportunidad abierta', 'oportunidades abiertas') + ' por ' + F.money(open.reduce((s, d) => s + (+d.value || 0), 0)) + ' · ganado este mes: ' + F.money(wonMonth.reduce((s, d) => s + (+d.value || 0), 0));
      board.innerHTML = String(html`${this.stages.map((st) => {
        const ds = this.data.filter((d) => d.stage === st).sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
        const cls = st === this.won ? 'won' : st === this.lost ? 'lost' : '';
        return html`<section class="col ${cls}" data-stage="${st}" aria-label="${st}">
          <div class="col-head"><div class="spread"><strong>${st}</strong><span class="pill">${ds.length}</span></div><span class="muted">${F.money(ds.reduce((s, d) => s + (+d.value || 0), 0))}</span></div>
          <div class="col-body">${ds.length ? ds.map((d) => html`<article class="deal" draggable="true" data-id="${d.deal_id}" data-act="dl-edit" role="button" tabindex="0">
              <strong>${d.title}</strong>
              <div class="row small"><span class="soft ellipsis grow">${d.contact_name}</span><span class="val num">${F.money(d.value)}</span></div>
              ${d.product ? html`<div><span class="tag">${d.product}</span></div>` : ''}
              <div class="foot"><span>${d.owner || 'Sin responsable'}</span><span>${d.expected_close ? 'cierre ' + F.date(d.expected_close) : F.ago(d.updated_at)}</span></div>
            </article>`) : html`<p class="small muted" style="padding:6px 4px">Suelta aquí una tarjeta.</p>`}</div>
        </section>`;
      })}`);
      this.bindDrag(board);
    },
    bindDrag(board) {
      let dragId = null;
      board.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.deal'); if (!card) return;
        dragId = card.dataset.id; card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', dragId); } catch (x) {}
      });
      board.addEventListener('dragend', (e) => { const card = e.target.closest('.deal'); if (card) card.classList.remove('dragging'); APP.$$('.col.drop', board).forEach((c) => c.classList.remove('drop')); });
      board.addEventListener('dragover', (e) => { const col = e.target.closest('.col'); if (!col || !dragId) return; e.preventDefault(); APP.$$('.col.drop', board).forEach((c) => c !== col && c.classList.remove('drop')); col.classList.add('drop'); });
      board.addEventListener('drop', async (e) => {
        const col = e.target.closest('.col'); if (!col || !dragId) return;
        e.preventDefault();
        const d = this.data.find((x) => x.deal_id === dragId);
        const stage = col.dataset.stage;
        dragId = null;
        if (!d || d.stage === stage) return this.paint();
        const before = d.stage;
        d.stage = stage; d.status = stage === this.won ? 'won' : stage === this.lost ? 'lost' : 'open'; d.updated_at = new Date().toISOString();
        if (d.status !== 'open') d.closed_at = d.updated_at;
        this.paint();
        const r = await APP.try('saveDeal', { deal_id: d.deal_id, stage }, stage === this.won ? '¡Venta ganada! ' + d.title : 'Movida a ' + stage + '.');
        if (!r) { d.stage = before; this.paint(); }
      });
    },

    /** d: oportunidad existente, id, o { phone, contact_name } para una nueva */
    async edit(d, onSaved) {
      if (typeof d === 'string') {
        const r = await APP.try('deals', {});
        d = r && r.data.find((x) => x.deal_id === d);
        if (!d) return;
      }
      d = d || {};
      const isNew = !d.deal_id;
      const stages = APP.meta.stages.length ? APP.meta.stages : this.stages;
      APP.modal({
        title: isNew ? 'Nueva oportunidad' : 'Oportunidad', size: 'lg',
        body: html`<form id="dlForm" data-submit="dl-save" class="stack">
          ${isNew ? html`<div class="fields">
            <label class="field"><span>Teléfono del cliente</span><input class="input" name="phone" value="${d.phone || ''}" required placeholder="999 888 777" inputmode="tel"></label>
            <label class="field"><span>Nombre del cliente</span><input class="input" name="contact_name" value="${d.contact_name || ''}" placeholder="Si es nuevo, se crea el contacto"></label>
          </div>` : html`<div class="callout"><span>${icon('users', 'sm')}</span><span><strong>${d.contact_name}</strong> · ${F.phone(d.phone)} · <a href="#" data-act="open-profile" data-phone="${d.phone}">Ver ficha</a></span></div>`}
          <label class="field"><span>Título</span><input class="input" name="title" value="${d.title || ''}" required placeholder="Ej. Portabilidad 2 líneas postpago" autofocus></label>
          <div class="fields">
            <label class="field"><span>Producto o servicio</span><input class="input" name="product" value="${d.product || ''}" placeholder="Fibra 300 Mbps"></label>
            <label class="field"><span>Valor (${APP.meta.currency})</span><input class="input" name="value" value="${d.value || ''}" inputmode="decimal" placeholder="0"></label>
          </div>
          <div class="fields">
            <label class="field"><span>Etapa</span><select class="select" name="stage">${stages.map((s) => html`<option ${s === (d.stage || stages[0]) ? 'selected' : ''}>${s}</option>`)}</select></label>
            <label class="field"><span>Responsable</span><select class="select" name="owner">${userOptions(d.owner || (isNew ? APP.state.user.name : ''))}</select></label>
            <label class="field"><span>Cierre estimado</span><input class="input" type="date" name="expected_close" value="${String(d.expected_close || '').slice(0, 10)}"></label>
          </div>
          <label class="field"><span>Notas</span><textarea class="textarea" name="notes" rows="2">${d.notes || ''}</textarea></label>
        </form>`,
        foot: html`${!isNew && APP.can('supervisor') ? html`<button class="btn btn-danger left" type="button" data-act="dl-del">${icon('trash', 'sm')}Eliminar</button>` : ''}
          <button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn btn-primary" type="submit" form="dlForm">${isNew ? 'Crear oportunidad' : 'Guardar'}</button>`,
        on: {
          'dl-save': async (form) => {
            const v = APP.formData(form);
            if (!isNew) v.deal_id = d.deal_id;
            const r = await APP.try('saveDeal', v, isNew ? 'Oportunidad creada.' : 'Oportunidad guardada.');
            if (!r) return;
            form.closest('.overlay')._close();
            if (onSaved) onSaved(); else if (APP.cur === APP.views.embudo) APP.views.embudo.load();
          },
          'dl-del': async (el) => {
            if (!(await APP.confirm('¿Eliminar "' + d.title + '"? Esta acción no se puede deshacer.', { danger: true, ok: 'Eliminar' }))) return;
            if (await APP.try('deleteDeal', { deal_id: d.deal_id }, 'Oportunidad eliminada.')) { el.closest('.overlay')._close(); if (onSaved) onSaved(); else if (APP.cur === APP.views.embudo) APP.views.embudo.load(); }
          }
        }
      });
    },

    on: {
      'dl-q': APP.debounce(function (el) { const v = APP.views.embudo; v.q = el.value.trim(); v.load(); }, 280),
      'dl-owner'(el) { this.owner = el.value; this.load(); },
      'dl-new'() { this.edit(); },
      'dl-edit'(el) { this.edit(this.data.find((x) => x.deal_id === el.dataset.id)); }
    }
  });

  // ══ Tareas ════════════════════════════════════════════════════════════
  const PRIO = { alta: ['Alta', 'alert'], normal: ['Normal', ''], baja: ['Baja', ''] };
  APP.view('tareas', {
    title: 'Tareas',
    mine: true, showDone: false, data: [],
    async render(el) {
      this.el = el;
      el.innerHTML = String(html`<div class="page" style="max-width:920px">
        <header class="page-head">
          <div><h1>Tareas</h1><p class="lede" id="tkLede">Llamadas, seguimientos y pendientes con recordatorio por WhatsApp.</p></div>
          <button class="btn btn-primary" type="button" data-act="tk-new">${icon('plus')}Nueva tarea</button>
        </header>
        <div class="toolbar"><div class="seg" role="group" aria-label="Mostrar">
          <button type="button" data-act="tk-mine" data-v="1" aria-pressed="${this.mine ? 'true' : 'false'}">Mis tareas</button>
          <button type="button" data-act="tk-mine" data-v="0" aria-pressed="${this.mine ? 'false' : 'true'}">Todo el equipo</button>
        </div><span class="small muted">También puedes crearlas desde WhatsApp: <code>/tarea mañana 10:00 Llamar a Rosa</code></span></div>
        <section class="panel" id="tkList"><div class="loading"><div class="spinner"></div></div></section>
      </div>`);
      await this.load();
    },
    async load() {
      const r = await APP.api('tasks', { mine: this.mine ? 'true' : '' });
      this.data = r.data;
      this.paint();
    },
    paint() {
      const box = document.getElementById('tkList');
      if (!box) return;
      const now = new Date(), nowIso = now.toISOString();
      const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      const open = this.data.filter((t) => t.status === 'open');
      const groups = [
        ['Vencidas', open.filter((t) => t.due_at && t.due_at < nowIso), 'alert'],
        ['Hoy', open.filter((t) => t.due_at && t.due_at >= nowIso && t.due_at <= endToday)],
        ['Próximas', open.filter((t) => t.due_at && t.due_at > endToday)],
        ['Sin fecha', open.filter((t) => !t.due_at)]
      ].filter((g) => g[1].length);
      const done = this.data.filter((t) => t.status === 'done').sort((a, b) => (a.done_at < b.done_at ? 1 : -1)).slice(0, 20);
      const late = groups.find((g) => g[0] === 'Vencidas');
      const lede = document.getElementById('tkLede');
      if (lede) lede.textContent = F.plural(open.length, 'tarea abierta', 'tareas abiertas') + (late ? ' · ' + F.plural(late[1].length, 'vencida', 'vencidas') : '');
      if (!open.length && !done.length) {
        box.innerHTML = String(html`<div class="empty">${icon('tasks')}<strong>Sin tareas</strong><p>Crea una para no olvidar una llamada o un seguimiento. Te llegará un recordatorio a tu WhatsApp a la hora indicada.</p><button class="btn btn-primary" type="button" data-act="tk-new">Nueva tarea</button></div>`);
        return;
      }
      box.innerHTML = String(html`${groups.map((g) => html`<div class="group-title">${g[0]} <span class="pill ${g[2] || ''}">${g[1].length}</span></div>${g[1].map((t) => this.row(t))}`)}
        ${!open.length ? html`<div class="empty" style="padding:22px">${icon('check')}<strong>Nada pendiente</strong></div>` : ''}
        ${done.length ? html`<div class="group-title"><button class="btn btn-ghost btn-sm" type="button" data-act="tk-done-toggle">${icon(this.showDone ? 'down' : 'right', 'sm')}Completadas (${done.length})</button></div>${this.showDone ? done.map((t) => this.row(t)) : ''}` : ''}`);
    },
    row(t) {
      const late = t.status === 'open' && t.due_at && t.due_at < new Date().toISOString();
      const p = PRIO[t.priority] || PRIO.normal;
      return html`<div class="task ${t.status === 'done' ? 'done' : ''}">
        <button class="check-btn" type="button" data-act="tk-toggle" data-id="${t.task_id}" aria-label="${(t.status === 'done' ? 'Reabrir ' : 'Completar ') + t.title}">${icon('check', 'sm')}</button>
        <div style="min-width:0"><div class="t-title">${t.title}</div>
          <div class="t-meta">
            ${t.due_at ? html`<span class="${late ? 'late' : ''}">${icon('clock', 'sm')} ${F.when(t.due_at)}</span>` : ''}
            ${t.contact_name ? html`<a href="#" data-act="open-profile" data-phone="${t.phone}">${t.contact_name}</a>` : ''}
            ${!this.mine && t.assigned_to ? html`<span>${t.assigned_to}</span>` : ''}
            ${t.priority === 'alta' ? html`<span class="pill ${p[1]}">Prioridad alta</span>` : ''}
            ${t.remind === 'true' && t.status === 'open' && t.due_at ? html`<span title="Recordatorio por WhatsApp">${t.reminded_at ? 'Recordatorio enviado' : 'Con recordatorio'}</span>` : ''}
          </div></div>
        <div class="row">
          ${t.phone ? html`<button class="icon-btn sm" type="button" data-act="open-chat" data-phone="${t.phone}" title="Abrir chat" aria-label="Abrir chat">${icon('inbox', 'sm')}</button>` : ''}
          <button class="icon-btn sm" type="button" data-act="tk-edit" data-id="${t.task_id}" title="Editar" aria-label="Editar">${icon('edit', 'sm')}</button>
          <button class="icon-btn sm danger" type="button" data-act="tk-del" data-id="${t.task_id}" title="Eliminar" aria-label="Eliminar">${icon('trash', 'sm')}</button>
        </div></div>`;
    },
    edit(t, onSaved) {
      t = t || {};
      const isNew = !t.task_id;
      let due = t.due_at ? F.toLocalInput(t.due_at) : '';
      if (isNew && !due) { const d = new Date(Date.now() + 3600000); d.setMinutes(0, 0, 0); due = F.toLocalInput(d); }
      APP.modal({
        title: isNew ? 'Nueva tarea' : 'Editar tarea',
        body: html`<form id="tkForm" data-submit="tk-save" class="stack">
          <label class="field"><span>Qué hay que hacer</span><input class="input" name="title" value="${t.title || ''}" required placeholder="Llamar para confirmar la instalación" autofocus></label>
          <div class="fields">
            <label class="field"><span>Fecha y hora</span><input class="input" type="datetime-local" name="due_at" value="${due}"></label>
            <label class="field"><span>Prioridad</span><select class="select" name="priority">${Object.keys(PRIO).map((k) => html`<option value="${k}" ${(t.priority || 'normal') === k ? 'selected' : ''}>${PRIO[k][0]}</option>`)}</select></label>
          </div>
          <div class="fields">
            <label class="field"><span>Cliente (teléfono, opcional)</span><input class="input" name="phone" value="${t.phone || ''}" inputmode="tel" placeholder="999 888 777"></label>
            <label class="field"><span>Responsable</span><select class="select" name="assigned_to">${userOptions(t.assigned_to || APP.state.user.name, false)}</select></label>
          </div>
          <label class="check"><input type="checkbox" name="remind" ${t.remind !== 'false' ? 'checked' : ''}>Avisarme por WhatsApp a la hora indicada</label>
          <p class="hint">El aviso llega al teléfono registrado del responsable (Configuración › Usuarios).</p>
        </form>`,
        foot: html`<button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn btn-primary" type="submit" form="tkForm">${isNew ? 'Crear tarea' : 'Guardar'}</button>`,
        on: {
          'tk-save': async (form) => {
            const v = APP.formData(form);
            v.due_at = v.due_at ? F.fromLocalInput(v.due_at) : '';
            if (!isNew) v.task_id = t.task_id;
            const r = await APP.try('saveTask', v, isNew ? 'Tarea creada.' : 'Tarea guardada.');
            if (!r) return;
            form.closest('.overlay')._close();
            if (onSaved) onSaved(); else if (APP.cur === APP.views.tareas) APP.views.tareas.load();
            APP.pollNow();
          }
        }
      });
    },
    on: {
      'tk-new'() { this.edit(); },
      'tk-edit'(el) { this.edit(this.data.find((t) => t.task_id === el.dataset.id)); },
      'tk-mine'(el) { this.mine = el.dataset.v === '1'; APP.$$('[data-act="tk-mine"]').forEach((b) => b.setAttribute('aria-pressed', b === el ? 'true' : 'false')); this.load(); },
      'tk-done-toggle'() { this.showDone = !this.showDone; this.paint(); },
      async 'tk-toggle'(el) {
        const t = this.data.find((x) => x.task_id === el.dataset.id);
        const status = t.status === 'done' ? 'open' : 'done';
        if (await APP.try('saveTask', { task_id: t.task_id, status }, status === 'done' ? 'Tarea completada.' : 'Tarea reabierta.')) { t.status = status; t.done_at = new Date().toISOString(); this.paint(); APP.pollNow(); }
      },
      async 'tk-del'(el) {
        if (!(await APP.confirm('¿Eliminar esta tarea?', { danger: true, ok: 'Eliminar' }))) return;
        if (await APP.try('deleteTask', { task_id: el.dataset.id }, 'Tarea eliminada.')) this.load();
      }
    }
  });
})();
