/* Generado desde apps-script/*.gs para el modo demo. No editar a mano. */
/* ── 00_Config.gs ── */
/**
 * WA POWER v2 — 00_Config.gs
 * Esquema de la base (Google Sheets), valores por defecto y lectura de configuración.
 *
 * Secretos (NUNCA en la hoja): se guardan en Propiedades del script
 *   TEXTMEBOT_API_KEY · APP_SECRET_TOKEN · WEBHOOK_SECRET
 */

var APP_VERSION = '2.1.0';

// ID de tu Google Sheet (el mismo de la v1: los datos se conservan y se migran)
var SPREADSHEET_ID = '1kB2zeGAX8MGnFLMVnP68wOueE4KZnZ621xAizC0BwI4';

// Columnas por hoja. Las de la v1 van primero para ser compatibles; setup agrega las nuevas al final.
var SCHEMA = {
  Settings:          ['key', 'value', 'description', 'updated_at'],
  Users:             ['user_id', 'name', 'email', 'phone', 'role', 'password_hash', 'salt', 'active', 'created_at', 'last_login_at'],
  Contacts:          ['contact_id', 'phone', 'whatsapp_name', 'display_name', 'tags', 'status', 'source', 'first_seen_at', 'last_seen_at', 'notes', 'do_not_contact',
                      'email', 'company', 'city', 'owner', 'custom_1', 'custom_2', 'last_inbound_at', 'last_outbound_at', 'created_at', 'updated_at', 'bot'],
  Conversations:     ['conversation_id', 'phone', 'whatsapp_name', 'last_message', 'last_message_at', 'total_messages', 'status', 'summary', 'updated_at',
                      'last_direction', 'unread', 'assigned_to', 'waiting_since', 'last_human_reply_at'],
  Messages:          ['message_id', 'phone', 'direction', 'timestamp', 'type', 'body', 'file_url', 'document_url', 'status', 'source', 'agent', 'rule_id', 'campaign_id', 'schedule_id', 'error', 'audio_url'],
  Queue:             ['queue_id', 'created_at', 'recipient', 'body', 'file_url', 'document_url', 'source', 'agent', 'campaign_id', 'schedule_id', 'not_before', 'status', 'attempts', 'sent_at', 'error', 'audio_url'],
  ScheduledMessages: ['schedule_id', 'title', 'recipient_type', 'recipients', 'message_template', 'file_url', 'audio_url', 'document_url', 'start_datetime', 'recurrence_type',
                      'recurrence_rule', 'next_run_at', 'last_run_at', 'status', 'created_at', 'updated_at', 'created_by', 'run_count'],
  AutomationRules:   ['rule_id', 'rule_name', 'enabled', 'priority', 'trigger_type', 'keyword', 'match_type', 'conditions_json', 'response_template', 'fallback_response',
                      'tags_to_add', 'mark_status', 'created_at', 'updated_at', 'file_url', 'deal_stage', 'assign_to', 'notify_admin', 'cooldown_minutes', 'hits', 'last_hit_at', 'only_tags', 'except_tags'],
  Campaigns:         ['campaign_id', 'name', 'description', 'audience_filter', 'message_template', 'status', 'scheduled_at', 'recurrence', 'total_recipients', 'sent_count',
                      'failed_count', 'created_at', 'audience_stage', 'file_url', 'started_at', 'finished_at', 'updated_at', 'created_by'],
  Templates:         ['template_id', 'name', 'category', 'message', 'file_url', 'audio_url', 'document_url', 'status', 'created_at', 'updated_at', 'shortcut', 'uses'],
  Deals:             ['deal_id', 'phone', 'title', 'product', 'stage', 'value', 'owner', 'expected_close', 'status', 'notes', 'created_at', 'updated_at', 'closed_at'],
  Tasks:             ['task_id', 'title', 'phone', 'due_at', 'priority', 'status', 'assigned_to', 'remind', 'reminded_at', 'created_by', 'created_at', 'done_at'],
  Notes:             ['note_id', 'phone', 'body', 'author', 'created_at'],
  Groups:            ['group_id', 'name', 'invite_code', 'notes', 'source', 'last_seen_at', 'last_sent_at', 'created_at', 'updated_at'],
  AuditLogs:         ['log_id', 'timestamp', 'actor', 'action', 'entity_type', 'entity_id', 'details_json']
};

// Clave primaria de cada hoja
var PK = {
  Settings: 'key', Users: 'user_id', Contacts: 'contact_id', Conversations: 'conversation_id', Messages: 'message_id',
  Queue: 'queue_id', ScheduledMessages: 'schedule_id', AutomationRules: 'rule_id', Campaigns: 'campaign_id',
  Templates: 'template_id', Deals: 'deal_id', Tasks: 'task_id', Notes: 'note_id', Groups: 'group_id', AuditLogs: 'log_id'
};

// Configuración editable desde el portal (se guarda en la hoja Settings)
var DEFAULT_SETTINGS = {
  COMPANY_NAME:              ['Mi Empresa', 'Nombre que aparece en los mensajes ({{company_name}})'],
  PORTAL_SUBTITLE:           ['WhatsApp Corporativo', 'Texto bajo el logo del portal'],
  BOT_NUMBER:                ['', 'Número conectado a TextMeBot (se detecta solo). No se le envían avisos: WhatsApp no muestra mensajes a uno mismo'],
  NOTIFY_GROUP:              ['', 'Grupo de WhatsApp donde llegan avisos, recordatorios y el resumen (ID del grupo)'],
  DEFAULT_TIMEZONE:          ['America/Lima', 'Zona horaria del sistema'],
  DEFAULT_COUNTRY_CODE:      ['51', 'Código de país que se agrega a números de 9 dígitos'],
  CURRENCY:                  ['S/', 'Moneda de las oportunidades'],
  RATE_LIMIT_SECONDS:        ['5', 'Espera mínima entre mensajes (TextMeBot recomienda 5 segundos o más)'],
  CAMPAIGN_DELAY_SECONDS:    ['8', 'Espera entre mensajes de campañas (segundos, + azar de 0 a 4)'],
  BOT_ENABLED:               ['true', 'Respuestas automáticas encendidas'],
  BOT_SCOPE:                 ['all', 'A quién responde el bot: all = a todos salvo excluidos · allowlist = solo a los permitidos'],
  BOT_EXCLUDE_TAGS:          ['familia, personal, proveedor', 'Contactos con estas etiquetas nunca reciben respuestas automáticas'],
  BOT_ONLY_TAGS:             ['', 'En modo "solo permitidos": etiquetas que sí reciben respuestas automáticas'],
  HUMAN_TAKEOVER_MIN:        ['120', 'Minutos que el bot se calla en un chat después de que responde un asesor (0 = nunca)'],
  COMMANDS_ENABLED:          ['true', 'Permitir comandos por WhatsApp a usuarios con teléfono registrado'],
  AUTO_REPLY_COOLDOWN_MIN:   ['60', 'Minutos antes de repetir la misma respuesta automática al mismo contacto'],
  WELCOME_ENABLED:           ['false', 'Enviar bienvenida a contactos nuevos si ninguna regla responde'],
  WELCOME_MESSAGE:           ['Hola {{whatsapp_name}}, gracias por escribir a {{company_name}}. En breve te atendemos.', 'Mensaje de bienvenida'],
  AWAY_ENABLED:              ['false', 'Responder fuera del horario de atención'],
  AWAY_MESSAGE:              ['Hola {{whatsapp_name}}, ahora estamos fuera de horario. Te respondemos apenas abramos.', 'Mensaje fuera de horario'],
  BH_DAYS:                   ['1,2,3,4,5,6', 'Días de atención (1 = lunes … 7 = domingo)'],
  BH_START:                  ['09:00', 'Hora de apertura'],
  BH_END:                    ['20:00', 'Hora de cierre'],
  FALLBACK_ENABLED:          ['false', 'Responder cuando ninguna regla coincide (una vez cada 12 h por contacto)'],
  DEFAULT_FALLBACK_MESSAGE:  ['Gracias por tu mensaje. Un asesor te responderá pronto.', 'Mensaje cuando ninguna regla coincide'],
  IGNORE_GROUPS:             ['true', 'Ignorar mensajes que llegan de grupos'],
  PIPELINE_STAGES:           ['["Nuevo","Contactado","Interesado","Propuesta","Negociación","Ganado","Perdido"]', 'Etapas del embudo (JSON)'],
  WON_STAGE:                 ['Ganado', 'Etapa que cuenta como venta cerrada'],
  LOST_STAGE:                ['Perdido', 'Etapa que cuenta como oportunidad perdida'],
  DIGEST_ENABLED:            ['true', 'Enviar resumen diario por WhatsApp a los administradores'],
  DIGEST_HOUR:               ['8', 'Hora del resumen diario (0-23)'],
  SYSTEM_VERSION:            [APP_VERSION, 'Versión del sistema']
};

var SECRET_KEYS = ['TEXTMEBOT_API_KEY', 'APP_SECRET_TOKEN', 'WEBHOOK_SECRET'];

// ── Propiedades del script (secretos y estado interno) ───────────────────
function prop_(key) { return PropertiesService.getScriptProperties().getProperty(key); }
function setProp_(key, value) { PropertiesService.getScriptProperties().setProperty(key, String(value)); }
function delProp_(key) { PropertiesService.getScriptProperties().deleteProperty(key); }

// ── Configuración (hoja Settings, con caché) ─────────────────────────────
var _CFG = null;

function cfgAll_() {
  if (_CFG) return _CFG;
  var cache = CacheService.getScriptCache();
  var hit = cache.get('cfg_v2');
  if (hit) { _CFG = JSON.parse(hit); return _CFG; }
  var out = {};
  for (var k in DEFAULT_SETTINGS) out[k] = DEFAULT_SETTINGS[k][0];
  try {
    db_('Settings').all().forEach(function (r) {
      if (r.key && SECRET_KEYS.indexOf(r.key) === -1) out[r.key] = r.value;
    });
  } catch (e) { /* hoja aún no creada */ }
  _CFG = out;
  cache.put('cfg_v2', JSON.stringify(out), 300);
  return out;
}

function cfg_(key) {
  var all = cfgAll_();
  return all[key] !== undefined ? String(all[key]) : '';
}

function cfgBool_(key) { return String(cfg_(key)).toLowerCase() === 'true'; }
function cfgNum_(key, dflt) { var n = parseFloat(cfg_(key)); return isNaN(n) ? dflt : n; }

function setCfg_(key, value) {
  if (SECRET_KEYS.indexOf(key) !== -1) throw new Error('Los secretos no se guardan en la hoja');
  var t = db_('Settings');
  var row = t.findBy('key', key);
  var now = nowIso_();
  if (row) t.patch(row, { value: value, updated_at: now });
  else t.insert({ key: key, value: value, description: (DEFAULT_SETTINGS[key] || [])[1] || '', updated_at: now });
  _CFG = null;
  CacheService.getScriptCache().remove('cfg_v2');
}

function tz_() { return cfg_('DEFAULT_TIMEZONE') || Session.getScriptTimeZone() || 'America/Lima'; }

function stages_() {
  try {
    var arr = JSON.parse(cfg_('PIPELINE_STAGES'));
    if (Array.isArray(arr) && arr.length) return arr.map(String);
  } catch (e) {}
  return JSON.parse(DEFAULT_SETTINGS.PIPELINE_STAGES[0]);
}

// ── Utilidades comunes ───────────────────────────────────────────────────
function nowIso_() { return new Date().toISOString(); }

function uid_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase();
}

function fmtDate_(date, pattern) {
  var d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, tz_(), pattern);
}

/* Fechas rápidas: Utilities.formatDate es lento si se llama miles de veces (Analítica).
   Se calcula una vez el desfase de la zona horaria y luego es pura aritmética. */
var _TZOFF = null;
function tzOffsetMs_() {
  if (_TZOFF === null) {
    var z = Utilities.formatDate(new Date(), tz_(), 'Z');
    var sign = z.charAt(0) === '-' ? -1 : 1;
    _TZOFF = sign * (parseInt(z.slice(1, 3), 10) * 60 + parseInt(z.slice(3, 5), 10)) * 60000;
  }
  return _TZOFF;
}
/** Fecha desplazada a la hora local: usar getUTCDate/getUTCHours/getUTCDay. */
function toLocal_(iso) {
  var t = (iso instanceof Date ? iso : new Date(iso)).getTime();
  return isNaN(t) ? null : new Date(t + tzOffsetMs_());
}
function dayKey_(iso) { var d = toLocal_(iso); return d ? d.toISOString().slice(0, 10) : ''; }

function norm_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim();
}

function truncate_(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

function money_(v) {
  var n = parseFloat(v) || 0;
  return cfg_('CURRENCY') + ' ' + n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function minutesSince_(iso) {
  var t = new Date(iso).getTime();
  return isNaN(t) ? 0 : Math.max(0, Math.round((Date.now() - t) / 60000));
}

function humanWait_(iso) {
  var m = minutesSince_(iso);
  if (m < 60) return m + ' min';
  if (m < 1440) return Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
  return Math.floor(m / 1440) + ' d';
}

;
/* ── 01_Db.gs ── */
/**
 * WA POWER v2 — 01_Db.gs
 * Capa de datos sobre Google Sheets.
 *  - Lee cada hoja una sola vez por ejecución (caché en memoria).
 *  - Actualiza una fila completa en una sola llamada (antes: una llamada por celda).
 *  - Todo se guarda como texto plano para que Sheets no convierta teléfonos, fechas ni booleanos.
 */

var _TABLES = {};

// ── Versión de datos: cualquier escritura la cambia y así se invalidan las respuestas en caché ──
var _DIRTY = false;
function bumpVersion_() {
  try { CacheService.getScriptCache().put('dv', Date.now().toString(36) + Math.random().toString(36).slice(2, 6), 21600); } catch (e) {}
}
function markDirty_() { if (!_DIRTY) { _DIRTY = true; bumpVersion_(); } }
/** Al terminar una ejecución que escribió: vuelve a cambiar la versión (cierra la carrera con lecturas simultáneas). */
function finishWrites_() { if (_DIRTY) { bumpVersion_(); _DIRTY = false; } }
function dataVersion_() {
  var c = CacheService.getScriptCache();
  var v = c.get('dv');
  if (!v) { v = Date.now().toString(36); c.put('dv', v, 21600); }
  return v;
}
/** Respuesta en caché de Apps Script. versioned = se descarta en cuanto cambia cualquier dato. */
function cached_(key, ttl, fn, versioned) {
  var cache = CacheService.getScriptCache();
  var k = 'c_' + key + (versioned ? '_' + dataVersion_() : '');
  if (k.length > 200) k = 'c_' + hash_(k, 'k').slice(0, 40);
  var hit = cache.get(k);
  if (hit) { try { return JSON.parse(hit); } catch (e) {} }
  var out = fn();
  try { var s = JSON.stringify(out); if (s.length < 95000) cache.put(k, s, ttl); } catch (e) {}
  return out;
}

function ss_() {
  if (!ss_._ss) ss_._ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss_._ss;
}

function db_(name) {
  if (!_TABLES[name]) _TABLES[name] = new Table_(name);
  return _TABLES[name];
}

function Table_(name) {
  this.name = name;
  this.pk = PK[name];
  this._sheet = null;
  this._headers = null;
  this._rows = null;
}

Table_.prototype.sheet = function () {
  if (!this._sheet) {
    this._sheet = ss_().getSheetByName(this.name);
    if (!this._sheet) throw new Error('Falta la hoja "' + this.name + '". Ejecuta la instalación (instalar).');
  }
  return this._sheet;
};

Table_.prototype.headers = function () {
  if (!this._headers) {
    var sh = this.sheet();
    var lastCol = Math.max(sh.getLastColumn(), 1);
    this._headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  }
  return this._headers;
};

function cellToStr_(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString();
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  return String(v);
}

function strToCell_(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

Table_.prototype._toObj = function (arr, rowNum) {
  var h = this.headers();
  var o = {};
  for (var i = 0; i < h.length; i++) if (h[i]) o[h[i]] = cellToStr_(arr[i]);
  (SCHEMA[this.name] || []).forEach(function (c) { if (o[c] === undefined) o[c] = ''; });
  Object.defineProperty(o, '_row', { value: rowNum, enumerable: false, writable: true });
  return o;
};

Table_.prototype._toArr = function (obj) {
  return this.headers().map(function (h) { return strToCell_(obj[h]); });
};

/** Todas las filas (caché por ejecución). */
Table_.prototype.all = function () {
  if (this._rows) return this._rows;
  var sh = this.sheet();
  var last = sh.getLastRow();
  var rows = [];
  if (last > 1) {
    var vals = sh.getRange(2, 1, last - 1, this.headers().length).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (vals[i].join('') === '') continue;
      rows.push(this._toObj(vals[i], i + 2));
    }
  }
  this._rows = rows;
  return rows;
};

/** Últimas n filas sin leer toda la hoja (ideal para Messages). */
Table_.prototype.tail = function (n) {
  if (this._rows) return this._rows.slice(-n);
  var sh = this.sheet();
  var last = sh.getLastRow();
  if (last <= 1) return [];
  var start = Math.max(2, last - n + 1);
  var vals = sh.getRange(start, 1, last - start + 1, this.headers().length).getValues();
  var self = this;
  return vals.filter(function (r) { return r.join('') !== ''; })
    .map(function (r, i) { return self._toObj(r, start + i); });
};

Table_.prototype.find = function (fn) {
  var rows = this.all();
  for (var i = 0; i < rows.length; i++) if (fn(rows[i])) return rows[i];
  return null;
};

Table_.prototype.filter = function (fn) { return this.all().filter(fn); };

Table_.prototype.findBy = function (col, val) {
  val = String(val);
  return this.find(function (r) { return String(r[col]) === val; });
};

Table_.prototype.get = function (id) { return this.findBy(this.pk, id); };

/**
 * Filas donde col === val usando TextFinder (no lee toda la hoja).
 * Muy rápido para el historial de un número en Messages.
 */
Table_.prototype.findAllExact = function (col, val, limit) {
  if (this._rows) {
    var all = this.filter(function (r) { return String(r[col]) === String(val); });
    return limit ? all.slice(-limit) : all;
  }
  var sh = this.sheet();
  var colIdx = this.headers().indexOf(col);
  if (colIdx === -1 || sh.getLastRow() < 2) return [];
  var rows = sh.getRange(2, colIdx + 1, sh.getLastRow() - 1, 1)
    .createTextFinder(String(val)).matchEntireCell(true).matchCase(true).findAll()
    .map(function (rg) { return rg.getRow(); }).sort(function (a, b) { return a - b; });
  if (limit && rows.length > limit) rows = rows.slice(-limit);
  if (!rows.length) return [];
  // Antes: una consulta por fila (un chat de 200 mensajes = 200 viajes a Sheets).
  // Ahora: se agrupan filas cercanas y se leen en bloque (1 a pocas consultas).
  var self = this, width = this.headers().length, out = [];
  var blocks = [], cur = [rows[0], rows[0]];
  var span = rows[rows.length - 1] - rows[0];
  for (var i = 1; i < rows.length; i++) {
    if (span <= 6000 || rows[i] - cur[1] <= 300) cur[1] = rows[i];
    else { blocks.push(cur); cur = [rows[i], rows[i]]; }
  }
  blocks.push(cur);
  var want = {};
  rows.forEach(function (r) { want[r] = true; });
  blocks.forEach(function (b) {
    var vals = sh.getRange(b[0], 1, b[1] - b[0] + 1, width).getValues();
    for (var j = 0; j < vals.length; j++) if (want[b[0] + j]) out.push(self._toObj(vals[j], b[0] + j));
  });
  return out;
};

Table_.prototype._fill = function (obj) {
  var out = {};
  var cols = SCHEMA[this.name] || this.headers();
  cols.forEach(function (c) { out[c] = obj[c] !== undefined ? obj[c] : ''; });
  for (var k in obj) if (out[k] === undefined) out[k] = obj[k];
  if (this.pk && !out[this.pk] && this.name !== 'Settings') out[this.pk] = uid_(this.name.slice(0, 3).toUpperCase());
  return out;
};

Table_.prototype.insert = function (obj) {
  markDirty_();
  var full = this._fill(obj);
  var sh = this.sheet();
  sh.appendRow(this._toArr(full));
  var row = sh.getLastRow();
  var stored = this._toObj(this._toArr(full), row);
  if (this._rows) this._rows.push(stored);
  return stored;
};

Table_.prototype.insertMany = function (objs) {
  if (!objs.length) return [];
  markDirty_();
  var self = this;
  var fulls = objs.map(function (o) { return self._fill(o); });
  var sh = this.sheet();
  var start = sh.getLastRow() + 1;
  var matrix = fulls.map(function (f) { return self._toArr(f); });
  var rg = sh.getRange(start, 1, matrix.length, this.headers().length);
  rg.setNumberFormat('@');
  rg.setValues(matrix);
  var stored = matrix.map(function (arr, i) { return self._toObj(arr, start + i); });
  if (this._rows) this._rows = this._rows.concat(stored);
  return stored;
};

/** Actualiza una fila ya leída (una sola escritura). */
Table_.prototype.patch = function (rowObj, changes) {
  if (!rowObj || !rowObj._row) return null;
  markDirty_();
  for (var k in changes) rowObj[k] = strToCell_(changes[k]);
  this.sheet().getRange(rowObj._row, 1, 1, this.headers().length).setValues([this._toArr(rowObj)]);
  return rowObj;
};

Table_.prototype.update = function (id, changes) {
  var row = this.get(id);
  if (!row) return null;
  return this.patch(row, changes);
};

/** Escribe varias filas modificadas agrupando rangos contiguos. */
Table_.prototype.patchMany = function (rowObjs) {
  if (!rowObjs.length) return;
  markDirty_();
  var self = this;
  rowObjs.slice().sort(function (a, b) { return a._row - b._row; }).forEach(function (r) {
    self.sheet().getRange(r._row, 1, 1, self.headers().length).setValues([self._toArr(r)]);
  });
};

Table_.prototype.remove = function (id) {
  var row = this.get(id);
  if (!row) return false;
  markDirty_();
  this.sheet().deleteRow(row._row);
  this._rows = null;
  return true;
};

Table_.prototype.invalidate = function () { this._rows = null; this._headers = null; };

/** Ejecuta fn con el candado del script (escrituras concurrentes: webhook + tareas programadas). */
var _LOCK_DEPTH = 0;

function withLock_(fn, waitMs) {
  if (_LOCK_DEPTH > 0) return fn(); // ya estamos dentro del candado
  var lock = LockService.getScriptLock();
  lock.waitLock(waitMs || 20000);
  _LOCK_DEPTH++;
  try {
    // Otra ejecución pudo escribir mientras esperábamos: releer.
    for (var k in _TABLES) _TABLES[k]._rows = null;
    return fn();
  } finally {
    _LOCK_DEPTH--;
    lock.releaseLock();
  }
}

// ── Auditoría ────────────────────────────────────────────────────────────
function audit_(actor, action, entityType, entityId, details) {
  try {
    db_('AuditLogs').insert({
      log_id: uid_('LOG'), timestamp: nowIso_(), actor: actor || 'system', action: action,
      entity_type: entityType || '', entity_id: entityId || '',
      details_json: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : ''
    });
  } catch (e) { Logger.log('audit error: ' + e.message); }
}

;
/* ── 02_Auth.gs ── */
/**
 * WA POWER v2 — 02_Auth.gs
 * Inicio de sesión real (la v1 no verificaba la contraseña), sesiones de 6 h y usuarios con rol.
 *  - admin: todo.  - agent: bandeja, contactos, oportunidades, tareas, envíos.
 *  - La clave maestra APP_SECRET_TOKEN siempre entra como admin.
 */

var SESSION_TTL = 21600; // 6 h (máximo de CacheService)

function hash_(text, salt) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(salt) + '|' + String(text), Utilities.Charset.UTF_8);
  return bytes.map(function (b) { var h = (b & 0xff).toString(16); return h.length === 1 ? '0' + h : h; }).join('');
}

function randomToken_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
}

