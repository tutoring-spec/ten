// ============================================================
// CALENDAR SERVICE — gestione eventi Google Calendar
// ============================================================

/**
 * Restituisce il calendario primario dell'utente.
 * @return {Calendar}
 */
function getPrimaryCalendar() {
  return CalendarApp.getDefaultCalendar();
}

/**
 * Lista gli eventi del calendario primario in un intervallo di date.
 * @param {Date} startDate
 * @param {Date} endDate
 * @return {Array<{id, title, start, end, location, description}>}
 */
function listEvents(startDate, endDate) {
  var events = getPrimaryCalendar().getEvents(startDate, endDate);
  return events.map(function(e) {
    return {
      id:          e.getId(),
      title:       e.getTitle(),
      start:       e.getStartTime(),
      end:         e.getEndTime(),
      location:    e.getLocation(),
      description: e.getDescription(),
    };
  });
}

/**
 * Crea un nuovo evento nel calendario primario.
 * @param {string} title
 * @param {Date}   startTime
 * @param {Date}   endTime
 * @param {Object} [options]  {location, description, guests: [email,...]}
 * @return {CalendarEvent}
 */
function createEvent(title, startTime, endTime, options) {
  options = options || {};
  var event = getPrimaryCalendar().createEvent(title, startTime, endTime, {
    location:    options.location    || '',
    description: options.description || '',
    guests:      (options.guests || []).join(','),
  });
  return event;
}

/**
 * Elimina un evento per ID.
 * @param {string} eventId
 */
function deleteEvent(eventId) {
  getPrimaryCalendar().getEventById(eventId).deleteEvent();
}

/**
 * Aggiorna titolo e descrizione di un evento esistente.
 * @param {string} eventId
 * @param {string} newTitle
 * @param {string} newDescription
 */
function updateEvent(eventId, newTitle, newDescription) {
  var event = getPrimaryCalendar().getEventById(eventId);
  if (newTitle)       event.setTitle(newTitle);
  if (newDescription) event.setDescription(newDescription);
}

/**
 * Lista gli eventi di oggi.
 * @return {Array}
 */
function getTodayEvents() {
  var today = new Date();
  var tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return listEvents(today, tomorrow);
}
