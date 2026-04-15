// ============================================================
// DRIVE SERVICE — gestione file e cartelle su Google Drive
// ============================================================

/**
 * Restituisce (o crea) la cartella radice del progetto.
 * @return {Folder}
 */
function getRootFolder() {
  var folders = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
}

/**
 * Elenca tutti i file nella cartella radice.
 * @return {Array<{id, name, mimeType, url}>}
 */
function listRootFiles() {
  var folder = getRootFolder();
  var files = folder.getFiles();
  var result = [];
  while (files.hasNext()) {
    var f = files.next();
    result.push({
      id:       f.getId(),
      name:     f.getName(),
      mimeType: f.getMimeType(),
      url:      f.getUrl(),
    });
  }
  return result;
}

/**
 * Cerca file su tutto il Drive per nome (ricerca parziale).
 * @param {string} query
 * @return {Array<{id, name, mimeType, url}>}
 */
function searchDriveFiles(query) {
  var files = DriveApp.searchFiles(
    'title contains "' + query.replace(/"/g, '') + '" and trashed = false'
  );
  var result = [];
  var count = 0;
  while (files.hasNext() && count < CONFIG.DRIVE_MAX_RESULTS) {
    var f = files.next();
    result.push({
      id:       f.getId(),
      name:     f.getName(),
      mimeType: f.getMimeType(),
      url:      f.getUrl(),
    });
    count++;
  }
  return result;
}

/**
 * Crea una sottocartella dentro la root folder.
 * @param {string} name
 * @return {Folder}
 */
function createSubFolder(name) {
  var root = getRootFolder();
  var existing = root.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return root.createFolder(name);
}

/**
 * Carica un file di testo nella cartella radice.
 * @param {string} fileName
 * @param {string} content
 * @param {string} mimeType  es. 'text/plain'
 * @return {File}
 */
function uploadTextFile(fileName, content, mimeType) {
  var folder = getRootFolder();
  return folder.createFile(fileName, content, mimeType || MimeType.PLAIN_TEXT);
}

/**
 * Elimina un file per ID (lo sposta nel cestino).
 * @param {string} fileId
 */
function trashFile(fileId) {
  DriveApp.getFileById(fileId).setTrashed(true);
}

/**
 * Condivide un file con un utente specifico.
 * @param {string} fileId
 * @param {string} email
 * @param {string} role  'reader' | 'commenter' | 'writer'
 */
function shareFile(fileId, email, role) {
  var file = DriveApp.getFileById(fileId);
  switch (role) {
    case 'writer':
      file.addEditor(email); break;
    case 'commenter':
      file.addCommenter(email); break;
    default:
      file.addViewer(email);
  }
}