function safeEqual_(a, b) {
  a = String(a || ''); b = String(b || '');
  if (!a || a.length !== b.length) return false;
  var r = 0;
  for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function auth_login(p) {
  var user = String(p.user || '').trim();
  var pass = String(p.password || '');
  if (!user || !pass) throw new Error('Escribe tu usuario y contraseña.');

  var master = prop_('APP_SECRET_TOKEN');
  if (!master) throw new Error('Falta APP_SECRET_TOKEN. Ejecuta la función "instalar" en Apps Script.');

  var session = null;
  if (safeEqual_(pass, master)) {
    var match = db_('Users').find(function (u) { return norm_(u.name) === norm_(user) || norm_(u.email) === norm_(user); });
    session = { name: match ? match.name : user, role: 'admin', user_id: match ? match.user_id : 'MASTER', phone: match ? match.phone : '' };
  } else {
    var u = db_('Users').find(function (r) {
      return String(r.active) !== 'false' && (norm_(r.name) === norm_(user) || (r.email && norm_(r.email) === norm_(user)));
    });
    if (!u || !safeEqual_(hash_(pass, u.salt), u.password_hash)) {
      audit_(user, 'login_failed', 'user', '', {});
      throw new Error('Usuario o contraseña incorrectos.');
    }
    db_('Users').patch(u, { last_login_at: nowIso_() });
    session = { name: u.name, role: u.role || 'agent', user_id: u.user_id, phone: u.phone };
  }

  var token = randomToken_();
  CacheService.getScriptCache().put('sess_' + token, JSON.stringify(session), SESSION_TTL);
  audit_(session.name, 'login', 'user', session.user_id, { role: session.role });
  return { success: true, token: token, user: session, expires_in: SESSION_TTL };
}

function auth_session_(token) {
  if (!token) return null;
  var master = prop_('APP_SECRET_TOKEN');
  // Compatibilidad: integraciones que envían la clave maestra directamente.
  if (master && safeEqual_(token, master)) return { name: 'api', role: 'admin', user_id: 'MASTER', phone: '' };
  var cache = CacheService.getScriptCache();
  var raw = cache.get('sess_' + token);
  if (!raw) return null;
  cache.put('sess_' + token, raw, SESSION_TTL); // se renueva con el uso
  return JSON.parse(raw);
}

function auth_logout(p) {
  if (p.token) CacheService.getScriptCache().remove('sess_' + p.token);
  return { success: true };
}

/** Usuario registrado para un teléfono (para comandos por WhatsApp). */
function auth_userByPhone_(phone) {
  var p = normPhone_(phone);
  if (!p) return null;
  return db_('Users').find(function (u) {
    return String(u.active) !== 'false' && u.phone && normPhone_(u.phone) === p;
  });
}

function adminPhones_() {
  return db_('Users').filter(function (u) {
    return String(u.active) !== 'false' && u.phone && (u.role === 'admin' || u.role === 'supervisor');
  }).map(function (u) { return normPhone_(u.phone); });
}

// ── Gestión de usuarios (solo admin) ─────────────────────────────────────
function users_list() {
  return {
    success: true,
    data: db_('Users').all().map(function (u) {
      return { user_id: u.user_id, name: u.name, email: u.email, phone: u.phone, role: u.role, active: u.active, last_login_at: u.last_login_at };
    })
  };
}

function users_save(p, me) {
  var t = db_('Users');
  var name = String(p.name || '').trim();
  if (!name) throw new Error('El nombre es obligatorio.');
  var role = ['admin', 'supervisor', 'agent'].indexOf(p.role) !== -1 ? p.role : 'agent';
  var dup = t.find(function (u) { return norm_(u.name) === norm_(name) && u.user_id !== p.user_id; });
  if (dup) throw new Error('Ya existe un usuario con ese nombre.');
  var changes = { name: name, email: String(p.email || '').trim(), phone: p.phone ? normPhone_(p.phone) : '', role: role, active: p.active === false || p.active === 'false' ? 'false' : 'true' };
  if (p.password) {
    if (String(p.password).length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
    changes.salt = randomToken_().slice(0, 16);
    changes.password_hash = hash_(p.password, changes.salt);
  }
  var row;
  if (p.user_id) {
    row = t.update(p.user_id, changes);
    if (!row) throw new Error('Usuario no encontrado.');
  } else {
    if (!p.password) throw new Error('Define una contraseña para el nuevo usuario.');
    changes.user_id = uid_('USR');
    changes.created_at = nowIso_();
    row = t.insert(changes);
  }
  audit_(me.name, p.user_id ? 'user_updated' : 'user_created', 'user', row.user_id, { name: name, role: role });
  return { success: true, user_id: row.user_id };
}

function users_delete(p, me) {
  var ok = db_('Users').remove(p.user_id);
  audit_(me.name, 'user_deleted', 'user', p.user_id, {});
  return { success: ok };
}

;
/* ── 03_WhatsApp.gs ── */
/**
 * WA POWER v2 — 03_WhatsApp.gs
 * Envío por TextMeBot, cola de envíos (campañas y programados), variables de plantillas.
 */

var TEXTMEBOT_SEND_URL = 'https://api.textmebot.com/send.php';
var HUMAN_SOURCES = ['manual', 'command', 'quick-reply', 'template'];

// ── Teléfonos ────────────────────────────────────────────────────────────
function isGroup_(p) { return String(p || '').indexOf('@g.us') !== -1; }

/** Deja solo dígitos (sin +). Números peruanos de 9 dígitos reciben el 51. Los grupos se conservan. */
function normPhone_(p) {
  var s = String(p || '').trim();
  if (!s) return '';
  if (isGroup_(s)) return s;
  s = s.replace(/@(c\.us|s\.whatsapp\.net)$/, '').replace(/\D/g, '');
  var cc = (typeof cfg_ === 'function' ? cfg_('DEFAULT_COUNTRY_CODE') : '51') || '51';
  if (s.length === 9 && s.charAt(0) === '9') s = cc + s;
  return s;
}

/** Número conectado a TextMeBot. A él no se envía nada: WhatsApp no muestra mensajes a uno mismo. */
function ownNumber_() { return normPhone_(cfg_('BOT_NUMBER')); }
var OWN_NUMBER_ERROR = 'Ese es el número conectado a TextMeBot: WhatsApp no te muestra lo que tu número se envía a sí mismo. Usa otro celular o configura un grupo de avisos (Configuración › Conexión).';

var MEDIA_LABEL = { image: '📷 Foto', audio: '🎤 Audio', video: '🎥 Video', sticker: '💟 Sticker', document: '📄 Documento', location: '📍 Ubicación', contact: '👤 Contacto', media: '📎 Archivo', file: '📎 Archivo' };
function mediaLabel_(type) { return MEDIA_LABEL[type] || '📎 Archivo'; }

function recipientParam_(phone) {
  return isGroup_(phone) ? phone : '+' + phone;
}

// ── Variables de plantillas ──────────────────────────────────────────────
function resolveVars_(template, contact, extra) {
  if (!template) return '';
  contact = contact || {};
  if (isGroup_(contact.phone) && !contact.display_name && typeof groupName_ === 'function') contact = { phone: contact.phone, display_name: groupName_(contact.phone) };
  var name = String(contact.display_name || contact.whatsapp_name || '').trim();
  var first = isGroup_(contact.phone) ? name : (name.split(' ')[0] || '');
  var now = new Date();
  var hour = parseInt(fmtDate_(now, 'H'), 10);
  var vars = {
    whatsapp_name: String(contact.whatsapp_name || name || '').trim() || 'hola',
    display_name: name || 'cliente',
    first_name: first || 'hola',
    phone: contact.phone || '',
    email: contact.email || '',
    company: contact.company || '',
    city: contact.city || '',
    custom_1: contact.custom_1 || '',
    custom_2: contact.custom_2 || '',
    company_name: cfg_('COMPANY_NAME'),
    today: fmtDate_(now, 'dd/MM/yyyy'),
    time: fmtDate_(now, 'HH:mm'),
    greeting: hour < 12 ? 'Buenos días' : (hour < 19 ? 'Buenas tardes' : 'Buenas noches'),
    agent: (extra && extra.agent) || ''
  };
  if (extra) for (var k in extra) vars[k] = extra[k];
  return String(template).replace(/\{\{\s*([a-z_0-9]+)\s*\}\}/gi, function (m, key) {
    key = key.toLowerCase();
    return vars[key] !== undefined ? String(vars[key]) : m;
  });
}

// ── Envío inmediato ──────────────────────────────────────────────────────
/**
 * Envía un mensaje por TextMeBot y lo registra.
 * opts: { file_url, document_url, source, agent, campaign_id, schedule_id, rule_id, force }
 */
function wa_send_(recipient, text, opts) {
  opts = opts || {};
  var phone = normPhone_(recipient);
  if (!phone) return { success: false, error: 'Falta el destinatario.' };
  if (phone === ownNumber_()) return { success: false, error: OWN_NUMBER_ERROR };
  text = String(text || '');
  if (!text.trim() && !opts.file_url && !opts.document_url && !opts.audio_url) return { success: false, error: 'El mensaje está vacío.' };

  var contact = isGroup_(phone) ? null : db_('Contacts').findBy('phone', phone);
  if (!opts.force && contact && String(contact.do_not_contact) === 'true') {
    return { success: false, error: 'El contacto pidió no recibir mensajes (No contactar).' };
  }

  var apiKey = prop_('TEXTMEBOT_API_KEY');
  if (!apiKey) return { success: false, error: 'Falta la API key de TextMeBot (Configuración).' };

  // Espera mínima entre envíos
  var gap = cfgNum_('RATE_LIMIT_SECONDS', 3) * 1000;
  var last = parseInt(prop_('LAST_SEND_TIME') || '0', 10);
  var wait = last + gap - Date.now();
  if (wait > 0) Utilities.sleep(Math.min(wait, 15000));

  var url = TEXTMEBOT_SEND_URL + '?recipient=' + encodeURIComponent(recipientParam_(phone)) +
    '&apikey=' + encodeURIComponent(apiKey) + '&json=yes';
  if (text) url += '&text=' + encodeURIComponent(text);
  if (opts.file_url) url += '&file=' + encodeURIComponent(opts.file_url);
  if (opts.document_url) url += '&document=' + encodeURIComponent(opts.document_url);
  if (opts.audio_url) url += '&audio=' + encodeURIComponent(opts.audio_url);

  var ok = false, err = '';
  try {
    var res = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true, followRedirects: true });
    var parsed = wa_parseResponse_(res.getResponseCode(), res.getContentText());
    ok = parsed.ok;
    err = parsed.ok ? '' : parsed.error;
  } catch (e) {
    err = 'No se pudo conectar con TextMeBot: ' + e.message;
  }
  setProp_('LAST_SEND_TIME', Date.now());

  var msg = recordOutbound_(phone, text, {
    file_url: opts.file_url, document_url: opts.document_url, audio_url: opts.audio_url, status: ok ? 'sent' : 'failed',
    source: opts.source || 'manual', agent: opts.agent || '', rule_id: opts.rule_id,
    campaign_id: opts.campaign_id, schedule_id: opts.schedule_id, error: err
  });

  return ok ? { success: true, message_id: msg.message_id } : { success: false, error: err, message_id: msg.message_id };
}

function wa_parseResponse_(code, body) {
  var text = String(body || '');
  if (code < 200 || code >= 300) return { ok: false, error: 'TextMeBot respondió HTTP ' + code + ': ' + truncate_(text, 180) };
  try {
    var j = JSON.parse(text);
    var st = String(j.status || j.result || j.success || '').toLowerCase();
    if (/success|ok|sent|queued|true/.test(st)) return { ok: true };
    if (st) return { ok: false, error: 'TextMeBot: ' + truncate_(j.message || j.error || text, 180) };
  } catch (e) { /* respuesta en texto/HTML */ }
  var plain = text.replace(/<[^>]+>/g, ' ');
  if (/success|enviado|queued/i.test(plain)) return { ok: true };
  if (/error|fail|invalid|incorrect|not connected|disconnected|banned|limit|wrong/i.test(plain)) {
    return { ok: false, error: 'TextMeBot: ' + truncate_(plain.replace(/\s+/g, ' ').trim(), 180) };
  }
  return { ok: true };
}

/** Registra un mensaje saliente y actualiza conversación y contacto. */
function recordOutbound_(phone, text, meta) {
  return withLock_(function () {
    var now = nowIso_();
    var msg = db_('Messages').insert({
      message_id: uid_('MSG'), phone: phone, direction: 'out', timestamp: now, type: meta.file_url ? 'image' : (meta.document_url ? 'document' : (meta.audio_url ? 'audio' : 'text')),
      body: text, file_url: meta.file_url || '', document_url: meta.document_url || '', audio_url: meta.audio_url || '', status: meta.status,
      source: meta.source || 'manual', agent: meta.agent || '', rule_id: meta.rule_id || '',
      campaign_id: meta.campaign_id || '', schedule_id: meta.schedule_id || '', error: meta.error || ''
    });
    msgCacheAppend_(msg);
    if (meta.status === 'sent' && isGroup_(phone)) {
      var g = db_('Groups').get(phone);
      if (g) db_('Groups').patch(g, { last_sent_at: now });
    }
    if (meta.status === 'sent' && !isGroup_(phone)) {
      var human = HUMAN_SOURCES.indexOf(meta.source) !== -1;
      var conv = db_('Conversations').findBy('phone', phone);
      if (conv) {
        var ch = {
          last_message: truncate_(text || '[adjunto]', 200), last_message_at: now, last_direction: 'out',
          total_messages: (parseInt(conv.total_messages, 10) || 0) + 1, updated_at: now
        };
        if (human) {
          ch.waiting_since = '';
          ch.last_human_reply_at = now;
          ch.unread = '0';
          if (conv.status === 'needs-human' || conv.status === 'resolved') ch.status = 'open';
        }
        db_('Conversations').patch(conv, ch);
      } else if (human || meta.source === 'campaign' || meta.source === 'scheduler') {
        db_('Conversations').insert({
          conversation_id: uid_('CNV'), phone: phone, whatsapp_name: '', last_message: truncate_(text, 200),
          last_message_at: now, last_direction: 'out', total_messages: 1, status: 'open', unread: '0', updated_at: now
        });
      }
      var c = db_('Contacts').findBy('phone', phone);
      if (c) db_('Contacts').patch(c, { last_outbound_at: now });
    }
    return msg;
  });
}

// ── Cola de envíos ───────────────────────────────────────────────────────
function queue_add_(items) {
  var now = nowIso_();
  var rows = items.map(function (it) {
    return {
      queue_id: uid_('QUE'), created_at: now, recipient: normPhone_(it.recipient), body: it.body || '',
      file_url: it.file_url || '', document_url: it.document_url || '', audio_url: it.audio_url || '', source: it.source || 'queue',
      agent: it.agent || '', campaign_id: it.campaign_id || '', schedule_id: it.schedule_id || '',
      not_before: it.not_before || now, status: it.status || 'pending', attempts: '0', sent_at: '', error: ''
    };
  });
  withLock_(function () { db_('Queue').insertMany(rows); });
  var first = rows.reduce(function (m, r) { return !m || r.not_before < m ? r.not_before : m; }, '');
  wake_(first);
  return rows.length;
}

/** Procesa la cola hasta el tiempo límite. Devuelve { sent, failed, remaining }. */
function queue_process_(deadlineMs) {
  var q = db_('Queue');
  q.invalidate();
  var nowIso = nowIso_();
  var due = q.filter(function (r) { return r.status === 'pending' && (!r.not_before || r.not_before <= nowIso); })
    .sort(function (a, b) { return a.not_before < b.not_before ? -1 : 1; });

  var sent = 0, failed = 0, campStats = {};
  var campDelay = cfgNum_('CAMPAIGN_DELAY_SECONDS', 8) * 1000;

  // Ítems que quedaron "enviando" por un corte (más de 10 min) vuelven a la cola
  var stale = new Date(Date.now() - 600000).toISOString();
  var stuck = q.filter(function (r) { return r.status === 'sending' && (r.sent_at || r.created_at) < stale; });
  if (stuck.length) withLock_(function () {
    stuck.forEach(function (r) { var f = db_('Queue').get(r.queue_id); if (f && f.status === 'sending') db_('Queue').patch(f, { status: 'pending' }); });
  });

  for (var i = 0; i < due.length; i++) {
    if (Date.now() > deadlineMs) break;
    var item = due[i];
    // Reclamar el ítem (otra ejecución podría estar enviando la misma cola)
    var claimed = withLock_(function () {
      var f = db_('Queue').get(item.queue_id);
      if (!f || f.status !== 'pending') return false;
      if (f.campaign_id) {
        var camp = db_('Campaigns').get(f.campaign_id);
        if (camp && (camp.status === 'paused' || camp.status === 'cancelled')) return false;
      }
      db_('Queue').patch(f, { status: 'sending', sent_at: nowIso_() });
      return true;
    });
    if (!claimed) continue;
    var res = wa_send_(item.recipient, item.body, {
      file_url: item.file_url, document_url: item.document_url, audio_url: item.audio_url, source: item.source,
      agent: item.agent, campaign_id: item.campaign_id, schedule_id: item.schedule_id
    });
    var attempts = (parseInt(item.attempts, 10) || 0) + 1;
    var ch = { attempts: attempts };
    var dnc = /No contactar/.test(res.error || '');
    if (res.success) { ch.status = 'sent'; ch.sent_at = nowIso_(); ch.error = ''; sent++; }
    else if (attempts < 3 && !dnc) { ch.status = 'pending'; ch.sent_at = ''; ch.not_before = new Date(Date.now() + 120000 * attempts).toISOString(); ch.error = res.error; }
    else { ch.status = dnc ? 'skipped' : 'failed'; ch.error = res.error; failed++; }
    withLock_(function () {
      var fresh = db_('Queue').get(item.queue_id);
      if (fresh) db_('Queue').patch(fresh, ch);
    });

    if (item.campaign_id && ch.status !== 'pending') {
      var s = campStats[item.campaign_id] || (campStats[item.campaign_id] = { sent: 0, failed: 0 });
      if (ch.status === 'sent') s.sent++; else s.failed++;
    }
    if (item.source === 'campaign' && i < due.length - 1) Utilities.sleep(campDelay + Math.floor(Math.random() * 4000));
  }

  for (var cid in campStats) campaign_bump_(cid, campStats[cid].sent, campStats[cid].failed);
  var remaining = db_('Queue').filter(function (r) { return r.status === 'pending'; }).length;
  return { sent: sent, failed: failed, remaining: remaining };
}

/** Programa la siguiente activación del proceso automático (tick). */
function wake_(when) {
  if (!when) return;
  var t = new Date(when).getTime();
  if (isNaN(t)) return;
  var cur = parseInt(prop_('NEXT_WAKE_AT') || '0', 10);
  if (!cur || t < cur) setProp_('NEXT_WAKE_AT', t);
}

/** Aviso a administradores por WhatsApp (no queda como conversación de cliente). */
/**
 * A dónde van los avisos, recordatorios y el resumen diario:
 *  - Si hay un grupo de avisos configurado → a ese grupo (ideal si usas tu propio número como bot).
 *  - Si no → a los celulares de los usuarios, excepto el número del bot.
 */
function notifyTargets_(phones) {
  var group = cfg_('NOTIFY_GROUP');
  if (group && isGroup_(group)) return [group];
  var own = ownNumber_(), seen = {};
  return (phones || adminPhones_()).map(normPhone_).filter(function (p) {
    if (!p || p === own || seen[p]) return false;
    seen[p] = true;
    return true;
  });
}

function notifyAdmins_(text, exceptPhone) {
  notifyTargets_().forEach(function (p) {
    if (p !== exceptPhone) wa_send_(p, text, { source: 'system', force: true });
  });
}

;
/* ── 04_Inbound.gs ── */
/**
 * WA POWER v2 — 04_Inbound.gs
 * Mensajes entrantes (webhook de TextMeBot) y motor de reglas.
 *
 * Orden de decisión para cada mensaje:
 *   1. ¿Es un usuario del sistema escribiendo un comando (/ayuda, /pendientes…)? → módulo de comandos.
 *   2. Se guarda: mensaje, contacto, conversación (no leídos, espera).
 *   3. Si el contacto es "No contactar" o el bot está apagado → termina.
 *   4. Reglas por prioridad (primera que coincide). Acciones: responder, etiquetar, cambiar estado,
 *      crear/mover oportunidad, asignar, avisar al administrador.
 *   5. Sin regla: bienvenida (contacto nuevo) → fuera de horario → mensaje por defecto (si están activos).
 */

