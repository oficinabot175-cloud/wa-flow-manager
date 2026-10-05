/**
 * WA POWER — Simulador de Google Apps Script en memoria.
 * Permite ejecutar el backend real (.gs) en el navegador (modo demo) o en Node (pruebas).
 * No envía nada a WhatsApp: TextMeBot se simula.
 */
(function (G) {
  'use strict';

  // ── Hoja de cálculo en memoria ─────────────────────────────────────────
  function Range(sheet, r, c, nr, nc) { this.s = sheet; this.r = r; this.c = c; this.nr = nr || 1; this.nc = nc || 1; }
  Range.prototype.getValues = function () {
    var out = [];
    for (var i = 0; i < this.nr; i++) {
      var row = this.s._data[this.r - 1 + i] || [];
      var o = [];
      for (var j = 0; j < this.nc; j++) { var v = row[this.c - 1 + j]; o.push(v === undefined ? '' : v); }
      out.push(o);
    }
    return out;
  };
  Range.prototype.getDisplayValues = Range.prototype.getValues;
  Range.prototype.setValues = function (m) {
    for (var i = 0; i < m.length; i++) {
      var ri = this.r - 1 + i;
      while (this.s._data.length <= ri) this.s._data.push([]);
      for (var j = 0; j < m[i].length; j++) this.s._data[ri][this.c - 1 + j] = m[i][j] === null || m[i][j] === undefined ? '' : String(m[i][j]);
    }
    return this;
  };
  Range.prototype.setValue = function (v) { return this.setValues([[v]]); };
  ['setNumberFormat', 'setFontWeight', 'setBackground', 'setFontColor', 'setWrap'].forEach(function (k) { Range.prototype[k] = function () { return this; }; });
  Range.prototype.getRow = function () { return this.r; };
  Range.prototype.createTextFinder = function (text) {
    var self = this, entire = false;
    var f = {
      matchEntireCell: function (b) { entire = b; return f; },
      matchCase: function () { return f; },
      findAll: function () {
        var hits = [];
        var vals = self.getValues();
        for (var i = 0; i < vals.length; i++) for (var j = 0; j < vals[i].length; j++) {
          var v = String(vals[i][j]);
          if (entire ? v === String(text) : v.indexOf(String(text)) !== -1) hits.push(new Range(self.s, self.r + i, self.c + j, 1, 1));
        }
        return hits;
      }
    };
    return f;
  };

  function Sheet(name) { this.name = name; this._data = []; }
  Sheet.prototype.getName = function () { return this.name; };
  Sheet.prototype.getLastRow = function () {
    for (var i = this._data.length - 1; i >= 0; i--) if ((this._data[i] || []).join('') !== '') return i + 1;
    return 0;
  };
  Sheet.prototype.getLastColumn = function () {
    var m = 0;
    this._data.forEach(function (r) { for (var j = r.length - 1; j >= 0; j--) if (r[j] !== '' && r[j] !== undefined) { m = Math.max(m, j + 1); break; } });
    return m;
  };
  Sheet.prototype.getMaxRows = function () { return Math.max(1000, this._data.length); };
  Sheet.prototype.getMaxColumns = function () { return Math.max(26, this.getLastColumn()); };
  Sheet.prototype.insertColumnsAfter = function () {};
  Sheet.prototype.setFrozenRows = function () {};
  Sheet.prototype.getRange = function (r, c, nr, nc) { return new Range(this, r, c, nr, nc); };
  Sheet.prototype.getDataRange = function () { return new Range(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); };
  Sheet.prototype.appendRow = function (arr) { this._data.splice(this.getLastRow(), 0, arr.map(function (v) { return v === null || v === undefined ? '' : String(v); })); return this; };
  Sheet.prototype.deleteRow = function (r) { this._data.splice(r - 1, 1); };

  function Spreadsheet() { this._sheets = {}; }
  Spreadsheet.prototype.getSheetByName = function (n) { return this._sheets[n] || null; };
  Spreadsheet.prototype.insertSheet = function (n) { this._sheets[n] = new Sheet(n); return this._sheets[n]; };
  Spreadsheet.prototype.getSheets = function () { var s = this._sheets; return Object.keys(s).map(function (k) { return s[k]; }); };

  var SS = new Spreadsheet();
  G.SpreadsheetApp = { openById: function () { return SS; }, getActiveSpreadsheet: function () { return SS; }, __ss: SS };

  // ── Propiedades, caché, candado ────────────────────────────────────────
  var props = {};
  G.PropertiesService = {
    getScriptProperties: function () {
      return {
        getProperty: function (k) { return props.hasOwnProperty(k) ? props[k] : null; },
        setProperty: function (k, v) { props[k] = String(v); return this; },
        deleteProperty: function (k) { delete props[k]; return this; },
        getProperties: function () { var o = {}; for (var k in props) o[k] = props[k]; return o; }
      };
    },
    __props: props
  };

  var cache = {};
  G.CacheService = {
    getScriptCache: function () {
      return {
        get: function (k) { var e = cache[k]; if (!e) return null; if (e.exp < G.__now()) { delete cache[k]; return null; } return e.v; },
        put: function (k, v, ttl) { cache[k] = { v: String(v), exp: G.__now() + (ttl || 600) * 1000 }; },
        remove: function (k) { delete cache[k]; }
      };
    },
    __clear: function () { for (var k in cache) delete cache[k]; }
  };

  G.LockService = { getScriptLock: function () { return { waitLock: function () {}, tryLock: function () { return true; }, releaseLock: function () {}, hasLock: function () { return true; } }; } };

  // ── Reloj (se puede adelantar en pruebas) ──────────────────────────────
  var offset = 0;
  G.__now = function () { return Date.now() + offset; };
  G.__advance = function (ms) { offset += ms; };

  // ── Utilities ──────────────────────────────────────────────────────────
  function parts(date, tz) {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, weekday: 'short' });
    var o = {};
    f.formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
    if (o.hour === '24') o.hour = '00';
    return o;
  }
  function offsetStr(date, tz) {
    var p = parts(date, tz);
    var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    var diff = Math.round((asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000);
    var sign = diff < 0 ? '-' : '+';
    diff = Math.abs(diff);
    return sign + ('0' + Math.floor(diff / 60)).slice(-2) + ('0' + (diff % 60)).slice(-2);
  }
  var WD = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

  // SHA-256 síncrono (para hash de contraseñas en el simulador)
  function sha256Bytes(str) {
    var utf8 = unescape(encodeURIComponent(str));
    var bytes = [];
    for (var i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var l = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (var s = 7; s >= 0; s--) bytes.push(s > 3 ? 0 : (l >>> (s * 8)) & 0xff);
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (var off = 0; off < bytes.length; off += 64) {
      var w = [];
      for (var t = 0; t < 16; t++) w[t] = (bytes[off + t * 4] << 24) | (bytes[off + t * 4 + 1] << 16) | (bytes[off + t * 4 + 2] << 8) | bytes[off + t * 4 + 3];
      for (t = 16; t < 64; t++) {
        var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H = [(H[0] + a) | 0, (H[1] + b) | 0, (H[2] + c) | 0, (H[3] + d) | 0, (H[4] + e) | 0, (H[5] + f) | 0, (H[6] + g) | 0, (H[7] + h) | 0];
    }
    var out = [];
    H.forEach(function (x) { for (var s2 = 3; s2 >= 0; s2--) { var v = (x >>> (s2 * 8)) & 0xff; out.push(v > 127 ? v - 256 : v); } });
    return out;
  }

  function uuid() {
    if (G.crypto && G.crypto.randomUUID) return G.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }

  function parseCsv(text, sep) {
    sep = sep || ',';
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cur); rows.push(row); row = []; cur = '';
      } else cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.join('') !== ''; });
  }

  function b64decode(s) {
    var bin = typeof atob === 'function' ? atob(s) : Buffer.from(s, 'base64').toString('binary');
    var out = [];
    for (var i = 0; i < bin.length; i++) { var c = bin.charCodeAt(i); out.push(c > 127 ? c - 256 : c); }
    return out;
  }
  G.Utilities = {
    base64Decode: b64decode,
    newBlob: function (bytes, mime, name) { return { bytes: bytes, mime: mime, name: name }; },
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' },
    computeDigest: function (alg, str) { return sha256Bytes(String(str)); },
    getUuid: uuid,
    sleep: function () {},
    parseCsv: parseCsv,
    formatDate: function (date, tz, pattern) {
      var d = date instanceof Date ? date : new Date(date);
      var p = parts(d, tz);
      return pattern.replace(/yyyy|yy|MM|dd|HH|H|mm|ss|u|Z|EEE/g, function (tok) {
        switch (tok) {
          case 'yyyy': return p.year;
          case 'yy': return p.year.slice(-2);
          case 'MM': return p.month;
          case 'dd': return p.day;
          case 'HH': return p.hour;
          case 'H': return String(parseInt(p.hour, 10));
          case 'mm': return p.minute;
          case 'ss': return p.second;
          case 'u': return String(WD[p.weekday]);
          case 'Z': return offsetStr(d, tz);
          case 'EEE': return p.weekday;
        }
        return tok;
      });
    }
  };

  // ── Servicios de red y web ─────────────────────────────────────────────
  G.__sent = [];
  G.__textmebotFail = false;
  G.UrlFetchApp = {
    fetch: function (url) {
      var u = new URL(url);
      if (u.searchParams.get('group_info')) {
        var code = u.searchParams.get('group_info');
        var gid = '1203630' + String(Math.abs(code.split('').reduce(function (h, c) { return (h * 31 + c.charCodeAt(0)) | 0; }, 7))).padStart(11, '0').slice(0, 11) + '@g.us';
        return { getResponseCode: function () { return 200; }, getContentText: function () { return JSON.stringify({ status: 'success', group_id: gid, subject: G.__groupSubject || 'Equipo de ventas' }); } };
      }
      var entry = { recipient: u.searchParams.get('recipient'), text: u.searchParams.get('text'), file: u.searchParams.get('file'), document: u.searchParams.get('document'), audio: u.searchParams.get('audio'), at: new Date(G.__now()).toISOString() };
      G.__sent.push(entry);
      if (G.__onSend) try { G.__onSend(entry); } catch (e) {}
      var fail = G.__textmebotFail;
      return {
        getResponseCode: function () { return 200; },
        getContentText: function () { return fail ? '{"status":"error","message":"Invalid recipient"}' : '{"status":"success"}'; }
      };
    }
  };

  var driveFiles = [];
  G.DriveApp = {
    Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' }, Permission: { VIEW: 'VIEW' },
    getFoldersByName: function () { var done = false; return { hasNext: function () { return false; }, next: function () { return null; } }; },
    createFolder: function (name) {
      return {
        getName: function () { return name; },
        createFile: function (blob) {
          var id = 'DRV' + driveFiles.length + Math.random().toString(36).slice(2, 8);
          var bin = blob.bytes.map(function (b) { return String.fromCharCode(b & 255); }).join('');
          var b64 = typeof btoa === 'function' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');
          var f = { __dataUrl: 'data:' + blob.mime + ';base64,' + b64, getId: function () { return id; }, setSharing: function () { return f; } };
          driveFiles.push(f);
          return f;
        }
      };
    }
  };

  G.ContentService = {
    MimeType: { JSON: 'json', TEXT: 'text' },
    createTextOutput: function (s) { return { _s: s, setMimeType: function () { return this; }, getContent: function () { return this._s; } }; }
  };
  G.HtmlService = { createHtmlOutput: function (s) { return { getContent: function () { return s; } }; } };

  var triggers = [];
  G.ScriptApp = {
    getService: function () { return { getUrl: function () { return 'https://script.google.com/macros/s/DEMO/exec'; } }; },
    getProjectTriggers: function () { return triggers.slice(); },
    deleteTrigger: function (t) { var i = triggers.indexOf(t); if (i > -1) triggers.splice(i, 1); },
    newTrigger: function (fn) {
      var t = { getHandlerFunction: function () { return fn; } };
      var b = { timeBased: function () { return b; }, everyMinutes: function () { return b; }, everyHours: function () { return b; }, create: function () { triggers.push(t); return t; } };
      return b;
    }
  };
  G.Session = { getScriptTimeZone: function () { return 'America/Lima'; } };
  G.Logger = { log: function (m) { if (G.__verbose) console.log('[Logger]', m); } };
})(typeof window !== 'undefined' ? window : globalThis);
