import { TodoItem, TrashItem } from "./TodoItem";

export function TodoList({ todos, loading, onComplete, onUpdate, onDelete, editingId, onSelectTask }) {
  if (loading) return <div className="state-box" role="status" aria-live="polite" data-testid="loading-state"><span className="spinner spinner--lg" aria-hidden="true" /><p>Loading tasks…</p></div>;
  if (!todos.length) return <div className="state-box" data-testid="empty-state"><p className="state-box__title">No tasks yet</p><p className="state-box__sub">Add a task above to get started.</p></div>;
  return <ul className="todo-list" aria-label="Task list" data-testid="todo-list">{todos.map((todo) => <TodoItem key={todo.id} todo={todo} onComplete={onComplete} onUpdate={onUpdate} onDelete={onDelete} forceEditing={editingId === todo.id} onStartEdit={onSelectTask} />)}</ul>;
}

export function TrashList({ todos, loading, onRestore, onPermanentDelete }) {
  if (loading) return <div className="state-box" role="status" aria-live="polite"><span className="spinner spinner--lg" aria-hidden="true" /><p>Loading trash…</p></div>;
  if (!todos.length) return <div className="state-box" data-testid="trash-empty-state"><p className="state-box__title">Trash is empty</p><p className="state-box__sub">Tasks moved to trash appear here.</p></div>;
  return <ul className="todo-list" aria-label="Trash list">{todos.map((todo) => <TrashItem key={todo.id} todo={todo} onRestore={onRestore} onPermanentDelete={onPermanentDelete} />)}</ul>;
}
