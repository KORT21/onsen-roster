/**
 * Onsen Roster data service.
 *
 * Deploy this file as a Google Apps Script web app from the Google account
 * that owns the roster spreadsheet. Set the SPREADSHEET_ID Script Property;
 * do not commit spreadsheet IDs or credentials to GitHub.
 */

var API_VERSION = 1;
var CACHE_SECONDS = 60;
var WEEK_TAB_PATTERN = /^WC\s+\d{1,2}\/\d{1,2}$/i;

function doGet() {
  try {
    var cached = CacheService.getScriptCache().get('roster-v1');
    if (cached) return jsonOutput_(JSON.parse(cached));

    var spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!spreadsheetId) throw new Error('SPREADSHEET_ID is not configured in Script Properties.');

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var weeks = spreadsheet.getSheets()
      .filter(function (sheet) { return WEEK_TAB_PATTERN.test(sheet.getName().trim()); })
      .map(readWeek_)
      .filter(Boolean)
      .sort(function (a, b) { return a.start.localeCompare(b.start); });

    var payload = {
      version: API_VERSION,
      fetchedAt: new Date().toISOString(),
      source: {
        name: 'Onsen Google Sheet',
        spreadsheetTitle: spreadsheet.getName(),
      },
      weeks: weeks,
    };

    var serialized = JSON.stringify(payload);
    if (serialized.length < 90000) CacheService.getScriptCache().put('roster-v1', serialized, CACHE_SECONDS);
    return jsonOutput_(payload);
  } catch (error) {
    return jsonOutput_({
      version: API_VERSION,
      error: error && error.message ? error.message : String(error),
      fetchedAt: new Date().toISOString(),
    });
  }
}

function readWeek_(sheet) {
  var range = sheet.getDataRange();
  var values = range.getValues();
  var display = range.getDisplayValues();
  if (!display.length) return null;

  var headerIndex = findHeaderRow_(values, display);
  if (headerIndex < 0) return null;

  var monday = dateFromHeader_(values[headerIndex], sheet.getName());
  if (!monday) return null;

  var days = [];
  for (var dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    var date = new Date(monday.getTime());
    date.setDate(monday.getDate() + dayIndex);
    days.push({
      date: Utilities.formatDate(date, 'Pacific/Auckland', 'yyyy-MM-dd'),
      shortLabel: Utilities.formatDate(date, 'Pacific/Auckland', 'EEE'),
    });
  }

  var rows = [];
  for (var rowIndex = headerIndex + 1; rowIndex < display.length; rowIndex += 1) {
    var label = clean_(display[rowIndex][0]);
    var cells = [];
    for (var column = 1; column <= 7; column += 1) cells.push(clean_(display[rowIndex][column]));
    if (!label && !cells.some(Boolean)) continue;
    rows.push({
      id: String(sheet.getSheetId()) + '-r' + String(rowIndex + 1),
      label: label,
      cells: cells,
    });
  }

  var start = Utilities.formatDate(monday, 'Pacific/Auckland', 'yyyy-MM-dd');
  return {
    id: String(sheet.getSheetId()),
    label: sheet.getName(),
    start: start,
    days: days,
    rows: rows,
  };
}

function findHeaderRow_(values, display) {
  for (var row = 0; row < Math.min(display.length, 20); row += 1) {
    var dateCount = 0;
    var dayLabelCount = 0;
    for (var column = 1; column <= 7; column += 1) {
      if (isDate_(values[row][column])) dateCount += 1;
      if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(clean_(display[row][column]))) dayLabelCount += 1;
    }
    if (dateCount >= 5 || dayLabelCount >= 5) return row;
  }
  return -1;
}

function dateFromHeader_(row, tabName) {
  for (var column = 1; column <= 7; column += 1) {
    if (isDate_(row[column])) {
      var date = new Date(row[column].getTime());
      date.setHours(12, 0, 0, 0);
      return date;
    }
  }

  var match = tabName.match(/(\d{1,2})\/(\d{1,2})/);
  if (!match) return null;
  var day = Number(match[1]);
  var month = Number(match[2]) - 1;
  var now = new Date();
  var candidates = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(function (year) {
    return new Date(year, month, day, 12, 0, 0, 0);
  });
  candidates.sort(function (a, b) { return Math.abs(a - now) - Math.abs(b - now); });
  return candidates[0];
}

function clean_(value) {
  var cleaned = String(value == null ? '' : value).replace(/\u00a0/g, ' ').trim();
  return cleaned === '`' ? '' : cleaned;
}

function isDate_(value) {
  return Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime());
}

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

