/**

 * Kairos → Google Sheets bridge

 *

 * SETUP (once on your computer):

 * 1. Create a Google Sheet named "Kairos Lift Log"

 * 2. Extensions → Apps Script → delete any code → paste THIS whole file → Save

 * 3. Deploy → New deployment → Type: Web app

 *    - Execute as: Me

 *    - Who has access: Anyone (the app only sends your workout rows)

 * 4. Copy the Web app URL

 * 5. In Kairos → Settings → paste that URL under Google Sheets

 *

 * After updating this script: Deploy → Manage deployments → Edit (pencil) → New version → Deploy.

 * First run migrates an old single "Log" tab into Push / Pull / Legs / Upper / Lower

 * (your filled rows are kept — Log is renamed to "_Old Log").

 *

 * Tabs:

 *   Push / Pull / Legs / Upper / Lower — one row per set for that day type

 *   Progress — latest weight per exercise (auto-refreshed on each send)

 */



var WORKOUT_TABS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower'];

var PROGRESS_SHEET = 'Progress';

var OLD_LOG = 'Log';

var ARCHIVED_LOG = '_Old Log';



/** Per-workout tab (Workout is the tab name, so it is not a column) */

var HEADERS = ['Date', 'Exercise', 'Set', 'Goal', 'Weight', 'Reps', 'Feel'];

var PROGRESS_HEADERS = ['Exercise', 'Workout', 'Weight', 'Reps', 'Date', 'Change'];



function doGet() {

  return ContentService.createTextOutput(

    JSON.stringify({ ok: true, service: 'kairos-lift-log' })

  ).setMimeType(ContentService.MimeType.JSON);

}



function doPost(e) {

  try {

    var body = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    ensureSheets_(ss);



    if (body.action === 'append' && body.rows && body.rows.length) {

      var n = appendRows_(ss, body.rows);

      refreshProgress_(ss);

      return json_({

        ok: true,

        appended: n,

        message: 'Added ' + n + ' rows to the workout tab(s). Progress updated.',

      });

    }



    if (body.action === 'refresh_progress') {

      refreshProgress_(ss);

      return json_({ ok: true, message: 'Progress refreshed.' });

    }



    if (body.action === 'migrate') {

      var moved = migrateOldLog_(ss);

      refreshProgress_(ss);

      return json_({

        ok: true,

        migrated: moved,

        message: 'Migrated ' + moved + ' rows from Log into workout tabs.',

      });

    }



    return json_({ ok: false, error: 'Unknown action' });

  } catch (err) {

    return json_({ ok: false, error: String(err) });

  }

}



function ensureSheets_(ss) {

  for (var i = 0; i < WORKOUT_TABS.length; i++) {

    ensureWorkoutSheet_(ss, WORKOUT_TABS[i]);

  }



  var progress = ss.getSheetByName(PROGRESS_SHEET);

  if (!progress) progress = ss.insertSheet(PROGRESS_SHEET);

  progress.getRange(1, 1, 1, PROGRESS_HEADERS.length).setValues([PROGRESS_HEADERS]);

  progress.getRange(1, 1, 1, PROGRESS_HEADERS.length).setFontWeight('bold');

  progress.setFrozenRows(1);

  progress.setColumnWidth(1, 180);

  progress.setColumnWidth(2, 80);



  // Move existing combined Log into Push/Pull/… once

  migrateOldLog_(ss);

}



function ensureWorkoutSheet_(ss, name) {

  var sheet = ss.getSheetByName(name);

  if (!sheet) sheet = ss.insertSheet(name);

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');

  sheet.setFrozenRows(1);

  sheet.setColumnWidths(1, HEADERS.length, 90);

  sheet.setColumnWidth(2, 180); // Exercise

  return sheet;

}



/**

 * Map whatever the app / old Log stored in the Workout column → tab name.

 */

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



function appendRows_(ss, rows) {

  // Group by destination tab

  var byTab = {};

  for (var i = 0; i < rows.length; i++) {

    var r = rows[i];

    var tab = tabForWorkout_(r.workout);

    if (!tab) tab = 'Push'; // fallback — should not happen

    if (!byTab[tab]) byTab[tab] = [];

    byTab[tab].push([

      r.date || '',

      r.exercise || '',

      r.set || '',

      r.goal || r.target || '',

      r.weight === null || r.weight === undefined ? '' : r.weight,

      r.reps === null || r.reps === undefined ? '' : r.reps,

      r.feel || '',

    ]);

  }



  var total = 0;

  var tabs = Object.keys(byTab);

  for (var t = 0; t < tabs.length; t++) {

    var name = tabs[t];

    var sheet = ensureWorkoutSheet_(ss, name);

    var values = byTab[name];

    sheet.getRange(sheet.getLastRow() + 1, 1, values.length, HEADERS.length).setValues(values);

    total += values.length;

  }

  return total;

}



/**

 * One-time: copy rows from "Log" into the right workout tabs, then rename Log.

 * Safe to call repeatedly — if Log is already gone, does nothing.

 *

 * Supports both layouts:

 *   New-ish Log: Date Workout Exercise Set Goal Weight Reps Feel

 *   (Workout in column B)

 */

