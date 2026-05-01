/**
 * ============================================================
 * WA FLOW MANAGER — AutomationEngine.gs
 * Deterministic rule engine for auto-replies
 * ============================================================
 */

/**
 * Process an incoming message through the automation engine
 * @param {Object} msgData - { type, from, from_name, to, file, message }
 * @returns {Object} Processing result
 */
function processIncomingMessage(msgData) {
  var now = new Date().toISOString();
  var phone = String(msgData.from || '').trim();
  var fromName = String(msgData.from_name || '').trim();
  var message = String(msgData.message || '').trim();
  var normalizedMsg = message.toLowerCase().replace(/\s+/g, ' ').trim();

  // 1. Save to Inbox
  var messageId = generateId('MSG');
  var inboxEntry = {
    message_id: messageId,
    timestamp: now,
    type: msgData.type || 'text',
    from: phone,
    from_name: fromName,
    to: msgData.to || '',
    file_url: msgData.file || '',
    message: message,
    normalized_message: normalizedMsg,
    status: 'received',
    assigned_to: '',
    replied: 'false',
    reply_message: '',
    reply_mode: '',
    matched_rule_id: '',
    created_at: now
  };

  appendSheetRow(SHEETS.INBOX, inboxEntry);

  // 2. Get or create contact
  var contactResult = getOrCreateContact(phone, fromName);
  var contact = contactResult.contact;

  // 3. Update conversation
  updateConversation(phone, fromName, message);

  // 4. Log message received
  logAudit('webhook', 'message_received', 'inbox', messageId, {
    from: phone,
    type: msgData.type,
    isNewContact: contactResult.isNew
  });

  // 5. Check do_not_contact
  if (String(contact.do_not_contact) === 'true') {
    logAudit('system', 'message_blocked_dnc', 'inbox', messageId, { phone: phone });
    return { processed: true, autoReply: false, reason: 'do_not_contact' };
  }

  // 6. Run automation rules
  var ruleResult = evaluateRules(normalizedMsg, contact);

  if (ruleResult.matched) {
    // Update inbox with matched rule
    updateSheetRow(SHEETS.INBOX, 'message_id', messageId, {
      matched_rule_id: ruleResult.ruleId,
      replied: 'true',
      reply_message: ruleResult.response,
      reply_mode: 'auto',
      status: 'auto-replied'
    });

    // Send auto-reply
    var sendResult = sendWhatsAppMessage(phone, ruleResult.response, {
      source: 'auto-reply'
    });

    // Handle special statuses
    if (ruleResult.markStatus === 'needs-human') {
      updateSheetRow(SHEETS.CONVERSATIONS, 'phone', phone, { status: 'needs-human' });
    }
    if (ruleResult.markStatus === 'do_not_contact') {
      updateSheetRow(SHEETS.CONTACTS, 'phone', phone, { do_not_contact: 'true' });
    }

    // Add tags
    if (ruleResult.tagsToAdd) {
      var existingTags = String(contact.tags || '');
      var newTags = existingTags ? existingTags + ',' + ruleResult.tagsToAdd : ruleResult.tagsToAdd;
      updateSheetRow(SHEETS.CONTACTS, 'phone', phone, { tags: newTags });
    }

    logAudit('system', 'auto_reply_sent', 'rule', ruleResult.ruleId, {
      phone: phone,
      ruleName: ruleResult.ruleName,
      response: ruleResult.response.substring(0, 100)
    });

    return { processed: true, autoReply: true, ruleId: ruleResult.ruleId, ruleName: ruleResult.ruleName };
  }

  // 7. No rule matched — check for fallback
  var fallbackMsg = getConfig('DEFAULT_FALLBACK_MESSAGE');
  // Only send fallback if it's configured and non-empty
  // We do NOT auto-send fallback by default to avoid spam — just mark as pending
  updateSheetRow(SHEETS.CONVERSATIONS, 'phone', phone, { status: 'pending' });

  return { processed: true, autoReply: false, reason: 'no_rule_matched' };
}

/**
 * Evaluate automation rules against a normalized message
 * @param {string} normalizedMsg - Lowercase, trimmed message
 * @param {Object} contact - Contact record
 * @returns {Object} { matched, ruleId, ruleName, response, markStatus, tagsToAdd }
 */
