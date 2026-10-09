/* WA POWER — Modo demo.
   Carga el backend real (.gs) sobre el simulador de Apps Script y lo llena con datos de ejemplo.
   Nada sale a WhatsApp y todo se borra al recargar la página. */
(function () {
  'use strict';
  let ready = null;
  const MIN = 60000;
  const ago = (m) => new Date(Date.now() - m * MIN).toISOString();
  const ahead = (m) => new Date(Date.now() + m * MIN).toISOString();

  function atLocal(daysFromNow, h, m) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(h, m || 0, 0, 0);
    return d.toISOString();
  }

  // Conversaciones principales: [teléfono, nombre, etiquetas, ciudad, estado, mensajes]
  // mensaje: [dirección, minutos atrás, texto, fuente, asesor]
  const PEOPLE = [
    ['51987654321', 'Rosa Díaz', 'fibra, interesado', 'San Juan de Lurigancho', 'open', [
      ['in', 190, 'Hola, buenas tardes'], ['out', 190, 'Buenas tardes Rosa, gracias por escribir a CISESA. ¿En qué te podemos ayudar?', 'auto'],
      ['in', 44, '¿Cuánto cuesta el internet de 300 megas? Vivo en SJL, por la avenida Próceres']]],
    ['51922333444', 'Jorge Quispe', 'cliente, movil', 'Comas', 'needs-human', [
      ['in', 13, 'Buenas, quiero hablar con un asesor por favor. Pedí portabilidad hace 3 días y mi línea sigue sin señal'],
      ['out', 13, 'Perfecto, Jorge. Un asesor te escribe en unos minutos.', 'auto']]],
    ['51955111222', 'María Fernanda Torres', 'cliente, fibra', 'Los Olivos', 'open', [
      ['in', 2900, 'Hola, ¿el pago se puede hacer por Yape?'], ['out', 2890, 'Hola María Fernanda, sí: te paso el número por aquí mismo.', 'manual', 'Ana Ruiz'],
      ['in', 97, 'Buenos días, me llegó el recibo con un cobro de S/ 35 que no reconozco. ¿Me pueden explicar qué es?'],
      ['in', 95, 'Adjunto la foto del recibo']]],
    ['51944555666', 'Luis Paredes', 'duo, negociacion', 'Surco', 'open', [
      ['in', 1500, 'Me interesa el dúo fibra + TV que vi en su publicación'], ['out', 1490, 'Hola Luis, te cuento: 300 Mbps + TV a S/ 149 al mes, instalación gratis esta semana.', 'manual', 'Carlos Bardales'],
      ['in', 62, 'Acepto la propuesta, ¿qué necesito?'], ['out', 52, 'Excelente, Luis. Solo tu DNI y la dirección exacta. Te agendo la instalación.', 'manual', 'Carlos Bardales'],
      ['in', 4, 'Listo, ya te mandé los datos. ¿A qué hora pueden venir a instalar?']]],
    ['51966777888', 'Carmen Rojas', 'prospecto', 'Callao', 'open', [
      ['in', 26, 'Hola, ¿tienen chips prepago? Necesito dos para mis hijos']]],
    ['51977888999', 'Pedro Huamán', 'cliente', 'Ate', 'resolved', [
      ['in', 1460, 'Ya me instalaron, todo funciona bien'], ['out', 1455, 'Qué bueno, Pedro. Cualquier cosa nos escribes por aquí.', 'manual', 'Ana Ruiz'],
      ['in', 1400, 'Gracias por la ayuda'], ['out', 1400, '¡Con gusto, Pedro! Aquí estamos para lo que necesites.', 'auto']]],
    ['51988999000', 'Ana Lucía Vega', 'renovacion, vip', 'Miraflores', 'pending', [
      ['in', 330, 'Quiero renovar mi equipo, tengo el plan de S/ 89'], ['out', 300, 'Hola Ana Lucía, te envío la cotización con los equipos disponibles para tu plan.', 'manual', 'Ana Ruiz'],
      ['in', 280, 'Perfecto, la reviso con mi esposo y te aviso mañana']]],
    ['51911222333', 'Ricardo Salinas', 'fibra, prospecto', 'San Miguel', 'open', [
      ['out', 3000, 'Buenas tardes Ricardo, este mes la fibra de 300 Mbps está a S/ 89. ¿Te cuento?', 'campaign'],
      ['in', 2950, 'Me interesa la promo, ¿sigue vigente?'], ['out', 2900, 'Sí, Ricardo, hasta fin de mes. Te envío la propuesta formal.', 'manual', 'Carlos Bardales']]],
    ['51933444555', 'Sofía Mendoza', 'cliente, movil, vip', 'La Molina', 'resolved', [
      ['in', 2000, 'Ya firmé el contrato de las 2 líneas'], ['out', 1990, '¡Gracias, Sofía! Tus líneas se activan hoy mismo.', 'manual', 'Ana Ruiz']]]
  ];

  const EXTRA_NAMES = ['Diego Ramos', 'Valeria Castro', 'José Gutiérrez', 'Lucía Flores', 'Miguel Ángel Chávez', 'Patricia Soto', 'Andrés Vargas', 'Gabriela Ríos', 'Fernando Díaz', 'Daniela Paredes', 'Raúl Mendoza', 'Claudia Herrera', 'Óscar Villanueva', 'Milagros Cruz', 'Renzo Aguilar', 'Karina Ponce', 'Alberto Núñez', 'Silvia Campos', 'Hugo Espinoza', 'Rocío Salazar', 'Martín Ortiz', 'Natalia León', 'César Ramírez', 'Elena Morales', 'Iván Rosales', 'Pilar Chumpitaz', 'Manuel Torres', 'Yesenia Mamani'];
  const EXTRA_TAGS = ['fibra', 'movil', 'renovacion', 'vip', 'prospecto', 'cliente'];
  const CITIES = ['Lima', 'San Isidro', 'Chorrillos', 'Villa El Salvador', 'Independencia', 'Breña', 'Jesús María', 'Pueblo Libre'];
  const QUESTIONS = ['Hola, ¿qué planes tienen?', '¿Cuánto cuesta la portabilidad?', 'Buenas, ¿tienen cobertura en mi zona?', 'Quiero cambiar de plan', '¿Hasta qué hora atienden?', 'Hola, necesito mi recibo', '¿Hacen instalación los sábados?', 'Gracias, ya quedó'];
  const ANSWERS = ['Hola, claro. Te paso las opciones disponibles.', 'Con gusto, ¿me confirmas tu distrito?', 'Sí, atendemos hasta las 8:00 p. m.', 'Te envío el detalle en un momento.'];

  const PROMO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="#0D5C58"/><circle cx="690" cy="90" r="160" fill="#136d68"/><circle cx="690" cy="90" r="36" fill="#E3A21A"/><text x="60" y="150" font-family="Arial,Helvetica,sans-serif" font-size="34" fill="#DDEFE9">Solo este mes</text><text x="60" y="250" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="86" fill="#ffffff">Fibra 300 Mbps</text><text x="60" y="350" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="72" fill="#E3A21A">S/ 89 al mes</text><text x="60" y="430" font-family="Arial,Helvetica,sans-serif" font-size="28" fill="#DDEFE9">Instalación gratis · CISESA</text></svg>';
  const PROMO_IMG = 'data:image/svg+xml;base64,' + btoa(PROMO_SVG);

  function rnd(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  function seed() {
    const r = rnd(42);
    const now = new Date().toISOString();
    setProp_('TEXTMEBOT_API_KEY', 'demo');
    setCfg_('COMPANY_NAME', 'CISESA');
    setCfg_('BOT_NUMBER', '51943206279');
    setCfg_('PORTAL_SUBTITLE', 'WhatsApp Corporativo');
    setProp_('GROQ_API_KEY', 'demo');
    setCfg_('AI_ENABLED', 'true');
    setCfg_('AI_KNOWLEDGE', 'Empresa: CISESA, distribuidor autorizado de telecomunicaciones en Lima.\nQué ofrecemos: internet de fibra óptica (100, 300 y 600 Mbps), dúo fibra + TV, portabilidad móvil postpago, renovación de equipos y chips prepago.\nPrecios que puedes decir: fibra 300 Mbps a S/ 89 al mes (promoción del mes), dúo fibra + TV a S/ 149 al mes.\nInstalación: gratis, de 24 a 72 horas según cobertura.\nHorario: lunes a sábado de 9:00 a. m. a 8:00 p. m.\nMedios de pago: Yape, Plin, transferencia y agentes.\nLo que la IA NO debe hacer: dar descuentos, confirmar fechas de instalación ni pedir datos bancarios.');
    setCfg_('WELCOME_ENABLED', 'true');
    setCfg_('WELCOME_MESSAGE', 'Hola {{first_name}}, gracias por escribir a CISESA. Un asesor te atiende en breve.');
    const sys = { name: 'demo', role: 'admin' };
    users_save({ name: 'Carlos Bardales', email: 'carlos.bardales@cisesa.com', phone: '999000111', role: 'admin', password: 'demo1234' }, sys);
    users_save({ name: 'Ana Ruiz', phone: '955444333', role: 'agent', password: 'demo1234' }, sys);
    users_save({ name: 'Jorge Salas', phone: '966555444', role: 'supervisor', password: 'demo1234' }, sys);

    const rules = db_('AutomationRules').all();
    const hitsBy = { Saludo: 64, Precios: 41, 'Hablar con asesor': 17, Baja: 3, Agradecimiento: 29 };
    rules.forEach((x) => db_('AutomationRules').patch(x, { hits: hitsBy[x.rule_name] || 0, last_hit_at: ago(13 + Math.floor(r() * 200)) }));
    const ruleId = (name) => (rules.find((x) => x.rule_name === name) || {}).rule_id || '';

    const contacts = [], convs = [], msgs = [];
    function addMsg(phone, dir, min, text, source, agent) {
      msgs.push({ message_id: uid_('MSG'), phone, direction: dir, timestamp: ago(min), type: 'text', body: text, status: dir === 'in' ? 'received' : 'sent', source: dir === 'in' ? 'whatsapp' : source || 'manual', agent: agent || '', rule_id: dir === 'out' && source === 'auto' ? ruleId(/asesor/.test(text) ? 'Hablar con asesor' : /gusto/.test(text) ? 'Agradecimiento' : 'Saludo') : '' });
    }
    PEOPLE.forEach(([phone, name, tags, city, status, list], i) => {
      const first = list[0][1];
      contacts.push({ contact_id: uid_('CON'), phone, whatsapp_name: name, display_name: name, tags, status: 'active', source: i === 7 ? 'import' : 'whatsapp', first_seen_at: ago(first + 60 * 24 * (3 + i * 5)), last_seen_at: ago(list[list.length - 1][1]), last_inbound_at: ago((list.filter((m) => m[0] === 'in').slice(-1)[0] || list[0])[1]), city, company: i === 3 ? 'Paredes & Asociados' : '', email: i === 2 ? 'mftorres@gmail.com' : '', owner: i % 2 ? 'Ana Ruiz' : 'Carlos Bardales', do_not_contact: 'false', created_at: ago(first + 9000) });
      list.forEach((m) => addMsg(phone, m[0], m[1], m[2], m[3], m[4]));
      // Espera: mensajes entrantes después de la última respuesta humana (o del bot si no pidió asesor)
      let waitingSince = '', unread = 0;
      for (let k = list.length - 1; k >= 0; k--) {
        const m = list[k];
        if (m[0] === 'out' && (m[3] !== 'auto' || status !== 'needs-human')) break;
        if (m[0] === 'in') { waitingSince = ago(m[1]); unread++; }
      }
      if (status === 'resolved' || status === 'pending') { waitingSince = ''; unread = 0; }
      if (status === 'needs-human') waitingSince = ago(list[0][1]);
      const last = list[list.length - 1];
      convs.push({ conversation_id: uid_('CNV'), phone, whatsapp_name: name, last_message: last[2], last_message_at: ago(last[1]), last_direction: last[0], total_messages: list.length, unread, waiting_since: waitingSince, status, assigned_to: i === 1 ? 'Carlos Bardales' : i === 6 ? 'Ana Ruiz' : '', updated_at: ago(last[1]) });
    });

    // Historial de 14 días para la analítica
    EXTRA_NAMES.forEach((name, i) => {
      const phone = '519' + String(10000000 + Math.floor(r() * 89999999));
      const tags = [EXTRA_TAGS[i % EXTRA_TAGS.length], r() > 0.6 ? EXTRA_TAGS[(i + 2) % EXTRA_TAGS.length] : ''].filter(Boolean).join(', ');
      const dayAgo = 1 + Math.floor(r() * 13);
      const hour = 9 + Math.floor(Math.pow(r(), 0.8) * 11);
      const d = new Date(); d.setDate(d.getDate() - dayAgo); d.setHours(hour, Math.floor(r() * 60), 0, 0);
      const baseMin = Math.round((Date.now() - d.getTime()) / MIN);
      contacts.push({ contact_id: uid_('CON'), phone, whatsapp_name: name, display_name: name, tags, status: i === 5 ? 'inactive' : 'active', source: i % 3 ? 'whatsapp' : 'import', first_seen_at: ago(baseMin + 20000), last_seen_at: ago(baseMin), last_inbound_at: ago(baseMin), city: CITIES[i % CITIES.length], owner: i % 3 ? 'Ana Ruiz' : 'Carlos Bardales', do_not_contact: i === 11 ? 'true' : 'false', created_at: ago(baseMin + 20000) });
      const turns = 1 + Math.floor(r() * 3);
      let t = baseMin;
      for (let k = 0; k < turns; k++) {
        addMsg(phone, 'in', t, QUESTIONS[Math.floor(r() * QUESTIONS.length)]);
        const bot = r() < 0.45;
        const wait = bot ? 0 : 3 + Math.floor(Math.pow(r(), 2) * 50);
        addMsg(phone, 'out', t - wait, bot ? 'Hola, gracias por escribir a CISESA. ¿En qué te podemos ayudar?' : ANSWERS[Math.floor(r() * ANSWERS.length)], bot ? 'auto' : 'manual', bot ? '' : (i % 2 ? 'Ana Ruiz' : 'Carlos Bardales'));
        t -= wait + 30 + Math.floor(r() * 300);
        if (t < 10) break;
      }
      if (i < 20) addMsg(phone, 'out', 7200, 'Buenas tardes, este mes la fibra de 300 Mbps está a S/ 89. ¿Te cuento?', 'campaign');
      convs.push({ conversation_id: uid_('CNV'), phone, whatsapp_name: name, last_message: ANSWERS[i % ANSWERS.length], last_message_at: ago(Math.max(t, 5)), last_direction: 'out', total_messages: turns * 2, unread: 0, waiting_since: '', status: 'resolved', updated_at: ago(Math.max(t, 5)) });
    });
    msgs.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
    db_('Contacts').insertMany(contacts);
    db_('Conversations').insertMany(convs);
    db_('Messages').insertMany(msgs);

    const month = new Date(); month.setDate(Math.max(1, month.getDate() - 2));
    const deals = [
      ['51987654321', 'Fibra 300 Mbps', 'Internet fijo', 'Interesado', 99, 'Carlos Bardales', 44],
      ['51944555666', 'Dúo fibra + TV', 'Dúo', 'Negociación', 149, 'Carlos Bardales', 4],
      ['51911222333', 'Fibra 300 Mbps promo', 'Internet fijo', 'Propuesta', 89, 'Carlos Bardales', 2900],
      ['51988999000', 'Renovación de equipo', 'Renovación', 'Propuesta', 1299, 'Ana Ruiz', 280],
      ['51966777888', '2 chips prepago', 'Móvil prepago', 'Nuevo', 20, 'Ana Ruiz', 26],
      ['51922333444', 'Portabilidad 1 línea', 'Portabilidad', 'Contactado', 59, 'Carlos Bardales', 13],
      [contacts[9].phone, 'Plan postpago S/ 69', 'Móvil postpago', 'Contactado', 69, 'Ana Ruiz', 3000],
      [contacts[12].phone, 'Fibra 600 Mbps', 'Internet fijo', 'Nuevo', 129, 'Carlos Bardales', 900],
      ['51933444555', 'Portabilidad 2 líneas', 'Portabilidad', 'Ganado', 138, 'Ana Ruiz', 1990],
      [contacts[15].phone, 'Dúo fibra + TV', 'Dúo', 'Ganado', 149, 'Carlos Bardales', 6000],
      [contacts[18].phone, 'Renovación de equipo', 'Renovación', 'Perdido', 899, 'Ana Ruiz', 8000]
    ];
    db_('Deals').insertMany(deals.map((d) => {
      const status = d[3] === 'Ganado' ? 'won' : d[3] === 'Perdido' ? 'lost' : 'open';
      return { deal_id: uid_('DEA'), phone: d[0], title: d[1], product: d[2], stage: d[3], value: String(d[4]), owner: d[5], status, created_at: ago(d[6] + 600), updated_at: ago(d[6]), closed_at: status === 'open' ? '' : ago(d[6]), expected_close: status === 'open' && d[4] > 100 ? atLocal(5, 12).slice(0, 10) : '' };
    }));

    db_('Notes').insertMany([
      { note_id: uid_('NOT'), phone: '51944555666', body: 'Prefiere instalación en la mañana. Edificio con portería: avisar al llegar.', author: 'Carlos Bardales', created_at: ago(50) },
      { note_id: uid_('NOT'), phone: '51988999000', body: 'Le interesa el equipo de gama media. Decide con su esposo.', author: 'Ana Ruiz', created_at: ago(275) },
      { note_id: uid_('NOT'), phone: '51922333444', body: 'Portabilidad pedida el lunes. Revisar estado con backoffice.', author: 'Jorge Salas', created_at: ago(10) }
    ]);

    db_('Tasks').insertMany([
      { task_id: uid_('TSK'), title: 'Llamar a María Fernanda por el cobro del recibo', phone: '51955111222', due_at: ago(35), priority: 'alta', status: 'open', assigned_to: 'Carlos Bardales', remind: 'true', reminded_at: ago(35), created_by: 'Carlos Bardales', created_at: ago(90) },
      { task_id: uid_('TSK'), title: 'Confirmar hora de instalación con Luis', phone: '51944555666', due_at: ahead(95), priority: 'normal', status: 'open', assigned_to: 'Carlos Bardales', remind: 'true', created_by: 'Carlos Bardales', created_at: ago(40) },
      { task_id: uid_('TSK'), title: 'Enviar contrato firmado a Sofía', phone: '51933444555', due_at: ahead(200), priority: 'normal', status: 'open', assigned_to: 'Ana Ruiz', remind: 'true', created_by: 'Ana Ruiz', created_at: ago(300) },
      { task_id: uid_('TSK'), title: 'Seguimiento a la cotización de Ana Lucía', phone: '51988999000', due_at: atLocal(1, 10), priority: 'normal', status: 'open', assigned_to: 'Carlos Bardales', remind: 'true', created_by: 'Ana Ruiz', created_at: ago(270) },
      { task_id: uid_('TSK'), title: 'Revisar el reporte semanal de ventas', phone: '', due_at: atLocal(3, 9), priority: 'baja', status: 'open', assigned_to: 'Carlos Bardales', remind: 'false', created_by: 'Carlos Bardales', created_at: ago(2000) },
      { task_id: uid_('TSK'), title: 'Activar las líneas de Sofía', phone: '51933444555', due_at: ago(1900), priority: 'alta', status: 'done', assigned_to: 'Ana Ruiz', remind: 'true', reminded_at: ago(1900), created_by: 'Ana Ruiz', created_at: ago(1990), done_at: ago(1850) }
    ]);

    const fibra = contacts.filter((c) => /fibra/.test(c.tags)).map((c) => c.phone).slice(0, 6).join(',');
    db_('ScheduledMessages').insertMany([
      { schedule_id: uid_('SCH'), title: 'Aviso de instalación a Luis', recipient_type: 'list', recipients: '51944555666', message_template: 'Hola {{first_name}}, te confirmamos la instalación para mañana entre 9 y 11 a. m.', start_datetime: atLocal(1, 8, 30), next_run_at: atLocal(1, 8, 30), recurrence_type: 'once', status: 'active', created_by: 'Carlos Bardales', created_at: ago(40), updated_at: ago(40), run_count: '0' },
      { schedule_id: uid_('SCH'), title: 'Recordatorio de pago · clientes fibra', recipient_type: 'list', recipients: fibra, message_template: '{{greeting}} {{first_name}}, te recordamos que tu recibo vence esta semana. Puedes pagar por Yape o en agentes.', start_datetime: atLocal(2, 9), next_run_at: atLocal(2, 9), recurrence_type: 'monthly', status: 'active', created_by: 'Carlos Bardales', created_at: ago(40000), updated_at: ago(40000), run_count: '3' },
      { schedule_id: uid_('SCH'), title: 'Promoción de fin de semana', recipient_type: 'list', recipients: contacts.slice(9, 14).map((c) => c.phone).join(','), message_template: 'Este fin de semana: instalación gratis en fibra. ¿Te interesa?', start_datetime: atLocal(4, 10), next_run_at: atLocal(4, 10), recurrence_type: 'weekly', status: 'paused', created_by: 'Ana Ruiz', created_at: ago(9000), updated_at: ago(3000), run_count: '2' }
    ]);

    db_('Campaigns').insertMany([
      { campaign_id: uid_('CMP'), name: 'Promo fibra septiembre', description: 'Fibra 300 Mbps a S/ 89', audience_filter: 'fibra', message_template: '{{greeting}} {{first_name}}, este mes la fibra de 300 Mbps está a S/ 89. ¿Te cuento?', status: 'completed', total_recipients: '21', sent_count: '20', failed_count: '1', created_at: ago(7400), started_at: ago(7200), finished_at: ago(7150), scheduled_at: ago(7200), created_by: 'Carlos Bardales', updated_at: ago(7150) },
      { campaign_id: uid_('CMP'), name: 'Renovación de equipos octubre', description: 'Clientes con más de 18 meses', audience_filter: 'renovacion, vip', message_template: 'Hola {{first_name}}, ya puedes renovar tu equipo con descuento. ¿Te paso las opciones?', status: 'draft', total_recipients: '0', sent_count: '0', failed_count: '0', created_at: ago(120), created_by: 'Carlos Bardales', updated_at: ago(120) }
    ]);

    // Grupos de WhatsApp y chats donde el bot no responde
    const now2 = new Date().toISOString();
    db_('Groups').insertMany([
      { group_id: '120363041234567890@g.us', name: 'Equipo de ventas CISESA', invite_code: 'DemoVentas123456', source: 'invite', last_seen_at: ago(30), last_sent_at: ago(1440), created_at: ago(30000), updated_at: now2 },
      { group_id: '51943627026-1415712161@g.us', name: 'Reportes ControlNet', source: 'manual', last_sent_at: ago(600), created_at: ago(60000), updated_at: now2 },
      { group_id: '120363049876543210@g.us', name: 'Clientes VIP · novedades', source: 'detected', last_seen_at: ago(200), created_at: ago(9000), updated_at: now2 }
    ]);
    db_('ScheduledMessages').insertMany([
      { schedule_id: uid_('SCH'), title: 'Buenos días al equipo de ventas', recipient_type: 'list', recipients: '120363041234567890@g.us', message_template: '*Buenos días, equipo* ☀️\nMeta de hoy: 15 ventas. Promo vigente: fibra 300 Mbps a S/ 89.', file_url: PROMO_IMG, start_datetime: atLocal(1, 8), next_run_at: atLocal(1, 8), recurrence_type: 'mon_sat', status: 'active', created_by: 'Carlos Bardales', created_at: ago(20000), updated_at: ago(20000), run_count: '14' },
      { schedule_id: uid_('SCH'), title: 'Promo del mes a clientes VIP', recipient_type: 'list', recipients: '120363049876543210@g.us', message_template: 'Hola a todos, este mes la fibra de 300 Mbps está a S/ 89 con instalación gratis. Escríbenos por privado.', file_url: PROMO_IMG, start_datetime: atLocal(2, 11), next_run_at: atLocal(2, 11), recurrence_type: 'once', status: 'active', created_by: 'Carlos Bardales', created_at: ago(300), updated_at: ago(300), run_count: '0' }
    ]);
    const tpl = db_('Templates').findBy('shortcut', 'promo');
    if (tpl) db_('Templates').patch(tpl, { file_url: PROMO_IMG });
    db_('Contacts').insertMany([
      { contact_id: uid_('CON'), phone: '51944100200', display_name: 'Mamá', whatsapp_name: 'Mamá', tags: 'familia', status: 'active', source: 'manual', do_not_contact: 'false', created_at: ago(90000), first_seen_at: ago(90000), last_seen_at: ago(400) },
      { contact_id: uid_('CON'), phone: '51955300400', display_name: 'Distribuidora Andina (proveedor)', whatsapp_name: 'Distribuidora Andina', tags: 'proveedor', status: 'active', source: 'manual', do_not_contact: 'false', bot: 'off', created_at: ago(40000), first_seen_at: ago(40000), last_seen_at: ago(900) }
    ]);
    const prov = db_('Contacts').findBy('phone', '51955300400');
    db_('Messages').insertMany([{ message_id: uid_('MSG'), phone: '51955300400', direction: 'in', timestamp: ago(38), type: 'text', body: 'Carlos, ya salió el pedido de 40 routers. Llega mañana a la tienda.', status: 'received', source: 'whatsapp' }]);
    db_('Conversations').insertMany([{ conversation_id: uid_('CNV'), phone: prov.phone, whatsapp_name: prov.whatsapp_name, last_message: 'Carlos, ya salió el pedido de 40 routers. Llega mañana a la tienda.', last_message_at: ago(38), last_direction: 'in', total_messages: 1, unread: 1, waiting_since: ago(38), status: 'open', updated_at: ago(38) }]);

    // Algunas auditorías para la pestaña Actividad
    audit_('Carlos Bardales', 'login', 'user', '', { role: 'admin' });
    audit_('Ana Ruiz', 'deal_updated', 'deal', '', { stage: 'Propuesta' });
    setProp_('LAST_TICK_AT', ago(0.5));
  }

  function call(body) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const out = doPost({ parameter: {}, postData: { contents: JSON.stringify(body) } });
        resolve(JSON.parse(out.getContent()));
      }, 70 + Math.random() * 90);
    });
  }

  function webhook(data) {
    const key = prop_('WEBHOOK_SECRET');
    return JSON.parse(doPost({ parameter: { key }, postData: { contents: JSON.stringify(data) } }).getContent());
  }

  const SAMPLES = ['Hola, buenas tardes. ¿Qué planes de internet tienen?', '¿Cuánto cuesta la portabilidad a postpago?', 'Quiero hablar con un asesor', 'Muchas gracias', 'STOP', '¿Atienden los domingos?'];

  window.DEMO = {
    init() {
      if (!ready) {
        instalar();
        seed();
        const r = auth_login({ user: 'Carlos Bardales', password: prop_('APP_SECRET_TOKEN') });
        ready = { token: r.token, user: r.user };
        setInterval(() => { try { tick(); } catch (e) {} }, 20000);
        // Un cliente nuevo escribe a los pocos segundos, para ver el aviso en vivo
        setTimeout(() => { webhook({ from: '51912345678', from_name: 'Diego Ramos', message: 'Hola, ¿hacen instalaciones los domingos? Estoy en Pueblo Libre', type: 'text' }); if (window.APP) APP.pollNow(); }, 25000);
      }
      return ready;
    },
    call,
    inboundDialog() {
      const { html, icon } = APP;
      const convs = db_('Conversations').all().filter((c) => c.status !== 'resolved').slice(0, 8);
      APP.modal({
        title: 'Simular un mensaje de cliente',
        body: html`<form id="demoIn" data-submit="demo-send" class="stack">
          <p class="soft small">Así llega un WhatsApp real: pasa por el bot, las reglas y la bandeja.</p>
          <label class="field"><span>Quién escribe</span><select class="select" name="who" data-change="demo-who">
            <option value="new">Un cliente nuevo</option>${convs.map((c) => html`<option value="${c.phone}">${c.whatsapp_name || c.phone}</option>`)}</select></label>
          <div class="fields" id="demoNew"><label class="field"><span>Nombre</span><input class="input" name="name" value="Valeria Chávez"></label><label class="field"><span>Teléfono</span><input class="input" name="phone" value="${'519' + Math.floor(10000000 + Math.random() * 89999999)}"></label></div>
          <label class="field"><span>Mensaje</span><textarea class="textarea" name="message" rows="3" required>${SAMPLES[0]}</textarea></label>
          <div class="var-chips">${SAMPLES.map((s) => html`<button type="button" data-act="demo-sample" data-s="${s}" style="font-family:inherit">${s.length > 28 ? s.slice(0, 27) + '…' : s}</button>`)}</div>
        </form>`,
        foot: html`<button class="btn" type="button" data-act="layer-close">Cancelar</button><button class="btn btn-primary" type="submit" form="demoIn">${icon('send')}Recibir mensaje</button>`,
        on: {
          'demo-who': (sel) => { sel.form.querySelector('#demoNew').hidden = sel.value !== 'new'; },
          'demo-sample': (b) => { const ta = b.closest('.overlay').querySelector('[name=message]'); ta.value = b.dataset.s; },
          'demo-send': (form) => {
            const d = APP.formData(form);
            const phone = d.who === 'new' ? d.phone : d.who;
            const conv = db_('Conversations').findBy('phone', phone);
            const name = d.who === 'new' ? d.name : (conv && conv.whatsapp_name) || '';
            const r = webhook({ from: phone, from_name: name, message: d.message, type: 'text' });
            const res = r.result || {};
            form.closest('.overlay')._close();
            APP.toast(res.ai ? 'Llegó el mensaje y la IA respondió' + (res.handoff ? ' derivándolo a un asesor' : '') + (res.intent ? ' (intención: ' + res.intent + ')' : '') + '.' : res.autoReply ? 'Llegó el mensaje y el bot respondió' + (res.rule ? ' con la regla "' + res.rule + '"' : '') + '.' : res.reason === 'do_not_contact' ? 'Llegó el mensaje; el contacto pidió la baja, así que no se responde.' : 'Llegó el mensaje y quedó esperando a un asesor.', '', { long: true });
            APP.pollNow();
          }
        }
      });
    }
  };
})();
