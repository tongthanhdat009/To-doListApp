import { useState } from "react";

export function TodoForm({ onAdd, loading }) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title cannot be empty.");
      return;
    }
    setError("");
    try {
      await onAdd(trimmed);
      setTitle("");
    } catch {
      // Parent displays the API error; retain title for retry.
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Add a new task" className="todo-form">
      <div className="todo-form__row">
        <label htmlFor="new-todo-title" className="sr-only">New task title</label>
        <input
          id="new-todo-title"
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (error) setError("");
          }}
          placeholder="What needs to be done?"
          aria-describedby={error ? "new-todo-error" : undefined}
          aria-invalid={Boolean(error)}
          disabled={loading}
          className="todo-form__input"
          data-testid="new-todo-input"
          autoComplete="off"
          maxLength={200}
        />
        <button type="submit" disabled={loading} className="btn btn--primary" data-testid="add-todo-btn">
          {loading ? "Adding…" : "Add task"}
        </button>
      </div>
      {error && <p id="new-todo-error" role="alert" className="field-error">{error}</p>}
    </form>
  );
}