function evaluateRules(normalizedMsg, contact) {
  var result = getSheetData(SHEETS.AUTOMATION_RULES, { enabled: 'true' }, { sortBy: 'priority', sortDir: 'asc' });
  var rules = result.data || [];

  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    if (String(rule.enabled) !== 'true') continue;

    var keyword = String(rule.keyword || '').toLowerCase().trim();
    var matchType = String(rule.match_type || 'contains').toLowerCase();

    var matched = false;

    switch (matchType) {
      case 'exact':
        matched = (normalizedMsg === keyword);
        break;
      case 'contains':
        matched = (normalizedMsg.indexOf(keyword) !== -1);
        break;
      case 'starts_with':
        matched = (normalizedMsg.indexOf(keyword) === 0);
        break;
      case 'ends_with':
        var endPos = normalizedMsg.length - keyword.length;
        matched = (endPos >= 0 && normalizedMsg.indexOf(keyword, endPos) === endPos);
        break;
      case 'regex':
        try {
          var regex = new RegExp(keyword, 'i');
          matched = regex.test(normalizedMsg);
        } catch (e) {
          matched = false;
        }
        break;
      default:
        matched = (normalizedMsg.indexOf(keyword) !== -1);
    }

    if (matched) {
      // Resolve template variables
      var responseTemplate = String(rule.response_template || rule.fallback_response || '');
      var resolvedResponse = resolveTemplateVars(responseTemplate, contact);

      return {
        matched: true,
        ruleId: rule.rule_id,
        ruleName: rule.rule_name,
        response: resolvedResponse,
        markStatus: rule.mark_status || '',
        tagsToAdd: rule.tags_to_add || ''
      };
    }
  }

  return { matched: false };
}

/**
 * Resolve template variables in a message string
 * @param {string} template - Message with {{variable}} placeholders
 * @param {Object} contact - Contact data
 * @returns {string} Resolved message
 */
function resolveTemplateVars(template, contact) {
  if (!template) return '';

  contact = contact || {};
  var companyName = getConfig('COMPANY_NAME') || getSettingFromSheet('COMPANY_NAME') || 'Mi Empresa';
  var now = new Date();
  var timezone = getConfig('DEFAULT_TIMEZONE') || 'America/Lima';

  // Format date/time
  var dateStr = Utilities.formatDate(now, timezone, 'dd/MM/yyyy');
  var timeStr = Utilities.formatDate(now, timezone, 'HH:mm');

  // Determine display name with fallbacks
  var whatsappName = String(contact.whatsapp_name || '').trim();
  var displayName = String(contact.display_name || '').trim();
  var nameToUse = whatsappName || displayName || 'Hola';

  var vars = {
    '{{whatsapp_name}}': nameToUse,
    '{{display_name}}': displayName || nameToUse,
    '{{phone}}': contact.phone || '',
    '{{today}}': dateStr,
    '{{time}}': timeStr,
    '{{company_name}}': companyName,
    '{{last_message}}': contact.last_message || '',
    '{{custom_1}}': contact.custom_1 || '',
    '{{custom_2}}': contact.custom_2 || ''
  };

  var result = template;
  for (var key in vars) {
    result = result.split(key).join(vars[key]);
  }

  return result;
}

/**
 * Test a rule against a sample message (without sending)
 * @param {string} ruleId - Rule ID to test
 * @param {string} testMessage - Message to test against
 * @returns {Object} Test result
 */
function testRule(ruleId, testMessage) {
  var rule = findRow(SHEETS.AUTOMATION_RULES, 'rule_id', ruleId);
  if (!rule) return { success: false, error: 'Rule not found' };

  var normalizedMsg = testMessage.toLowerCase().replace(/\s+/g, ' ').trim();
  var keyword = String(rule.keyword || '').toLowerCase().trim();
  var matchType = String(rule.match_type || 'contains').toLowerCase();
  var matched = false;

  switch (matchType) {
    case 'exact': matched = (normalizedMsg === keyword); break;
    case 'contains': matched = (normalizedMsg.indexOf(keyword) !== -1); break;
    case 'starts_with': matched = (normalizedMsg.indexOf(keyword) === 0); break;
    case 'ends_with':
      var endPos = normalizedMsg.length - keyword.length;
      matched = (endPos >= 0 && normalizedMsg.indexOf(keyword, endPos) === endPos);
      break;
    case 'regex':
      try { matched = new RegExp(keyword, 'i').test(normalizedMsg); } catch(e) { matched = false; }
      break;
  }

  var dummyContact = {
    whatsapp_name: 'Usuario Prueba',
    display_name: 'Usuario Prueba',
    phone: '+51999999999'
  };

  var resolvedResponse = matched ? resolveTemplateVars(rule.response_template, dummyContact) : '';

  return {
    success: true,
    matched: matched,
    ruleName: rule.rule_name,
    keyword: keyword,
    matchType: matchType,
    testMessage: testMessage,
    normalizedMessage: normalizedMsg,
    response: resolvedResponse,
    markStatus: matched ? rule.mark_status : ''
  };
}
