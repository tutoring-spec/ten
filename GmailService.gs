// ============================================================
// GMAIL SERVICE — lettura e invio email
// ============================================================

/**
 * Cerca email nella casella in base a una query Gmail.
 * @param {string} query  es. 'from:tizio@gmail.com is:unread'
 * @param {number} maxResults
 * @return {Array<{id, subject, from, date, snippet}>}
 */
function searchEmails(query, maxResults) {
  var threads = GmailApp.search(query, 0, maxResults || 20);
  var result = [];
  threads.forEach(function(thread) {
    var msg = thread.getMessages()[0];
    result.push({
      id:      msg.getId(),
      subject: msg.getSubject(),
      from:    msg.getFrom(),
      date:    msg.getDate(),
      snippet: thread.getFirstMessageSubject(),
    });
  });
  return result;
}

/**
 * Invia un'email.
 * @param {string} to
 * @param {string} subject
 * @param {string} body       corpo in testo semplice
 * @param {string} [htmlBody] corpo HTML opzionale
 */
function sendEmail(to, subject, body, htmlBody) {
  var options = {};
  if (htmlBody) options.htmlBody = htmlBody;
  GmailApp.sendEmail(to, subject, body, options);
}

/**
 * Invia un'email con un allegato preso da Drive.
 * @param {string} to
 * @param {string} subject
 * @param {string} body
 * @param {string} fileId  ID del file su Drive
 */
function sendEmailWithAttachment(to, subject, body, fileId) {
  var file = DriveApp.getFileById(fileId);
  GmailApp.sendEmail(to, subject, body, { attachments: [file.getBlob()] });
}

/**
 * Segna come letti tutti i messaggi nei thread trovati dalla query.
 * @param {string} query
 */
function markAsRead(query) {
  GmailApp.search(query).forEach(function(thread) {
    thread.markRead();
  });
}

/**
 * Recupera i messaggi non letti dalla posta in arrivo.
 * @param {number} maxResults
 * @return {Array}
 */
function getUnreadEmails(maxResults) {
  return searchEmails('in:inbox is:unread', maxResults || 10);
}
