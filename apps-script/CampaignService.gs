/**
 * ============================================================
 * WA FLOW MANAGER — CampaignService.gs
 * Campaign management and execution
 * ============================================================
 */

/**
 * Create a new campaign
 */
function createCampaign(data) {
  var now = new Date().toISOString();
  var campaignId = generateId('CMP');

  var entry = {
    campaign_id: campaignId,
    name: data.name || 'Sin nombre',
    description: data.description || '',
    audience_filter: data.audience_filter || '',
    message_template: data.message_template || '',
    status: 'draft',
    scheduled_at: data.scheduled_at || '',
    recurrence: data.recurrence || 'once',
    total_recipients: '0',
    sent_count: '0',
    failed_count: '0',
    created_at: now
  };

  appendSheetRow(SHEETS.CAMPAIGNS, entry);
  logAudit('user', 'campaign_created', 'campaign', campaignId, { name: entry.name });

  return { success: true, campaign_id: campaignId, data: entry };
}

/**
 * Update a campaign
 */
function updateCampaign(campaignId, updates) {
  var success = updateSheetRow(SHEETS.CAMPAIGNS, 'campaign_id', campaignId, updates);
  if (success) logAudit('user', 'campaign_updated', 'campaign', campaignId, updates);
  return { success: success };
}

/**
 * Delete a campaign
 */
function deleteCampaign(campaignId) {
  var success = deleteSheetRow(SHEETS.CAMPAIGNS, 'campaign_id', campaignId);
  if (success) logAudit('user', 'campaign_deleted', 'campaign', campaignId, {});
  return { success: success };
}

/**
 * Get campaigns
 */
function getCampaigns(filters) {
  return getSheetData(SHEETS.CAMPAIGNS, filters, { sortBy: 'created_at', sortDir: 'desc' });
}

/**
 * Execute a campaign: send messages to matching contacts
 */
function executeCampaign(campaignId) {
  var campaign = findRow(SHEETS.CAMPAIGNS, 'campaign_id', campaignId);
  if (!campaign) return { success: false, error: 'Campaign not found' };

  if (campaign.status === 'completed' || campaign.status === 'cancelled') {
    return { success: false, error: 'Campaign is ' + campaign.status };
  }

  // Get recipients based on audience_filter (tag-based)
  var recipients = [];
  var audienceFilter = String(campaign.audience_filter || '').trim();

  if (audienceFilter) {
    // Filter contacts by tag
    var allContacts = getSheetData(SHEETS.CONTACTS, { status: 'active' });
    var contacts = allContacts.data || [];

    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      if (String(c.do_not_contact) === 'true') continue;

      var tags = String(c.tags || '').toLowerCase();
      if (tags.indexOf(audienceFilter.toLowerCase()) !== -1) {
        recipients.push(c);
      }
    }
  } else {
    // All active contacts not in do_not_contact
    var allContacts = getSheetData(SHEETS.CONTACTS, { status: 'active' });
    var contacts = allContacts.data || [];

    for (var i = 0; i < contacts.length; i++) {
      if (String(contacts[i].do_not_contact) !== 'true') {
        recipients.push(contacts[i]);
      }
    }
  }

  // Update campaign status
  updateSheetRow(SHEETS.CAMPAIGNS, 'campaign_id', campaignId, {
    status: 'sending',
    total_recipients: String(recipients.length)
  });

  var sentCount = 0;
  var failedCount = 0;

  for (var j = 0; j < recipients.length; j++) {
    var contact = recipients[j];
    var resolvedMsg = resolveTemplateVars(campaign.message_template, contact);

    var sendResult = sendWhatsAppMessage(contact.phone, resolvedMsg, {
      source: 'campaign',
      campaign_id: campaignId
    });

    if (sendResult.success) {
      sentCount++;
    } else {
      failedCount++;
    }
  }

  // Update campaign with results
  updateSheetRow(SHEETS.CAMPAIGNS, 'campaign_id', campaignId, {
    status: 'completed',
    sent_count: String(sentCount),
    failed_count: String(failedCount)
  });

  logAudit('system', 'campaign_executed', 'campaign', campaignId, {
    total: recipients.length,
    sent: sentCount,
    failed: failedCount
  });

  return {
    success: true,
    total: recipients.length,
    sent: sentCount,
    failed: failedCount
  };
}
