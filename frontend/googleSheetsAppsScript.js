/**
 * Kairos Lift Log — Clean, Automated Google Sheets Apps Script (v9)
 *
 * CLEAN 7-COLUMN STRUCTURE:
 *   Date | Exercise | Set | Target | Start lb | Weight | Reps
 *
 * FEATURES:
 *   - Automatic exercise alternative dropdowns (e.g., Flat Machine vs Barbell Bench)
 *   - Universal date & number parser
 *   - Multi-tab session scanning
 *   - Automatic sanitization of legacy columns
 *
 * SETUP / UPDATE:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Delete ALL code → paste THIS file → Save (Cmd+S / Ctrl+S)
 * 3. Deploy → Manage deployments → click Pencil (Edit) → Version: "New version" → Deploy
 */

var WORKOUT_TABS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower'];
var PROGRESS_SHEET = 'Progress';

var HEADERS = ['Date', 'Exercise', 'Set', 'Target', 'Start lb', 'Weight', 'Reps'];
var PROGRESS_HEADERS = ['Exercise', 'Workout', 'Weight', 'Reps', 'Date', 'Change'];

function doGet() {
  return json_({ ok: true, service: 'kairos-lift-log', version: 9 });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheets_(ss);

    if (body.action === 'clean_layout') {
      cleanAndSanitizeAllSheets_(ss);
      refreshProgress_(ss);
      return json_({
        ok: true,
        message: 'Cleaned all sheets. Restored pristine 7-column layout (Date, Exercise, Set, Target, Start lb, Weight, Reps).',
      });
    }

    if (body.action === 'append' && body.rows && body.rows.length) {
      cleanAndSanitizeAllSheets_(ss);
      var n = appendRows_(ss, body.rows);
      refreshProgress_(ss);
      return json_({
        ok: true,
        appended: n,
        message: 'Added ' + n + ' rows to your sheet. Fill Weight + Reps (yellow) at the gym.',
      });
    }

    if (body.action === 'fetch_session') {
      cleanAndSanitizeAllSheets_(ss);
      var dateKey = String(body.date || '').trim();
      if (!dateKey) {
        return json_({ ok: false, error: 'Pass date as YYYY-MM-DD' });
      }
      var session = fetchSession_(ss, dateKey);
      return json_({
        ok: true,
        date: dateKey,
        workout: session.workout,
        rows: session.rows,
        filledSets: session.rows.length,
        debug: session.debug,
        message:
          session.rows.length > 0
            ? 'Found ' + session.rows.length + ' filled sets for ' + dateKey
            : 'No filled sets found for ' +
              dateKey +
              '. Tabs checked: ' +
              session.debug.tabsChecked.join(', ') +
              '. Dates found: ' +
              (session.debug.datesFound.length ? session.debug.datesFound.join(', ') : 'none'),
      });
    }

    if (body.action === 'refresh_progress') {
      refreshProgress_(ss);
      return json_({ ok: true, message: 'Progress refreshed.' });
    }

    return json_({ ok: false, error: 'Unknown action: ' + body.action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/**
 * Ensures all standard workout tabs exist and cleans legacy "Order" and "Slot" columns.
 */
function ensureSheets_(ss) {
  for (var i = 0; i < WORKOUT_TABS.length; i++) {
    ensureWorkoutSheet_(ss, WORKOUT_TABS[i]);
  }

  var progress = ss.getSheetByName(PROGRESS_SHEET);
  if (!progress) progress = ss.insertSheet(PROGRESS_SHEET);
  styleHeaderRow_(progress, PROGRESS_HEADERS);

  var sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && sheet1.getLastRow() <= 1 && WORKOUT_TABS.indexOf('Sheet1') < 0) {
    try {
      ss.deleteSheet(sheet1);
    } catch (ignore) {}
  }
}

function ensureWorkoutSheet_(ss, name) {
  var sheet = getSheetCaseInsensitive_(ss, name);
  if (!sheet) sheet = ss.insertSheet(name);
  sanitizeSingleSheetLayout_(sheet);
  return sheet;
}

/**
 * Completely scrubs legacy "Order" or "Slot/Required" headers and formats row 1 cleanly.
 */
function sanitizeSingleSheetLayout_(sheet) {
  var lastRow = sheet.getLastRow();
  var maxCols = sheet.getMaxColumns();

  // If sheet is fresh or row 1 contains legacy headers like "Order" or "Slot"
  if (lastRow < 1) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else {
    var topRow = sheet.getRange(1, 1, 1, Math.min(maxCols, 12)).getValues()[0];
    var hasLegacyHeaders = false;
    for (var c = 0; c < topRow.length; c++) {
      var h = String(topRow[c] || '').trim().toLowerCase();
      if (h === 'order' || h === 'slot' || h === 'feel' || h === 'workout') {
        hasLegacyHeaders = true;
        break;
      }
    }

    // Overwrite header row with pristine 7-column layout
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

    // Clear any leftover phantom headers beyond column 7
    if (maxCols > HEADERS.length) {
      sheet.getRange(1, HEADERS.length + 1, 1, maxCols - HEADERS.length).clear();
    }
  }

  styleHeaderRow_(sheet, HEADERS);
  sheet.setColumnWidth(1, 100); // Date
  sheet.setColumnWidth(2, 220); // Exercise
  sheet.setColumnWidth(3, 50);  // Set
  sheet.setColumnWidth(4, 75);  // Target
  sheet.setColumnWidth(5, 75);  // Start lb
  sheet.setColumnWidth(6, 75);  // Weight
  sheet.setColumnWidth(7, 65);  // Reps
}

function cleanAndSanitizeAllSheets_(ss) {
  for (var i = 0; i < WORKOUT_TABS.length; i++) {
    var s = getSheetCaseInsensitive_(ss, WORKOUT_TABS[i]);
    if (s) sanitizeSingleSheetLayout_(s);
  }
}

function styleHeaderRow_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet
    .getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#111827')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);
}

function tabForWorkout_(workout) {
  var w = String(workout || '')
    .trim()
    .toLowerCase();
  if (w.indexOf('push') === 0) return 'Push';
  if (w.indexOf('pull') === 0) return 'Pull';
  if (w.indexOf('legs') === 0) return 'Legs';
  if (w.indexOf('upper') === 0) return 'Upper';
  if (w.indexOf('lower') === 0) return 'Lower';
  return null;
}

function getSheetCaseInsensitive_(ss, name) {
  var exact = ss.getSheetByName(name);
  if (exact) return exact;
  var target = String(name || '').trim().toLowerCase();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sName = sheets[i].getName().trim().toLowerCase();
    if (sName === target || sName.indexOf(target) === 0) {
      return sheets[i];
    }
  }
  return null;
}

