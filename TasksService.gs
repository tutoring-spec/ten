// ============================================================
// TASKS SERVICE — gestione Google Tasks
// ============================================================

/**
 * Restituisce la prima lista di attività dell'utente.
 * @return {TaskList}
 */
function getDefaultTaskList() {
  return Tasks.Tasklists.list({ maxResults: 1 }).items[0];
}

/**
 * Elenca tutti i task di una lista.
 * @param {string} taskListId
 * @return {Array<{id, title, status, due, notes}>}
 */
function listTasks(taskListId) {
  var items = Tasks.Tasks.list(taskListId).items || [];
  return items.map(function(t) {
    return {
      id:     t.id,
      title:  t.title,
      status: t.status,
      due:    t.due,
      notes:  t.notes,
    };
  });
}

/**
 * Crea un nuovo task.
 * @param {string} taskListId
 * @param {string} title
 * @param {string} [notes]
 * @param {Date}   [due]
 * @return {Task}
 */
function createTask(taskListId, title, notes, due) {
  var task = { title: title };
  if (notes) task.notes = notes;
  if (due)   task.due = due.toISOString();
  return Tasks.Tasks.insert(task, taskListId);
}

/**
 * Segna un task come completato.
 * @param {string} taskListId
 * @param {string} taskId
 */
function completeTask(taskListId, taskId) {
  var task = Tasks.Tasks.get(taskListId, taskId);
  task.status = 'completed';
  Tasks.Tasks.update(task, taskListId, taskId);
}

/**
 * Elimina un task.
 * @param {string} taskListId
 * @param {string} taskId
 */
function deleteTask(taskListId, taskId) {
  Tasks.Tasks.remove(taskListId, taskId);
}
