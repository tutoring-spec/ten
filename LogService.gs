// ============================================================
// LOG SERVICE — log persistente su Spreadsheet
// ============================================================

var LOG_SS_KEY = 'LOG_SPREADSHEET_ID';

/**
 * Restituisce (o crea) lo spreadsheet di log.
 * @return {Spreadsheet}
 */
function getLogSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty(LOG_SS_KEY);
  if (ssId) {
    try { return SpreadsheetApp.openById(ssId); } catch (e) { /* ricrea */ }
  }
  var ss = createSpreadsheet('GoogleIntegration — Log');
  var sheet = ss.getActiveSheet();
  sheet.setName(CONFIG.LOG_SHEET_NAME);
  sheet.appendRow(['Timestamp', 'Servizio', 'Azione', 'Dettaglio', 'Stato']);
  props.setProperty(LOG_SS_KEY, ss.getId());
  return ss;
}

/**
 * Aggiunge una riga al log.
 * @param {string} service   es. 'Drive', 'Gmail'
 * @param {string} action    es. 'createFile'
 * @param {string} detail    descrizione
 * @param {string} [status]  'OK' | 'ERROR'
 */
function log(service, action, detail, status) {
  try {
    var ss = getLogSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
    sheet.appendRow([
      new Date(),
      service,
      action,
      detail,
      status || 'OK',
    ]);
  } catch (e) {
    Logger.log('LogService error: ' + e.message);
  }
}