function appendRows_(ss, rows) {
  var byTab = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var tab = tabForWorkout_(r.workout) || 'Push';
    if (!byTab[tab]) byTab[tab] = [];
    byTab[tab].push(r);
  }

  var total = 0;
  var tabs = Object.keys(byTab);
  for (var t = 0; t < tabs.length; t++) {
    var name = tabs[t];
    var sheet = ensureWorkoutSheet_(ss, name);
    var payload = byTab[name];
    var values = [];
    var lastExercise = '';
    var lastDate = '';

    for (var j = 0; j < payload.length; j++) {
      var row = payload[j];
      var date = row.date || '';
      var exercise = row.exercise || '';
      var setNum = row.set || '';
      var target = row.goal || row.target || '';
      var start =
        row.startWeight === null || row.startWeight === undefined || row.startWeight === ''
          ? ''
          : row.startWeight;
      var weight =
        row.weight === null || row.weight === undefined || row.weight === '' ? '' : row.weight;
      var reps = row.reps === null || row.reps === undefined || row.reps === '' ? '' : row.reps;

      var showExercise = exercise;
      var showDate = date;
      if (exercise === lastExercise && date === lastDate) {
        showExercise = '';
        showDate = '';
      }
      lastExercise = exercise;
      lastDate = date;

      values.push([showDate, showExercise, setNum, target, start, weight, reps]);
    }

    var startRow = sheet.getLastRow() + 1;

    // Blank spacer between sessions
    if (startRow > 2) {
      sheet
        .getRange(startRow, 1, 1, HEADERS.length)
        .setValues([['', '', '', '', '', '', '']]);
      startRow += 1;
    }

    sheet.getRange(startRow, 1, values.length, HEADERS.length).setValues(values);
    sheet.getRange(startRow, 6, values.length, 2).setBackground('#fef9c3');

    for (var k = 0; k < values.length; k++) {
      var rowPayload = payload[k];
      if (values[k][1]) {
        sheet.getRange(startRow + k, 2).setFontWeight('bold');
      }
      // Apply exercise alternative dropdown if options exist
      if (rowPayload && rowPayload.exerciseOptions && rowPayload.exerciseOptions.length > 1) {
        applyExerciseDropdown_(sheet.getRange(startRow + k, 2), rowPayload.exerciseOptions);
      }
    }

    total += values.length;
  }
  return total;
}

function applyExerciseDropdown_(range, options) {
  try {
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(options, true)
      .setAllowInvalid(true)
      .build();
    range.setDataValidation(rule);
  } catch (err) {
    // Ignore validation errors on restricted ranges
  }
}

/**
 * Universal date normalizer: extracts YYYY-MM-DD from any date or string.
 */
