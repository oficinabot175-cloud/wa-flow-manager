/**
 * ============================================================
 * WA FLOW MANAGER — Config.gs
 * Configuration, constants, and database setup
 * ============================================================
 */

// ── Spreadsheet ID ──────────────────────────────────────────
var SPREADSHEET_ID = '1kB2zeGAX8MGnFLMVnP68wOueE4KZnZ621xAizC0BwI4';

// ── Sheet Names ─────────────────────────────────────────────
var SHEETS = {
  SETTINGS:           'Settings',
  CONTACTS:           'Contacts',
  INBOX:              'Inbox',
  OUTBOX:             'Outbox',
  SCHEDULED_MESSAGES: 'ScheduledMessages',
  AUTOMATION_RULES:   'AutomationRules',
  CONVERSATIONS:      'Conversations',
  CAMPAIGNS:          'Campaigns',
  TEMPLATES:          'Templates',
  AUDIT_LOGS:         'AuditLogs'
};

// ── Column Definitions ──────────────────────────────────────
var COLUMNS = {
  Settings:           ['key','value','description','updated_at'],
  Contacts:           ['contact_id','phone','whatsapp_name','display_name','tags','status','source','first_seen_at','last_seen_at','notes','do_not_contact'],
  Inbox:              ['message_id','timestamp','type','from','from_name','to','file_url','message','normalized_message','status','assigned_to','replied','reply_message','reply_mode','matched_rule_id','created_at'],
  Outbox:             ['outbox_id','created_at','recipient','recipient_name','message','file_url','audio_url','document_url','send_mode','status','sent_at','error_message','source','campaign_id','schedule_id'],
  ScheduledMessages:  ['schedule_id','title','recipient_type','recipients','message_template','file_url','audio_url','document_url','start_datetime','recurrence_type','recurrence_rule','next_run_at','last_run_at','status','created_at','updated_at'],
  AutomationRules:    ['rule_id','rule_name','enabled','priority','trigger_type','keyword','match_type','conditions_json','response_template','fallback_response','tags_to_add','mark_status','created_at','updated_at'],
  Conversations:      ['conversation_id','phone','whatsapp_name','last_message','last_message_at','total_messages','status','summary','updated_at'],
  Campaigns:          ['campaign_id','name','description','audience_filter','message_template','status','scheduled_at','recurrence','total_recipients','sent_count','failed_count','created_at'],
  Templates:          ['template_id','name','category','message','file_url','audio_url','document_url','status','created_at','updated_at'],
  AuditLogs:          ['log_id','timestamp','actor','action','entity_type','entity_id','details_json']
};

// ── Configuration Helpers ───────────────────────────────────

/**
 * Get a script property value
 */
