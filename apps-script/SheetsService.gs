/**
 * ============================================================
 * WA FLOW MANAGER — SheetsService.gs
 * Generic CRUD operations for Google Sheets
 * ============================================================
 */

/**
 * Get sheet by name from main spreadsheet
 */
function getSheet(sheetName) {
  return getSpreadsheet().getSheetByName(sheetName);
}

/**
 * Generate a unique ID with prefix
 * Example: generateId('MSG') => 'MSG_1714567890123'
 */
function generateId(prefix) {
  return prefix + '_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
}

/**
 * Get all data from a sheet as array of objects
 * @param {string} sheetName - Sheet name
 * @param {Object} filters - Optional key-value filters
 * @param {Object} options - { limit, offset, sortBy, sortDir }
 * @returns {Array} Array of row objects
 */
function getSheetData(sheetName, filters, options) {
  var sheet = getSheet(sheetName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    row._rowIndex = i + 1; // 1-based sheet row number

    // Apply filters
    if (filters) {
      var match = true;
      for (var key in filters) {
        if (filters[key] !== undefined && filters[key] !== '' && filters[key] !== null) {
          var cellVal = String(row[key] || '').toLowerCase();
          var filterVal = String(filters[key]).toLowerCase();
          if (cellVal.indexOf(filterVal) === -1) {
            match = false;
            break;
          }
        }
      }
      if (!match) continue;
    }

    rows.push(row);
  }

  // Sort
  options = options || {};
  if (options.sortBy) {
    var sortDir = options.sortDir === 'asc' ? 1 : -1;
    rows.sort(function(a, b) {
      var va = a[options.sortBy] || '';
      var vb = b[options.sortBy] || '';
      if (va < vb) return -1 * sortDir;
      if (va > vb) return 1 * sortDir;
      return 0;
    });
  }

  // Pagination
  var total = rows.length;
  if (options.offset) {
    rows = rows.slice(options.offset);
  }
  if (options.limit) {
    rows = rows.slice(0, options.limit);
  }

  return { data: rows, total: total };
}

/**
 * Append a new row to a sheet
 * @param {string} sheetName
 * @param {Object} rowData - key-value pairs matching column headers
 * @returns {Object} The inserted row data
 */
function appendSheetRow(sheetName, rowData) {
  var sheet = getSheet(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = [];

  for (var i = 0; i < headers.length; i++) {
    newRow.push(rowData[headers[i]] !== undefined ? rowData[headers[i]] : '');
  }

  sheet.appendRow(newRow);
  return rowData;
}

/**
 * Update a row by matching a key column value
 * @param {string} sheetName
 * @param {string} keyCol - Column name to match
 * @param {string} keyVal - Value to find
 * @param {Object} updates - key-value pairs to update
 * @returns {boolean} Success
 */
function updateSheetRow(sheetName, keyCol, keyVal, updates) {
  var sheet = getSheet(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;

  var headers = data[0];
  var keyColIndex = headers.indexOf(keyCol);
  if (keyColIndex === -1) throw new Error('Column not found: ' + keyCol);

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][keyColIndex]) === String(keyVal)) {
      // Found the row, apply updates
      for (var col in updates) {
        var colIndex = headers.indexOf(col);
        if (colIndex !== -1) {
          sheet.getRange(i + 1, colIndex + 1).setValue(updates[col]);
        }
      }
      return true;
    }
  }

  return false;
}

/**
 * Delete a row by matching a key column value
 * @param {string} sheetName
 * @param {string} keyCol
 * @param {string} keyVal
 * @returns {boolean}
 */
function deleteSheetRow(sheetName, keyCol, keyVal) {
  var sheet = getSheet(sheetName);
  if (!sheet) return false;

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;

  var headers = data[0];
  var keyColIndex = headers.indexOf(keyCol);
  if (keyColIndex === -1) return false;

  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][keyColIndex]) === String(keyVal)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }

  return false;
}

/**
 * Find a single row by key
 */
function findRow(sheetName, keyCol, keyVal) {
  var sheet = getSheet(sheetName);
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;

  var headers = data[0];
  var keyColIndex = headers.indexOf(keyCol);
  if (keyColIndex === -1) return null;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][keyColIndex]) === String(keyVal)) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      row._rowIndex = i + 1;
      return row;
    }
  }

  return null;
}

/**
 * Get or create a contact
 */
function getOrCreateContact(phone, whatsappName) {
  var existing = findRow(SHEETS.CONTACTS, 'phone', phone);
  var now = new Date().toISOString();

  if (existing) {
    // Update last seen and whatsapp name
    var updates = { last_seen_at: now };
    if (whatsappName && whatsappName !== existing.whatsapp_name) {
      updates.whatsapp_name = whatsappName;
    }
    updateSheetRow(SHEETS.CONTACTS, 'phone', phone, updates);
    existing.last_seen_at = now;
    if (whatsappName) existing.whatsapp_name = whatsappName;
    return { contact: existing, isNew: false };
  }

  // Create new contact
  var contact = {
    contact_id: generateId('CON'),
    phone: phone,
    whatsapp_name: whatsappName || '',
    display_name: whatsappName || '',
    tags: '',
    status: 'active',
    source: 'whatsapp',
    first_seen_at: now,
    last_seen_at: now,
    notes: '',
    do_not_contact: 'false'
  };

  appendSheetRow(SHEETS.CONTACTS, contact);
  return { contact: contact, isNew: true };
}

/**
 * Update or create a conversation record
 */
function updateConversation(phone, whatsappName, message) {
  var now = new Date().toISOString();
  var existing = findRow(SHEETS.CONVERSATIONS, 'phone', phone);

  if (existing) {
    var totalMsg = parseInt(existing.total_messages || 0) + 1;
    updateSheetRow(SHEETS.CONVERSATIONS, 'phone', phone, {
      whatsapp_name: whatsappName || existing.whatsapp_name,
      last_message: message,
      last_message_at: now,
      total_messages: totalMsg,
      updated_at: now
    });
  } else {
    appendSheetRow(SHEETS.CONVERSATIONS, {
      conversation_id: generateId('CONV'),
      phone: phone,
      whatsapp_name: whatsappName || '',
      last_message: message,
      last_message_at: now,
      total_messages: 1,
      status: 'active',
      summary: '',
      updated_at: now
    });
  }
}

/**
 * Get a setting from the Settings sheet
 */
function getSettingFromSheet(key) {
  var row = findRow(SHEETS.SETTINGS, 'key', key);
  return row ? row.value : null;
}

/**
 * Set a setting in the Settings sheet
 */
function setSettingInSheet(key, value, description) {
  var existing = findRow(SHEETS.SETTINGS, 'key', key);
  var now = new Date().toISOString();

  if (existing) {
    updateSheetRow(SHEETS.SETTINGS, 'key', key, { value: value, updated_at: now });
  } else {
    appendSheetRow(SHEETS.SETTINGS, {
      key: key,
      value: value,
      description: description || '',
      updated_at: now
    });
  }
}
