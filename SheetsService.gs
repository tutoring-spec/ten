// ============================================================
// SHEETS SERVICE — creazione e manipolazione di Fogli Google
// ============================================================

/**
 * Crea un nuovo Google Sheet nella root folder.
 * @param {string} name
 * @return {Spreadsheet}
 */
function createSpreadsheet(name) {
  var ss = SpreadsheetApp.create(name);
  var file = DriveApp.getFileById(ss.getId());
  getRootFolder().addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  return ss;
}

/**
 * Apre uno spreadsheet per ID.
 * @param {string} ssId
 * @return {Spreadsheet}
 */
function openSpreadsheet(ssId) {
  return SpreadsheetApp.openById(ssId);
}

/**
 * Scrive dati (array 2D) in un foglio a partire dalla cella A1.
 * @param {string} ssId
 * @param {string} sheetName
 * @param {Array<Array>} data
 */
function writeData(ssId, sheetName, data) {
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  sheet.clearContents();
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}

/**
 * Legge tutti i dati da un foglio come array 2D.
 * @param {string} ssId
 * @param {string} sheetName
 * @return {Array<Array>}
 */
function readData(ssId, sheetName) {
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  return sheet.getDataRange().getValues();
}

/**
 * Aggiunge una riga in fondo al foglio.
 * @param {string} ssId
 * @param {string} sheetName
 * @param {Array} row
 */
function appendRow(ssId, sheetName, row) {
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  sheet.appendRow(row);
}
