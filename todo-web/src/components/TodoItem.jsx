import { useEffect, useState } from "react";

const today = () => {
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${date.getFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};
const formatDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`)) : "No due date";
const formatDateTime = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Unknown";

export function TodoItem({ todo, onComplete, onUpdate, onDelete, forceEditing = false, onStartEdit }) {
  const [editing, setEditing] = useState(forceEditing);
  const [draft, setDraft] = useState(todo);
  const [editError, setEditError] = useState("");
  const [pending, setPending] = useState(false);
  const overdue = Boolean(todo.dueDate && todo.dueDate < today() && !todo.isCompleted);

  useEffect(() => { if (forceEditing) setEditing(true); }, [forceEditing]);

  function startEdit() {
    setDraft({ ...todo, description: todo.description ?? "", dueDate: todo.dueDate ?? "", priority: todo.priority ?? "Medium" });
    setEditError("");
    setEditing(true);
    onStartEdit?.(todo.id);
  }

  async function handleComplete() {
    setPending(true);
    try { await onComplete(todo.id, !todo.isCompleted); } finally { setPending(false); }
  }

  async function save(event) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) { setEditError("Title cannot be empty."); return; }
    setPending(true);
    setEditError("");
    try {
      await onUpdate(todo.id, { ...draft, title, description: draft.description.trim(), dueDate: draft.dueDate || null, isCompleted: todo.isCompleted });
      setEditing(false);
    } catch { /* Parent displays API errors. */ } finally { setPending(false); }
  }

  async function remove() {
    if (!window.confirm(`Move "${todo.title}" to trash? You can restore it later.`)) return;
    setPending(true);
    try { await onDelete(todo.id); } finally { setPending(false); }
  }

  return (
    <li className={`todo-item${todo.isCompleted ? " todo-item--done" : ""}${overdue ? " todo-item--overdue" : ""}`} data-testid="todo-item">
      <label className="todo-item__check-wrap" aria-label={todo.isCompleted ? "Mark incomplete" : "Mark complete"}>
        <input type="checkbox" checked={todo.isCompleted} onChange={handleComplete} disabled={pending}
          aria-label={todo.isCompleted ? "Mark as incomplete" : "Mark as complete"} data-testid="todo-complete-checkbox" />
      </label>
      {editing ? (
        <form onSubmit={save} className="todo-item__edit-form" aria-label={`Edit task: ${todo.title}`}>
          <label htmlFor={`edit-${todo.id}`}>Title<input id={`edit-${todo.id}`} type="text" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            aria-describedby={editError ? `edit-err-${todo.id}` : undefined} aria-invalid={Boolean(editError)} disabled={pending} autoFocus
            className="todo-item__edit-input" data-testid="edit-todo-input" maxLength={200} /></label>
          <label>Description<textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} disabled={pending} maxLength={2000} rows={4} /></label>
          <div className="field-row"><label>Priority<select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))} disabled={pending}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label>Due date<input type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} disabled={pending} /></label></div>
          {editError && <p id={`edit-err-${todo.id}`} role="alert" className="field-error">{editError}</p>}
          <div className="todo-item__edit-actions">
            <button type="submit" disabled={pending} className="btn btn--primary btn--sm" data-testid="save-todo-btn">{pending ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setEditing(false)} disabled={pending} className="btn btn--ghost btn--sm" data-testid="cancel-edit-btn">Cancel</button>
          </div>
        </form>
      ) : <>
        <div className="todo-item__content">
          <span className="todo-item__title" data-testid="todo-title">{todo.title}</span>
          <div className="todo-item__meta"><span>Priority: {todo.priority ?? "Medium"}</span><span>Due: {formatDate(todo.dueDate)}</span>{overdue && <strong>Overdue</strong>}</div>
          {todo.description && <details className="todo-item__description"><summary>{todo.description.length > 120 ? `${todo.description.slice(0, 120)}…` : todo.description}</summary><p>{todo.description}</p></details>}
        </div>
        <div className="todo-item__actions">
          <button type="button" onClick={startEdit} disabled={pending} className="btn btn--ghost btn--sm" aria-label={`Edit task: ${todo.title}`} data-testid="edit-todo-btn">Edit</button>
          <button type="button" onClick={remove} disabled={pending} className="btn btn--danger btn--sm" aria-label={`Move task to trash: ${todo.title}`} data-testid="delete-todo-btn">{pending ? "Moving…" : "Move to trash"}</button>
        </div>
      </>}
    </li>
  );
}

export function TrashItem({ todo, onRestore, onPermanentDelete }) {
  const [pending, setPending] = useState(false);
  async function restore() { setPending(true); try { await onRestore(todo.id); } finally { setPending(false); } }
  async function removeForever() {
    if (!window.confirm(`Permanently delete "${todo.title}"? This cannot be undone.`)) return;
    setPending(true); try { await onPermanentDelete(todo.id); } finally { setPending(false); }
  }
  return <li className="todo-item todo-item--trash" data-testid="trash-item"><div className="todo-item__content"><span className="todo-item__title">{todo.title}</span>
    <div className="todo-item__meta"><span>Priority: {todo.priority ?? "Medium"}</span><span>Due: {formatDate(todo.dueDate)}</span><span>{todo.isCompleted ? "Completed" : "Incomplete"}</span><span>Deleted: {formatDateTime(todo.deletedAt)}</span></div>
    {todo.description && <details className="todo-item__description"><summary>{todo.description.length > 120 ? `${todo.description.slice(0, 120)}…` : todo.description}</summary><p>{todo.description}</p></details>}</div>
    <div className="todo-item__actions"><button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={restore}>Restore</button><button type="button" className="btn btn--danger btn--sm" disabled={pending} onClick={removeForever}>Delete permanently</button></div></li>;
}