function normalizeDate_(value, ss) {
  if (value === '' || value === null || value === undefined) return '';

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    try {
      var tz = ss ? ss.getSpreadsheetTimeZone() : Session.getScriptTimeZone();
      return Utilities.formatDate(value, tz, 'yyyy-MM-dd');
    } catch (e) {
      var y = value.getFullYear();
      var m = value.getMonth() + 1;
      var d = value.getDate();
      return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
    }
  }

  var str = String(value).trim();
  if (!str) return '';

  // 2026-08-25 or 2026/08/25
  var iso = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (iso) {
    var y = Number(iso[1]);
    var m = Number(iso[2]);
    var d = Number(iso[3]);
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  }

  // 08/25/2026 or 8/25/2026
  var us = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (us) {
    var m = Number(us[1]);
    var d = Number(us[2]);
    var y = Number(us[3]);
    if (y < 100) y += 2000;
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  }

  // 8/25 (current year)
  var monthDay = str.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (monthDay) {
    var curYear = new Date().getFullYear();
    var m = Number(monthDay[1]);
    var d = Number(monthDay[2]);
    return curYear + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  }

  var parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    var dt = new Date(parsed);
    var y = dt.getFullYear();
    var m = dt.getMonth() + 1;
    var d = dt.getDate();
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  }

  return str;
}

function parseNum_(val) {
  if (val === '' || val === null || val === undefined) return null;
  if (typeof val === 'number') return isFinite(val) ? val : null;
  var str = String(val).trim().toLowerCase();
  if (str === 'bw' || str === 'bodyweight') return 0;
  var match = str.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (match) {
    var n = parseFloat(match[0]);
    return isFinite(n) ? n : null;
  }
  return null;
}

function findColIndexes_(headerRow) {
  var map = { date: -1, exercise: -1, set: -1, target: -1, start: -1, weight: -1, reps: -1 };
  if (!headerRow || !headerRow.length) {
    return { date: 0, exercise: 1, set: 2, target: 3, start: 4, weight: 5, reps: 6 };
  }

  for (var i = 0; i < headerRow.length; i++) {
    var h = String(headerRow[i] || '').trim().toLowerCase();
    if (h === 'date' || h === 'session date' || h === 'day') {
      map.date = i;
    } else if (h === 'exercise' || h === 'movement' || h === 'lift' || h === 'name') {
      map.exercise = i;
    } else if (h === 'set' || h === 'set #' || h === 'set num' || h === 'set number') {
      map.set = i;
    } else if (h === 'target' || h === 'goal' || h === 'target reps' || h === 'rep range') {
      map.target = i;
    } else if (h.indexOf('start') >= 0) {
      map.start = i;
    } else if (h.indexOf('weight') >= 0 || h === 'load' || h === 'lbs' || h === 'lb') {
      map.weight = i;
    } else if (h.indexOf('rep') >= 0) {
      map.reps = i;
    }
  }

  if (map.date === -1) map.date = 0;
  if (map.exercise === -1) map.exercise = 1;
  if (map.set === -1) map.set = 2;
  if (map.weight === -1) map.weight = headerRow.length >= 7 ? 5 : headerRow.length >= 6 ? 4 : 5;
  if (map.reps === -1) map.reps = headerRow.length >= 7 ? 6 : headerRow.length >= 6 ? 5 : 6;
  if (map.target === -1) map.target = 3;
  if (map.start === -1) map.start = 4;

  return map;
}

/**
 * Fetch filled sets for one date across all tabs.
 */
