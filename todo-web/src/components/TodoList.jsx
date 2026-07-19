import { TodoItem } from "./TodoItem";

export function TodoList({ todos, loading, onComplete, onUpdate, onDelete }) {
  if (loading) {
    return <div className="state-box" role="status" aria-live="polite" data-testid="loading-state"><span className="spinner spinner--lg" aria-hidden="true" /><p>Loading tasks…</p></div>;
  }
  if (todos.length === 0) {
    return <div className="state-box" data-testid="empty-state"><p className="state-box__title">No tasks yet</p><p className="state-box__sub">Add a task above to get started.</p></div>;
  }
  return <ul className="todo-list" aria-label="Task list" data-testid="todo-list">
    {todos.map((todo) => <TodoItem key={todo.id} todo={todo} onComplete={onComplete} onUpdate={onUpdate} onDelete={onDelete} />)}
  </ul>;
}
