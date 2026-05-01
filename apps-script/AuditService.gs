/**
 * ============================================================
 * WA FLOW MANAGER — AuditService.gs
 * Audit logging for all system actions
 * ============================================================
 */

/**
 * Log an action to AuditLogs sheet
 * @param {string} actor - Who performed the action (system, user, webhook)
 * @param {string} action - What happened (message_received, message_sent, rule_matched, etc.)
 * @param {string} entityType - Type of entity (message, contact, rule, campaign, etc.)
 * @param {string} entityId - ID of the entity
 * @param {Object|string} details - Additional details (will be JSON stringified if object)
 */
function logAudit(actor, action, entityType, entityId, details) {
  try {
    var detailsStr = '';
    if (details) {
      detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
    }

    appendSheetRow(SHEETS.AUDIT_LOGS, {
      log_id: generateId('LOG'),
      timestamp: new Date().toISOString(),
      actor: actor || 'system',
      action: action || '',
      entity_type: entityType || '',
      entity_id: entityId || '',
      details_json: detailsStr
    });
  } catch (e) {
    // Silently fail audit logging to not break main operations
    Logger.log('Audit log error: ' + e.message);
  }
}

/**
 * Get recent audit logs
 * @param {number} limit - Max number of logs to return
 * @returns {Array}
 */
function getRecentAuditLogs(limit) {
  var result = getSheetData(SHEETS.AUDIT_LOGS, null, {
    sortBy: 'timestamp',
    sortDir: 'desc',
    limit: limit || 50
  });
  return result.data || [];
}
