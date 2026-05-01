/**
 * ============================================================
 * WA FLOW MANAGER — Code.gs
 * Main entry point: doGet, doPost, and action router
 * ============================================================
 */

/**
 * Handle GET requests from frontend
 */
function doGet(e) {
  var params = e.parameter || {};
  return handleRequest(params);
}

/**
 * Handle POST requests (webhooks from TextMeBot + frontend actions)
 */
function doPost(e) {
  try {
    var body = {};

    // Try to parse JSON body
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        body = {};
      }
    }

    // Merge URL parameters
    var params = e.parameter || {};
    for (var key in body) {
      params[key] = body[key];
    }

    // Check if this is a TextMeBot webhook (has 'from' and 'message' fields, no 'action')
    if (!params.action && params.from && params.message !== undefined) {
      return handleWebhook(params);
    }

    return handleRequest(params);
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

/**
 * Handle incoming TextMeBot webhook
 */
function handleWebhook(data) {
  try {
    var result = processIncomingMessage(data);
    return jsonResponse({ success: true, result: result });
  } catch (err) {
    logAudit('system', 'webhook_error', 'webhook', '', { error: err.message });
    return jsonResponse({ success: false, error: err.message });
  }
}

/**
 * Main action router
 */
function handleRequest(params) {
  var action = params.action || '';
  var token = params.token || '';

  // Public actions that don't require token
  var publicActions = ['ping', 'health'];

  // Validate token for non-public actions
  if (publicActions.indexOf(action) === -1 && action !== '') {
    var appToken = getConfig('APP_SECRET_TOKEN');
    if (appToken && token !== appToken) {
      return jsonResponse({ success: false, error: 'Unauthorized: invalid token' });
    }
  }

  try {
    var result;

    switch (action) {
      // ── System ─────────────────────────────────────
      case 'ping':
      case 'health':
        result = { success: true, message: 'WA Flow Manager is running', timestamp: new Date().toISOString() };
        break;

      case 'setupDatabase':
        result = setupDatabase();
        break;

      case 'getSettings':
        result = getSheetData(SHEETS.SETTINGS);
        result.success = true;
        break;

      case 'saveSettings':
        setSettingInSheet(params.key, params.value, params.description);
        // Also save to PropertiesService if it's a config key
        if (['TEXTMEBOT_API_KEY', 'APP_SECRET_TOKEN', 'DEFAULT_TIMEZONE', 'RATE_LIMIT_SECONDS', 'COMPANY_NAME', 'DEFAULT_FALLBACK_MESSAGE'].indexOf(params.key) !== -1) {
          setConfig(params.key, params.value);
        }
        logAudit('user', 'setting_updated', 'settings', params.key, { key: params.key });
        result = { success: true };
        break;

      // ── Dashboard ──────────────────────────────────
      case 'getDashboardStats':
        result = getDashboardStats();
        break;

      // ── Inbox ──────────────────────────────────────
      case 'getInbox':
        result = getSheetData(SHEETS.INBOX, {
          from: params.from,
          status: params.status,
          type: params.type
        }, {
          sortBy: 'timestamp',
          sortDir: 'desc',
          limit: parseInt(params.limit) || 100,
          offset: parseInt(params.offset) || 0
        });
        result.success = true;
        break;

      // ── Contacts ───────────────────────────────────
      case 'getContacts':
        result = getSheetData(SHEETS.CONTACTS, {
          phone: params.phone,
          display_name: params.name,
          tags: params.tags,
          status: params.status
        }, {
          sortBy: 'last_seen_at',
          sortDir: 'desc',
          limit: parseInt(params.limit) || 100
        });
        result.success = true;
        break;

      case 'updateContact':
        var contactUpdates = {};
        if (params.display_name !== undefined) contactUpdates.display_name = params.display_name;
        if (params.tags !== undefined) contactUpdates.tags = params.tags;
        if (params.notes !== undefined) contactUpdates.notes = params.notes;
        if (params.do_not_contact !== undefined) contactUpdates.do_not_contact = params.do_not_contact;
        if (params.status !== undefined) contactUpdates.status = params.status;

        var contactSuccess = updateSheetRow(SHEETS.CONTACTS, 'contact_id', params.contact_id, contactUpdates);
        logAudit('user', 'contact_updated', 'contact', params.contact_id, contactUpdates);
        result = { success: contactSuccess };
        break;

      // ── Conversations ──────────────────────────────
      case 'getConversations':
        result = getSheetData(SHEETS.CONVERSATIONS, {
          status: params.status
        }, {
          sortBy: 'last_message_at',
          sortDir: 'desc',
          limit: parseInt(params.limit) || 50
        });
        result.success = true;
        break;

      case 'getConversationByPhone':
        // Get conversation metadata
        var convMeta = findRow(SHEETS.CONVERSATIONS, 'phone', params.phone);
        // Get all messages for this phone (inbox + outbox)
        var inboxMsgs = getSheetData(SHEETS.INBOX, { from: params.phone }, { sortBy: 'timestamp', sortDir: 'asc' });
        var outboxMsgs = getSheetData(SHEETS.OUTBOX, { recipient: params.phone }, { sortBy: 'created_at', sortDir: 'asc' });

        // Merge and sort
        var allMessages = [];
        (inboxMsgs.data || []).forEach(function(m) {
          allMessages.push({ direction: 'incoming', timestamp: m.timestamp || m.created_at, message: m.message, type: m.type, file_url: m.file_url, status: m.status, from_name: m.from_name });
        });
        (outboxMsgs.data || []).forEach(function(m) {
          allMessages.push({ direction: 'outgoing', timestamp: m.sent_at || m.created_at, message: m.message, type: 'text', file_url: m.file_url, status: m.status, source: m.source });
        });

        allMessages.sort(function(a, b) {
          return new Date(a.timestamp) - new Date(b.timestamp);
        });

        result = { success: true, conversation: convMeta, messages: allMessages };
        break;

      case 'markConversationStatus':
        var convSuccess = updateSheetRow(SHEETS.CONVERSATIONS, 'phone', params.phone, {
          status: params.status,
          updated_at: new Date().toISOString()
        });
        logAudit('user', 'conversation_status_changed', 'conversation', params.phone, { status: params.status });
        result = { success: convSuccess };
        break;

      // ── Send Message ───────────────────────────────
      case 'sendMessage':
        result = sendWhatsAppMessage(params.recipient, params.message, {
          file_url: params.file_url,
          document_url: params.document_url,
          audio_url: params.audio_url,
          send_mode: params.send_mode || 'immediate',
          source: 'manual'
        });
        break;

      // ── Schedules ──────────────────────────────────
      case 'createSchedule':
        result = createSchedule(params);
        break;

      case 'updateSchedule':
        result = updateSchedule(params.schedule_id, params);
        break;

      case 'deleteSchedule':
        result = deleteSchedule(params.schedule_id);
        break;

      case 'getSchedules':
        result = getSchedules({ status: params.status });
        result.success = true;
        break;

      case 'runSchedulerManual':
        result = runScheduler();
        break;

      // ── Rules ──────────────────────────────────────
      case 'createRule':
        var now = new Date().toISOString();
        var ruleEntry = {
          rule_id: generateId('RULE'),
          rule_name: params.rule_name || '',
          enabled: params.enabled || 'true',
          priority: params.priority || '10',
          trigger_type: params.trigger_type || 'keyword',
          keyword: params.keyword || '',
          match_type: params.match_type || 'contains',
          conditions_json: params.conditions_json || '',
          response_template: params.response_template || '',
          fallback_response: params.fallback_response || '',
          tags_to_add: params.tags_to_add || '',
          mark_status: params.mark_status || '',
          created_at: now,
          updated_at: now
        };
        appendSheetRow(SHEETS.AUTOMATION_RULES, ruleEntry);
        logAudit('user', 'rule_created', 'rule', ruleEntry.rule_id, { name: ruleEntry.rule_name });
        result = { success: true, rule_id: ruleEntry.rule_id, data: ruleEntry };
        break;

      case 'updateRule':
        var ruleUpdates = {};
        ['rule_name','enabled','priority','trigger_type','keyword','match_type','conditions_json','response_template','fallback_response','tags_to_add','mark_status'].forEach(function(f) {
          if (params[f] !== undefined) ruleUpdates[f] = params[f];
        });
        ruleUpdates.updated_at = new Date().toISOString();
        var ruleSuccess = updateSheetRow(SHEETS.AUTOMATION_RULES, 'rule_id', params.rule_id, ruleUpdates);
        logAudit('user', 'rule_updated', 'rule', params.rule_id, ruleUpdates);
        result = { success: ruleSuccess };
        break;

      case 'deleteRule':
        result = { success: deleteSheetRow(SHEETS.AUTOMATION_RULES, 'rule_id', params.rule_id) };
        logAudit('user', 'rule_deleted', 'rule', params.rule_id, {});
        break;

      case 'getRules':
        result = getSheetData(SHEETS.AUTOMATION_RULES, null, { sortBy: 'priority', sortDir: 'asc' });
        result.success = true;
        break;

      case 'testRule':
        result = testRule(params.rule_id, params.test_message || '');
        break;

      // ── Templates ──────────────────────────────────
      case 'createTemplate':
        result = createTemplate(params);
        break;

      case 'updateTemplate':
        result = updateTemplate(params.template_id, params);
        break;

      case 'deleteTemplate':
        result = deleteTemplate(params.template_id);
        break;

      case 'getTemplates':
        result = getTemplates({ category: params.category, status: params.status });
        result.success = true;
        break;

      // ── Campaigns ──────────────────────────────────
      case 'createCampaign':
        result = createCampaign(params);
        break;

      case 'updateCampaign':
        result = updateCampaign(params.campaign_id, params);
        break;

      case 'deleteCampaign':
        result = deleteCampaign(params.campaign_id);
        break;

      case 'getCampaigns':
        result = getCampaigns({ status: params.status });
        result.success = true;
        break;

      case 'executeCampaign':
        result = executeCampaign(params.campaign_id);
        break;

      // ── TextMeBot ──────────────────────────────────
      case 'testTextMeBot':
        result = testTextMeBotConnection();
        break;

      // ── Analytics ──────────────────────────────────
      case 'getAnalytics':
        result = getAnalytics({ days: params.days });
        break;

      // ── Audit ──────────────────────────────────────
      case 'getAuditLogs':
        result = { success: true, data: getRecentAuditLogs(parseInt(params.limit) || 50) };
        break;

      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }

    return jsonResponse(result);

  } catch (err) {
    logAudit('system', 'request_error', 'system', action, { error: err.message });
    return jsonResponse({ success: false, error: err.message });
  }
}

/**
 * Create a JSON response with CORS headers
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