function migrateOldLog_(ss) {

  var log = ss.getSheetByName(OLD_LOG);

  if (!log) return 0;

  if (log.getLastRow() < 2) {

    // Empty Log — just archive / remove so it does not confuse

    try {

      log.setName(ARCHIVED_LOG);

    } catch (e) {

      /* already exists */

    }

    return 0;

  }



  var data = log.getDataRange().getValues();

  var headers = data[0].map(function (h) {

    return String(h).toLowerCase();

  });



  // Detect column indexes (flexible)

  var colDate = indexOfHeader_(headers, ['date']);

  var colWorkout = indexOfHeader_(headers, ['workout', 'day label', 'day']);

  var colExercise = indexOfHeader_(headers, ['exercise']);

  var colSet = indexOfHeader_(headers, ['set']);

  var colGoal = indexOfHeader_(headers, ['goal', 'target reps', 'target']);

  var colWeight = indexOfHeader_(headers, ['weight', 'weight lb', 'weight lbs']);

  var colReps = indexOfHeader_(headers, ['reps']);

  var colFeel = indexOfHeader_(headers, ['feel']);



  // Fallback to the known simple layout if headers are messy

  if (colDate < 0) colDate = 0;

  if (colWorkout < 0) colWorkout = 1;

  if (colExercise < 0) colExercise = 2;

  if (colSet < 0) colSet = 3;

  if (colGoal < 0) colGoal = 4;

  if (colWeight < 0) colWeight = 5;

  if (colReps < 0) colReps = 6;

  if (colFeel < 0) colFeel = 7;



  var byTab = {};

  var moved = 0;

  for (var i = 1; i < data.length; i++) {

    var row = data[i];

    var workout = row[colWorkout];

    var tab = tabForWorkout_(workout);

    if (!tab) continue;

    if (!byTab[tab]) byTab[tab] = [];

    byTab[tab].push([

      row[colDate] || '',

      row[colExercise] || '',

      row[colSet] || '',

      row[colGoal] || '',

      row[colWeight] === null || row[colWeight] === undefined ? '' : row[colWeight],

      row[colReps] === null || row[colReps] === undefined ? '' : row[colReps],

      row[colFeel] || '',

    ]);

    moved++;

  }



  var tabs = Object.keys(byTab);

  for (var t = 0; t < tabs.length; t++) {

    var name = tabs[t];

    var sheet = ensureWorkoutSheet_(ss, name);

    var values = byTab[name];

    if (values.length) {

      sheet.getRange(sheet.getLastRow() + 1, 1, values.length, HEADERS.length).setValues(values);

    }

  }



  // Keep a backup so nothing is lost

  try {

    var existingArchive = ss.getSheetByName(ARCHIVED_LOG);

    if (existingArchive) {

      ss.deleteSheet(existingArchive);

    }

    log.setName(ARCHIVED_LOG);

  } catch (err) {

    // If rename fails, leave Log as-is; rows already copied

  }



  return moved;

}



function indexOfHeader_(headers, names) {

  for (var i = 0; i < names.length; i++) {

    var idx = headers.indexOf(names[i]);

    if (idx >= 0) return idx;

  }

  return -1;

}



/**

 * Aggregate Progress from all workout tabs.

 * Columns per tab: Date(0) Exercise(1) Set(2) Goal(3) Weight(4) Reps(5) Feel(6)

 */

function refreshProgress_(ss) {

  var progress = ss.getSheetByName(PROGRESS_SHEET);

  var byExercise = {};



  for (var t = 0; t < WORKOUT_TABS.length; t++) {

    var sheet = ss.getSheetByName(WORKOUT_TABS[t]);

    if (!sheet || sheet.getLastRow() < 2) continue;

    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {

      var date = normalizeDate_(data[i][0]);

      var exercise = String(data[i][1] || '');

      var setNum = Number(data[i][2]);

      var weight = data[i][4];

      var reps = data[i][5];

      var workoutName = WORKOUT_TABS[t];



      if (!exercise || weight === '' || weight === null) continue;

      var w = Number(weight);

      if (!isFinite(w)) continue;



      if (!byExercise[exercise]) byExercise[exercise] = { workout: workoutName, days: {} };

      // Prefer most recent workout tab label seen

      byExercise[exercise].workout = workoutName;

      var day = byExercise[exercise].days[date];

      if (!day || setNum >= day.setNum) {

        byExercise[exercise].days[date] = {

          setNum: setNum,

          weight: w,

          reps: reps === '' || reps === null ? '' : Number(reps),

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

    out.push([name, entry.workout, last.weight, last.reps, lastDate, change]);

  }



  progress.clearContents();

  progress.getRange(1, 1, 1, PROGRESS_HEADERS.length).setValues([PROGRESS_HEADERS]);

  progress.getRange(1, 1, 1, PROGRESS_HEADERS.length).setFontWeight('bold');

  progress.setFrozenRows(1);

  if (out.length) {

    progress.getRange(2, 1, out.length, PROGRESS_HEADERS.length).setValues(out);

  }

}



function normalizeDate_(value) {

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {

    var y = value.getFullYear();

    var m = value.getMonth() + 1;

    var d = value.getDate();

    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;

  }

  return String(value || '');

}



function json_(obj) {

  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(

    ContentService.MimeType.JSON

  );

}


