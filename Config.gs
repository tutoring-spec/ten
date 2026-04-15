// ============================================================
// CONFIG — costanti globali del progetto
// ============================================================

var CONFIG = {
  // Cartella radice su Drive dove vengono salvati i file generati
  ROOT_FOLDER_NAME: 'GoogleIntegration',

  // Foglio di log per tutte le operazioni
  LOG_SHEET_NAME: 'Log',

  // Numero massimo di risultati nelle ricerche Drive
  DRIVE_MAX_RESULTS: 50,

  // Destinatario di default per le email di riepilogo
  REPORT_EMAIL: Session.getEffectiveUser().getEmail(),
};