function getConfig(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

/**
 * Set a script property value
 */
function setConfig(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

/**
 * Get multiple config keys
 */
function getAllConfig() {
  return PropertiesService.getScriptProperties().getProperties();
}

/**
 * Get the main spreadsheet
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ── Setup Database ──────────────────────────────────────────

/**
 * Creates all required sheets, headers, and sample data.
 * Safe to run multiple times — won't overwrite existing sheets.
 */
function setupDatabase() {
  var ss = getSpreadsheet();
  var created = [];
  var existing = [];

  // Create each sheet if it doesn't exist
  for (var sheetKey in SHEETS) {
    var sheetName = SHEETS[sheetKey];
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Set headers
      var cols = COLUMNS[sheetName];
      if (cols) {
        sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
        // Bold + freeze header row
        sheet.getRange(1, 1, 1, cols.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
      created.push(sheetName);
    } else {
      existing.push(sheetName);
    }
  }

  // Insert default settings
  _insertDefaultSettings(ss);

  // Insert sample automation rules
  _insertSampleRules(ss);

  // Insert sample templates
  _insertSampleTemplates(ss);

  // Set default config properties
  _setDefaultProperties();

  return {
    success: true,
    created: created,
    existing: existing,
    message: 'Database setup complete. Created: ' + created.join(', ')
  };
}

/**
 * Insert default settings if the sheet is empty
 */
function _insertDefaultSettings(ss) {
  var sheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  if (data.length > 1) return; // already has data

  var now = new Date().toISOString();
  var defaults = [
    ['COMPANY_NAME', 'Mi Empresa', 'Nombre de la empresa para mensajes', now],
    ['DEFAULT_TIMEZONE', 'America/Lima', 'Zona horaria del sistema', now],
    ['RATE_LIMIT_SECONDS', '3', 'Segundos de espera entre mensajes', now],
    ['DEFAULT_FALLBACK_MESSAGE', 'Gracias por tu mensaje. Un asesor te responderá pronto.', 'Mensaje por defecto cuando no hay regla', now],
    ['WELCOME_MESSAGE_ENABLED', 'true', 'Enviar mensaje de bienvenida a contactos nuevos', now],
    ['SYSTEM_VERSION', '1.0.0', 'Versión del sistema', now]
  ];

  sheet.getRange(2, 1, defaults.length, 4).setValues(defaults);
}

/**
 * Insert sample automation rules
 */
function _insertSampleRules(ss) {
  var sheet = ss.getSheetByName(SHEETS.AUTOMATION_RULES);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  if (data.length > 1) return;

  var now = new Date().toISOString();
  var rules = [
    ['RULE_001', 'Saludo', 'true', '1', 'keyword', 'hola', 'contains', '', 'Hola {{whatsapp_name}}, gracias por escribir a {{company_name}}. ¿En qué podemos ayudarte?', '', '', '', now, now],
    ['RULE_002', 'Precios', 'true', '2', 'keyword', 'precio', 'contains', '', 'Hola {{whatsapp_name}}, gracias por tu interés. Te compartimos la información de precios en breve.', '', '', '', now, now],
    ['RULE_003', 'Ayuda', 'true', '3', 'keyword', 'ayuda', 'contains', '', 'Claro, {{whatsapp_name}}. Puedes escribirnos tu consulta y un asesor te ayudará.', '', '', '', now, now],
    ['RULE_004', 'Asesor', 'true', '4', 'keyword', 'asesor', 'contains', '', 'Perfecto, {{whatsapp_name}}. Hemos registrado tu solicitud para que un asesor pueda revisarla.', '', '', 'needs-human', now, now],
    ['RULE_005', 'Baja', 'true', '5', 'keyword', 'stop', 'contains', '', 'Entendido, {{whatsapp_name}}. Ya no te enviaremos más mensajes.', '', '', 'do_not_contact', now, now],
    ['RULE_006', 'Agradecimiento', 'true', '6', 'keyword', 'gracias', 'contains', '', '¡Con gusto, {{whatsapp_name}}! Estamos para servirte. 😊', '', '', '', now, now]
  ];

  sheet.getRange(2, 1, rules.length, 14).setValues(rules);
}

/**
 * Insert sample templates
 */
function _insertSampleTemplates(ss) {
  var sheet = ss.getSheetByName(SHEETS.TEMPLATES);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  if (data.length > 1) return;

  var now = new Date().toISOString();
  var templates = [
    ['TPL_001', 'Recordatorio', 'seguimiento', 'Hola {{whatsapp_name}}, te recordamos que tienes una comunicación pendiente con {{company_name}}.', '', '', '', 'active', now, now],
    ['TPL_002', 'Confirmación', 'notificación', 'Hola {{whatsapp_name}}, confirmamos la recepción de tu mensaje. Gracias por comunicarte con nosotros.', '', '', '', 'active', now, now],
    ['TPL_003', 'Seguimiento', 'seguimiento', 'Hola {{whatsapp_name}}, queríamos hacer seguimiento a tu consulta. ¿Aún necesitas ayuda?', '', '', '', 'active', now, now],
    ['TPL_004', 'Bienvenida', 'general', 'Hola {{whatsapp_name}}, bienvenido a {{company_name}}. ¿En qué podemos ayudarte hoy?', '', '', '', 'active', now, now],
    ['TPL_005', 'Novedades Mensuales', 'marketing', 'Hola {{whatsapp_name}}, iniciamos un nuevo mes y te compartimos nuestras novedades.', '', '', '', 'active', now, now]
  ];

  sheet.getRange(2, 1, templates.length, 10).setValues(templates);
}

/**
 * Set default script properties
 */
function _setDefaultProperties() {
  var props = PropertiesService.getScriptProperties();
  var existing = props.getProperties();

  if (!existing['DEFAULT_TIMEZONE']) props.setProperty('DEFAULT_TIMEZONE', 'America/Lima');
  if (!existing['RATE_LIMIT_SECONDS']) props.setProperty('RATE_LIMIT_SECONDS', '3');
  if (!existing['COMPANY_NAME']) props.setProperty('COMPANY_NAME', 'Mi Empresa');
  if (!existing['DEFAULT_FALLBACK_MESSAGE']) props.setProperty('DEFAULT_FALLBACK_MESSAGE', 'Gracias por tu mensaje. Un asesor te responderá pronto.');
}
