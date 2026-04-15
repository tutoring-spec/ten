// ============================================================
// CODE.GS — entry point, menu personalizzato e demo completa
// ============================================================

/**
 * Aggiunge un menu "Google Integration" nell'interfaccia Apps Script
 * quando il progetto è associato a uno Spreadsheet o a un sito.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Google Integration')
    .addItem('Mostra info account', 'showAccountInfo')
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('Drive')
        .addItem('Elenca file root', 'demoListFiles')
        .addItem('Crea cartella di test', 'demoCreateFolder')
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('Gmail')
        .addItem('Mostra non letti', 'demoUnreadEmails')
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu('Calendar')
        .addItem("Eventi di oggi", 'demoTodayEvents')
    )
    .addSeparator()
    .addItem('Esegui demo completa', 'runFullDemo')
    .addToUi();
}

// ─── Info account ──────────────────────────────────────────

function showAccountInfo() {
  var user = Session.getEffectiveUser().getEmail();
  SpreadsheetApp.getUi().alert('Utente connesso: ' + user);
}

// ─── Demo Drive ────────────────────────────────────────────

function demoListFiles() {
  var files = listRootFiles();
  var msg = files.length === 0
    ? 'Nessun file nella cartella radice.'
    : files.map(function(f) { return '• ' + f.name; }).join('\n');
  SpreadsheetApp.getUi().alert('File in ' + CONFIG.ROOT_FOLDER_NAME + ':\n\n' + msg);
  log('Drive', 'listRootFiles', files.length + ' file trovati');
}

function demoCreateFolder() {
  var folder = createSubFolder('Demo_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd'));
  SpreadsheetApp.getUi().alert('Cartella creata: ' + folder.getName());
  log('Drive', 'createSubFolder', folder.getName());
}

// ─── Demo Gmail ────────────────────────────────────────────

function demoUnreadEmails() {
  var emails = getUnreadEmails(5);
  var msg = emails.length === 0
    ? 'Nessuna email non letta.'
    : emails.map(function(e) { return '• ' + e.subject + ' (' + e.from + ')'; }).join('\n');
  SpreadsheetApp.getUi().alert('Ultime email non lette:\n\n' + msg);
  log('Gmail', 'getUnreadEmails', emails.length + ' email');
}

// ─── Demo Calendar ─────────────────────────────────────────

function demoTodayEvents() {
  var events = getTodayEvents();
  var msg = events.length === 0
    ? 'Nessun evento oggi.'
    : events.map(function(e) {
        return '• ' + e.title + ' (' +
          Utilities.formatDate(e.start, Session.getScriptTimeZone(), 'HH:mm') + ')';
      }).join('\n');
  SpreadsheetApp.getUi().alert("Evento di oggi:\n\n" + msg);
  log('Calendar', 'getTodayEvents', events.length + ' eventi');
}

// ─── Demo completa ─────────────────────────────────────────

/**
 * Dimostra l'integrazione di tutti i servizi in sequenza.
 * Eseguila manualmente da Apps Script Editor oppure dal menu.
 */
function runFullDemo() {
  Logger.log('=== AVVIO DEMO COMPLETA ===');

  // 1. Drive — crea un file di testo
  var textFile = uploadTextFile(
    'demo_' + Date.now() + '.txt',
    'File creato dalla demo di Google Integration.\nData: ' + new Date(),
    MimeType.PLAIN_TEXT
  );
  Logger.log('[Drive] File creato: ' + textFile.getName() + ' — ' + textFile.getUrl());
  log('Drive', 'uploadTextFile', textFile.getName());

  // 2. Sheets — crea uno spreadsheet e scrive dati
  var ss = createSpreadsheet('Demo Spreadsheet ' + Date.now());
  writeData(ss.getId(), 'Sheet1', [
    ['Nome', 'Cognome', 'Email'],
    ['Mario', 'Rossi', 'mario.rossi@example.com'],
    ['Giulia', 'Bianchi', 'giulia.bianchi@example.com'],
  ]);
  Logger.log('[Sheets] Spreadsheet creato: ' + ss.getUrl());
  log('Sheets', 'createSpreadsheet', ss.getName());

  // 3. Docs — crea un documento
  var doc = createDocument('Demo Document ' + Date.now());
  appendParagraph(doc.getId(), 'Questo documento è stato creato automaticamente da Google Apps Script.');
  Logger.log('[Docs] Documento creato: ' + doc.getUrl());
  log('Docs', 'createDocument', doc.getName());

  // 4. Slides — crea una presentazione
  var pres = createPresentation('Demo Presentation ' + Date.now());
  addSlide(pres.getId(), 'Slide 1', 'Contenuto generato da Apps Script');
  Logger.log('[Slides] Presentazione creata: ' + pres.getUrl());
  log('Slides', 'createPresentation', pres.getName());

  // 5. Calendar — evento demo domani
  var start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  var end = new Date(start);
  end.setHours(11, 0, 0, 0);
  var event = createEvent('Demo Event Apps Script', start, end, {
    description: 'Evento creato dalla demo di Google Integration',
  });
  Logger.log('[Calendar] Evento creato: ' + event.getTitle());
  log('Calendar', 'createEvent', event.getTitle());

  // 6. Gmail — email di riepilogo a se stessi
  var body = [
    'Demo completata con successo!',
    '',
    'File Drive:        ' + textFile.getUrl(),
    'Spreadsheet:       ' + ss.getUrl(),
    'Documento:         ' + doc.getUrl(),
    'Presentazione:     ' + pres.getUrl(),
    'Evento Calendar:   ' + event.getTitle() + ' — ' + start,
  ].join('\n');
  sendEmail(CONFIG.REPORT_EMAIL, '[GoogleIntegration] Demo completata', body);
  log('Gmail', 'sendEmail', 'Riepilogo inviato a ' + CONFIG.REPORT_EMAIL);

  Logger.log('=== DEMO COMPLETATA ===');

  try {
    SpreadsheetApp.getUi().alert('Demo completata! Controlla i log e la tua email.');
  } catch (e) {
    // Eseguito senza UI (trigger)
  }
}

// ─── Trigger suggeriti ─────────────────────────────────────

/**
 * Installa un trigger giornaliero che esegue getTodayEvents ogni mattina.
 * Esegui questa funzione UNA SOLA VOLTA dall'editor.
 */
function installDailyTrigger() {
  // Rimuove eventuali trigger duplicati
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'dailyMorningReport') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('dailyMorningReport')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
  Logger.log('Trigger giornaliero installato.');
}

/**
 * Report mattutino automatico: invia gli eventi del giorno via email.
 */
function dailyMorningReport() {
  var events = getTodayEvents();
  var lines = events.length === 0
    ? ['Nessun evento in programma oggi.']
    : events.map(function(e) {
        return '• ' + e.title + ' — ' +
          Utilities.formatDate(e.start, Session.getScriptTimeZone(), 'HH:mm');
      });
  sendEmail(
    CONFIG.REPORT_EMAIL,
    '[GoogleIntegration] Agenda di oggi — ' +
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy'),
    'Buongiorno!\n\nEcco i tuoi eventi di oggi:\n\n' + lines.join('\n')
  );
  log('Gmail', 'dailyMorningReport', events.length + ' eventi inviati');
}
