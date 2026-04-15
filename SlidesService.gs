// ============================================================
// SLIDES SERVICE — creazione e modifica di Presentazioni Google
// ============================================================

/**
 * Crea una nuova presentazione nella root folder.
 * @param {string} title
 * @return {Presentation}
 */
function createPresentation(title) {
  var pres = SlidesApp.create(title);
  var file = DriveApp.getFileById(pres.getId());
  getRootFolder().addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  return pres;
}

/**
 * Aggiunge una slide con titolo e corpo di testo.
 * @param {string} presId
 * @param {string} slideTitle
 * @param {string} slideBody
 */
function addSlide(presId, slideTitle, slideBody) {
  var pres = SlidesApp.openById(presId);
  var slide = pres.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  slide.getPlaceholder(SlidesApp.PlaceholderType.TITLE)
       .asShape().getText().setText(slideTitle);
  slide.getPlaceholder(SlidesApp.PlaceholderType.BODY)
       .asShape().getText().setText(slideBody);
}

/**
 * Esporta la presentazione come PDF nella root folder.
 * @param {string} presId
 * @return {File}
 */
function exportPresentationAsPdf(presId) {
  var file = DriveApp.getFileById(presId);
  var pdfBlob = file.getAs(MimeType.PDF);
  pdfBlob.setName(file.getName() + '.pdf');
  return getRootFolder().createFile(pdfBlob);
}
