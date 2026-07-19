import { useState } from "react";

export function TodoItem({ todo, onComplete, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editError, setEditError] = useState("");
  const [pendingComplete, setPendingComplete] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  async function handleComplete() {
    setPendingComplete(true);
    try { await onComplete(todo.id, !todo.isCompleted); } finally { setPendingComplete(false); }
  }

  function handleEditStart() {
    setEditTitle(todo.title);
    setEditError("");
    setEditing(true);
  }

  async function handleEditSave(event) {
    event.preventDefault();
    const trimmed = editTitle.trim();
    if (!trimmed) { setEditError("Title cannot be empty."); return; }
    if (trimmed === todo.title) { setEditing(false); return; }
    setEditError("");
    setPendingSave(true);
    try { await onUpdate(todo.id, trimmed); setEditing(false); } catch { /* parent message; retain editor */ } finally { setPendingSave(false); }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${todo.title}"? This cannot be undone.`)) return;
    setPendingDelete(true);
    try { await onDelete(todo.id); } finally { setPendingDelete(false); }
  }

  const isBusy = pendingComplete || pendingDelete || pendingSave;
  return (
    <li className={`todo-item${todo.isCompleted ? " todo-item--done" : ""}`} data-testid="todo-item">
      <label className="todo-item__check-wrap" aria-label={todo.isCompleted ? "Mark incomplete" : "Mark complete"}>
        <input type="checkbox" checked={todo.isCompleted} onChange={handleComplete} disabled={isBusy}
          aria-label={todo.isCompleted ? "Mark as incomplete" : "Mark as complete"} data-testid="todo-complete-checkbox" />
        {pendingComplete && <span className="spinner" aria-hidden="true" />}
      </label>
      {editing ? (
        <form onSubmit={handleEditSave} className="todo-item__edit-form" aria-label={`Edit task: ${todo.title}`}>
          <label htmlFor={`edit-${todo.id}`} className="sr-only">Edit task title</label>
          <input id={`edit-${todo.id}`} type="text" value={editTitle} onChange={(event) => { setEditTitle(event.target.value); if (editError) setEditError(""); }}
            aria-describedby={editError ? `edit-err-${todo.id}` : undefined} aria-invalid={Boolean(editError)} disabled={pendingSave} autoFocus
            className="todo-item__edit-input" data-testid="edit-todo-input" maxLength={200} />
          {editError && <p id={`edit-err-${todo.id}`} role="alert" className="field-error">{editError}</p>}
          <div className="todo-item__edit-actions">
            <button type="submit" disabled={pendingSave} className="btn btn--primary btn--sm" data-testid="save-todo-btn">{pendingSave ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setEditing(false)} disabled={pendingSave} className="btn btn--ghost btn--sm" data-testid="cancel-edit-btn">Cancel</button>
          </div>
        </form>
      ) : <span className="todo-item__title" data-testid="todo-title">{todo.title}</span>}
      {!editing && <div className="todo-item__actions">
        <button type="button" onClick={handleEditStart} disabled={isBusy} className="btn btn--ghost btn--sm" aria-label={`Edit task: ${todo.title}`} data-testid="edit-todo-btn">Edit</button>
        <button type="button" onClick={handleDelete} disabled={isBusy} className="btn btn--danger btn--sm" aria-label={`Delete task: ${todo.title}`} data-testid="delete-todo-btn">{pendingDelete ? "Deleting…" : "Delete"}</button>
      </div>}
    </li>
  );
}
