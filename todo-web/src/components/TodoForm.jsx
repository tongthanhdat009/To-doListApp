import { useState } from "react";

const emptyTodo = { title: "", description: "", priority: "Medium", dueDate: "" };

export function TodoForm({ onAdd, loading }) {
  const [todo, setTodo] = useState(emptyTodo);
  const [error, setError] = useState("");

  function setField(field, value) {
    setTodo((current) => ({ ...current, [field]: value }));
    if (error) setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const title = todo.title.trim();
    if (!title) {
      setError("Title cannot be empty.");
      return;
    }
    setError("");
    try {
      await onAdd({ ...todo, title, description: todo.description.trim(), dueDate: todo.dueDate || null });
      setTodo(emptyTodo);
    } catch {
      // Parent displays API errors; retain input for retry.
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Add a new task" className="todo-form">
      <div className="todo-form__row">
        <label htmlFor="new-todo-title" className="sr-only">New task title</label>
        <input id="new-todo-title" type="text" value={todo.title} onChange={(event) => setField("title", event.target.value)}
          placeholder="What needs to be done?" aria-describedby={error ? "new-todo-error" : undefined}
          aria-invalid={Boolean(error)} disabled={loading} className="todo-form__input" data-testid="new-todo-input"
          autoComplete="off" maxLength={200} />
        <button type="submit" disabled={loading} className="btn btn--primary" data-testid="add-todo-btn">
          {loading ? "Adding…" : "Add task"}
        </button>
      </div>
      <div className="todo-form__details">
        <label>Description<textarea value={todo.description} onChange={(event) => setField("description", event.target.value)} disabled={loading} maxLength={2000} rows={3} /></label>
        <label>Priority<select value={todo.priority} onChange={(event) => setField("priority", event.target.value)} disabled={loading}>
          <option>Low</option><option>Medium</option><option>High</option>
        </select></label>
        <label>Due date<input type="date" value={todo.dueDate} onChange={(event) => setField("dueDate", event.target.value)} disabled={loading} /></label>
      </div>
      {error && <p id="new-todo-error" role="alert" className="field-error">{error}</p>}
    </form>
  );
}
