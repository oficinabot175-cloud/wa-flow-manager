/**
 * ============================================================
 * WA FLOW MANAGER — AnalyticsService.gs
 * Dashboard statistics and analytics
 * ============================================================
 */

/**
 * Get dashboard statistics for today
 */
function getDashboardStats() {
  var now = new Date();
  var timezone = getConfig('DEFAULT_TIMEZONE') || 'America/Lima';
  var todayStr = Utilities.formatDate(now, timezone, 'yyyy-MM-dd');

  // Messages received today
  var inboxResult = getSheetData(SHEETS.INBOX);
  var inboxData = inboxResult.data || [];
  var receivedToday = 0;
  var autoRepliedToday = 0;

  for (var i = 0; i < inboxData.length; i++) {
    var msgDate = String(inboxData[i].timestamp || inboxData[i].created_at || '').substring(0, 10);
    if (msgDate === todayStr) {
      receivedToday++;
      if (inboxData[i].status === 'auto-replied') autoRepliedToday++;
    }
  }

  // Messages sent today
  var outboxResult = getSheetData(SHEETS.OUTBOX);
  var outboxData = outboxResult.data || [];
  var sentToday = 0;
  var errorsToday = 0;

  for (var j = 0; j < outboxData.length; j++) {
    var sentDate = String(outboxData[j].created_at || '').substring(0, 10);
    if (sentDate === todayStr) {
      if (outboxData[j].status === 'sent') sentToday++;
      if (outboxData[j].status === 'failed') errorsToday++;
    }
  }

  // New contacts today
  var contactsResult = getSheetData(SHEETS.CONTACTS);
  var contactsData = contactsResult.data || [];
  var newContactsToday = 0;

  for (var k = 0; k < contactsData.length; k++) {
    var contactDate = String(contactsData[k].first_seen_at || '').substring(0, 10);
    if (contactDate === todayStr) newContactsToday++;
  }

  // Pending conversations
  var convsResult = getSheetData(SHEETS.CONVERSATIONS, { status: 'pending' });
  var pendingConvs = convsResult.total || 0;

  // Needs human conversations
  var humanResult = getSheetData(SHEETS.CONVERSATIONS, { status: 'needs-human' });
  var needsHuman = humanResult.total || 0;

  // Active campaigns
  var campaignsResult = getSheetData(SHEETS.CAMPAIGNS);
  var campaignsData = campaignsResult.data || [];
  var activeCampaigns = 0;
  for (var m = 0; m < campaignsData.length; m++) {
    if (campaignsData[m].status === 'active' || campaignsData[m].status === 'sending') activeCampaigns++;
  }

  // Upcoming schedules
  var schedulesResult = getSheetData(SHEETS.SCHEDULED_MESSAGES, { status: 'active' }, { sortBy: 'next_run_at', sortDir: 'asc', limit: 5 });
  var upcomingSchedules = schedulesResult.data || [];

  // Recent errors
  var recentErrors = [];
  for (var n = outboxData.length - 1; n >= Math.max(0, outboxData.length - 5); n--) {
    if (outboxData[n] && outboxData[n].status === 'failed') {
      recentErrors.push({
        recipient: outboxData[n].recipient,
        error: outboxData[n].error_message,
        date: outboxData[n].created_at
      });
    }
  }

  return {
    success: true,
    date: todayStr,
    received_today: receivedToday,
    sent_today: sentToday,
    auto_replied_today: autoRepliedToday,
    errors_today: errorsToday,
    new_contacts_today: newContactsToday,
    pending_conversations: pendingConvs,
    needs_human: needsHuman,
    active_campaigns: activeCampaigns,
    total_contacts: contactsResult.total || 0,
    total_inbox: inboxResult.total || 0,
    upcoming_schedules: upcomingSchedules,
    recent_errors: recentErrors
  };
}

/**
 * Get detailed analytics for a date range
 */
function getAnalytics(params) {
  params = params || {};
  var days = parseInt(params.days) || 7;
  var now = new Date();
  var timezone = getConfig('DEFAULT_TIMEZONE') || 'America/Lima';

  // Messages per day
  var inboxResult = getSheetData(SHEETS.INBOX);
  var inboxData = inboxResult.data || [];
  var outboxResult = getSheetData(SHEETS.OUTBOX);
  var outboxData = outboxResult.data || [];

  var messagesByDay = {};
  var sentByDay = {};

  for (var d = 0; d < days; d++) {
    var date = new Date(now);
    date.setDate(date.getDate() - d);
    var dateStr = Utilities.formatDate(date, timezone, 'yyyy-MM-dd');
    messagesByDay[dateStr] = 0;
    sentByDay[dateStr] = 0;
  }

  for (var i = 0; i < inboxData.length; i++) {
    var msgDate = String(inboxData[i].timestamp || inboxData[i].created_at || '').substring(0, 10);
    if (messagesByDay.hasOwnProperty(msgDate)) messagesByDay[msgDate]++;
  }

  for (var j = 0; j < outboxData.length; j++) {
    var sDate = String(outboxData[j].created_at || '').substring(0, 10);
    if (sentByDay.hasOwnProperty(sDate)) sentByDay[sDate]++;
  }

  // Top contacts (most active)
  var contactActivity = {};
  for (var k = 0; k < inboxData.length; k++) {
    var phone = inboxData[k].from || '';
    if (!contactActivity[phone]) contactActivity[phone] = { phone: phone, name: inboxData[k].from_name || phone, count: 0 };
    contactActivity[phone].count++;
  }

  var topContacts = Object.keys(contactActivity).map(function(p) { return contactActivity[p]; });
  topContacts.sort(function(a, b) { return b.count - a.count; });
  topContacts = topContacts.slice(0, 10);

  // Top rules matched
  var ruleMatches = {};
  for (var m = 0; m < inboxData.length; m++) {
    var ruleId = inboxData[m].matched_rule_id;
    if (ruleId) {
      if (!ruleMatches[ruleId]) ruleMatches[ruleId] = { rule_id: ruleId, count: 0 };
      ruleMatches[ruleId].count++;
    }
  }

  var topRules = Object.keys(ruleMatches).map(function(r) { return ruleMatches[r]; });
  topRules.sort(function(a, b) { return b.count - a.count; });
  topRules = topRules.slice(0, 10);

  // Send error rate
  var totalSent = 0;
  var totalFailed = 0;
  for (var n = 0; n < outboxData.length; n++) {
    if (outboxData[n].status === 'sent') totalSent++;
    if (outboxData[n].status === 'failed') totalFailed++;
  }

  return {
    success: true,
    days: days,
    messages_by_day: messagesByDay,
    sent_by_day: sentByDay,
    top_contacts: topContacts,
    top_rules: topRules,
    total_sent: totalSent,
    total_failed: totalFailed,
    error_rate: totalSent > 0 ? ((totalFailed / (totalSent + totalFailed)) * 100).toFixed(1) : '0'
  };
}
