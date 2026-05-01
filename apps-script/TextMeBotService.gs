/**
 * ============================================================
 * WA FLOW MANAGER — TextMeBotService.gs
 * TextMeBot API integration for sending WhatsApp messages
 * ============================================================
 */

var TEXTMEBOT_BASE_URL = 'https://api.textmebot.com/send.php';

/**
 * Send a WhatsApp message via TextMeBot API
 * @param {string} recipient - Phone number with country code
 * @param {string} text - Message text
 * @param {Object} options - { file_url, document_url, audio_url, source, campaign_id, schedule_id }
 * @returns {Object} Result with success status
 */
function sendWhatsAppMessage(recipient, text, options) {
  options = options || {};

  // Validate inputs
  if (!recipient) return { success: false, error: 'Recipient is required' };
  if (!text && !options.file_url && !options.document_url && !options.audio_url) {
    return { success: false, error: 'Message text or attachment is required' };
  }

  // Check do_not_contact
  var contact = findRow(SHEETS.CONTACTS, 'phone', recipient);
  if (contact && String(contact.do_not_contact) === 'true') {
    return { success: false, error: 'Contact is marked as do_not_contact' };
  }

  // Get API key
  var apiKey = getConfig('TEXTMEBOT_API_KEY');
  if (!apiKey) {
    return { success: false, error: 'TextMeBot API key not configured' };
  }

  // Create outbox entry
  var outboxId = generateId('OUT');
  var now = new Date().toISOString();
  var outboxEntry = {
    outbox_id: outboxId,
    created_at: now,
    recipient: recipient,
    recipient_name: contact ? (contact.display_name || contact.whatsapp_name || '') : '',
    message: text || '',
    file_url: options.file_url || '',
    audio_url: options.audio_url || '',
    document_url: options.document_url || '',
    send_mode: options.send_mode || 'immediate',
    status: 'pending',
    sent_at: '',
    error_message: '',
    source: options.source || 'manual',
    campaign_id: options.campaign_id || '',
    schedule_id: options.schedule_id || ''
  };

  appendSheetRow(SHEETS.OUTBOX, outboxEntry);

  // Build API URL
  var url = TEXTMEBOT_BASE_URL + '?recipient=' + encodeURIComponent(recipient) +
            '&apikey=' + encodeURIComponent(apiKey);

  if (text) {
    url += '&text=' + encodeURIComponent(text);
  }

  // Handle attachments
  if (options.file_url) {
    url += '&file=' + encodeURIComponent(options.file_url);
  }
  if (options.document_url) {
    url += '&document=' + encodeURIComponent(options.document_url);
  }
  // Note: TextMeBot may not natively support audio, send as file
  if (options.audio_url && !options.file_url) {
    url += '&file=' + encodeURIComponent(options.audio_url);
  }

  try {
    // Rate limiting
    var rateLimitSec = parseInt(getConfig('RATE_LIMIT_SECONDS') || '3');
    var lastSendTime = getConfig('LAST_SEND_TIME');
    if (lastSendTime) {
      var elapsed = (new Date().getTime() - parseInt(lastSendTime)) / 1000;
      if (elapsed < rateLimitSec) {
        Utilities.sleep((rateLimitSec - elapsed) * 1000);
      }
    }

    // Send request
    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true
    });

    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();

    // Update last send time
    setConfig('LAST_SEND_TIME', String(new Date().getTime()));

    if (responseCode === 200) {
      // Update outbox as sent
      updateSheetRow(SHEETS.OUTBOX, 'outbox_id', outboxId, {
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      logAudit('system', 'message_sent', 'outbox', outboxId, {
        recipient: recipient,
        responseCode: responseCode
      });

      return { success: true, outbox_id: outboxId, response: responseBody };
    } else {
      // Update outbox as failed
      updateSheetRow(SHEETS.OUTBOX, 'outbox_id', outboxId, {
        status: 'failed',
        error_message: 'HTTP ' + responseCode + ': ' + responseBody
      });

      logAudit('system', 'message_failed', 'outbox', outboxId, {
        recipient: recipient,
        responseCode: responseCode,
        error: responseBody
      });

      return { success: false, error: 'Send failed: HTTP ' + responseCode, outbox_id: outboxId };
    }
  } catch (e) {
    // Update outbox as failed
    updateSheetRow(SHEETS.OUTBOX, 'outbox_id', outboxId, {
      status: 'failed',
      error_message: e.message
    });

    logAudit('system', 'message_error', 'outbox', outboxId, {
      recipient: recipient,
      error: e.message
    });

    return { success: false, error: e.message, outbox_id: outboxId };
  }
}

/**
 * Test TextMeBot connection by checking if API key is valid
 */
function testTextMeBotConnection() {
  var apiKey = getConfig('TEXTMEBOT_API_KEY');
  if (!apiKey) {
    return { success: false, error: 'API key not configured' };
  }

  try {
    // Use a simple test call - send.php with invalid recipient returns a response (not 404)
    var url = TEXTMEBOT_BASE_URL + '?recipient=test&apikey=' + encodeURIComponent(apiKey) + '&text=test';
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var code = response.getResponseCode();
    var body = response.getContentText();

    return {
      success: true,
      message: 'TextMeBot connection OK',
      responseCode: code,
      response: body
    };
  } catch (e) {
    return { success: false, error: 'Connection failed: ' + e.message };
  }
}

/**
 * Get the webhook configuration URL for TextMeBot
 */
function getWebhookConfigUrl() {
  var apiKey = getConfig('TEXTMEBOT_API_KEY');
  if (!apiKey) {
    return { success: false, error: 'API key not configured' };
  }
  return {
    success: true,
    url: 'https://api.textmebot.com/webhook.php?apikey=' + encodeURIComponent(apiKey)
  };
}
