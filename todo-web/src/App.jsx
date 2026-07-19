import { useCallback, useEffect, useState } from "react";
import { TodoForm } from "./components/TodoForm";
import { TodoList } from "./components/TodoList";
import {
  fetchTodos,
  createTodo,
  updateTodo,
  setTodoCompletion,
  deleteTodo,
} from "./api/todosApi";

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const loadTodos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTodos();
      setTodos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message ?? "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  async function handleAdd(title) {
    setAdding(true);
    setError("");
    try {
      const created = await createTodo(title);
      if (created && typeof created === "object") {
        setTodos((prev) => [...prev, created]);
      } else {
        await loadTodos();
      }
    } catch (err) {
      setError(err?.message ?? "Failed to add task.");
      throw err;
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdate(id, title) {
    setError("");
    try {
      const updated = await updateTodo(id, title);
      if (updated && typeof updated === "object") {
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      } else {
        await loadTodos();
      }
    } catch (err) {
      setError(err?.message ?? "Failed to update task.");
      throw err;
    }
  }

  async function handleComplete(id, isCompleted) {
    setError("");
    try {
      const updated = await setTodoCompletion(id, isCompleted);
      if (updated && typeof updated === "object") {
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      } else {
        await loadTodos();
      }
    } catch (err) {
      setError(err?.message ?? "Failed to update task status.");
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err?.message ?? "Failed to delete task.");
    }
  }

  return (
    <div className="page">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="app-header">
        <div className="app-header__inner">
          <h1>My Tasks</h1>
        </div>
      </header>

      <main className="app-main" id="main-content">
        <TodoForm onAdd={handleAdd} loading={adding} />

        {error && (
          <div
            className="app-error"
            role="alert"
            aria-live="assertive"
            data-testid="app-error"
          >
            <span aria-hidden="true">!</span>
            <span>{error}</span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setError("")}
              aria-label="Dismiss error message"
            >
              Dismiss
            </button>
          </div>
        )}

        <TodoList
          todos={todos}
          loading={loading}
          onComplete={handleComplete}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </main>

      <footer className="app-footer">
        <p>To-Do List App</p>
      </footer>
    </div>
  );
}

export default App;
