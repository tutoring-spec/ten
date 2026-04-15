// ============================================================
// DOCS SERVICE — creazione e modifica di Google Documenti
// ============================================================

/**
 * Crea un nuovo Google Doc nella root folder.
 * @param {string} title
 * @return {Document}
 */
function createDocument(title) {
  var doc = DocumentApp.create(title);
  var file = DriveApp.getFileById(doc.getId());
  getRootFolder().addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  return doc;
}

/**
 * Apre un documento per ID.
 * @param {string} docId
 * @return {Document}
 */
function openDocument(docId) {
  return DocumentApp.openById(docId);
}

/**
 * Aggiunge un paragrafo di testo alla fine del documento.
 * @param {string} docId
 * @param {string} text
 */
function appendParagraph(docId, text) {
  var body = DocumentApp.openById(docId).getBody();
  body.appendParagraph(text);
}

/**
 * Sostituisce tutte le occorrenze di un testo segnaposto nel documento.
 * @param {string} docId
 * @param {string} placeholder  es. '{{NOME}}'
 * @param {string} value
 */
function replaceText(docId, placeholder, value) {
  DocumentApp.openById(docId).getBody().replaceText(placeholder, value);
}

/**
 * Esporta il documento come PDF e lo salva nella root folder.
 * @param {string} docId
 * @return {File}  il PDF salvato su Drive
 */
function exportDocAsPdf(docId) {
  var doc = DriveApp.getFileById(docId);
  var pdfBlob = doc.getAs(MimeType.PDF);
  pdfBlob.setName(doc.getName() + '.pdf');
  return getRootFolder().createFile(pdfBlob);
}