function fetchSession_(ss, targetDateKey) {
  var targetNorm = normalizeDate_(targetDateKey, ss);
  var rows = [];
  var foundWorkout = '';
  var debug = {
    targetDate: targetNorm,
    tabsChecked: [],
    datesFound: [],
    sampleRows: [],
  };

  var allSheets = ss.getSheets();
  var sheetsToCheck = [];

  for (var w = 0; w < WORKOUT_TABS.length; w++) {
    var ws = getSheetCaseInsensitive_(ss, WORKOUT_TABS[w]);
    if (ws && sheetsToCheck.indexOf(ws) < 0) {
      sheetsToCheck.push(ws);
    }
  }
  for (var a = 0; a < allSheets.length; a++) {
    var s = allSheets[a];
    var sName = s.getName().trim().toLowerCase();
    if (sName !== 'progress' && sName.indexOf('_old') !== 0 && sheetsToCheck.indexOf(s) < 0) {
      sheetsToCheck.push(s);
    }
  }

  for (var sIdx = 0; sIdx < sheetsToCheck.length; sIdx++) {
    var sheet = sheetsToCheck[sIdx];
    var tabName = sheet.getName();
    debug.tabsChecked.push(tabName);

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) continue;

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;

    var cols = findColIndexes_(data[0]);
    var currentExercise = '';
    var currentDate = '';

    for (var i = 1; i < data.length; i++) {
      var rowValues = data[i];

      var isBlank = true;
      for (var c = 0; c < rowValues.length; c++) {
        if (rowValues[c] !== '' && rowValues[c] !== null && rowValues[c] !== undefined) {
          isBlank = false;
          break;
        }
      }
      if (isBlank) {
        currentExercise = '';
        continue;
      }

      var rawDate = rowValues[cols.date];
      var normDate = normalizeDate_(rawDate, ss);
      if (normDate) {
        currentDate = normDate;
        if (debug.datesFound.indexOf(normDate) < 0) {
          debug.datesFound.push(normDate);
        }
      }

      var named = String(rowValues[cols.exercise] || '').trim();
      if (named) currentExercise = named;

      if (!currentDate || currentDate !== targetNorm) continue;
      if (!currentExercise) continue;

      var w = parseNum_(rowValues[cols.weight]);
      var r = parseNum_(rowValues[cols.reps]);

      if (w === null && r === null) {
        for (var colIdx = 0; colIdx < rowValues.length; colIdx++) {
          if (colIdx === cols.date || colIdx === cols.exercise) continue;
          var num = parseNum_(rowValues[colIdx]);
          if (num !== null) {
            if (w === null) w = num;
            else if (r === null) {
              r = num;
              break;
            }
          }
        }
      }

      if (debug.sampleRows.length < 3) {
        debug.sampleRows.push(
          tabName + ' r' + (i + 1) + ': date=' + currentDate + ' ex=' + currentExercise + ' w=' + w + ' r=' + r
        );
      }

      if (w === null && r === null) continue;
      if (w === null) w = 0;
      if (r === null) r = 0;

      var startVal = parseNum_(rowValues[cols.start]);

      rows.push({
        date: targetNorm,
        workout: tabName,
        exercise: currentExercise,
        set: parseNum_(rowValues[cols.set]) || (rows.length + 1),
        goal: String(rowValues[cols.target] || ''),
        startWeight: startVal !== null ? startVal : '',
        weight: w,
        reps: r,
      });

      if (!foundWorkout) foundWorkout = tabName;
    }
  }

  return { workout: foundWorkout, rows: rows, debug: debug };
}

function refreshProgress_(ss) {
  var progress = ss.getSheetByName(PROGRESS_SHEET);
  if (!progress) progress = ss.insertSheet(PROGRESS_SHEET);

  var byExercise = {};

  for (var t = 0; t < WORKOUT_TABS.length; t++) {
    var sheet = getSheetCaseInsensitive_(ss, WORKOUT_TABS[t]);
    if (!sheet || sheet.getLastRow() < 2) continue;

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;

    var cols = findColIndexes_(data[0]);
    var currentExercise = '';
    var currentDate = '';

    for (var i = 1; i < data.length; i++) {
      var rawDate = data[i][cols.date];
      var normDate = normalizeDate_(rawDate, ss);
      if (normDate) currentDate = normDate;

      var named = String(data[i][cols.exercise] || '').trim();
      if (named) currentExercise = named;

      var exercise = currentExercise;
      var setNum = parseNum_(data[i][cols.set]) || 1;
      var w = parseNum_(data[i][cols.weight]);
      var r = parseNum_(data[i][cols.reps]);
      var workoutName = WORKOUT_TABS[t];

      if (!exercise || w === null || !currentDate) continue;

      if (!byExercise[exercise]) byExercise[exercise] = { workout: workoutName, days: {} };
      byExercise[exercise].workout = workoutName;

      var day = byExercise[exercise].days[currentDate];
      if (!day || setNum >= day.setNum) {
        byExercise[exercise].days[currentDate] = {
          setNum: setNum,
          weight: w,
          reps: r !== null ? r : '',
        };
      }
    }
  }

  var out = [];
  var names = Object.keys(byExercise).sort();
  for (var n = 0; n < names.length; n++) {
    var name = names[n];
    var entry = byExercise[name];
    var dates = Object.keys(entry.days).sort();
    if (dates.length === 0) continue;
    var lastDate = dates[dates.length - 1];
    var last = entry.days[lastDate];
    var change = '—';
    if (dates.length >= 2) {
      var prev = entry.days[dates[dates.length - 2]];
      var delta = last.weight - prev.weight;
      if (delta > 0) change = '+' + delta;
      else if (delta < 0) change = String(delta);
      else change = 'same';
    }
    out.push([names[n], entry.workout, last.weight, last.reps, lastDate, change]);
  }

  progress.clearContents();
  styleHeaderRow_(progress, PROGRESS_HEADERS);
  if (out.length) {
    progress.getRange(2, 1, out.length, PROGRESS_HEADERS.length).setValues(out);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