function inbound_handle_(data) {
  var rawFrom = data.from || data.sender || data.phone || data.number || data.author || '';
  var chat = String(data.chat_id || data.chatId || data.group || '');
  var groupMsg = isGroup_(rawFrom) || isGroup_(chat) || String(data.is_group || data.isGroup || '') === 'true';
  var body = String(data.message !== undefined ? data.message : (data.text || data.body || '')).trim();
  var type = String(data.type || (data.file ? 'image' : 'text')).toLowerCase();
  var file = String(data.file || data.file_url || data.media || data.url || '');
  var name = String(data.from_name || data.name || data.pushname || data.sender_name || '').trim();

  // Fotos, audios y stickers: TextMeBot avisa con textos como "[unknown]" o "[image]"
  var mm = body.match(/^\[(unknown|image|imagen|photo|audio|ptt|voice|video|sticker|document|documento|file|location|ubicacion|contact|vcard)\]$/i);
  if (mm) {
    var k = mm[1].toLowerCase();
    type = ({ imagen: 'image', photo: 'image', ptt: 'audio', voice: 'audio', documento: 'document', file: 'document', ubicacion: 'location', vcard: 'contact' })[k] || (k === 'unknown' ? (file ? 'document' : 'media') : k);
    body = '';
  }
  var fromMe = /^(true|1|yes)$/i.test(String(data.fromMe || data.from_me || data.is_from_me || data.self || ''));

  if (groupMsg) {
    // Se registra el grupo para poder enviarle mensajes programados (sus mensajes no se guardan)
    var gid = isGroup_(chat) ? chat : (isGroup_(rawFrom) ? rawFrom : '');
    if (gid) group_touch_(normPhone_(gid), String(data.group_name || data.subject || data.chat_name || data.groupName || ''));
    // Comandos escritos en el grupo de avisos (por un usuario registrado o por tu propio número)
    var ng = cfg_('NOTIFY_GROUP');
    if (gid && ng && normPhone_(gid) === ng && /^[\/#!]/.test(body) && cfgBool_('COMMANDS_ENABLED')) {
      var author = normPhone_(data.author || data.participant || data.sender_phone || (isGroup_(rawFrom) ? '' : rawFrom));
      var guser = author ? auth_userByPhone_(author) : null;
      if (guser || fromMe || (author && author === ownNumber_())) return cmd_run_(guser || ownerUser_(), body, { reply: true, phone: ng });
    }
    if (cfgBool_('IGNORE_GROUPS')) return { processed: false, reason: 'group_ignored' };
  }

  var phone = normPhone_(groupMsg && chat ? chat : rawFrom);
  if (!phone) return { processed: false, reason: 'no_sender' };

  // Número del bot: se aprende solo del campo "to" del webhook
  var own = ownNumber_();
  var to = normPhone_(data.to || data.receiver || data.recipient || '');
  if (!own && /^\d{10,15}$/.test(to)) { setCfg_('BOT_NUMBER', to); own = to; }
  // Mensajes de tu propio número: solo comandos (respuesta al grupo de avisos), nunca como cliente
  if (fromMe || (own && phone === own)) {
    if (/^[\/#!]/.test(body) && cfgBool_('COMMANDS_ENABLED')) {
      return cmd_run_(auth_userByPhone_(phone) || ownerUser_(), body, { reply: true, phone: cfg_('NOTIFY_GROUP') || phone });
    }
    return { processed: false, reason: 'own_message' };
  }

  // Reintentos del webhook: ignorar el mismo mensaje en 45 s
  var cache = CacheService.getScriptCache();
  var dedupeKey = 'in_' + hash_(phone + '|' + body + '|' + file, 'd').slice(0, 32);
  if (cache.get(dedupeKey)) return { processed: false, reason: 'duplicate' };
  cache.put(dedupeKey, '1', 45);

  // 1. Comandos de usuarios del sistema
  var user = groupMsg ? null : auth_userByPhone_(phone);
  if (user && cfgBool_('COMMANDS_ENABLED') && /^[\/#!]/.test(body)) {
    return cmd_run_(user, body, { reply: true, phone: phone });
  }

  // 2. Guardar
  var saved = withLock_(function () {
    var now = nowIso_();
    var msg = db_('Messages').insert({
      message_id: uid_('MSG'), phone: phone, direction: 'in', timestamp: now, type: type, body: body,
      file_url: file, status: 'received', source: 'whatsapp'
    });
    msgCacheAppend_(msg);
    var cr = contact_touch_(phone, name, now);
    var conv = db_('Conversations').findBy('phone', phone);
    if (conv) {
      db_('Conversations').patch(conv, {
        whatsapp_name: name || conv.whatsapp_name, last_message: truncate_(body || mediaLabel_(type), 200),
        last_message_at: now, last_direction: 'in', total_messages: (parseInt(conv.total_messages, 10) || 0) + 1,
        unread: (parseInt(conv.unread, 10) || 0) + 1, waiting_since: conv.waiting_since || now,
        status: conv.status === 'resolved' || conv.status === 'active' || !conv.status ? 'open' : conv.status, updated_at: now
      });
    } else {
      conv = db_('Conversations').insert({
        conversation_id: uid_('CNV'), phone: phone, whatsapp_name: name, last_message: truncate_(body || mediaLabel_(type), 200),
        last_message_at: now, last_direction: 'in', total_messages: 1, unread: 1, waiting_since: now, status: 'open', updated_at: now
      });
    }
    return { msg: msg, contact: cr.contact, isNew: cr.isNew, conv: conv };
  });

  var contact = saved.contact;
  if (String(contact.do_not_contact) === 'true') return { processed: true, autoReply: false, reason: 'do_not_contact' };
  var gate = bot_allowed_(contact, saved.conv);
  if (!gate.ok) return { processed: true, autoReply: false, reason: gate.reason };

  // 4. Reglas
  var match = rules_match_(body, contact, saved.isNew);
  if (match) {
    rules_apply_(match, contact, saved.msg, body);
    return { processed: true, autoReply: !!match.response, rule_id: match.rule.rule_id, rule: match.rule.rule_name };
  }

  // 5. Sin regla
  var sentWhat = '';
  if (saved.isNew && cfgBool_('WELCOME_ENABLED')) {
    wa_send_(phone, resolveVars_(cfg_('WELCOME_MESSAGE'), contact), { source: 'auto', rule_id: 'WELCOME' });
    sentWhat = 'welcome';
  } else if (cfgBool_('AWAY_ENABLED') && !inBusinessHours_() && cooldownOk_('away', phone, 720)) {
    wa_send_(phone, resolveVars_(cfg_('AWAY_MESSAGE'), contact), { source: 'auto', rule_id: 'AWAY' });
    sentWhat = 'away';
  } else if (cfgBool_('FALLBACK_ENABLED') && cooldownOk_('fallback', phone, 720)) {
    wa_send_(phone, resolveVars_(cfg_('DEFAULT_FALLBACK_MESSAGE'), contact), { source: 'auto', rule_id: 'FALLBACK' });
    sentWhat = 'fallback';
  }
  return { processed: true, autoReply: !!sentWhat, reason: sentWhat || 'no_rule_matched' };
}

/** Crea o actualiza el contacto de un número. */
function contact_touch_(phone, name, now) {
  var t = db_('Contacts');
  var c = t.findBy('phone', phone);
  if (c) {
    var ch = { last_seen_at: now, last_inbound_at: now, updated_at: now };
    if (name && name !== c.whatsapp_name) ch.whatsapp_name = name;
    if (name && !c.display_name) ch.display_name = name;
    t.patch(c, ch);
    return { contact: c, isNew: false };
  }
  c = t.insert({
    contact_id: uid_('CON'), phone: phone, whatsapp_name: name, display_name: name, tags: '', status: 'active',
    source: 'whatsapp', first_seen_at: now, last_seen_at: now, last_inbound_at: now, do_not_contact: 'false',
    created_at: now, updated_at: now
  });
  return { contact: c, isNew: true };
}

/**
 * ¿Puede el bot responder en este chat? Orden de decisión:
 *  1. Bot general apagado → no.
 *  2. Chat con respuestas automáticas "siempre apagadas" → no; "siempre encendidas" → sí (salta 3 y 4).
 *  3. Etiquetas excluidas (familia, proveedor…) → no. En modo "solo permitidos", sin etiqueta permitida → no.
 *  4. Un asesor respondió hace poco (toma humana) → no, para no interrumpir la conversación.
 */
function bot_allowed_(contact, conv) {
  if (!cfgBool_('BOT_ENABLED')) return { ok: false, reason: 'bot_off' };
  var mode = String(contact.bot || '');
  if (mode === 'off') return { ok: false, reason: 'chat_bot_off' };
  if (mode !== 'on') {
    var tags = splitTags_(contact.tags).map(norm_);
    var excl = splitTags_(cfg_('BOT_EXCLUDE_TAGS')).map(norm_);
    if (excl.some(function (t) { return tags.indexOf(t) !== -1; })) return { ok: false, reason: 'excluded_tag' };
    if (cfg_('BOT_SCOPE') === 'allowlist') {
      var only = splitTags_(cfg_('BOT_ONLY_TAGS')).map(norm_);
      if (!only.some(function (t) { return tags.indexOf(t) !== -1; })) return { ok: false, reason: 'not_allowed' };
    }
  }
  var takeover = cfgNum_('HUMAN_TAKEOVER_MIN', 120);
  if (mode !== 'on' && takeover > 0 && conv && conv.last_human_reply_at && minutesSince_(conv.last_human_reply_at) < takeover) {
    return { ok: false, reason: 'human_active' };
  }
  return { ok: true };
}

/** Explicación en palabras para el portal. */
function bot_reason_text_(reason) {
  return ({
    bot_off: 'El bot está apagado para todos.', chat_bot_off: 'Las respuestas automáticas están apagadas en este chat.',
    excluded_tag: 'El contacto tiene una etiqueta excluida del bot.', not_allowed: 'El bot solo responde a contactos con etiquetas permitidas.',
    human_active: 'Un asesor respondió hace poco: el bot espera para no interrumpir.'
  })[reason] || '';
}

function cooldownOk_(kind, phone, minutes) {
  var cache = CacheService.getScriptCache();
  var key = 'cd_' + kind + '_' + phone;
  if (cache.get(key)) return false;
  cache.put(key, '1', Math.min(21600, Math.max(1, minutes) * 60));
  return true;
}

function inBusinessHours_(date) {
  var d = date || new Date();
  var dow = parseInt(fmtDate_(d, 'u'), 10); // 1 = lunes … 7 = domingo
  var days = String(cfg_('BH_DAYS') || '').split(',').map(function (x) { return parseInt(x, 10); });
  if (days.indexOf(dow) === -1) return false;
  var hm = fmtDate_(d, 'HH:mm');
  return hm >= (cfg_('BH_START') || '00:00') && hm < (cfg_('BH_END') || '23:59');
}

// ── Motor de reglas ──────────────────────────────────────────────────────
function rules_active_() {
  return db_('AutomationRules').filter(function (r) { return String(r.enabled) === 'true'; })
    .sort(function (a, b) { return (parseFloat(a.priority) || 99) - (parseFloat(b.priority) || 99); });
}

/** Palabras clave separadas por coma: "precio, costo, cuánto cuesta". */
function rule_keywords_(rule) {
  return String(rule.keyword || '').split(',').map(norm_).filter(function (k) { return k; });
}

function escapeRe_(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function rule_test_(rule, text, isNew) {
  var trigger = String(rule.trigger_type || 'keyword');
  if (trigger === 'first_message') return !!isNew;
  var type = String(rule.match_type || 'contains').toLowerCase();
  if (trigger === 'any' || type === 'any') return true;
  var msg = norm_(text);
  if (!msg) return false;
  var kws = rule_keywords_(rule);
  if (type === 'regex') {
    try { return new RegExp(String(rule.keyword), 'i').test(text) || new RegExp(String(rule.keyword), 'i').test(msg); }
    catch (e) { return false; }
  }
  for (var i = 0; i < kws.length; i++) {
    var k = kws[i];
    switch (type) {
      case 'exact': if (msg === k) return true; break;
      case 'starts_with': if (msg.indexOf(k) === 0) return true; break;
      case 'ends_with': if (msg.slice(-k.length) === k) return true; break;
      case 'word': if (new RegExp('(^|[^a-z0-9ñ])' + escapeRe_(k) + '([^a-z0-9ñ]|$)').test(msg)) return true; break;
      default: if (msg.indexOf(k) !== -1) return true;
    }
  }
  return false;
}

/** Condiciones por etiqueta de cada regla: "solo para" y "excepto". */
function rule_conditionsOk_(rule, contact) {
  var tags = splitTags_(contact && contact.tags).map(norm_);
  var only = splitTags_(rule.only_tags).map(norm_);
  var except = splitTags_(rule.except_tags).map(norm_);
  if (only.length && !only.some(function (t) { return tags.indexOf(t) !== -1; })) return false;
  if (except.some(function (t) { return tags.indexOf(t) !== -1; })) return false;
  return true;
}

function rules_match_(text, contact, isNew) {
  var rules = rules_active_();
  for (var i = 0; i < rules.length; i++) {
    var r = rules[i];
    if (!rule_conditionsOk_(r, contact)) continue;
    if (!rule_test_(r, text, isNew)) continue;
    var cd = parseFloat(r.cooldown_minutes);
    if (isNaN(cd)) cd = cfgNum_('AUTO_REPLY_COOLDOWN_MIN', 60);
    var response = r.response_template || r.fallback_response || '';
    // Si ya respondimos esta regla hace poco, no repetimos el texto, pero sí aplicamos acciones.
    var canReply = !response || cd <= 0 || cooldownOk_('r' + r.rule_id, contact.phone, cd);
    return { rule: r, response: canReply ? resolveVars_(response, contact) : '' };
  }
  return null;
}

function rules_apply_(match, contact, msg, body) {
  var r = match.rule;
  var phone = contact.phone;

  if (match.response || r.file_url) {
    wa_send_(phone, match.response, { source: 'auto', rule_id: r.rule_id, file_url: r.file_url || '' });
  }

  withLock_(function () {
    var now = nowIso_();
    var m = db_('Messages').get(msg.message_id);
    if (m) db_('Messages').patch(m, { rule_id: r.rule_id, status: match.response ? 'auto-replied' : 'received' });

    var conv = db_('Conversations').findBy('phone', phone);
    var convCh = {};
    if (r.mark_status === 'needs-human') convCh.status = 'needs-human';
    else if (r.mark_status === 'resolved') { convCh.status = 'resolved'; convCh.waiting_since = ''; }
    else if (r.mark_status === 'pending') convCh.status = 'pending';
    else if (match.response) { convCh.waiting_since = ''; convCh.unread = '0'; } // el bot ya contestó
    if (r.assign_to) convCh.assigned_to = r.assign_to;
    if (conv && Object.keys(convCh).length) db_('Conversations').patch(conv, convCh);

    var c = db_('Contacts').findBy('phone', phone);
    if (c) {
      var cc = {};
      if (r.mark_status === 'do_not_contact') cc.do_not_contact = 'true';
      if (r.tags_to_add) cc.tags = mergeTags_(c.tags, r.tags_to_add);
      if (r.assign_to && !c.owner) cc.owner = r.assign_to;
      if (Object.keys(cc).length) { cc.updated_at = now; db_('Contacts').patch(c, cc); }
    }

    if (r.deal_stage) deal_upsertForPhone_(phone, r.deal_stage, { title: 'Consulta: ' + truncate_(body, 40), owner: r.assign_to || '' });

    var rr = db_('AutomationRules').get(r.rule_id);
    if (rr) db_('AutomationRules').patch(rr, { hits: (parseInt(rr.hits, 10) || 0) + 1, last_hit_at: now });
  });

  if (String(r.notify_admin) === 'true') {
    var who = contact.display_name || contact.whatsapp_name || phone;
    notifyAdmins_('🔔 *' + r.rule_name + '*\n' + who + ' (+' + phone + ') escribió:\n_' + truncate_(body, 300) + '_\n\nResponde con: /r ' + phone + ' tu mensaje');
  }
}

function mergeTags_(current, add) {
  var set = {};
  String(current || '').split(',').concat(String(add || '').split(',')).forEach(function (t) {
    t = t.trim();
    if (t) set[t.toLowerCase()] = t;
  });
  return Object.keys(set).map(function (k) { return set[k]; }).join(', ');
}

/** Probar una regla o un texto contra todas las reglas (sin enviar nada). */
function rules_test(p) {
  var contact = { whatsapp_name: 'Cliente de prueba', display_name: 'Cliente de prueba', phone: '51999999999', tags: p.tags || '' };
  if (p.phone) {
    var real = db_('Contacts').findBy('phone', normPhone_(p.phone));
    if (real) {
      contact = real;
      var gate = bot_allowed_(real, db_('Conversations').findBy('phone', real.phone));
      if (!gate.ok) return { success: true, matched: false, blocked: gate.reason, blocked_text: bot_reason_text_(gate.reason) };
    }
  }
  var text = String(p.test_message || '');
  if (p.rule_id) {
    var r = db_('AutomationRules').get(p.rule_id);
    if (!r) throw new Error('Regla no encontrada.');
    var ok = rule_test_(r, text, false);
    return { success: true, matched: ok, rule_id: r.rule_id, rule_name: r.rule_name, response: ok ? resolveVars_(r.response_template, contact) : '' };
  }
  var rules = rules_active_();
  for (var i = 0; i < rules.length; i++) {
    if (rule_conditionsOk_(rules[i], contact) && rule_test_(rules[i], text, false)) {
      return { success: true, matched: true, rule_id: rules[i].rule_id, rule_name: rules[i].rule_name, response: resolveVars_(rules[i].response_template, contact), mark_status: rules[i].mark_status };
    }
  }
  return { success: true, matched: false, in_hours: inBusinessHours_() };
}

function rules_list() {
  return { success: true, data: db_('AutomationRules').all().slice().sort(function (a, b) { return (parseFloat(a.priority) || 99) - (parseFloat(b.priority) || 99); }) };
}

function rules_save(p, me) {
  var t = db_('AutomationRules');
  var fields = ['rule_name', 'enabled', 'priority', 'trigger_type', 'keyword', 'match_type', 'response_template', 'tags_to_add',
    'mark_status', 'file_url', 'deal_stage', 'assign_to', 'notify_admin', 'cooldown_minutes', 'only_tags', 'except_tags'];
  var ch = { updated_at: nowIso_() };
  fields.forEach(function (f) { if (p[f] !== undefined) ch[f] = p[f]; });
  if (!p.rule_id) {
    if (!ch.rule_name) throw new Error('Ponle un nombre a la regla.');
    if ((ch.trigger_type || 'keyword') === 'keyword' && !ch.keyword && ch.match_type !== 'any') throw new Error('Escribe al menos una palabra clave.');
    ch.rule_id = uid_('RULE');
    ch.created_at = ch.updated_at;
    ch.enabled = ch.enabled || 'true';
    ch.priority = ch.priority || '10';
    ch.match_type = ch.match_type || 'word';
    ch.trigger_type = ch.trigger_type || 'keyword';
    ch.hits = '0';
    t.insert(ch);
  } else if (!t.update(p.rule_id, ch)) throw new Error('Regla no encontrada.');
  CacheService.getScriptCache().remove('rules_v2');
  audit_(me.name, p.rule_id ? 'rule_updated' : 'rule_created', 'rule', p.rule_id || ch.rule_id, { name: ch.rule_name });
  return { success: true, rule_id: p.rule_id || ch.rule_id };
}

function rules_delete(p, me) {
  var ok = db_('AutomationRules').remove(p.rule_id);
  audit_(me.name, 'rule_deleted', 'rule', p.rule_id, {});
  return { success: ok };
}

;
/* ── 05_CRM.gs ── */
/**
 * WA POWER v2 — 05_CRM.gs
 * Contactos, conversaciones, notas, oportunidades (embudo), tareas, plantillas y respuestas rápidas.
 */

function contactName_(c, phone) {
  if (!c && isGroup_(phone) && typeof groupName_ === 'function') return groupName_(phone);
  return (c && (c.display_name || c.whatsapp_name)) || ('+' + phone);
}

function splitTags_(s) {
  return String(s || '').split(',').map(function (t) { return t.trim(); }).filter(function (t) { return t; });
}

// ── Conversaciones ───────────────────────────────────────────────────────
function conv_list(p, me) {
  return cached_('cl_' + norm_(me.name) + '_' + (p.filter || 'all') + '_' + norm_(p.q || '') + '_' + (p.limit || ''), 120, function () { return conv_list_(p, me); }, true);
}

function conv_list_(p, me) {
  var contacts = {};
  db_('Contacts').all().forEach(function (c) { contacts[c.phone] = c; });
  var filter = p.filter || 'all';
  var q = norm_(p.q || '');
  var rows = db_('Conversations').all().filter(function (cv) {
    if (!cv.phone || isGroup_(cv.phone)) return false;
    var st = cv.status === 'active' ? 'open' : cv.status;
    if (filter === 'waiting' && !cv.waiting_since) return false;
    if (filter === 'human' && st !== 'needs-human') return false;
    if (filter === 'pending' && st !== 'pending') return false;
    if (filter === 'resolved' && st !== 'resolved') return false;
    if (filter === 'open' && st === 'resolved') return false;
    if (filter === 'mine' && norm_(cv.assigned_to) !== norm_(me.name)) return false;
    if (filter === 'unread' && !(parseInt(cv.unread, 10) > 0)) return false;
    if (q) {
      var c = contacts[cv.phone] || {};
      var hay = norm_([cv.phone, cv.whatsapp_name, c.display_name, c.tags, cv.last_message].join(' '));
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }).map(function (cv) {
    var c = contacts[cv.phone] || {};
    return {
      phone: cv.phone, name: contactName_(c, cv.phone), last_message: cv.last_message, last_message_at: cv.last_message_at,
      last_direction: cv.last_direction, unread: parseInt(cv.unread, 10) || 0, status: cv.status === 'active' ? 'open' : (cv.status || 'open'),
      assigned_to: cv.assigned_to, waiting_since: cv.waiting_since, tags: c.tags || '', dnc: String(c.do_not_contact) === 'true', bot: c.bot || ''
    };
  });
  rows.sort(function (a, b) {
    if (filter === 'waiting') return a.waiting_since < b.waiting_since ? -1 : 1;
    return a.last_message_at < b.last_message_at ? 1 : -1;
  });
  var limit = parseInt(p.limit, 10) || 200;
  return { success: true, data: rows.slice(0, limit), total: rows.length, counts: conv_counts_(me) };
}

function conv_counts_(me) {
  var out = { all: 0, waiting: 0, human: 0, pending: 0, unread: 0, mine: 0, resolved: 0 };
  db_('Conversations').all().forEach(function (cv) {
    if (!cv.phone || isGroup_(cv.phone)) return;
    out.all++;
    if (cv.waiting_since) out.waiting++;
    if (cv.status === 'needs-human') out.human++;
    if (cv.status === 'pending') out.pending++;
    if (cv.status === 'resolved') out.resolved++;
    if (parseInt(cv.unread, 10) > 0) out.unread++;
    if (me && norm_(cv.assigned_to) === norm_(me.name) && cv.status !== 'resolved') out.mine++;
  });
  return out;
}

// ── Historial de cada chat en caché (se actualiza al guardar cada mensaje) ──
var MSG_CACHE_N = 60;
function msgOut_(m) {
  return { id: m.message_id, dir: m.direction, at: m.timestamp, body: truncate_(m.body, 4000), type: m.type, file_url: m.file_url, document_url: m.document_url, audio_url: m.audio_url, status: m.status, source: m.source, agent: m.agent, error: m.error, rule_id: m.rule_id };
}
function msgCacheGet_(phone) {
  var raw = CacheService.getScriptCache().get('mc_' + phone);
  return raw ? JSON.parse(raw) : null;
}
function msgCachePut_(phone, list) {
  try { CacheService.getScriptCache().put('mc_' + phone, JSON.stringify(list.slice(-MSG_CACHE_N)), 3600); }
  catch (e) { CacheService.getScriptCache().remove('mc_' + phone); }
}
/** Se llama dentro del candado al guardar un mensaje: si el chat está en caché, se le agrega. */
function msgCacheAppend_(m) {
  try {
    var list = msgCacheGet_(m.phone);
    if (list) { list.push(msgOut_(m)); msgCachePut_(m.phone, list); }
  } catch (e) { CacheService.getScriptCache().remove('mc_' + m.phone); }
}

/** Chat + ficha 360 del contacto en una sola llamada. before = traer mensajes más antiguos. */
function conv_get(p) {
  var phone = normPhone_(p.phone);
  if (!phone) throw new Error('Falta el número.');
  var limit = Math.min(parseInt(p.limit, 10) || MSG_CACHE_N, 300);
  var contact = db_('Contacts').findBy('phone', phone);
  var conv = db_('Conversations').findBy('phone', phone);
  var out;
  if (p.before) {
    var older = db_('Messages').findAllExact('phone', phone).filter(function (m) { return m.timestamp < p.before; })
      .sort(function (a, b) { return a.timestamp < b.timestamp ? -1 : 1; });
    return { success: true, phone: phone, messages: older.slice(-limit).map(msgOut_), more: older.length > limit };
  }
  var cachedList = limit <= MSG_CACHE_N ? msgCacheGet_(phone) : null;
  // Si la caché quedó atrás respecto de la conversación, se reconstruye
  if (cachedList && conv && conv.last_message_at && cachedList.length && cachedList[cachedList.length - 1].at < conv.last_message_at) cachedList = null;
  var msgs, more;
  if (cachedList) { msgs = cachedList.slice(-limit); more = (parseInt(conv && conv.total_messages, 10) || 0) > msgs.length; }
  else {
    var raw = db_('Messages').findAllExact('phone', phone, limit + 1);
    if (!raw.length) raw = legacyMessages_(phone); // historial de la v1 aún no migrado
    raw.sort(function (a, b) { return a.timestamp < b.timestamp ? -1 : 1; });
    more = raw.length > limit;
    msgs = raw.slice(-limit).map(msgOut_);
    if (limit === MSG_CACHE_N) msgCachePut_(phone, msgs);
  }
  var gate = contact ? bot_allowed_(contact, conv) : { ok: cfgBool_('BOT_ENABLED'), reason: cfgBool_('BOT_ENABLED') ? '' : 'bot_off' };
  return {
    success: true,
    phone: phone,
    contact: contact,
    conversation: conv,
    bot: { ok: gate.ok, reason: gate.reason || '', text: gate.ok ? 'El bot responde en este chat.' : bot_reason_text_(gate.reason) },
    messages: msgs,
    more: more,
    notes: db_('Notes').filter(function (n) { return n.phone === phone; }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }),
    deals: db_('Deals').filter(function (d) { return d.phone === phone; }).sort(function (a, b) { return a.updated_at < b.updated_at ? 1 : -1; }),
    tasks: db_('Tasks').filter(function (t) { return t.phone === phone; }).sort(function (a, b) { return a.due_at < b.due_at ? -1 : 1; })
  };
}

function legacyMessages_(phone) {
  var out = [];
  try {
    var ss = ss_();
    if (ss.getSheetByName('Inbox')) {
      new Table_('Inbox').all().forEach(function (m) {
        if (normPhone_(m.from) === phone) out.push({ message_id: m.message_id, direction: 'in', timestamp: m.timestamp || m.created_at, body: m.message, type: m.type, file_url: m.file_url, status: m.status, source: 'whatsapp', rule_id: m.matched_rule_id });
      });
    }
    if (ss.getSheetByName('Outbox')) {
      new Table_('Outbox').all().forEach(function (m) {
        if (normPhone_(m.recipient) === phone) out.push({ message_id: m.outbox_id, direction: 'out', timestamp: m.sent_at || m.created_at, body: m.message, type: 'text', file_url: m.file_url, document_url: m.document_url, status: m.status, source: m.source, error: m.error_message });
      });
    }
  } catch (e) {}
  return out;
}

function conv_markRead(p) {
  var phone = normPhone_(p.phone);
  withLock_(function () {
    var cv = db_('Conversations').findBy('phone', phone);
    if (cv && cv.unread !== '0') db_('Conversations').patch(cv, { unread: '0' });
  });
  return { success: true };
}

function conv_setStatus(p, me) {
  var phone = normPhone_(p.phone);
  var status = p.status;
  if (['open', 'pending', 'needs-human', 'resolved'].indexOf(status) === -1) throw new Error('Estado no válido.');
  withLock_(function () {
    var cv = db_('Conversations').findBy('phone', phone);
    if (!cv) throw new Error('Conversación no encontrada.');
    var ch = { status: status, updated_at: nowIso_() };
    if (status === 'resolved') { ch.waiting_since = ''; ch.unread = '0'; }
    db_('Conversations').patch(cv, ch);
  });
  audit_(me.name, 'conversation_' + status, 'conversation', phone, {});
  return { success: true };
}

function conv_assign(p, me) {
  var phone = normPhone_(p.phone);
  withLock_(function () {
    var cv = db_('Conversations').findBy('phone', phone);
    if (cv) db_('Conversations').patch(cv, { assigned_to: p.assigned_to || '', updated_at: nowIso_() });
    var c = db_('Contacts').findBy('phone', phone);
    if (c && p.assigned_to) db_('Contacts').patch(c, { owner: p.assigned_to });
  });
  audit_(me.name, 'conversation_assigned', 'conversation', phone, { to: p.assigned_to });
  return { success: true };
}

// ── Envío desde el portal ────────────────────────────────────────────────
function send_message(p, me) {
  var recipients = String(p.recipient || '').split(/[,;\n]/).map(normPhone_).filter(function (x) { return x; });
  if (!recipients.length) throw new Error('Escribe al menos un número.');
  var source = p.source || 'manual';
  var tplId = p.template_id;
  if (tplId) {
    var tpl = db_('Templates').get(tplId);
    if (tpl) db_('Templates').patch(tpl, { uses: (parseInt(tpl.uses, 10) || 0) + 1 });
  }

  // Envío diferido o múltiple → cola
  if (p.send_at || recipients.length > 1) {
    var when = p.send_at ? new Date(p.send_at).toISOString() : nowIso_();
    var items = recipients.map(function (r) {
      var c = db_('Contacts').findBy('phone', r) || { phone: r };
      return { recipient: r, body: resolveVars_(p.message, c, { agent: me.name }), file_url: p.file_url, document_url: p.document_url, audio_url: p.audio_url, source: source, agent: me.name, not_before: when };
    });
    var n = queue_add_(items);
    audit_(me.name, 'messages_queued', 'queue', '', { count: n, send_at: when });
    return { success: true, queued: n, send_at: when };
  }

  var r = recipients[0];
  var contact = db_('Contacts').findBy('phone', r) || { phone: r };
  var text = resolveVars_(p.message, contact, { agent: me.name });
  var res = wa_send_(r, text, { file_url: p.file_url, document_url: p.document_url, audio_url: p.audio_url, source: source, agent: me.name });
  if (res.success && !isGroup_(r)) {
    withLock_(function () { if (!db_('Contacts').findBy('phone', r)) contact_touch_(r, '', nowIso_()); });
  }
  return res;
}

// ── Contactos ────────────────────────────────────────────────────────────
function contacts_list(p) {
  var q = norm_(p.q || '');
  var tag = norm_(p.tag || '');
  var status = p.status || '';
  var openDeals = {};
  db_('Deals').all().forEach(function (d) { if (d.status !== 'won' && d.status !== 'lost') openDeals[d.phone] = d.stage; });
  var rows = db_('Contacts').filter(function (c) {
    if (!c.phone || isGroup_(c.phone)) return false;
    if (status === 'dnc' && String(c.do_not_contact) !== 'true') return false;
    if (status === 'nobot' && c.bot !== 'off') return false;
    if (status && status !== 'dnc' && status !== 'nobot' && c.status !== status) return false;
    if (tag && splitTags_(c.tags).map(norm_).indexOf(tag) === -1) return false;
    if (q && norm_([c.phone, c.whatsapp_name, c.display_name, c.email, c.company, c.city, c.tags, c.notes].join(' ')).indexOf(q) === -1) return false;
    return true;
  }).map(function (c) {
    var o = {};
    for (var k in c) o[k] = c[k];
    o.stage = openDeals[c.phone] || '';
    return o;
  });
  rows.sort(function (a, b) { return (a.last_seen_at || a.created_at) < (b.last_seen_at || b.created_at) ? 1 : -1; });
  var tagsCount = {};
  db_('Contacts').all().forEach(function (c) { splitTags_(c.tags).forEach(function (t) { tagsCount[t] = (tagsCount[t] || 0) + 1; }); });
  var limit = parseInt(p.limit, 10) || 500;
  var offset = parseInt(p.offset, 10) || 0;
  return { success: true, data: rows.slice(offset, offset + limit), total: rows.length, tags: tagsCount };
}

function contacts_save(p, me) {
  var t = db_('Contacts');
  var fields = ['whatsapp_name', 'display_name', 'tags', 'status', 'notes', 'do_not_contact', 'email', 'company', 'city', 'owner', 'custom_1', 'custom_2', 'bot'];
  var now = nowIso_();
  var ch = { updated_at: now };
  fields.forEach(function (f) { if (p[f] !== undefined) ch[f] = p[f]; });
  if (ch.tags !== undefined) ch.tags = mergeTags_('', ch.tags);
  var row;
  withLock_(function () {
    if (p.contact_id) {
      row = t.update(p.contact_id, ch);
      if (!row) throw new Error('Contacto no encontrado.');
    } else {
      var phone = normPhone_(p.phone);
      if (!phone || phone.length < 8) throw new Error('Escribe el número con código de país (ej. 51999888777).');
      if (t.findBy('phone', phone)) throw new Error('Ese número ya está registrado.');
      ch.contact_id = uid_('CON');
      ch.phone = phone;
      ch.status = ch.status || 'active';
      ch.source = p.source || 'manual';
      ch.do_not_contact = ch.do_not_contact || 'false';
      ch.created_at = now;
      ch.first_seen_at = now;
      row = t.insert(ch);
    }
  });
  audit_(me.name, p.contact_id ? 'contact_updated' : 'contact_created', 'contact', row.contact_id, { phone: row.phone });
  return { success: true, contact_id: row.contact_id, data: row };
}

function contacts_delete(p, me) {
  var ok = withLock_(function () { return db_('Contacts').remove(p.contact_id); });
  audit_(me.name, 'contact_deleted', 'contact', p.contact_id, {});
  return { success: ok };
}

/** Acciones masivas: agregar/quitar etiqueta, marcar No contactar, asignar. */
function contacts_bulk(p, me) {
  var ids = String(p.ids || '').split(',').filter(function (x) { return x; });
  if (!ids.length) throw new Error('Selecciona al menos un contacto.');
  var n = 0;
  withLock_(function () {
    var t = db_('Contacts');
    var changed = [];
    ids.forEach(function (id) {
      var c = t.get(id);
      if (!c) return;
      if (p.op === 'add_tag') c.tags = mergeTags_(c.tags, p.value);
      else if (p.op === 'remove_tag') c.tags = splitTags_(c.tags).filter(function (x) { return norm_(x) !== norm_(p.value); }).join(', ');
      else if (p.op === 'dnc') c.do_not_contact = p.value === 'false' ? 'false' : 'true';
      else if (p.op === 'owner') c.owner = p.value;
      else if (p.op === 'status') c.status = p.value;
      else if (p.op === 'bot') c.bot = ['on', 'off'].indexOf(p.value) !== -1 ? p.value : '';
      else return;
      c.updated_at = nowIso_();
      changed.push(c);
      n++;
    });
    t.patchMany(changed);
  });
  audit_(me.name, 'contacts_bulk_' + p.op, 'contact', '', { count: n, value: p.value });
  return { success: true, updated: n };
}

/** Importa contactos desde CSV (texto). Columnas reconocidas: phone/telefono, nombre, etiquetas, email, empresa, ciudad, notas. */
function contacts_import(p, me) {
  var text = String(p.csv || '');
  if (!text.trim()) throw new Error('El archivo está vacío.');
  var sep = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  var rows = Utilities.parseCsv(text, sep);
  if (rows.length < 2) throw new Error('El CSV necesita encabezados y al menos una fila.');
  var head = rows[0].map(norm_);
  function col(names) { for (var i = 0; i < head.length; i++) if (names.indexOf(head[i]) !== -1) return i; return -1; }
  var iPhone = col(['phone', 'telefono', 'celular', 'numero', 'whatsapp', 'movil']);
  if (iPhone === -1) throw new Error('No encontré la columna de teléfono (phone, teléfono o celular).');
  var iName = col(['nombre', 'name', 'display_name', 'cliente']);
  var iTags = col(['etiquetas', 'tags', 'etiqueta']);
  var iEmail = col(['email', 'correo']);
  var iCompany = col(['empresa', 'company']);
  var iCity = col(['ciudad', 'city', 'distrito']);
  var iNotes = col(['notas', 'notes', 'observaciones']);
  var extraTag = String(p.tag || '').trim();

  var created = 0, updated = 0, skipped = 0;
  withLock_(function () {
    var t = db_('Contacts');
    var byPhone = {};
    t.all().forEach(function (c) { byPhone[c.phone] = c; });
    var now = nowIso_();
    var toInsert = [], toPatch = [];
    for (var r = 1; r < rows.length; r++) {
      var row = rows[r];
      var phone = normPhone_(row[iPhone]);
      if (!phone || phone.length < 8) { skipped++; continue; }
      var tags = mergeTags_(iTags > -1 ? row[iTags] : '', extraTag);
      var ex = byPhone[phone];
      if (ex) {
        if (iName > -1 && row[iName]) ex.display_name = row[iName];
        if (tags) ex.tags = mergeTags_(ex.tags, tags);
        if (iEmail > -1 && row[iEmail]) ex.email = row[iEmail];
        if (iCompany > -1 && row[iCompany]) ex.company = row[iCompany];
        if (iCity > -1 && row[iCity]) ex.city = row[iCity];
        ex.updated_at = now;
        toPatch.push(ex);
        updated++;
      } else {
        var c = {
          contact_id: uid_('CON'), phone: phone, display_name: iName > -1 ? row[iName] : '', tags: tags, status: 'active', source: 'import',
          email: iEmail > -1 ? row[iEmail] : '', company: iCompany > -1 ? row[iCompany] : '', city: iCity > -1 ? row[iCity] : '',
          notes: iNotes > -1 ? row[iNotes] : '', do_not_contact: 'false', created_at: now, first_seen_at: now, updated_at: now
        };
        byPhone[phone] = c;
        toInsert.push(c);
        created++;
      }
    }
    t.insertMany(toInsert);
    t.patchMany(toPatch);
  });
  audit_(me.name, 'contacts_imported', 'contact', '', { created: created, updated: updated, skipped: skipped });
  return { success: true, created: created, updated: updated, skipped: skipped };
}

function contacts_export() {
  var cols = ['phone', 'display_name', 'whatsapp_name', 'tags', 'status', 'email', 'company', 'city', 'owner', 'do_not_contact', 'first_seen_at', 'last_seen_at', 'notes'];
  var lines = [cols.join(',')];
  db_('Contacts').all().forEach(function (c) {
    lines.push(cols.map(function (k) { var v = String(c[k] || ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','));
  });
  return { success: true, csv: lines.join('\n'), filename: 'contactos_' + fmtDate_(new Date(), 'yyyyMMdd_HHmm') + '.csv' };
}

// ── Notas ────────────────────────────────────────────────────────────────
function notes_add(p, me) {
  var phone = normPhone_(p.phone);
  if (!phone || !String(p.body || '').trim()) throw new Error('La nota está vacía.');
  var n = withLock_(function () { return db_('Notes').insert({ note_id: uid_('NOT'), phone: phone, body: String(p.body).trim(), author: me.name, created_at: nowIso_() }); });
  return { success: true, data: n };
}

function notes_delete(p) { return { success: withLock_(function () { return db_('Notes').remove(p.note_id); }) }; }

// ── Oportunidades (embudo) ───────────────────────────────────────────────
function dealStatusFor_(stage) {
  if (norm_(stage) === norm_(cfg_('WON_STAGE'))) return 'won';
  if (norm_(stage) === norm_(cfg_('LOST_STAGE'))) return 'lost';
  return 'open';
}

function deals_list(p) {
  var contacts = {};
  db_('Contacts').all().forEach(function (c) { contacts[c.phone] = c; });
  var q = norm_(p.q || '');
  var owner = norm_(p.owner || '');
  var rows = db_('Deals').filter(function (d) {
    if (owner && norm_(d.owner) !== owner) return false;
    if (q && norm_([d.title, d.product, d.phone, (contacts[d.phone] || {}).display_name].join(' ')).indexOf(q) === -1) return false;
    return true;
  }).map(function (d) {
    var o = {};
    for (var k in d) o[k] = d[k];
    var c = contacts[d.phone];
    o.contact_name = contactName_(c, d.phone);
    o.last_seen_at = c ? c.last_seen_at : '';
    return o;
  });
  return { success: true, data: rows, stages: stages_(), currency: cfg_('CURRENCY'), won_stage: cfg_('WON_STAGE'), lost_stage: cfg_('LOST_STAGE') };
}

function deals_save(p, me) {
  var t = db_('Deals');
  var now = nowIso_();
  var ch = { updated_at: now };
  ['title', 'product', 'stage', 'value', 'owner', 'expected_close', 'notes'].forEach(function (f) { if (p[f] !== undefined) ch[f] = p[f]; });
  if (ch.value !== undefined) ch.value = String(parseFloat(String(ch.value).replace(/[^\d.]/g, '')) || 0);
  if (ch.stage) {
    if (stages_().indexOf(ch.stage) === -1) throw new Error('Etapa no válida: ' + ch.stage);
    ch.status = dealStatusFor_(ch.stage);
    ch.closed_at = ch.status === 'open' ? '' : now;
  }
  var row = withLock_(function () {
    if (p.deal_id) {
      var r = t.update(p.deal_id, ch);
      if (!r) throw new Error('Oportunidad no encontrada.');
      return r;
    }
    var phone = normPhone_(p.phone);
    if (!phone) throw new Error('La oportunidad necesita un contacto.');
    if (!db_('Contacts').findBy('phone', phone)) contact_touch_(phone, p.contact_name || '', now);
    ch.deal_id = uid_('DEA');
    ch.phone = phone;
    ch.title = ch.title || 'Nueva oportunidad';
    ch.stage = ch.stage || stages_()[0];
    ch.status = dealStatusFor_(ch.stage);
    ch.owner = ch.owner || me.name;
    ch.created_at = now;
    return t.insert(ch);
  });
  audit_(me.name, p.deal_id ? 'deal_updated' : 'deal_created', 'deal', row.deal_id, { stage: row.stage, value: row.value });
  return { success: true, deal_id: row.deal_id, data: row };
}

function deals_delete(p, me) {
  var ok = withLock_(function () { return db_('Deals').remove(p.deal_id); });
  audit_(me.name, 'deal_deleted', 'deal', p.deal_id, {});
  return { success: ok };
}

/** Crea o mueve la oportunidad abierta más reciente de un número. */
function deal_upsertForPhone_(phone, stage, extra) {
  if (stages_().indexOf(stage) === -1) return null;
  var t = db_('Deals');
  var open = t.filter(function (d) { return d.phone === phone && d.status === 'open'; })
    .sort(function (a, b) { return a.updated_at < b.updated_at ? 1 : -1; })[0];
  var now = nowIso_();
  var status = dealStatusFor_(stage);
  if (open) return t.patch(open, { stage: stage, status: status, updated_at: now, closed_at: status === 'open' ? '' : now });
  return t.insert({
    deal_id: uid_('DEA'), phone: phone, title: (extra && extra.title) || 'Nueva oportunidad', product: (extra && extra.product) || '',
    stage: stage, value: (extra && extra.value) || '0', owner: (extra && extra.owner) || '', status: status, created_at: now, updated_at: now
  });
}

// ── Tareas ───────────────────────────────────────────────────────────────
function tasks_list(p, me) {
  var contacts = {};
  db_('Contacts').all().forEach(function (c) { contacts[c.phone] = c; });
  var rows = db_('Tasks').filter(function (t) {
    if (p.status && t.status !== p.status) return false;
    if (p.mine === 'true' && norm_(t.assigned_to) !== norm_(me.name)) return false;
    return true;
  }).map(function (t) {
    var o = {};
    for (var k in t) o[k] = t[k];
    o.contact_name = t.phone ? contactName_(contacts[t.phone], t.phone) : '';
    return o;
  }).sort(function (a, b) { return (a.due_at || '9') < (b.due_at || '9') ? -1 : 1; });
  return { success: true, data: rows };
}

function tasks_save(p, me) {
  var t = db_('Tasks');
  var ch = {};
  ['title', 'due_at', 'priority', 'assigned_to', 'remind'].forEach(function (f) { if (p[f] !== undefined) ch[f] = p[f]; });
  if (p.phone !== undefined) ch.phone = p.phone ? normPhone_(p.phone) : '';
  if (ch.due_at) { var d = new Date(ch.due_at); if (isNaN(d.getTime())) throw new Error('Fecha no válida.'); ch.due_at = d.toISOString(); ch.reminded_at = ''; }
  if (p.status !== undefined) { ch.status = p.status === 'done' ? 'done' : 'open'; ch.done_at = ch.status === 'done' ? nowIso_() : ''; }
  var row = withLock_(function () {
    if (p.task_id) {
      var r = t.update(p.task_id, ch);
      if (!r) throw new Error('Tarea no encontrada.');
      return r;
    }
    if (!String(ch.title || '').trim()) throw new Error('Escribe qué hay que hacer.');
    ch.task_id = uid_('TSK');
    ch.status = 'open';
    ch.priority = ch.priority || 'normal';
    ch.assigned_to = ch.assigned_to || me.name;
    ch.remind = ch.remind === undefined ? 'true' : ch.remind;
    ch.created_by = me.name;
    ch.created_at = nowIso_();
    return t.insert(ch);
  });
  if (row.due_at && row.status === 'open' && String(row.remind) === 'true') wake_(row.due_at);
  return { success: true, task_id: row.task_id, data: row };
}

function tasks_delete(p) { return { success: withLock_(function () { return db_('Tasks').remove(p.task_id); }) }; }

// ── Plantillas y respuestas rápidas ──────────────────────────────────────
function templates_list(p) {
  var rows = db_('Templates').filter(function (t) {
    if (p.category && t.category !== p.category) return false;
    if (p.status && t.status !== p.status) return false;
    return true;
  }).sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
  return { success: true, data: rows };
}

function templates_save(p, me) {
  var t = db_('Templates');
  var ch = { updated_at: nowIso_() };
  ['name', 'category', 'message', 'file_url', 'document_url', 'status', 'shortcut'].forEach(function (f) { if (p[f] !== undefined) ch[f] = p[f]; });
  if (ch.shortcut) {
    ch.shortcut = norm_(ch.shortcut).replace(/[^a-z0-9_-]/g, '');
    var dup = t.find(function (x) { return x.shortcut === ch.shortcut && x.template_id !== p.template_id; });
    if (dup) throw new Error('El atajo /' + ch.shortcut + ' ya lo usa "' + dup.name + '".');
  }
  var row = withLock_(function () {
    if (p.template_id) {
      var r = t.update(p.template_id, ch);
      if (!r) throw new Error('Plantilla no encontrada.');
      return r;
    }
    if (!ch.name || !ch.message) throw new Error('La plantilla necesita nombre y mensaje.');
    ch.template_id = uid_('TPL');
    ch.status = ch.status || 'active';
    ch.category = ch.category || 'general';
    ch.uses = '0';
    ch.created_at = ch.updated_at;
    return t.insert(ch);
  });
  audit_(me.name, p.template_id ? 'template_updated' : 'template_created', 'template', row.template_id, { name: row.name });
  return { success: true, template_id: row.template_id };
}

function templates_delete(p, me) {
  var ok = withLock_(function () { return db_('Templates').remove(p.template_id); });
  audit_(me.name, 'template_deleted', 'template', p.template_id, {});
  return { success: ok };
}

// ── Búsqueda global (paleta Ctrl+K) ──────────────────────────────────────
function search_all(p) {
  var q = norm_(p.q || '');
  if (q.length < 2) return { success: true, contacts: [], deals: [], tasks: [] };
  var contacts = db_('Contacts').filter(function (c) {
    return norm_([c.phone, c.display_name, c.whatsapp_name, c.email, c.company, c.tags].join(' ')).indexOf(q) !== -1;
  }).slice(0, 8).map(function (c) { return { phone: c.phone, name: contactName_(c, c.phone), tags: c.tags }; });
  var deals = db_('Deals').filter(function (d) { return norm_([d.title, d.product].join(' ')).indexOf(q) !== -1; })
    .slice(0, 5).map(function (d) { return { deal_id: d.deal_id, title: d.title, stage: d.stage, phone: d.phone, value: d.value }; });
  var tasks = db_('Tasks').filter(function (t) { return t.status === 'open' && norm_(t.title).indexOf(q) !== -1; })
    .slice(0, 5).map(function (t) { return { task_id: t.task_id, title: t.title, due_at: t.due_at }; });
  return { success: true, contacts: contacts, deals: deals, tasks: tasks };
}

;
/* ── 06_Campaigns.gs ── */
/**
 * WA POWER v2 — 06_Campaigns.gs
 * Campañas segmentadas. Ya no se envían dentro de una sola petición (la v1 se cortaba a los 6 min):
 * se ponen en cola y el proceso automático las envía por tandas, con pausa y reanudación.
 */

function campaign_audience_(camp) {
  var tags = splitTags_(camp.audience_filter).map(norm_);
  var stage = String(camp.audience_stage || '');
  var inStage = {};
  if (stage) db_('Deals').all().forEach(function (d) { if (d.stage === stage) inStage[d.phone] = true; });
  return db_('Contacts').filter(function (c) {
    if (!c.phone || isGroup_(c.phone)) return false;
    if (String(c.do_not_contact) === 'true') return false;
    if (c.status && c.status !== 'active') return false;
    if (tags.length) {
      var ct = splitTags_(c.tags).map(norm_);
      if (!tags.some(function (t) { return ct.indexOf(t) !== -1; })) return false;
    }
    if (stage && !inStage[c.phone]) return false;
    return true;
  });
}

function campaigns_preview(p) {
  var list = campaign_audience_({ audience_filter: p.audience_filter, audience_stage: p.audience_stage });
  var sample = list.slice(0, 3).map(function (c) {
    return { name: contactName_(c, c.phone), phone: c.phone, message: resolveVars_(p.message_template || '', c) };
  });
  return { success: true, count: list.length, sample: sample };
}

function campaigns_list() {
  var pending = {};
  db_('Queue').all().forEach(function (q) {
    if (q.campaign_id && q.status === 'pending') pending[q.campaign_id] = (pending[q.campaign_id] || 0) + 1;
  });
  var rows = db_('Campaigns').all().map(function (c) {
    var o = {};
    for (var k in c) o[k] = c[k];
    o.pending = pending[c.campaign_id] || 0;
    return o;
  }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
  return { success: true, data: rows };
}

function campaigns_save(p, me) {
  var t = db_('Campaigns');
  var ch = { updated_at: nowIso_() };
  ['name', 'description', 'audience_filter', 'audience_stage', 'message_template', 'file_url', 'scheduled_at'].forEach(function (f) { if (p[f] !== undefined) ch[f] = p[f]; });
  var row = withLock_(function () {
    if (p.campaign_id) {
      var cur = t.get(p.campaign_id);
      if (!cur) throw new Error('Campaña no encontrada.');
      if (cur.status !== 'draft') throw new Error('Solo se editan campañas en borrador.');
      return t.patch(cur, ch);
    }
    if (!ch.name) throw new Error('Ponle un nombre a la campaña.');
    if (!ch.message_template) throw new Error('Escribe el mensaje de la campaña.');
    ch.campaign_id = uid_('CMP');
    ch.status = 'draft';
    ch.total_recipients = '0'; ch.sent_count = '0'; ch.failed_count = '0';
    ch.recurrence = 'once';
    ch.created_by = me.name;
    ch.created_at = ch.updated_at;
    return t.insert(ch);
  });
  audit_(me.name, p.campaign_id ? 'campaign_updated' : 'campaign_created', 'campaign', row.campaign_id, { name: row.name });
  return { success: true, campaign_id: row.campaign_id };
}

/** Lanza la campaña: arma la lista y la pone en cola (ahora o a la hora programada). */
function campaigns_launch(p, me) {
  var camp = db_('Campaigns').get(p.campaign_id);
  if (!camp) throw new Error('Campaña no encontrada.');
  if (camp.status !== 'draft') throw new Error('La campaña ya fue lanzada (' + camp.status + ').');
  var audience = campaign_audience_(camp);
  if (!audience.length) throw new Error('La audiencia está vacía: ningún contacto activo coincide con el filtro.');
  var when = p.scheduled_at || camp.scheduled_at;
  var start = when ? new Date(when) : new Date();
  if (isNaN(start.getTime())) start = new Date();
  var items = audience.map(function (c) {
    return { recipient: c.phone, body: resolveVars_(camp.message_template, c), file_url: camp.file_url, source: 'campaign', agent: me.name, campaign_id: camp.campaign_id, not_before: start.toISOString() };
  });
  queue_add_(items);
  withLock_(function () {
    var cur = db_('Campaigns').get(camp.campaign_id);
    db_('Campaigns').patch(cur, {
      status: start.getTime() > Date.now() + 60000 ? 'scheduled' : 'sending', total_recipients: items.length,
      scheduled_at: start.toISOString(), started_at: nowIso_(), updated_at: nowIso_()
    });
  });
  audit_(me.name, 'campaign_launched', 'campaign', camp.campaign_id, { recipients: items.length, at: start.toISOString() });
  return { success: true, queued: items.length, starts_at: start.toISOString(), eta_minutes: Math.ceil(items.length * (cfgNum_('CAMPAIGN_DELAY_SECONDS', 8) + 3) / 60) };
}

function campaigns_setState(p, me) {
  var op = p.op; // pause | resume | cancel
  var camp = db_('Campaigns').get(p.campaign_id);
  if (!camp) throw new Error('Campaña no encontrada.');
  withLock_(function () {
    var cur = db_('Campaigns').get(p.campaign_id);
    var q = db_('Queue');
    var mine = q.filter(function (r) { return r.campaign_id === p.campaign_id && (r.status === 'pending' || r.status === 'paused'); });
    if (op === 'pause') {
      mine.forEach(function (r) { if (r.status === 'pending') r.status = 'paused'; });
      db_('Campaigns').patch(cur, { status: 'paused', updated_at: nowIso_() });
    } else if (op === 'resume') {
      mine.forEach(function (r) { if (r.status === 'paused') r.status = 'pending'; });
      db_('Campaigns').patch(cur, { status: 'sending', updated_at: nowIso_() });
      wake_(nowIso_());
    } else if (op === 'cancel') {
      mine.forEach(function (r) { r.status = 'cancelled'; });
      db_('Campaigns').patch(cur, { status: 'cancelled', finished_at: nowIso_(), updated_at: nowIso_() });
    } else throw new Error('Operación no válida.');
    q.patchMany(mine);
  });
  audit_(me.name, 'campaign_' + op, 'campaign', p.campaign_id, {});
  return { success: true };
}

function campaigns_duplicate(p, me) {
  var c = db_('Campaigns').get(p.campaign_id);
  if (!c) throw new Error('Campaña no encontrada.');
  return campaigns_save({ name: c.name + ' (copia)', description: c.description, audience_filter: c.audience_filter, audience_stage: c.audience_stage, message_template: c.message_template, file_url: c.file_url }, me);
}

function campaigns_delete(p, me) {
  var c = db_('Campaigns').get(p.campaign_id);
  if (c && (c.status === 'sending' || c.status === 'scheduled')) throw new Error('Pausa o cancela la campaña antes de borrarla.');
  var ok = withLock_(function () { return db_('Campaigns').remove(p.campaign_id); });
  audit_(me.name, 'campaign_deleted', 'campaign', p.campaign_id, {});
  return { success: ok };
}

/** Suma resultados de envío a la campaña y la cierra cuando ya no queda nada en cola. */
function campaign_bump_(campaignId, sent, failed) {
  withLock_(function () {
    var c = db_('Campaigns').get(campaignId);
    if (!c) return;
    var ch = {
      sent_count: (parseInt(c.sent_count, 10) || 0) + sent,
      failed_count: (parseInt(c.failed_count, 10) || 0) + failed,
      updated_at: nowIso_()
    };
    if (c.status === 'scheduled') ch.status = 'sending';
    var left = db_('Queue').filter(function (q) { return q.campaign_id === campaignId && (q.status === 'pending' || q.status === 'paused'); }).length;
    if (!left && c.status !== 'cancelled') { ch.status = 'completed'; ch.finished_at = nowIso_(); }
    db_('Campaigns').patch(c, ch);
  });
}

;
/* ── 07_Scheduler.gs ── */
/**
 * WA POWER v2 — 07_Scheduler.gs
 * Mensajes programados + proceso automático "tick" (cada minuto).
 *
 * tick() despierta solo cuando hay algo que hacer (NEXT_WAKE_AT), así casi no consume cuota:
 *   programados vencidos → cola · envía la cola · recordatorios de tareas · resumen diario.
 * La v1 restaba 10 min a la hora elegida para "compensar" el trigger; ya no hace falta.
 */

// ── CRUD de programados ──────────────────────────────────────────────────
function schedules_list() {
  var groups = {};
  db_('Groups').all().forEach(function (g) { groups[g.group_id] = g.name || g.group_id; });
  var rows = db_('ScheduledMessages').all().slice().sort(function (a, b) {
    var x = a.next_run_at || '9', y = b.next_run_at || '9';
    return x < y ? -1 : 1;
  }).map(function (s) {
    var o = {};
    for (var k in s) o[k] = s[k];
    var rs = String(s.recipients || '').split(',').filter(function (x) { return x; });
    o.group_names = rs.filter(isGroup_).map(function (g) { return groups[g] || 'Grupo'; });
    o.people_count = rs.filter(function (x) { return !isGroup_(x); }).length;
    return o;
  });
  return { success: true, data: rows };
}

function schedules_save(p, me) {
  var t = db_('ScheduledMessages');
  var ch = { updated_at: nowIso_() };
  ['title', 'recipients', 'message_template', 'file_url', 'document_url', 'audio_url', 'recurrence_type', 'recurrence_rule'].forEach(function (f) { if (p[f] !== undefined) ch[f] = p[f]; });
  if (ch.recipients !== undefined) {
    ch.recipients = String(ch.recipients).split(/[,;\n]/).map(normPhone_).filter(function (x) { return x; }).join(',');
    if (!ch.recipients) throw new Error('Agrega al menos un destinatario.');
  }
  if (p.start_datetime) {
    var start = new Date(p.start_datetime);
    if (isNaN(start.getTime())) throw new Error('Fecha de inicio no válida.');
    ch.start_datetime = start.toISOString();
    ch.next_run_at = start.toISOString();
  }
  var row = withLock_(function () {
    if (p.schedule_id) {
      var r = t.update(p.schedule_id, ch);
      if (!r) throw new Error('Programación no encontrada.');
      if (r.status === 'completed' && p.start_datetime) t.patch(r, { status: 'active' });
      return r;
    }
    if (!ch.message_template && !ch.file_url && !ch.document_url && !ch.audio_url) throw new Error('Escribe el mensaje o adjunta un archivo.');
    if (!ch.recipients) throw new Error('Agrega al menos un destinatario.');
    if (!ch.next_run_at) throw new Error('Elige fecha y hora.');
    ch.schedule_id = uid_('SCH');
    ch.title = ch.title || 'Sin título';
    ch.recipient_type = 'list';
    ch.recurrence_type = ch.recurrence_type || 'once';
    ch.status = 'active';
    ch.created_by = me.name;
    ch.created_at = ch.updated_at;
    ch.run_count = '0';
    return t.insert(ch);
  });
  wake_(row.next_run_at);
  audit_(me.name, p.schedule_id ? 'schedule_updated' : 'schedule_created', 'schedule', row.schedule_id, { title: row.title, next: row.next_run_at });
  return { success: true, schedule_id: row.schedule_id, next_run_at: row.next_run_at };
}

function schedules_setState(p, me) {
  var row = withLock_(function () {
    var r = db_('ScheduledMessages').get(p.schedule_id);
    if (!r) throw new Error('Programación no encontrada.');
    if (p.op === 'pause') return db_('ScheduledMessages').patch(r, { status: 'paused', updated_at: nowIso_() });
    if (p.op === 'resume') {
      var next = r.next_run_at && new Date(r.next_run_at) > new Date() ? r.next_run_at : nextRun_(r, new Date());
      if (!next) throw new Error('Esta programación ya no tiene próximos envíos.');
      return db_('ScheduledMessages').patch(r, { status: 'active', next_run_at: next, updated_at: nowIso_() });
    }
    throw new Error('Operación no válida.');
  });
  wake_(row.next_run_at);
  audit_(me.name, 'schedule_' + p.op, 'schedule', p.schedule_id, {});
  return { success: true };
}

function schedules_delete(p, me) {
  var ok = withLock_(function () { return db_('ScheduledMessages').remove(p.schedule_id); });
  audit_(me.name, 'schedule_deleted', 'schedule', p.schedule_id, {});
  return { success: ok };
}

/** Envía ya un programado (sin mover su próxima fecha). */
function schedules_runNow(p, me) {
  var s = db_('ScheduledMessages').get(p.schedule_id);
  if (!s) throw new Error('Programación no encontrada.');
  var n = schedule_enqueue_(s, nowIso_());
  audit_(me.name, 'schedule_run_now', 'schedule', s.schedule_id, { recipients: n });
  if (CacheService.getScriptCache().get('tick_running')) return { success: true, queued: n, sent: 0, failed: 0, note: 'En cola: sale en el próximo minuto.' };
  var out = queue_process_(Date.now() + 90000);
  return { success: true, queued: n, sent: out.sent, failed: out.failed };
}

function schedule_enqueue_(s, when) {
  var recips = String(s.recipients || '').split(',').map(normPhone_).filter(function (x) { return x; });
  var items = recips.map(function (r) {
    var c = db_('Contacts').findBy('phone', r) || { phone: r };
    return { recipient: r, body: resolveVars_(s.message_template, c), file_url: s.file_url, document_url: s.document_url, audio_url: s.audio_url, source: 'scheduler', agent: s.created_by, schedule_id: s.schedule_id, not_before: when };
  });
  return queue_add_(items);
}

/** Próxima fecha después de "after". Recurrencias: once, daily, weekdays (L-V), mon_sat, weekly, monthly, every_n_days. */
function nextRun_(s, after) {
  var type = s.recurrence_type || 'once';
  if (type === 'once') return '';
  var base = new Date(s.next_run_at || s.start_datetime);
  if (isNaN(base.getTime())) return '';
  var n = Math.max(1, parseInt(s.recurrence_rule, 10) || 1);
  var guard = 0;
  var d = new Date(base.getTime());
  while (d <= after && guard++ < 2000) {
    if (type === 'daily') d.setDate(d.getDate() + 1);
    else if (type === 'weekly') d.setDate(d.getDate() + 7);
    else if (type === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (type === 'every_n_days') d.setDate(d.getDate() + n);
    else if (type === 'weekdays' || type === 'mon_sat') {
      do { d.setDate(d.getDate() + 1); } while (!dayAllowed_(d, type));
    } else return '';
  }
  return d.toISOString();
}

function dayAllowed_(d, type) {
  var dow = parseInt(fmtDate_(d, 'u'), 10);
  if (type === 'weekdays') return dow <= 5;
  if (type === 'mon_sat') return dow <= 6;
  return true;
}

// ── Proceso automático ───────────────────────────────────────────────────
function tick() {
  var now = Date.now();
  var wakeAt = parseInt(prop_('NEXT_WAKE_AT') || '0', 10);
  var force = arguments.length && arguments[0] === 'force';
  if (!force && wakeAt && now < wakeAt) return { skipped: true, next: new Date(wakeAt).toISOString() };

  var cache = CacheService.getScriptCache();
  if (cache.get('tick_running')) return { skipped: true, reason: 'running' };
  cache.put('tick_running', '1', 330);
  var report = { schedules: 0, sent: 0, failed: 0, reminders: 0 };
  try {
    setProp_('LAST_TICK_AT', new Date().toISOString());
    report.schedules = tick_schedules_();
    var q = queue_process_(now + 270000); // 4,5 min de margen (límite de Google: 6 min)
    report.sent = q.sent; report.failed = q.failed;
    report.reminders = tick_reminders_();
    tick_digest_();
  } catch (e) {
    audit_('system', 'tick_error', 'system', '', { error: e.message });
    report.error = e.message;
  } finally {
    setProp_('NEXT_WAKE_AT', computeNextWake_());
    cache.remove('tick_running');
    finishWrites_();
  }
  return report;
}

function tick_schedules_() {
  var now = new Date();
  var nowIso = now.toISOString();
  var due = db_('ScheduledMessages').filter(function (s) { return s.status === 'active' && s.next_run_at && s.next_run_at <= nowIso; });
  due.forEach(function (s) {
    schedule_enqueue_(s, nowIso);
    withLock_(function () {
      var cur = db_('ScheduledMessages').get(s.schedule_id);
      var next = nextRun_(cur, now);
      db_('ScheduledMessages').patch(cur, {
        last_run_at: nowIso, next_run_at: next, status: next ? 'active' : 'completed',
        run_count: (parseInt(cur.run_count, 10) || 0) + 1, updated_at: nowIso
      });
    });
    audit_('system', 'schedule_executed', 'schedule', s.schedule_id, { title: s.title });
  });
  return due.length;
}

function tick_reminders_() {
  var nowIso = nowIso_();
  var users = db_('Users').all();
  var due = db_('Tasks').filter(function (t) { return t.status === 'open' && String(t.remind) === 'true' && t.due_at && t.due_at <= nowIso && !t.reminded_at; });
  due.forEach(function (t) {
    var u = users.filter(function (x) { return norm_(x.name) === norm_(t.assigned_to) && x.phone; })[0];
    var targets = notifyTargets_(u ? [u.phone] : null);
    var who = '';
    if (t.phone) { var c = db_('Contacts').findBy('phone', t.phone); who = '\n👤 ' + contactName_(c, t.phone) + ' (+' + t.phone + ')'; }
    if (cfg_('NOTIFY_GROUP') && t.assigned_to) who += '\n📌 Para: ' + t.assigned_to;
    var text = '⏰ *Recordatorio*\n' + t.title + who + '\n\nCuando termines: /hecho ' + t.task_id.slice(-6);
    targets.forEach(function (ph) { wa_send_(ph, text, { source: 'system', force: true }); });
    withLock_(function () { var cur = db_('Tasks').get(t.task_id); if (cur) db_('Tasks').patch(cur, { reminded_at: nowIso_() }); });
  });
  return due.length;
}

function tick_digest_() {
  if (!cfgBool_('DIGEST_ENABLED')) return;
  var hour = parseInt(fmtDate_(new Date(), 'H'), 10);
  var today = fmtDate_(new Date(), 'yyyy-MM-dd');
  if (hour !== cfgNum_('DIGEST_HOUR', 8) || prop_('LAST_DIGEST') === today) return;
  setProp_('LAST_DIGEST', today);
  var text = cmd_summary_text_(null);
  notifyTargets_().forEach(function (ph) { wa_send_(ph, text, { source: 'system', force: true }); });
}

function computeNextWake_() {
  var cands = [];
  var nowIso = nowIso_();
  db_('ScheduledMessages').all().forEach(function (s) { if (s.status === 'active' && s.next_run_at) cands.push(s.next_run_at); });
  db_('Queue').all().forEach(function (q) { if (q.status === 'pending') cands.push(q.not_before || nowIso); });
  db_('Tasks').all().forEach(function (t) { if (t.status === 'open' && String(t.remind) === 'true' && t.due_at && !t.reminded_at) cands.push(t.due_at); });
  // Resumen diario
  if (cfgBool_('DIGEST_ENABLED')) {
    var d = new Date();
    var h = cfgNum_('DIGEST_HOUR', 8);
    var todayAt = new Date(fmtDate_(d, 'yyyy-MM-dd') + 'T' + ('0' + h).slice(-2) + ':00:00' + tzOffset_(d));
    if (todayAt.getTime() <= d.getTime()) todayAt = new Date(todayAt.getTime() + 86400000);
    cands.push(todayAt.toISOString());
  }
  var maxWait = Date.now() + 30 * 60000; // como máximo, revisar cada 30 min
  var best = cands.reduce(function (m, c) { var t = new Date(c).getTime(); return !isNaN(t) && t < m ? t : m; }, maxWait);
  return String(Math.max(best, Date.now() + 30000));
}

function tzOffset_(d) {
  var z = fmtDate_(d, 'Z'); // -0500
  return z ? z.slice(0, 3) + ':' + z.slice(3) : 'Z';
}

// ── Activadores ──────────────────────────────────────────────────────────
function triggers_install() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'tick' || t.getHandlerFunction() === 'runScheduler') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('tick').timeBased().everyMinutes(1).create();
  setProp_('NEXT_WAKE_AT', '0');
  return { success: true, message: 'Proceso automático activado (cada minuto).' };
}

function triggers_status() {
  var list = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  var last = prop_('LAST_TICK_AT');
  return {
    installed: list.indexOf('tick') !== -1,
    legacy: list.indexOf('runScheduler') !== -1,
    last_tick_at: last || '',
    healthy: !!last && minutesSince_(last) <= 35,
    next_wake_at: prop_('NEXT_WAKE_AT') ? new Date(parseInt(prop_('NEXT_WAKE_AT'), 10)).toISOString() : ''
  };
}

// Compatibilidad con el trigger de la v1
function runScheduler() { return tick('force'); }

;
/* ── 08_Commands.gs ── */
/**
 * WA POWER v2 — 08_Commands.gs
 * Opera el sistema desde tu WhatsApp. Escríbele al número conectado a TextMeBot desde un celular
 * registrado como usuario (Configuración › Usuarios › Teléfono). Los mensajes que empiezan con "/"
 * se interpretan como comandos; el resto se trata como un cliente normal.
 */

var CMD_HELP = [
  ['Atención', [
    ['/hoy', 'Resumen del día'],
    ['/p', 'Quién espera respuesta (numerados)'],
    ['/ver 2', 'Últimos mensajes de la #2'],
    ['/r 2 texto', 'Responder a la #2'],
    ['/q 2 atajo', 'Enviar respuesta rápida a la #2'],
    ['/e 999888777 texto', 'Enviar a cualquier número'],
    ['/ok 2', 'Marcar la #2 como atendida'],
    ['/asignar 2 Ana', 'Asignar la #2 a un usuario']
  ]],
  ['Clientes y ventas', [
    ['/buscar texto', 'Buscar contactos'],
    ['/ficha 2', 'Ficha completa del contacto'],
    ['/nota 2 texto', 'Agregar una nota'],
    ['/tag 2 etiqueta', 'Agregar etiqueta'],
    ['/lead 999888777 Nombre | 120 | Producto', 'Crear oportunidad'],
    ['/etapa 2 Propuesta', 'Mover su oportunidad de etapa'],
    ['/ventas', 'Resumen del embudo']
  ]],
  ['Agenda', [
    ['/tarea mañana 10:00 Llamar a Rosa', 'Tarea con recordatorio'],
    ['/tareas', 'Tus tareas abiertas'],
    ['/hecho 1', 'Completar la tarea #1'],
    ['/recordar 16:30 Enviar cotización', 'Recordatorio para ti'],
    ['/prog 30/09 18:00 999888777 texto', 'Programar un mensaje'],
    ['/prog lunes 8:00 g1 texto', 'Programar a un grupo (g1 sale de /grupos)']
  ]],
  ['Grupos', [
    ['/grupos', 'Tus grupos registrados (g1, g2…)'],
    ['/grupo https://chat.whatsapp.com/…', 'Registrar un grupo con su enlace de invitación'],
    ['/e g1 texto', 'Enviar ahora a un grupo']
  ]],
  ['Sistema', [
    ['/campanas', 'Estado de campañas'],
    ['/lanzar nombre', 'Lanzar campaña (pide confirmación)'],
    ['/bot on · /bot off', 'Encender o apagar el bot para todos'],
    ['/bot 2 off · /bot 2 auto', 'Apagar el bot solo en un chat (o volver a lo normal)'],
    ['/estado', 'Salud del sistema']
  ]]
];

/** Dueño del número del bot (cuando escribe desde su propio WhatsApp). */
function ownerUser_() {
  var a = db_('Users').filter(function (u) { return u.role === 'admin' && String(u.active) !== 'false'; })[0];
  return a ? { name: a.name, role: 'admin', user_id: a.user_id, phone: a.phone } : { name: 'Administrador', role: 'admin', user_id: 'OWNER', phone: ownNumber_() };
}

function cmd_help_text_() {
  var out = ['*WA Power · comandos*'];
  CMD_HELP.forEach(function (g) {
    out.push('', '*' + g[0] + '*');
    g[1].forEach(function (c) { out.push(c[0] + ' — ' + c[1]); });
  });
  out.push('', 'La #n sale de /p. También puedes usar el número o el nombre.');
  return out.join('\n');
}

/** Punto de entrada. ctx.reply = true envía la respuesta por WhatsApp a ctx.phone. */
function cmd_run_(user, text, ctx) {
  ctx = ctx || {};
  var raw = String(text || '').trim().replace(/^[\/#!]\s*/, '');
  var sp = raw.search(/\s/);
  var cmd = norm_(sp === -1 ? raw : raw.slice(0, sp));
  var rest = sp === -1 ? '' : raw.slice(sp + 1).trim();
  var me = { name: user.name, role: user.role || 'agent', user_id: user.user_id, phone: user.phone };
  var reply;
  try {
    reply = cmd_dispatch_(me, cmd, rest);
  } catch (e) {
    reply = '⚠️ ' + e.message;
  }
  // Una respuesta nunca empieza con "/" (evita que se lea como otro comando)
  if (reply && /^[\/#!]/.test(reply)) reply = '› ' + reply;
  audit_(me.name, 'whatsapp_command', 'command', cmd, { text: truncate_(raw, 200) });
  if (ctx.reply && ctx.phone && reply) wa_send_(ctx.phone, reply, { source: 'command-reply', force: true });
  return { processed: true, command: cmd, reply: reply };
}

function cmd_dispatch_(me, cmd, rest) {
  var A = {
    'ayuda': cmd_help_text_, 'menu': cmd_help_text_, 'help': cmd_help_text_, '?': cmd_help_text_, 'comandos': cmd_help_text_,
    'hoy': function () { return cmd_summary_text_(me); }, 'resumen': function () { return cmd_summary_text_(me); },
    'p': cmd_pending_, 'pendientes': cmd_pending_,
    'ver': cmd_view_, 'v': cmd_view_,
    'r': cmd_reply_, 'responder': cmd_reply_,
    'q': cmd_quick_, 'rapida': cmd_quick_, 'plantilla': cmd_quick_,
    'e': cmd_send_, 'enviar': cmd_send_,
    'ok': cmd_done_, 'atendido': cmd_done_, 'atendida': cmd_done_, 'resuelto': cmd_done_,
    'asignar': cmd_assign_,
    'buscar': cmd_search_, 'b': cmd_search_,
    'ficha': cmd_card_, 'f': cmd_card_,
    'nota': cmd_note_, 'n': cmd_note_,
    'tag': cmd_tag_, 'etiqueta': cmd_tag_,
    'lead': cmd_lead_, 'oportunidad': cmd_lead_,
    'etapa': cmd_stage_,
    'ventas': cmd_sales_, 'embudo': cmd_sales_,
    'tarea': cmd_task_, 't': cmd_task_,
    'tareas': cmd_tasks_,
    'hecho': cmd_taskDone_, 'listo': cmd_taskDone_,
    'recordar': cmd_remind_, 'recordatorio': cmd_remind_,
    'prog': cmd_schedule_, 'programar': cmd_schedule_,
    'campanas': cmd_campaigns_, 'campana': cmd_campaigns_,
    'lanzar': cmd_launch_, 'confirmar': cmd_confirm_,
    'bot': cmd_bot_,
    'estado': cmd_status_, 'salud': cmd_status_,
    'grupos': cmd_groups_, 'grupo': cmd_groupAdd_
  };
  var fn = A[cmd];
  if (!fn) return 'No conozco el comando "/' + cmd + '". Escribe /ayuda para ver la lista.';
  return fn(me, rest);
}

// ── Referencias: "#2", "2", "999888777" o un nombre ──────────────────────
function cmd_listKey_(me) { return 'cmdlist_' + (me.user_id || me.name); }

function cmd_ref_(me, ref) {
  ref = String(ref || '').trim();
  if (!ref) throw new Error('Indica a quién: #número de /p, el teléfono o el nombre.');
  var gm = ref.match(/^g(\d{1,2})$/i);
  if (gm) {
    var glist = JSON.parse(CacheService.getScriptCache().get(cmd_listKey_(me) + '_g') || '[]');
    if (!glist.length) glist = db_('Groups').all().slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }).map(function (g) { return g.group_id; });
    var gid = glist[parseInt(gm[1], 10) - 1];
    if (!gid) throw new Error('No hay grupo g' + gm[1] + '. Escribe /grupos para ver la lista.');
    return gid;
  }
  if (isGroupId_(ref)) return ref;
  var m = ref.match(/^#?(\d{1,2})$/);
  if (m) {
    var list = JSON.parse(CacheService.getScriptCache().get(cmd_listKey_(me)) || '[]');
    var phone = list[parseInt(m[1], 10) - 1];
    if (!phone) throw new Error('No hay #' + m[1] + ' en tu última lista. Escribe /p para actualizarla.');
    return phone;
  }
  var digits = ref.replace(/[\s+\-()]/g, '');
  if (/^\d{8,15}$/.test(digits)) return normPhone_(digits);
  var q = norm_(ref);
  var hits = db_('Contacts').filter(function (c) { return norm_([c.display_name, c.whatsapp_name].join(' ')).indexOf(q) !== -1; });
  if (hits.length === 1) return hits[0].phone;
  if (!hits.length) throw new Error('No encontré a "' + ref + '".');
  throw new Error('Hay ' + hits.length + ' contactos con "' + ref + '". Usa /buscar ' + ref + ' y luego el número.');
}

/** Separa "ref resto": la ref es la primera palabra (o el número completo). */
function cmd_split_(rest) {
  rest = String(rest || '').trim();
  var m = rest.match(/^(#?\d{1,2}|\+?[\d\s\-]{8,18}\d)\s+([\s\S]*)$/);
  if (m) return { ref: m[1], text: m[2].trim() };
  var sp = rest.search(/\s/);
  return sp === -1 ? { ref: rest, text: '' } : { ref: rest.slice(0, sp), text: rest.slice(sp + 1).trim() };
}

function cmd_nameOf_(phone) {
  if (isGroup_(phone)) return 'el grupo ' + groupName_(phone);
  var c = db_('Contacts').findBy('phone', phone);
  return contactName_(c, phone);
}

// ── Atención ─────────────────────────────────────────────────────────────
function cmd_summary_text_(me) {
  var d = analytics_today_();
  var lines = [
    '*' + (d.greeting) + (me ? ', ' + me.name.split(' ')[0] : '') + '* · ' + fmtDate_(new Date(), 'dd/MM HH:mm'),
    '',
    '📥 Recibidos hoy: *' + d.received + '*  ·  📤 Enviados: *' + d.sent + '*  ·  🤖 Bot: *' + d.auto + '*',
    '⏳ Esperando respuesta: *' + d.waiting + '*' + (d.oldest ? ' (la más antigua hace ' + d.oldest + ')' : ''),
    '🙋 Requieren humano: *' + d.human + '*',
    '👤 Contactos nuevos: *' + d.new_contacts + '*',
    '✅ Tareas para hoy: *' + d.tasks_today + '*' + (d.tasks_overdue ? '  ·  vencidas: *' + d.tasks_overdue + '*' : ''),
    '💼 Embudo abierto: *' + d.deals_open + '* por ' + money_(d.deals_value) + (d.won_today ? '  ·  ganadas hoy: *' + d.won_today + '*' : '')
  ];
  if (d.failed) lines.push('⚠️ Envíos fallidos hoy: *' + d.failed + '*');
  lines.push('', 'Escribe /p para ver quién espera.');
  return lines.join('\n');
}

function cmd_pending_(me, rest) {
  var n = Math.min(parseInt(rest, 10) || 10, 20);
  var rows = db_('Conversations').filter(function (c) { return c.waiting_since && !isGroup_(c.phone); })
    .sort(function (a, b) { return a.waiting_since < b.waiting_since ? -1 : 1; });
  if (!rows.length) return '✅ Nadie está esperando respuesta.';
  var list = rows.slice(0, n);
  CacheService.getScriptCache().put(cmd_listKey_(me), JSON.stringify(list.map(function (c) { return c.phone; })), 3600);
  var out = ['*Esperando respuesta* (' + rows.length + ')', ''];
  list.forEach(function (c, i) {
    var flag = c.status === 'needs-human' ? ' 🙋' : '';
    out.push('*#' + (i + 1) + '* ' + cmd_nameOf_(c.phone) + flag + ' · hace ' + humanWait_(c.waiting_since));
    out.push('   _' + truncate_(c.last_message, 80) + '_');
  });
  out.push('', 'Responde: /r 1 tu mensaje  ·  Ver chat: /ver 1');
  return out.join('\n');
}

function cmd_view_(me, rest) {
  var phone = cmd_ref_(me, rest);
  var msgs = db_('Messages').findAllExact('phone', phone).sort(function (a, b) { return a.timestamp < b.timestamp ? -1 : 1; }).slice(-8);
  var out = ['*' + cmd_nameOf_(phone) + '* · +' + phone, ''];
  if (!msgs.length) out.push('Sin mensajes.');
  msgs.forEach(function (m) {
    var who = m.direction === 'in' ? '👤' : (m.source === 'auto' ? '🤖' : '💬');
    out.push(who + ' ' + fmtDate_(m.timestamp, 'dd/MM HH:mm') + '  ' + truncate_(m.body || '[' + m.type + ']', 160));
  });
  out.push('', 'Responder: /r ' + phone + ' tu mensaje');
  return out.join('\n');
}

function cmd_reply_(me, rest) {
  var s = cmd_split_(rest);
  var phone = cmd_ref_(me, s.ref);
  if (!s.text) throw new Error('Falta el mensaje. Ejemplo: /r 2 Hola, ya te atiendo.');
  var c = db_('Contacts').findBy('phone', phone) || { phone: phone };
  var res = wa_send_(phone, resolveVars_(s.text, c, { agent: me.name }), { source: 'command', agent: me.name });
  return res.success ? '✅ Enviado a ' + cmd_nameOf_(phone) : '⚠️ No se envió: ' + res.error;
}

function cmd_quick_(me, rest) {
  var s = cmd_split_(rest);
  var phone = cmd_ref_(me, s.ref);
  var key = norm_(s.text).replace(/^\//, '');
  var tpl = db_('Templates').find(function (t) { return t.status !== 'inactive' && (t.shortcut === key || norm_(t.name) === key); });
  if (!tpl) {
    var list = db_('Templates').filter(function (t) { return t.shortcut; }).map(function (t) { return '/' + t.shortcut; }).join(', ');
    throw new Error('No hay respuesta rápida "' + key + '".' + (list ? ' Disponibles: ' + list : ''));
  }
  var c = db_('Contacts').findBy('phone', phone) || { phone: phone };
  var res = wa_send_(phone, resolveVars_(tpl.message, c, { agent: me.name }), { source: 'quick-reply', agent: me.name, file_url: tpl.file_url, document_url: tpl.document_url });
  db_('Templates').patch(tpl, { uses: (parseInt(tpl.uses, 10) || 0) + 1 });
  return res.success ? '✅ "' + tpl.name + '" enviada a ' + cmd_nameOf_(phone) : '⚠️ ' + res.error;
}

function cmd_send_(me, rest) {
  var s = cmd_split_(rest);
  var phone = normPhone_(s.ref);
  if (!/^\d{8,15}$/.test(phone) && !isGroup_(phone)) phone = cmd_ref_(me, s.ref);
  if (!s.text) throw new Error('Ejemplo: /e 999888777 Hola, te escribo de ' + cfg_('COMPANY_NAME'));
  var res = wa_send_(phone, s.text, { source: 'command', agent: me.name });
  if (res.success && !isGroup_(phone)) withLock_(function () { if (!db_('Contacts').findBy('phone', phone)) contact_touch_(phone, '', nowIso_()); });
  return res.success ? '✅ Enviado a ' + (isGroup_(phone) ? cmd_nameOf_(phone) : '+' + phone) : '⚠️ ' + res.error;
}

function cmd_done_(me, rest) {
  var phone = cmd_ref_(me, rest);
  conv_setStatus({ phone: phone, status: 'resolved' }, me);
  return '✅ ' + cmd_nameOf_(phone) + ' marcada como atendida.';
}

function cmd_assign_(me, rest) {
  var s = cmd_split_(rest);
  var phone = cmd_ref_(me, s.ref);
  var u = db_('Users').find(function (x) { return norm_(x.name).indexOf(norm_(s.text)) === 0; });
  if (!u) throw new Error('No hay un usuario "' + s.text + '".');
  conv_assign({ phone: phone, assigned_to: u.name }, me);
  if (u.phone && normPhone_(u.phone) !== normPhone_(me.phone)) {
    wa_send_(u.phone, '📌 ' + me.name + ' te asignó a *' + cmd_nameOf_(phone) + '* (+' + phone + ').\nVer: /ver ' + phone, { source: 'system', force: true });
  }
  return '✅ ' + cmd_nameOf_(phone) + ' asignada a ' + u.name + '.';
}

// ── Clientes y ventas ────────────────────────────────────────────────────
function cmd_search_(me, rest) {
  var q = norm_(rest);
  if (q.length < 2) throw new Error('Escribe al menos 2 letras. Ejemplo: /buscar rosa');
  var hits = db_('Contacts').filter(function (c) { return norm_([c.phone, c.display_name, c.whatsapp_name, c.company, c.tags].join(' ')).indexOf(q) !== -1; }).slice(0, 8);
  if (!hits.length) return 'Sin resultados para "' + rest + '".';
  CacheService.getScriptCache().put(cmd_listKey_(me), JSON.stringify(hits.map(function (c) { return c.phone; })), 3600);
  var out = ['*Resultados* (' + hits.length + ')', ''];
  hits.forEach(function (c, i) { out.push('*#' + (i + 1) + '* ' + contactName_(c, c.phone) + ' · +' + c.phone + (c.tags ? ' · ' + c.tags : '')); });
  out.push('', 'Ficha: /ficha 1  ·  Escribir: /r 1 texto');
  return out.join('\n');
}

function cmd_card_(me, rest) {
  var phone = cmd_ref_(me, rest);
  var c = db_('Contacts').findBy('phone', phone);
  if (!c) return 'No hay ficha para +' + phone + '.';
  var deals = db_('Deals').filter(function (d) { return d.phone === phone; });
  var notes = db_('Notes').filter(function (n) { return n.phone === phone; }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
  var tasks = db_('Tasks').filter(function (t) { return t.phone === phone && t.status === 'open'; });
  var out = ['*' + contactName_(c, phone) + '*', '📱 +' + phone];
  if (c.company) out.push('🏢 ' + c.company);
  if (c.city) out.push('📍 ' + c.city);
  if (c.email) out.push('✉️ ' + c.email);
  if (c.tags) out.push('🏷 ' + c.tags);
  if (c.owner) out.push('👤 Responsable: ' + c.owner);
  if (String(c.do_not_contact) === 'true') out.push('🚫 No contactar');
  out.push('🕑 Último mensaje: ' + (c.last_inbound_at ? fmtDate_(c.last_inbound_at, 'dd/MM HH:mm') : '—'));
  if (deals.length) {
    out.push('', '*Oportunidades*');
    deals.slice(0, 4).forEach(function (d) { out.push('• ' + d.title + ' — ' + d.stage + ' · ' + money_(d.value)); });
  }
  if (tasks.length) {
    out.push('', '*Tareas abiertas*');
    tasks.slice(0, 3).forEach(function (t) { out.push('• ' + t.title + (t.due_at ? ' (' + fmtDate_(t.due_at, 'dd/MM HH:mm') + ')' : '')); });
  }
  if (notes.length) {
    out.push('', '*Última nota*', '_' + truncate_(notes[0].body, 200) + '_ — ' + notes[0].author);
  }
  return out.join('\n');
}

function cmd_note_(me, rest) {
  var s = cmd_split_(rest);
  var phone = cmd_ref_(me, s.ref);
  if (!s.text) throw new Error('Ejemplo: /nota 2 Pidió cotización del plan de 200 Mbps');
  notes_add({ phone: phone, body: s.text }, me);
  return '📝 Nota guardada en ' + cmd_nameOf_(phone) + '.';
}

function cmd_tag_(me, rest) {
  var s = cmd_split_(rest);
  var phone = cmd_ref_(me, s.ref);
  if (!s.text) throw new Error('Ejemplo: /tag 2 vip');
  var c = db_('Contacts').findBy('phone', phone);
  if (!c) throw new Error('Ese contacto no existe.');
  withLock_(function () { var cur = db_('Contacts').findBy('phone', phone); db_('Contacts').patch(cur, { tags: mergeTags_(cur.tags, s.text), updated_at: nowIso_() }); });
  return '🏷 ' + cmd_nameOf_(phone) + ': ' + mergeTags_(c.tags, s.text);
}

function cmd_lead_(me, rest) {
  var parts = String(rest || '').split('|').map(function (x) { return x.trim(); });
  var first = cmd_split_(parts[0]);
  var phone = normPhone_(first.ref);
  if (!/^\d{8,15}$/.test(phone)) throw new Error('Ejemplo: /lead 999888777 Rosa Díaz | 120 | Portabilidad');
  var name = first.text;
  var value = parts[1] ? parseFloat(parts[1].replace(/[^\d.]/g, '')) || 0 : 0;
  var product = parts[2] || '';
  withLock_(function () {
    var c = db_('Contacts').findBy('phone', phone);
    if (!c) contact_touch_(phone, name, nowIso_());
    else if (name && !c.display_name) db_('Contacts').patch(c, { display_name: name });
  });
  var res = deals_save({ phone: phone, title: product || (name ? 'Venta a ' + name : 'Nueva oportunidad'), product: product, value: value, contact_name: name }, me);
  return '💼 Oportunidad creada: *' + res.data.title + '* · ' + money_(value) + ' · etapa ' + res.data.stage + '\nMover: /etapa ' + phone + ' ' + (stages_()[1] || '');
}

function cmd_stage_(me, rest) {
  var s = cmd_split_(rest);
  var phone = cmd_ref_(me, s.ref);
  var target = norm_(s.text);
  var stage = stages_().filter(function (x) { return norm_(x).indexOf(target) === 0; })[0];
  if (!target || !stage) throw new Error('Etapas: ' + stages_().join(', '));
  var d = withLock_(function () { return deal_upsertForPhone_(phone, stage, { owner: me.name, title: 'Oportunidad de ' + cmd_nameOf_(phone) }); });
  audit_(me.name, 'deal_stage_changed', 'deal', d.deal_id, { stage: stage });
  return '💼 ' + cmd_nameOf_(phone) + ' → *' + stage + '*' + (d.status === 'won' ? ' 🎉' : '');
}

function cmd_sales_() {
  var deals = db_('Deals').all();
  var out = ['*Embudo de ventas*', ''];
  stages_().forEach(function (st) {
    var ds = deals.filter(function (d) { return d.stage === st; });
    var val = ds.reduce(function (s, d) { return s + (parseFloat(d.value) || 0); }, 0);
    out.push(st + ': *' + ds.length + '* · ' + money_(val));
  });
  var month = fmtDate_(new Date(), 'yyyy-MM');
  var wonMonth = deals.filter(function (d) { return d.status === 'won' && d.closed_at && fmtDate_(d.closed_at, 'yyyy-MM') === month; });
  out.push('', '🏆 Ganado este mes: *' + wonMonth.length + '* · ' + money_(wonMonth.reduce(function (s, d) { return s + (parseFloat(d.value) || 0); }, 0)));
  return out.join('\n');
}

// ── Agenda ───────────────────────────────────────────────────────────────
var DOW_ES = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
function fmtHuman_(d) { return DOW_ES[parseInt(fmtDate_(d, 'u'), 10) - 1] + ' ' + fmtDate_(d, 'dd/MM HH:mm'); }

function pad2_(n) { return ('0' + n).slice(-2); }

function localDate_(y, m, d, h, mi) {
  var probe = new Date(Date.UTC(y, m - 1, d, 12));
  return new Date(y + '-' + pad2_(m) + '-' + pad2_(d) + 'T' + pad2_(h) + ':' + pad2_(mi) + ':00' + tzOffset_(probe));
}

/** Interpreta fechas al inicio del texto: "en 30 min", "hoy 17:00", "mañana 9", "30/09 18:30", "16:30", "viernes 10:00". */
function parseWhen_(str) {
  var s = String(str || '').replace(/\s+/g, ' ').trim();
  var n = norm_(s);
  var now = new Date();
  var today = fmtDate_(now, 'yyyy-MM-dd').split('-').map(Number);
  function hm(h, mi, ap) {
    h = parseInt(h, 10); mi = parseInt(mi || '0', 10);
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return [h, mi];
  }
  function cut(len) { return s.slice(len).trim(); }
  var m;
  if ((m = n.match(/^en\s+(\d+)\s*(m|min|mins|minutos?|h|hr|hrs|horas?)\b/))) {
    var mult = /^h/.test(m[2]) ? 3600000 : 60000;
    return { date: new Date(now.getTime() + parseInt(m[1], 10) * mult), rest: cut(m[0].length) };
  }
  if ((m = n.match(/^(hoy|manana|pasado manana)\s+(?:a las\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/))) {
    var add = m[1] === 'hoy' ? 0 : (m[1] === 'manana' ? 1 : 2);
    var t = hm(m[2], m[3], m[4]);
    var base = localDate_(today[0], today[1], today[2], t[0], t[1]);
    return { date: new Date(base.getTime() + add * 86400000), rest: cut(m[0].length) };
  }
  if ((m = n.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/))) {
    var yy = m[3] ? (m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10)) : today[0];
    var t2 = hm(m[4], m[5], m[6]);
    var d2 = localDate_(yy, parseInt(m[2], 10), parseInt(m[1], 10), t2[0], t2[1]);
    if (!m[3] && d2 < now) d2 = localDate_(yy + 1, parseInt(m[2], 10), parseInt(m[1], 10), t2[0], t2[1]);
    return { date: d2, rest: cut(m[0].length) };
  }
  var days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  if ((m = n.match(/^(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+(?:a las\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/))) {
    var target = days.indexOf(m[1]) + 1;
    var dow = parseInt(fmtDate_(now, 'u'), 10);
    var diff = (target - dow + 7) % 7 || 7;
    var t3 = hm(m[2], m[3], m[4]);
    var b3 = localDate_(today[0], today[1], today[2], t3[0], t3[1]);
    return { date: new Date(b3.getTime() + diff * 86400000), rest: cut(m[0].length) };
  }
  var t4 = null;
  if ((m = n.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?/))) t4 = hm(m[1], m[2], m[3]);
  else if ((m = n.match(/^(\d{1,2})\s*(am|pm)\b/))) t4 = hm(m[1], '0', m[2]);
  if (t4) {
    var d4 = localDate_(today[0], today[1], today[2], t4[0], t4[1]);
    if (d4 < now) d4 = new Date(d4.getTime() + 86400000);
    return { date: d4, rest: cut(m[0].length) };
  }
  return null;
}

function cmd_task_(me, rest) {
  var title = rest, when = null;
  if (rest.indexOf('|') !== -1) {
    var parts = rest.split('|');
    title = parts[0].trim();
    var w = parseWhen_(parts[1]);
    if (!w) throw new Error('No entendí la fecha "' + parts[1].trim() + '". Ejemplos: mañana 10:00 · 30/09 15:00 · en 2 h');
    when = w.date;
  } else {
    var w2 = parseWhen_(rest);
    if (w2) { when = w2.date; title = w2.rest; }
  }
  if (!title) throw new Error('Ejemplo: /tarea mañana 10:00 Llamar a Rosa');
  var res = tasks_save({ title: title, due_at: when ? when.toISOString() : '', assigned_to: me.name, remind: when ? 'true' : 'false' }, me);
  return '✅ Tarea creada' + (when ? ' para el ' + fmtHuman_(when) : '') + ':\n' + title + '\nCódigo: ' + res.task_id.slice(-6);
}

function cmd_tasks_(me) {
  var rows = db_('Tasks').filter(function (t) { return t.status === 'open' && (norm_(t.assigned_to) === norm_(me.name) || !t.assigned_to); })
    .sort(function (a, b) { return (a.due_at || '9') < (b.due_at || '9') ? -1 : 1; }).slice(0, 15);
  if (!rows.length) return '✅ No tienes tareas abiertas.';
  CacheService.getScriptCache().put('cmdtasks_' + (me.user_id || me.name), JSON.stringify(rows.map(function (t) { return t.task_id; })), 3600);
  var nowIso = nowIso_();
  var out = ['*Tus tareas* (' + rows.length + ')', ''];
  rows.forEach(function (t, i) {
    var late = t.due_at && t.due_at < nowIso ? ' ⚠️' : '';
    out.push('*' + (i + 1) + '.* ' + t.title + (t.due_at ? ' · ' + fmtDate_(t.due_at, 'dd/MM HH:mm') + late : ''));
  });
  out.push('', 'Completar: /hecho 1');
  return out.join('\n');
}

function cmd_taskDone_(me, rest) {
  var ref = String(rest || '').trim();
  var id = null;
  if (/^\d{1,2}$/.test(ref)) {
    var list = JSON.parse(CacheService.getScriptCache().get('cmdtasks_' + (me.user_id || me.name)) || '[]');
    id = list[parseInt(ref, 10) - 1];
  }
  var t = id ? db_('Tasks').get(id) : db_('Tasks').find(function (x) { return x.task_id.slice(-6).toUpperCase() === ref.toUpperCase(); });
  if (!t) throw new Error('No encontré esa tarea. Escribe /tareas para ver la lista.');
  tasks_save({ task_id: t.task_id, status: 'done' }, me);
  return '✅ Hecho: ' + t.title;
}

function cmd_remind_(me, rest) {
  var w = parseWhen_(rest);
  if (!w || !w.rest) throw new Error('Ejemplo: /recordar 16:30 Enviar cotización  ·  /recordar en 45 min llamar a Juan');
  tasks_save({ title: w.rest, due_at: w.date.toISOString(), assigned_to: me.name, remind: 'true' }, me);
  return '⏰ Te aviso el ' + fmtHuman_(w.date) + ': ' + w.rest;
}

function cmd_schedule_(me, rest) {
  var w = parseWhen_(rest);
  if (!w) throw new Error('Ejemplo: /prog 30/09 18:00 999888777 Hola, te recuerdo tu cita');
  var s = cmd_split_(w.rest);
  var phone = /^\d{8,15}$/.test(normPhone_(s.ref)) ? normPhone_(s.ref) : cmd_ref_(me, s.ref);
  if (!s.text) throw new Error('Falta el mensaje.');
  schedules_save({ title: 'Desde WhatsApp · ' + cmd_nameOf_(phone), recipients: phone, message_template: s.text, start_datetime: w.date.toISOString(), recurrence_type: 'once' }, me);
  return '🗓 Programado para el ' + fmtHuman_(w.date) + ' a ' + cmd_nameOf_(phone) + '.';
}

// ── Sistema ──────────────────────────────────────────────────────────────
function cmd_campaigns_() {
  var rows = campaigns_list().data.slice(0, 8);
  if (!rows.length) return 'No hay campañas.';
  var labels = { draft: 'Borrador', scheduled: 'Programada', sending: 'Enviando', paused: 'Pausada', completed: 'Terminada', cancelled: 'Cancelada' };
  var out = ['*Campañas*', ''];
  rows.forEach(function (c) {
    out.push('• *' + c.name + '* — ' + (labels[c.status] || c.status) + (c.status !== 'draft' ? ' · ' + c.sent_count + '/' + c.total_recipients + (c.failed_count > 0 ? ' (' + c.failed_count + ' fallidos)' : '') : ''));
  });
  out.push('', 'Lanzar un borrador: /lanzar nombre');
  return out.join('\n');
}

function cmd_launch_(me, rest) {
  if (me.role === 'agent') throw new Error('Solo administradores y supervisores pueden lanzar campañas.');
  var q = norm_(rest);
  var camp = db_('Campaigns').find(function (c) { return c.status === 'draft' && (norm_(c.name).indexOf(q) !== -1 || c.campaign_id.toUpperCase().slice(-6) === String(rest).toUpperCase()); });
  if (!q || !camp) throw new Error('No encontré un borrador con "' + rest + '". Escribe /campanas.');
  var count = campaign_audience_(camp).length;
  var code = String(Math.floor(1000 + Math.random() * 9000));
  CacheService.getScriptCache().put('cmdconfirm_' + (me.user_id || me.name), JSON.stringify({ id: camp.campaign_id, code: code }), 600);
  return '📢 *' + camp.name + '* se enviará a *' + count + '* contactos.\n\nPara confirmar escribe: /confirmar ' + code + '\n(válido 10 min)';
}

function cmd_confirm_(me, rest) {
  var key = 'cmdconfirm_' + (me.user_id || me.name);
  var pend = JSON.parse(CacheService.getScriptCache().get(key) || 'null');
  if (!pend || String(rest).trim() !== pend.code) throw new Error('Código incorrecto o vencido.');
  CacheService.getScriptCache().remove(key);
  var r = campaigns_launch({ campaign_id: pend.id }, me);
  return '🚀 Campaña en cola: ' + r.queued + ' mensajes. Tiempo estimado: ~' + r.eta_minutes + ' min.';
}

function cmd_bot_(me, rest) {
  var v = norm_(rest);
  // /bot 2 off · /bot 999888777 on · /bot Rosa auto → solo en ese chat
  var per = String(rest || '').trim().match(/^(.+?)\s+(on|off|auto|si|no)$/i);
  if (per) {
    var phone = cmd_ref_(me, per[1]);
    var mode = { on: 'on', si: 'on', off: 'off', no: 'off', auto: '' }[per[2].toLowerCase()];
    withLock_(function () {
      var c = db_('Contacts').findBy('phone', phone);
      if (!c) contact_touch_(phone, '', nowIso_());
      c = db_('Contacts').findBy('phone', phone);
      db_('Contacts').patch(c, { bot: mode, updated_at: nowIso_() });
    });
    audit_(me.name, 'chat_bot_' + (mode || 'auto'), 'contact', phone, {});
    return mode === 'off' ? '🤫 El bot ya no responderá a ' + cmd_nameOf_(phone) + '.' : mode === 'on' ? '🤖 El bot siempre responderá a ' + cmd_nameOf_(phone) + '.' : '🤖 ' + cmd_nameOf_(phone) + ' vuelve a la regla general del bot.';
  }
  if (me.role === 'agent') throw new Error('Solo administradores pueden cambiar el bot.');
  if (v !== 'on' && v !== 'off') return '🤖 El bot está ' + (cfgBool_('BOT_ENABLED') ? '*encendido*' : '*apagado*') + '. Usa /bot on o /bot off.';
  setCfg_('BOT_ENABLED', v === 'on' ? 'true' : 'false');
  audit_(me.name, 'bot_' + v, 'settings', 'BOT_ENABLED', {});
  return v === 'on' ? '🤖 Respuestas automáticas *encendidas*.' : '🤖 Respuestas automáticas *apagadas*. Los mensajes quedarán esperando en la bandeja.';
}

function cmd_status_() {
  var h = system_health_();
  return [
    '*Estado del sistema* · v' + APP_VERSION,
    (h.api_key ? '✅' : '❌') + ' TextMeBot conectado',
    (h.triggers.installed ? '✅' : '❌') + ' Proceso automático' + (h.triggers.last_tick_at ? ' (último: ' + fmtDate_(h.triggers.last_tick_at, 'HH:mm') + ')' : ''),
    (h.webhook_secret ? '✅' : '⚠️') + ' Webhook protegido',
    (h.bot ? '🤖 Bot encendido' : '⏸ Bot apagado'),
    '📨 En cola: ' + h.queue_pending + '  ·  ❌ Fallidos hoy: ' + h.failed_today
  ].join('\n');
}

function cmd_groups_(me) {
  var rows = db_('Groups').all().slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
  if (!rows.length) return 'No hay grupos registrados. Envía /grupo seguido del enlace de invitación, o escribe algo en el grupo para que se detecte solo.';
  CacheService.getScriptCache().put(cmd_listKey_(me) + '_g', JSON.stringify(rows.map(function (g) { return g.group_id; })), 3600);
  var out = ['*Tus grupos* (' + rows.length + ')', ''];
  rows.forEach(function (g, i) { out.push('*g' + (i + 1) + '* ' + (g.name || 'Sin nombre') + (g.last_sent_at ? ' · último envío ' + fmtDate_(g.last_sent_at, 'dd/MM HH:mm') : '')); });
  out.push('', 'Enviar: /e g1 texto  ·  Programar: /prog lunes 8:00 g1 texto');
  return out.join('\n');
}

function cmd_groupAdd_(me, rest) {
  if (me.role === 'agent') throw new Error('Solo administradores y supervisores registran grupos.');
  var parts = String(rest || '').trim().split(/\s+/);
  var link = parts.shift();
  var r = groups_save({ invite: link, name: parts.join(' ') }, me);
  return '✅ Grupo registrado: *' + (r.data.name || r.data.group_id) + '*\nRecuerda: tu número debe seguir siendo miembro del grupo.\nLista: /grupos';
}

/** Simulador del portal: ejecuta un comando como el usuario conectado (sin enviar la respuesta por WhatsApp). */
function cmd_simulate(p, me) {
  var r = cmd_run_(me, p.text, { reply: false });
  return { success: true, reply: r.reply, command: r.command };
}

function cmd_catalog() { return { success: true, groups: CMD_HELP }; }

;
/* ── 09_Analytics.gs ── */
/**
 * WA POWER v2 — 09_Analytics.gs
 * Mesa de atención (inicio), métricas por día en la zona horaria correcta
 * (la v1 contaba por fecha UTC: después de las 7 p. m. los mensajes caían en "mañana"),
 * tiempo de respuesta, mapa de horas, embudo y salud del sistema.
 */

function analytics_today_() {
  var today = dayKey_(new Date());
  var msgs = db_('Messages').tail(2500);
  var out = { received: 0, sent: 0, auto: 0, failed: 0 };
  msgs.forEach(function (m) {
    if (dayKey_(m.timestamp) !== today) return;
    if (m.direction === 'in') out.received++;
    else if (m.status === 'sent' && m.source !== 'system' && m.source !== 'command-reply') { out.sent++; if (m.source === 'auto') out.auto++; }
    else if (m.status === 'failed') out.failed++;
  });
  var convs = db_('Conversations').all().filter(function (c) { return !isGroup_(c.phone); });
  var waiting = convs.filter(function (c) { return c.waiting_since; }).sort(function (a, b) { return a.waiting_since < b.waiting_since ? -1 : 1; });
  out.waiting = waiting.length;
  out.oldest = waiting.length ? humanWait_(waiting[0].waiting_since) : '';
  out.human = convs.filter(function (c) { return c.status === 'needs-human'; }).length;
  out.new_contacts = db_('Contacts').filter(function (c) { return dayKey_(c.first_seen_at || c.created_at) === today; }).length;
  var nowIso = nowIso_();
  var open = db_('Tasks').filter(function (t) { return t.status === 'open'; });
  out.tasks_today = open.filter(function (t) { return t.due_at && dayKey_(t.due_at) === today; }).length;
  out.tasks_overdue = open.filter(function (t) { return t.due_at && t.due_at < nowIso && dayKey_(t.due_at) !== today; }).length;
  var deals = db_('Deals').all();
  var openDeals = deals.filter(function (d) { return d.status === 'open'; });
  out.deals_open = openDeals.length;
  out.deals_value = openDeals.reduce(function (s, d) { return s + (parseFloat(d.value) || 0); }, 0);
  out.won_today = deals.filter(function (d) { return d.status === 'won' && d.closed_at && dayKey_(d.closed_at) === today; }).length;
  var h = parseInt(fmtDate_(new Date(), 'H'), 10);
  out.greeting = h < 12 ? 'Buenos días' : (h < 19 ? 'Buenas tardes' : 'Buenas noches');
  return out;
}

/** Todo lo que necesita la pantalla de inicio en una sola llamada. */
function dashboard_get(p, me) {
  return cached_('db_' + norm_(me.name), 120, function () { return dashboard_get_(p, me); }, true);
}

function dashboard_get_(p, me) {
  var t = analytics_today_();
  var contacts = {};
  db_('Contacts').all().forEach(function (c) { contacts[c.phone] = c; });
  var queue = db_('Conversations').filter(function (c) { return c.waiting_since && !isGroup_(c.phone); })
    .sort(function (a, b) { return a.waiting_since < b.waiting_since ? -1 : 1; }).slice(0, 12)
    .map(function (c) {
      return { phone: c.phone, name: contactName_(contacts[c.phone], c.phone), last_message: c.last_message, waiting_since: c.waiting_since, status: c.status, assigned_to: c.assigned_to, unread: parseInt(c.unread, 10) || 0 };
    });
  var nowIso = nowIso_();
  var today = dayKey_(new Date());
  var tasks = db_('Tasks').filter(function (x) { return x.status === 'open' && x.due_at && (x.due_at < nowIso || dayKey_(x.due_at) === today); })
    .sort(function (a, b) { return a.due_at < b.due_at ? -1 : 1; }).slice(0, 8)
    .map(function (x) { var o = {}; for (var k in x) o[k] = x[k]; o.contact_name = x.phone ? contactName_(contacts[x.phone], x.phone) : ''; return o; });
  var deals = db_('Deals').all();
  var pipeline = stages_().map(function (st) {
    var ds = deals.filter(function (d) { return d.stage === st; });
    return { stage: st, count: ds.length, value: ds.reduce(function (s, d) { return s + (parseFloat(d.value) || 0); }, 0) };
  });
  var schedules = db_('ScheduledMessages').filter(function (s) { return s.status === 'active' && s.next_run_at; })
    .sort(function (a, b) { return a.next_run_at < b.next_run_at ? -1 : 1; }).slice(0, 5)
    .map(function (s) { return { schedule_id: s.schedule_id, title: s.title, next_run_at: s.next_run_at, recurrence_type: s.recurrence_type, recipients: String(s.recipients).split(',').length }; });
  var campaigns = db_('Campaigns').filter(function (c) { return c.status === 'sending' || c.status === 'scheduled' || c.status === 'paused'; })
    .map(function (c) { return { campaign_id: c.campaign_id, name: c.name, status: c.status, total: parseInt(c.total_recipients, 10) || 0, sent: parseInt(c.sent_count, 10) || 0, failed: parseInt(c.failed_count, 10) || 0 }; });
  return {
    success: true, today: t, queue: queue, tasks: tasks, pipeline: pipeline, schedules: schedules, campaigns: campaigns,
    currency: cfg_('CURRENCY'), company: cfg_('COMPANY_NAME'), health: system_health_(), me: me
  };
}

function analytics_get(p) {
  var d = Math.min(Math.max(parseInt(p.days, 10) || 14, 1), 90);
  // La analítica pesa: se reutiliza 3 minutos (no hace falta al segundo)
  return cached_('an_' + d, 180, function () { return analytics_get_({ days: d }); }, false);
}

function analytics_get_(p) {
  var days = Math.min(Math.max(parseInt(p.days, 10) || 14, 1), 90);
  var tz = tz_();
  var keys = [];
  for (var i = days - 1; i >= 0; i--) keys.push(dayKey_(new Date(Date.now() - i * 86400000)));
  var first = keys[0];
  var series = {};
  keys.forEach(function (k) { series[k] = { day: k, in: 0, out: 0, auto: 0, failed: 0 }; });
  var heat = [];
  for (var d = 0; d < 7; d++) { heat.push([]); for (var h = 0; h < 24; h++) heat[d].push(0); }
  var bySource = {};
  var ruleHits = {};

  var tailN = Math.min(20000, 1500 + days * 400);
  var msgs = db_('Messages').tail(tailN).filter(function (m) { return dayKey_(m.timestamp) >= first; })
    .sort(function (a, b) { return a.timestamp < b.timestamp ? -1 : 1; });
  var waitingSince = {};
  var responseMins = [];
  msgs.forEach(function (m) {
    var k = dayKey_(m.timestamp);
    var s = series[k];
    if (!s) return;
    if (m.direction === 'in') {
      s.in++;
      var ld = toLocal_(m.timestamp);
      var dow = (ld.getUTCDay() + 6) % 7; // lunes = 0
      var hr = ld.getUTCHours();
      heat[dow][hr]++;
      if (!waitingSince[m.phone]) waitingSince[m.phone] = m.timestamp;
      if (m.rule_id) ruleHits[m.rule_id] = (ruleHits[m.rule_id] || 0) + 1;
    } else {
      if (m.source === 'system' || m.source === 'command-reply') return;
      if (m.status === 'failed') { s.failed++; return; }
      s.out++;
      if (m.source === 'auto') s.auto++;
      bySource[m.source || 'manual'] = (bySource[m.source || 'manual'] || 0) + 1;
      if (HUMAN_SOURCES.indexOf(m.source) !== -1 && waitingSince[m.phone]) {
        responseMins.push((new Date(m.timestamp) - new Date(waitingSince[m.phone])) / 60000);
        delete waitingSince[m.phone];
      } else if (m.source === 'auto' && waitingSince[m.phone]) {
        delete waitingSince[m.phone];
      }
    }
  });
  responseMins.sort(function (a, b) { return a - b; });
  var median = responseMins.length ? responseMins[Math.floor(responseMins.length / 2)] : null;
  var within15 = responseMins.filter(function (x) { return x <= 15; }).length;

  var rules = {};
  db_('AutomationRules').all().forEach(function (r) { rules[r.rule_id] = r.rule_name; });
  var topRules = Object.keys(ruleHits).map(function (id) { return { rule_id: id, name: rules[id] || id, count: ruleHits[id] }; })
    .sort(function (a, b) { return b.count - a.count; }).slice(0, 8);

  var deals = db_('Deals').all();
  var funnel = stages_().map(function (st) {
    var ds = deals.filter(function (x) { return x.stage === st; });
    return { stage: st, count: ds.length, value: ds.reduce(function (s, x) { return s + (parseFloat(x.value) || 0); }, 0) };
  });
  var won = deals.filter(function (x) { return x.status === 'won' && dayKey_(x.closed_at) >= first; });
  var lost = deals.filter(function (x) { return x.status === 'lost' && dayKey_(x.closed_at) >= first; });

  var campaigns = db_('Campaigns').all().filter(function (c) { return c.status !== 'draft'; })
    .sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }).slice(0, 6)
    .map(function (c) { return { name: c.name, total: parseInt(c.total_recipients, 10) || 0, sent: parseInt(c.sent_count, 10) || 0, failed: parseInt(c.failed_count, 10) || 0, status: c.status }; });

  var totals = keys.reduce(function (acc, k) { var s = series[k]; acc.in += s.in; acc.out += s.out; acc.auto += s.auto; acc.failed += s.failed; return acc; }, { in: 0, out: 0, auto: 0, failed: 0 });
  var newContacts = db_('Contacts').filter(function (c) { return dayKey_(c.first_seen_at || c.created_at) >= first; }).length;

  return {
    success: true, days: days, series: keys.map(function (k) { return series[k]; }), totals: totals,
    response: { median_min: median === null ? null : Math.round(median), samples: responseMins.length, within_15_pct: responseMins.length ? Math.round(within15 * 100 / responseMins.length) : null },
    heatmap: heat, by_source: bySource, top_rules: topRules, funnel: funnel,
    won: { count: won.length, value: won.reduce(function (s, x) { return s + (parseFloat(x.value) || 0); }, 0) },
    lost: { count: lost.length }, campaigns: campaigns, new_contacts: newContacts, currency: cfg_('CURRENCY')
  };
}

function system_health_() {
  var today = dayKey_(new Date());
  var q = db_('Queue').all();
  var failedToday = db_('Messages').tail(1500).filter(function (m) { return m.direction === 'out' && m.status === 'failed' && dayKey_(m.timestamp) === today; }).length;
  var trig;
  try { trig = triggers_status(); } catch (e) { trig = { installed: false, error: e.message }; }
  return {
    version: APP_VERSION,
    api_key: !!prop_('TEXTMEBOT_API_KEY'),
    webhook_secret: !!prop_('WEBHOOK_SECRET'),
    bot: cfgBool_('BOT_ENABLED'),
    in_hours: inBusinessHours_(),
    triggers: trig,
    queue_pending: q.filter(function (x) { return x.status === 'pending'; }).length,
    failed_today: failedToday
  };
}

/** Consulta liviana cada 20 s desde el portal: contadores y mensajes nuevos. */
function poll_get(p, me) {
  var v = dataVersion_();
  if (p.v && p.v === v) return { success: true, unchanged: true, v: v, now: nowIso_() };
  var r = poll_full_(p, me);
  r.v = v;
  return r;
}

function poll_full_(p, me) {
  var since = String(p.since || '');
  var counts = conv_counts_(me);
  var fresh = [];
  if (since) {
    var contacts = {};
    db_('Conversations').all().forEach(function (c) {
      if (c.last_direction === 'in' && c.last_message_at >= since && !isGroup_(c.phone)) fresh.push(c);
    });
    db_('Contacts').all().forEach(function (c) { contacts[c.phone] = c; });
    fresh = fresh.map(function (c) { return { phone: c.phone, name: contactName_(contacts[c.phone], c.phone), body: c.last_message, at: c.last_message_at }; });
  }
  var openTasksDue = db_('Tasks').filter(function (t) { return t.status === 'open' && t.due_at && t.due_at <= nowIso_(); }).length;
  return { success: true, now: nowIso_(), counts: counts, fresh: fresh, tasks_due: openTasksDue, bot: cfgBool_('BOT_ENABLED') };
}

function audit_list(p) {
  var rows = db_('AuditLogs').tail(parseInt(p.limit, 10) || 200).reverse();
  if (p.q) { var q = norm_(p.q); rows = rows.filter(function (r) { return norm_([r.actor, r.action, r.entity_type, r.entity_id, r.details_json].join(' ')).indexOf(q) !== -1; }); }
  return { success: true, data: rows };
}

;
/* ── 10_Router.gs ── */
/**
 * WA POWER v2 — 10_Router.gs
 * Entradas web: doGet / doPost.
 *  - El portal envía POST con cuerpo JSON en text/plain (sin preflight CORS, el token ya no viaja en la URL).
 *  - El webhook de TextMeBot debe apuntar a:  <URL de la Web App>?key=<WEBHOOK_SECRET>
 *    Sin la clave correcta el mensaje se ignora (la v1 aceptaba mensajes falsos de cualquiera).
 */

var ROLE_RANK = { agent: 1, supervisor: 2, admin: 3 };

// acción → [función, rol mínimo]. Se arma dentro de una función porque Apps Script
// carga los archivos en orden y aquí se usan funciones de archivos posteriores.
var _ACTIONS = null;
function actions_() {
  if (_ACTIONS) return _ACTIONS;
  _ACTIONS = {
  ping:              [function () { return { success: true, app: 'WA Power', version: APP_VERSION, time: nowIso_() }; }, 'public'],
  login:             [auth_login, 'public'],
  logout:            [auth_logout, 'agent'],
  me:                [function (p, me) { return { success: true, user: me }; }, 'agent'],

  dashboard:         [dashboard_get, 'agent'],
  poll:              [poll_get, 'agent'],
  search:            [search_all, 'agent'],

  conversations:     [conv_list, 'agent'],
  conversation:      [conv_get, 'agent'],
  markRead:          [conv_markRead, 'agent'],
  setConversationStatus: [conv_setStatus, 'agent'],
  assignConversation:    [conv_assign, 'agent'],
  sendMessage:       [send_message, 'agent'],

  contacts:          [contacts_list, 'agent'],
  saveContact:       [contacts_save, 'agent'],
  deleteContact:     [contacts_delete, 'supervisor'],
  bulkContacts:      [contacts_bulk, 'supervisor'],
  importContacts:    [contacts_import, 'supervisor'],
  exportContacts:    [contacts_export, 'supervisor'],

  addNote:           [notes_add, 'agent'],
  deleteNote:        [notes_delete, 'agent'],

  deals:             [deals_list, 'agent'],
  saveDeal:          [deals_save, 'agent'],
  deleteDeal:        [deals_delete, 'supervisor'],

  tasks:             [tasks_list, 'agent'],
  saveTask:          [tasks_save, 'agent'],
  deleteTask:        [tasks_delete, 'agent'],

  templates:         [templates_list, 'agent'],
  saveTemplate:      [templates_save, 'supervisor'],
  deleteTemplate:    [templates_delete, 'supervisor'],

  campaigns:         [campaigns_list, 'supervisor'],
  previewCampaign:   [campaigns_preview, 'supervisor'],
  saveCampaign:      [campaigns_save, 'supervisor'],
  launchCampaign:    [campaigns_launch, 'supervisor'],
  campaignState:     [campaigns_setState, 'supervisor'],
  duplicateCampaign: [campaigns_duplicate, 'supervisor'],
  deleteCampaign:    [campaigns_delete, 'supervisor'],

  schedules:         [schedules_list, 'agent'],
  saveSchedule:      [schedules_save, 'agent'],
  scheduleState:     [schedules_setState, 'agent'],
  deleteSchedule:    [schedules_delete, 'agent'],
  runSchedule:       [schedules_runNow, 'agent'],

  rules:             [rules_list, 'supervisor'],
  saveRule:          [rules_save, 'supervisor'],
  deleteRule:        [rules_delete, 'supervisor'],
  testRule:          [rules_test, 'supervisor'],

  analytics:         [analytics_get, 'supervisor'],
  audit:             [audit_list, 'admin'],

  groups:            [groups_list, 'agent'],
  saveGroup:         [groups_save, 'supervisor'],
  deleteGroup:       [groups_delete, 'supervisor'],
  uploadFile:        [files_upload, 'agent'],

  commands:          [cmd_catalog, 'agent'],
  simulateCommand:   [cmd_simulate, 'agent'],

  settings:          [settings_get, 'agent'],
  saveSettings:      [settings_save, 'admin'],
  saveSecret:        [settings_saveSecret, 'admin'],
  rotateWebhookKey:  [settings_rotateWebhook, 'admin'],
  testTextMeBot:     [settings_testTextMeBot, 'admin'],
  installTriggers:   [function () { return triggers_install(); }, 'admin'],
  runTick:           [function () { return { success: true, report: tick('force') }; }, 'admin'],
  setupDatabase:     [function () { return setupDatabase(); }, 'admin'],
  users:             [users_list, 'admin'],
  saveUser:          [users_save, 'admin'],
  deleteUser:        [users_delete, 'admin']
  };
  return _ACTIONS;
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!p.action) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">WA Power ' + APP_VERSION + ' está funcionando. Abre tu portal para usarlo.</p>');
  }
  var out = route_(p);
  finishWrites_();
  return json_(out);
}

function doPost(e) {
  var p = {};
  try {
    var q = (e && e.parameter) || {};
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); }
      catch (err) { body = {}; }
    }
    for (var k in q) p[k] = q[k];
    for (var j in body) p[j] = body[j];

    // Webhook de TextMeBot: sin "action" y con remitente
    var out = (!p.action && (p.from !== undefined || p.sender !== undefined)) ? webhook_(p, q) : route_(p);
    finishWrites_();
    return json_(out);
  } catch (err2) {
    finishWrites_();
    return json_({ success: false, error: err2.message });
  }
}

function webhook_(p, query) {
  var secret = prop_('WEBHOOK_SECRET');
  if (secret && !safeEqual_(query.key || p.key || '', secret)) {
    return { success: false, ignored: true, reason: 'invalid_webhook_key' };
  }
  try {
    return { success: true, result: inbound_handle_(p) };
  } catch (e) {
    audit_('webhook', 'webhook_error', 'webhook', '', { error: e.message, from: p.from });
    return { success: false, error: e.message };
  }
}

function route_(p) {
  var action = String(p.action || '');
  var def = actions_()[action];
  if (!def) return { success: false, error: 'Acción desconocida: ' + action, code: 'unknown_action' };
  var role = def[1];
  var me = null;
  if (role !== 'public') {
    me = auth_session_(p.token);
    if (!me) return { success: false, error: 'Tu sesión venció. Vuelve a ingresar.', code: 'unauthorized' };
    if ((ROLE_RANK[me.role] || 0) < ROLE_RANK[role]) return { success: false, error: 'Tu usuario no tiene permiso para esta acción.', code: 'forbidden' };
  }
  try {
    var params = {};
    for (var k in p) if (k !== 'token' || action === 'logout') params[k] = p[k];
    var out = def[0](params, me);
    if (out && out.success === undefined) out.success = true;
    return out;
  } catch (e) {
    if (!/^(Escribe|Falta|Elige|Ponle|Agrega|Selecciona|Ya existe|Ese número|La |El |Solo |No |Usuario|Tu )/.test(e.message)) {
      audit_(me ? me.name : 'anon', 'request_error', 'system', action, { error: e.message });
    }
    return { success: false, error: e.message };
  }
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

;
/* ── 11_Setup.gs ── */
/**
 * WA POWER v2 — 11_Setup.gs
 *
 * ▶ Ejecuta "instalar" una vez desde el editor de Apps Script:
 *    1. Crea/actualiza todas las hojas y columnas (sin borrar nada de la v1).
 *    2. Migra Inbox/Outbox de la v1 al nuevo historial Messages.
 *    3. Saca secretos que la v1 dejaba escritos en la hoja Settings.
 *    4. Genera la clave maestra y la clave del webhook si faltan.
 *    5. Activa el proceso automático (cada minuto).
 *   Revisa el registro de ejecución: ahí verás tu clave maestra y la URL del webhook.
 */

function instalar() {
  var r = setupDatabase();
  var mig = migrateV1();
  var master = prop_('APP_SECRET_TOKEN');
  if (!master) { master = randomToken_().slice(0, 20); setProp_('APP_SECRET_TOKEN', master); }
  if (!prop_('WEBHOOK_SECRET')) setProp_('WEBHOOK_SECRET', randomToken_().slice(0, 24));
  var trig = triggers_install();
  var url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) {}
  var lines = [
    '════════ WA POWER ' + APP_VERSION + ' instalado ════════',
    'Hojas creadas: ' + (r.created.join(', ') || 'ninguna (ya existían)'),
    'Columnas nuevas: ' + r.columns_added,
    'Migración v1: ' + mig.message,
    'Clave maestra (APP_SECRET_TOKEN): ' + master,
    'Proceso automático: ' + trig.message,
    url ? 'Webhook para TextMeBot: ' + url + '?key=' + prop_('WEBHOOK_SECRET')
        : 'Aún no hay implementación web: publica la Web App y copia la URL del webhook desde Configuración en el portal.',
    '════════════════════════════════════════'
  ];
  lines.forEach(function (l) { Logger.log(l); });
  return lines.join('\n');
}

function setupDatabase() {
  var ss = ss_();
  var created = [], colsAdded = 0;
  Object.keys(SCHEMA).forEach(function (name) {
    var cols = SCHEMA[name];
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      created.push(name);
    }
    var lastCol = sh.getLastColumn();
    var current = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
    var missing = cols.filter(function (c) { return current.indexOf(c) === -1; });
    if (missing.length) {
      sh.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
      colsAdded += current.length ? missing.length : 0;
    }
    var width = current.length + missing.length;
    if (sh.getMaxColumns() < width) sh.insertColumnsAfter(sh.getMaxColumns(), width - sh.getMaxColumns());
    sh.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#E3F1EC').setFontColor('#0D5C58');
    sh.setFrozenRows(1);
    // Texto plano: evita que Sheets convierta teléfonos, fechas ISO o "true" en otros tipos
    sh.getRange(1, 1, sh.getMaxRows(), width).setNumberFormat('@');
  });
  for (var k in _TABLES) _TABLES[k].invalidate();

  seedSettings_();
  seedRules_();
  seedTemplates_();
  cleanSecretsFromSheet_();
  _CFG = null;
  CacheService.getScriptCache().remove('cfg_v2');
  return { success: true, created: created, columns_added: colsAdded, message: 'Base de datos lista. Hojas nuevas: ' + (created.join(', ') || 'ninguna') };
}

function seedSettings_() {
  var t = db_('Settings');
  var have = {};
  t.all().forEach(function (r) { have[r.key] = r; });
  var now = nowIso_();
  var add = [];
  for (var k in DEFAULT_SETTINGS) {
    if (!have[k]) add.push({ key: k, value: DEFAULT_SETTINGS[k][0], description: DEFAULT_SETTINGS[k][1], updated_at: now });
  }
  if (have.SYSTEM_VERSION) t.patch(have.SYSTEM_VERSION, { value: APP_VERSION, updated_at: now });
  // TextMeBot recomienda al menos 5 s entre mensajes (la v1 usaba 3)
  if (have.RATE_LIMIT_SECONDS && parseFloat(have.RATE_LIMIT_SECONDS.value) < 5) t.patch(have.RATE_LIMIT_SECONDS, { value: '5', updated_at: now });
  t.insertMany(add);
}

function seedRules_() {
  var t = db_('AutomationRules');
  if (t.all().length) {
    // v1: normaliza reglas existentes (baja con más palabras)
    var stop = t.find(function (r) { return norm_(r.keyword) === 'stop'; });
    if (stop) t.patch(stop, { keyword: 'stop, baja, no molestar, darme de baja', match_type: 'word' });
    return;
  }
  var now = nowIso_();
  var rows = [
    ['Saludo', 1, 'hola, buenas, buenos dias, buenas tardes, buenas noches', 'word', '{{greeting}} {{first_name}}, gracias por escribir a {{company_name}}. ¿En qué te podemos ayudar?', '', '', '', 'false'],
    ['Precios', 2, 'precio, precios, costo, cuanto cuesta, tarifa, planes', 'word', 'Hola {{first_name}}, con gusto te pasamos precios y planes. ¿Qué producto te interesa?', 'interesado', '', 'Interesado', 'false'],
    ['Hablar con asesor', 3, 'asesor, humano, persona, agente, ayuda', 'word', 'Perfecto, {{first_name}}. Un asesor te escribe en unos minutos.', '', 'needs-human', '', 'true'],
    ['Baja', 4, 'stop, baja, no molestar, darme de baja', 'word', 'Entendido, {{first_name}}. No te enviaremos más mensajes.', 'baja', 'do_not_contact', '', 'false'],
    ['Agradecimiento', 5, 'gracias, muchas gracias', 'word', '¡Con gusto, {{first_name}}! Aquí estamos para lo que necesites.', '', 'resolved', '', 'false']
  ];
  t.insertMany(rows.map(function (r) {
    return {
      rule_id: uid_('RULE'), rule_name: r[0], enabled: 'true', priority: String(r[1]), trigger_type: 'keyword', keyword: r[2], match_type: r[3],
      response_template: r[4], tags_to_add: r[5], mark_status: r[6], deal_stage: r[7], notify_admin: r[8], cooldown_minutes: '60', hits: '0',
      created_at: now, updated_at: now
    };
  }));
}

function seedTemplates_() {
  var t = db_('Templates');
  var now = nowIso_();
  if (t.all().length) {
    // v1: agrega atajos a las plantillas existentes que no tengan
    t.all().forEach(function (x) { if (!x.shortcut) t.patch(x, { shortcut: norm_(x.name).replace(/[^a-z0-9]/g, '').slice(0, 12) }); });
    return;
  }
  var rows = [
    ['Saludo inicial', 'atencion', 'hola', '{{greeting}} {{first_name}}, te saluda {{agent}} de {{company_name}}. ¿En qué te ayudo?'],
    ['Pedir datos', 'atencion', 'datos', 'Para avanzar, ¿me confirmas tu nombre completo, DNI y distrito, por favor?'],
    ['Seguimiento', 'seguimiento', 'seg', 'Hola {{first_name}}, te escribo para saber si pudiste revisar la propuesta. ¿Tienes alguna duda?'],
    ['Horario', 'atencion', 'horario', 'Atendemos de lunes a sábado de 9:00 a. m. a 8:00 p. m.'],
    ['Gracias', 'atencion', 'gracias', '¡Gracias a ti, {{first_name}}! Cualquier cosa, me escribes por aquí.'],
    ['Promoción del mes', 'marketing', 'promo', '{{greeting}} {{first_name}}, este mes tenemos una promoción especial para ti en {{company_name}}. ¿Te cuento?']
  ];
  t.insertMany(rows.map(function (r) {
    return { template_id: uid_('TPL'), name: r[0], category: r[1], shortcut: r[2], message: r[3], status: 'active', uses: '0', created_at: now, updated_at: now };
  }));
}

/** La v1 guardaba la API key y la clave en la hoja Settings: se mueven a Propiedades y se borran de la hoja. */
function cleanSecretsFromSheet_() {
  var t = db_('Settings');
  SECRET_KEYS.forEach(function (k) {
    var row = t.findBy('key', k);
    if (!row) return;
    if (row.value && row.value.indexOf('(guardado') !== 0 && !prop_(k)) setProp_(k, row.value);
    t.patch(row, { value: '(guardado de forma segura en Propiedades del script)', updated_at: nowIso_() });
  });
}

/** Copia Inbox/Outbox (v1) a Messages y ajusta estados. Se puede ejecutar más de una vez sin duplicar. */
function migrateV1() {
  if (prop_('MIGRATED_V1') === 'yes') return { success: true, message: 'ya estaba migrado' };
  var ss = ss_();
  var inbox = ss.getSheetByName('Inbox'), outbox = ss.getSheetByName('Outbox');
  if (!inbox && !outbox) { setProp_('MIGRATED_V1', 'yes'); return { success: true, message: 'no hay datos de la v1' }; }
  var rows = [];
  if (inbox) new Table_('Inbox').all().forEach(function (m) {
    rows.push({ message_id: m.message_id || uid_('MSG'), phone: normPhone_(m.from), direction: 'in', timestamp: m.timestamp || m.created_at, type: m.type || 'text', body: m.message, file_url: m.file_url, status: m.status || 'received', source: 'whatsapp', rule_id: m.matched_rule_id });
  });
  if (outbox) new Table_('Outbox').all().forEach(function (m) {
    rows.push({ message_id: m.outbox_id || uid_('MSG'), phone: normPhone_(m.recipient), direction: 'out', timestamp: m.sent_at || m.created_at, type: 'text', body: m.message, file_url: m.file_url, document_url: m.document_url, status: m.status, source: m.source === 'auto-reply' ? 'auto' : (m.source || 'manual'), campaign_id: m.campaign_id, schedule_id: m.schedule_id, error: m.error_message });
  });
  rows = rows.filter(function (r) { return r.phone; }).sort(function (a, b) { return a.timestamp < b.timestamp ? -1 : 1; });
  var existing = {};
  db_('Messages').all().forEach(function (m) { existing[m.message_id] = true; });
  rows = rows.filter(function (r) { return !existing[r.message_id]; });
  db_('Messages').insertMany(rows);

  // Conversaciones: "active" → "open"; teléfono normalizado
  var convs = db_('Conversations').all();
  convs.forEach(function (c) {
    c.phone = normPhone_(c.phone);
    if (c.status === 'active' || !c.status) c.status = 'open';
    if (!c.unread) c.unread = '0';
  });
  db_('Conversations').patchMany(convs);
  var contacts = db_('Contacts').all();
  contacts.forEach(function (c) { c.phone = normPhone_(c.phone); if (!c.created_at) c.created_at = c.first_seen_at; });
  db_('Contacts').patchMany(contacts);

  setProp_('MIGRATED_V1', 'yes');
  return { success: true, message: rows.length + ' mensajes copiados al nuevo historial' };
}

// ── Configuración desde el portal ────────────────────────────────────────
function settings_get(p, me) {
  var all = cfgAll_();
  var out = {};
  for (var k in DEFAULT_SETTINGS) out[k] = { value: all[k], description: DEFAULT_SETTINGS[k][1] };
  var url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) {}
  var isAdmin = me && me.role === 'admin';
  return {
    success: true, settings: out, stages: stages_(),
    secrets: { TEXTMEBOT_API_KEY: !!prop_('TEXTMEBOT_API_KEY'), WEBHOOK_SECRET: !!prop_('WEBHOOK_SECRET'), APP_SECRET_TOKEN: !!prop_('APP_SECRET_TOKEN') },
    webhook_url: isAdmin && url ? url + '?key=' + (prop_('WEBHOOK_SECRET') || '') : '',
    groups: db_('Groups').all().map(function (g) { return { group_id: g.group_id, name: g.name }; }),
    textmebot_webhook_setup: 'https://api.textmebot.com/webhook.php',
    health: system_health_(), users: db_('Users').all().map(function (u) { return { name: u.name, role: u.role, phone: u.phone }; }),
    version: APP_VERSION
  };
}

function settings_save(p, me) {
  var values = p.values || {};
  if (typeof values === 'string') values = JSON.parse(values);
  var changed = [];
  for (var k in values) {
    if (!DEFAULT_SETTINGS[k]) continue;
    var v = String(values[k]);
    if (k === 'PIPELINE_STAGES') {
      var arr = JSON.parse(v);
      if (!Array.isArray(arr) || arr.length < 2) throw new Error('El embudo necesita al menos 2 etapas.');
      v = JSON.stringify(arr.map(function (x) { return String(x).trim(); }).filter(function (x) { return x; }));
    }
    setCfg_(k, v);
    changed.push(k);
  }
  audit_(me.name, 'settings_updated', 'settings', '', { keys: changed });
  return { success: true, changed: changed };
}

function settings_saveSecret(p, me) {
  if (['TEXTMEBOT_API_KEY', 'APP_SECRET_TOKEN'].indexOf(p.key) === -1) throw new Error('Clave no permitida.');
  var v = String(p.value || '').trim();
  if (p.key === 'APP_SECRET_TOKEN' && v.length < 10) throw new Error('La clave maestra debe tener al menos 10 caracteres.');
  if (!v) throw new Error('El valor está vacío.');
  setProp_(p.key, v);
  audit_(me.name, 'secret_updated', 'settings', p.key, {});
  return { success: true };
}

function settings_rotateWebhook(p, me) {
  setProp_('WEBHOOK_SECRET', randomToken_().slice(0, 24));
  audit_(me.name, 'webhook_key_rotated', 'settings', 'WEBHOOK_SECRET', {});
  return settings_get(p, me);
}

function settings_testTextMeBot(p, me) {
  var to = normPhone_(p.phone || me.phone);
  if (!to) throw new Error('Escribe un número para enviar el mensaje de prueba.');
  var r = wa_send_(to, '✅ Prueba de WA Power: la conexión con TextMeBot funciona (' + fmtDate_(new Date(), 'dd/MM HH:mm') + ').', { source: 'system', force: true });
  return r.success ? { success: true, message: 'Mensaje de prueba enviado a +' + to } : r;
}

;
/* ── 12_Groups.gs ── */
/**
 * WA POWER v2 — 12_Groups.gs
 * Grupos de WhatsApp y archivos adjuntos.
 *
 * Cómo funciona TextMeBot con grupos:
 *  - Se envía igual que a un número, pero el destinatario es el ID del grupo: 1203630…@g.us
 *  - El ID se obtiene del enlace de invitación (https://chat.whatsapp.com/CODIGO):
 *      send.php?group_info=CODIGO&apikey=…&json=yes  →  { group_id, subject }
 *  - IMPORTANTE: el número conectado a TextMeBot debe ser miembro del grupo. Si no lo es,
 *    WhatsApp puede bloquear el número. Nunca lo saques del grupo mientras envíes mensajes.
 *  - También se registran solos: cuando alguien escribe en un grupo donde está tu número,
 *    el grupo aparece en la lista (sin guardar sus mensajes).
 */

function isGroupId_(s) { return /^[\d-]{6,40}@g\.us$/.test(String(s || '').trim()); }

function groupName_(id) {
  var g = db_('Groups').get(id);
  return g && g.name ? g.name : 'Grupo ' + String(id).replace('@g.us', '').slice(-6);
}

/** Registra o actualiza un grupo detectado por el webhook. */
function group_touch_(id, name) {
  if (!isGroupId_(id)) return;
  withLock_(function () {
    var t = db_('Groups');
    var g = t.get(id);
    var now = nowIso_();
    if (g) t.patch(g, { last_seen_at: now, name: g.name || name || '', updated_at: now });
    else t.insert({ group_id: id, name: name || '', source: 'detected', last_seen_at: now, created_at: now, updated_at: now });
  });
}

function inviteCode_(text) {
  var s = String(text || '').trim();
  var m = s.match(/chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9]{10,40})/);
  if (m) return m[1];
  return /^[A-Za-z0-9]{10,40}$/.test(s) ? s : '';
}

/** Pide a TextMeBot el ID y el nombre de un grupo a partir de su enlace de invitación. */
function group_resolve_(invite) {
  var code = inviteCode_(invite);
  if (!code) throw new Error('Pega el enlace de invitación del grupo (https://chat.whatsapp.com/…).');
  var apiKey = prop_('TEXTMEBOT_API_KEY');
  if (!apiKey) throw new Error('Falta la API key de TextMeBot (Configuración).');
  var url = TEXTMEBOT_SEND_URL + '?group_info=' + encodeURIComponent(code) + '&apikey=' + encodeURIComponent(apiKey) + '&json=yes';
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var text = res.getContentText();
  var j = null;
  try { j = JSON.parse(text); } catch (e) {}
  var id = j && (j.group_id || j.groupId || j.id || j.gid);
  if (!id) {
    var m = String(text).match(/[\d-]{6,40}@g\.us/);
    id = m ? m[0] : '';
  }
  if (!id) throw new Error('TextMeBot no devolvió el ID del grupo. Revisa que el enlace esté vigente y que tu número sea miembro del grupo. Respuesta: ' + truncate_(text, 160));
  id = String(id);
  if (id.indexOf('@g.us') === -1) id += '@g.us';
  return { group_id: id, name: (j && (j.subject || j.name || j.group_name)) || '', invite_code: code };
}

function groups_list() {
  var sent = {};
  db_('Messages').tail(5000).forEach(function (m) { if (m.direction === 'out' && isGroup_(m.phone) && m.status === 'sent') sent[m.phone] = (sent[m.phone] || 0) + 1; });
  var scheduled = {};
  db_('ScheduledMessages').all().forEach(function (s) {
    if (s.status !== 'active') return;
    String(s.recipients || '').split(',').forEach(function (r) { if (isGroup_(r)) scheduled[r] = (scheduled[r] || 0) + 1; });
  });
  var rows = db_('Groups').all().map(function (g) {
    var o = {};
    for (var k in g) o[k] = g[k];
    o.sent_recent = sent[g.group_id] || 0;
    o.scheduled = scheduled[g.group_id] || 0;
    return o;
  }).sort(function (a, b) { return String(a.name || 'zzz').localeCompare(String(b.name || 'zzz')); });
  return { success: true, data: rows };
}

/** Guarda un grupo: por enlace de invitación (se consulta a TextMeBot) o por ID directo. */
function groups_save(p, me) {
  var t = db_('Groups');
  var now = nowIso_();
  var info;
  if (p.group_id && t.get(p.group_id)) {
    var row = t.update(p.group_id, { name: p.name !== undefined ? String(p.name).trim() : t.get(p.group_id).name, notes: p.notes !== undefined ? p.notes : t.get(p.group_id).notes, updated_at: now });
    audit_(me.name, 'group_updated', 'group', row.group_id, { name: row.name });
    return { success: true, data: row };
  }
  if (p.invite) info = group_resolve_(p.invite);
  else {
    var id = String(p.group_id || '').trim();
    if (id && id.indexOf('@') === -1) id += '@g.us';
    if (!isGroupId_(id)) throw new Error('El ID del grupo debe verse así: 120363012345678901@g.us');
    info = { group_id: id, name: '', invite_code: '' };
  }
  var saved = withLock_(function () {
    var cur = t.get(info.group_id);
    var name = String(p.name || '').trim() || info.name || (cur && cur.name) || '';
    if (cur) return t.patch(cur, { name: name, invite_code: info.invite_code || cur.invite_code, notes: p.notes || cur.notes, updated_at: now });
    return t.insert({ group_id: info.group_id, name: name, invite_code: info.invite_code, notes: p.notes || '', source: p.invite ? 'invite' : 'manual', created_at: now, updated_at: now });
  });
  audit_(me.name, 'group_saved', 'group', saved.group_id, { name: saved.name });
  return { success: true, data: saved };
}

function groups_delete(p, me) {
  var ok = withLock_(function () { return db_('Groups').remove(p.group_id); });
  audit_(me.name, 'group_deleted', 'group', p.group_id, {});
  return { success: ok };
}

// ── Archivos: se guardan en tu Google Drive con enlace público ──────────
var UPLOAD_FOLDER = 'WA Power · archivos';
var UPLOAD_MAX_MB = 15;

function uploadFolder_() {
  var it = DriveApp.getFoldersByName(UPLOAD_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(UPLOAD_FOLDER);
}

/**
 * Recibe { name, mime, data (base64) } desde el portal y devuelve una URL pública
 * que TextMeBot puede descargar para enviar la imagen, el documento o el audio.
 */
function files_upload(p, me) {
  var mime = String(p.mime || '').toLowerCase();
  var ok = /^image\/(jpeg|png|webp|gif)$/.test(mime) || /^video\/(mp4|3gpp)$/.test(mime) || mime === 'application/pdf' ||
    /^audio\/(mpeg|mp3|ogg|aac|mp4|x-m4a)$/.test(mime) || /officedocument|msword|ms-excel|ms-powerpoint|text\/csv/.test(mime);
  if (!ok) throw new Error('Tipo de archivo no permitido. Usa imágenes (JPG, PNG), PDF, audio MP3 o documentos de Office.');
  var bytes = Utilities.base64Decode(String(p.data || ''));
  if (!bytes.length) throw new Error('El archivo está vacío.');
  if (bytes.length > UPLOAD_MAX_MB * 1024 * 1024) throw new Error('El archivo supera ' + UPLOAD_MAX_MB + ' MB.');
  var name = String(p.name || 'archivo').replace(/[^\w.\- ]+/g, '_').slice(0, 80);
  var file = uploadFolder_().createFile(Utilities.newBlob(bytes, mime, fmtDate_(new Date(), 'yyyyMMdd_HHmmss') + '_' + name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var id = file.getId();
  var kind = /^image\//.test(mime) ? 'image' : /^video\//.test(mime) ? 'video' : /^audio\//.test(mime) ? 'audio' : 'document';
  audit_(me.name, 'file_uploaded', 'file', id, { name: name, mime: mime, size: bytes.length });
  return {
    success: true, id: id, kind: kind, name: name, mime: mime, size: bytes.length,
    // Enlace de descarga directa: TextMeBot necesita el archivo, no la página de vista previa de Drive.
    url: file.__dataUrl || 'https://drive.google.com/uc?export=download&id=' + id,
    preview_url: kind === 'image' ? (file.__dataUrl || 'https://drive.google.com/thumbnail?id=' + id + '&sz=w800') : ''
  };
}
