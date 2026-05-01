/**
 * ============================================================
 * WA FLOW MANAGER — Scheduler.gs
 * Scheduled message management and execution
 * ============================================================
 */

/**
 * Create a new scheduled message
 */
function createSchedule(data) {
  var now = new Date().toISOString();
  var scheduleId = generateId('SCH');

  var entry = {
    schedule_id: scheduleId,
    title: data.title || 'Sin título',
    recipient_type: data.recipient_type || 'individual',
    recipients: data.recipients || '',
    message_template: data.message_template || '',
    file_url: data.file_url || '',
    audio_url: data.audio_url || '',
    document_url: data.document_url || '',
    start_datetime: data.start_datetime || '',
    recurrence_type: data.recurrence_type || 'once',
    recurrence_rule: data.recurrence_rule || '',
    next_run_at: data.start_datetime || '',
    last_run_at: '',
    status: 'active',
    created_at: now,
    updated_at: now
  };

  appendSheetRow(SHEETS.SCHEDULED_MESSAGES, entry);
  logAudit('user', 'schedule_created', 'schedule', scheduleId, { title: entry.title });

  return { success: true, schedule_id: scheduleId, data: entry };
}

/**
 * Update a scheduled message
 */
function updateSchedule(scheduleId, updates) {
  updates.updated_at = new Date().toISOString();
  var success = updateSheetRow(SHEETS.SCHEDULED_MESSAGES, 'schedule_id', scheduleId, updates);

  if (success) {
    logAudit('user', 'schedule_updated', 'schedule', scheduleId, updates);
  }

  return { success: success };
}

/**
 * Delete a scheduled message
 */
function deleteSchedule(scheduleId) {
  var success = deleteSheetRow(SHEETS.SCHEDULED_MESSAGES, 'schedule_id', scheduleId);

  if (success) {
    logAudit('user', 'schedule_deleted', 'schedule', scheduleId, {});
  }

  return { success: success };
}

/**
 * Get all schedules
 */
function getSchedules(filters) {
  return getSheetData(SHEETS.SCHEDULED_MESSAGES, filters, { sortBy: 'next_run_at', sortDir: 'asc' });
}

/**
 * Run the scheduler — checks for due messages and sends them
 * Should be called by a time-driven trigger (every 5 or 15 minutes)
 */
function runScheduler() {
  var now = new Date();
  var result = getSheetData(SHEETS.SCHEDULED_MESSAGES, { status: 'active' });
  var schedules = result.data || [];
  var processed = 0;
  var errors = 0;

  for (var i = 0; i < schedules.length; i++) {
    var schedule = schedules[i];
    var nextRun = new Date(schedule.next_run_at);

    // Check if this schedule is due
    if (isNaN(nextRun.getTime()) || nextRun > now) continue;

    // Parse recipients
    var recipients = String(schedule.recipients).split(',').map(function(r) { return r.trim(); }).filter(function(r) { return r.length > 0; });

    if (recipients.length === 0) continue;

    // Send to each recipient
    for (var j = 0; j < recipients.length; j++) {
      var recipient = recipients[j];

      // Resolve template
      var contact = findRow(SHEETS.CONTACTS, 'phone', recipient) || { phone: recipient, whatsapp_name: '', display_name: '' };
      var resolvedMsg = resolveTemplateVars(schedule.message_template, contact);

      var sendResult = sendWhatsAppMessage(recipient, resolvedMsg, {
        file_url: schedule.file_url || '',
        document_url: schedule.document_url || '',
        audio_url: schedule.audio_url || '',
        source: 'scheduler',
        schedule_id: schedule.schedule_id
      });

      if (sendResult.success) {
        processed++;
      } else {
        errors++;
      }
    }

    // Update schedule
    var updateData = {
      last_run_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    if (schedule.recurrence_type === 'once') {
      updateData.status = 'completed';
      updateData.next_run_at = '';
    } else {
      // Calculate next run
      updateData.next_run_at = calculateNextRun(nextRun, schedule.recurrence_type, schedule.recurrence_rule);
    }

    updateSheetRow(SHEETS.SCHEDULED_MESSAGES, 'schedule_id', schedule.schedule_id, updateData);

    logAudit('system', 'schedule_executed', 'schedule', schedule.schedule_id, {
      recipients: recipients.length,
      processed: processed,
      errors: errors
    });
  }

  return { success: true, processed: processed, errors: errors };
}

/**
 * Calculate the next run datetime based on recurrence
 */
function calculateNextRun(lastRun, recurrenceType, recurrenceRule) {
  var next = new Date(lastRun);

  switch (recurrenceType) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'every_n_days':
      var days = parseInt(recurrenceRule) || 1;
      next.setDate(next.getDate() + days);
      break;
    case 'once':
    default:
      return '';
  }

  return next.toISOString();
}
