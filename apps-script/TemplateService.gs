/**
 * ============================================================
 * WA FLOW MANAGER — TemplateService.gs
 * Message template management
 * ============================================================
 */

/**
 * Create a new template
 */
function createTemplate(data) {
  var now = new Date().toISOString();
  var templateId = generateId('TPL');

  var entry = {
    template_id: templateId,
    name: data.name || 'Sin nombre',
    category: data.category || 'general',
    message: data.message || '',
    file_url: data.file_url || '',
    audio_url: data.audio_url || '',
    document_url: data.document_url || '',
    status: 'active',
    created_at: now,
    updated_at: now
  };

  appendSheetRow(SHEETS.TEMPLATES, entry);
  logAudit('user', 'template_created', 'template', templateId, { name: entry.name });

  return { success: true, template_id: templateId, data: entry };
}

/**
 * Update a template
 */
function updateTemplate(templateId, updates) {
  updates.updated_at = new Date().toISOString();
  var success = updateSheetRow(SHEETS.TEMPLATES, 'template_id', templateId, updates);
  if (success) logAudit('user', 'template_updated', 'template', templateId, updates);
  return { success: success };
}

/**
 * Delete a template
 */
function deleteTemplate(templateId) {
  var success = deleteSheetRow(SHEETS.TEMPLATES, 'template_id', templateId);
  if (success) logAudit('user', 'template_deleted', 'template', templateId, {});
  return { success: success };
}

/**
 * Get templates with optional filters
 */
function getTemplates(filters) {
  return getSheetData(SHEETS.TEMPLATES, filters, { sortBy: 'name', sortDir: 'asc' });
}

/**
 * Preview a template with sample data
 */
function previewTemplate(templateId) {
  var template = findRow(SHEETS.TEMPLATES, 'template_id', templateId);
  if (!template) return { success: false, error: 'Template not found' };

  var sampleContact = {
    whatsapp_name: 'Usuario Ejemplo',
    display_name: 'Usuario Ejemplo',
    phone: '+51999888777'
  };

  var resolved = resolveTemplateVars(template.message, sampleContact);

  return {
    success: true,
    original: template.message,
    preview: resolved,
    template: template
  };
}
