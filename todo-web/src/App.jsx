import { useCallback, useEffect, useRef, useState } from "react";
import { TodoForm } from "./components/TodoForm";
import { TodoList, TrashList } from "./components/TodoList";
import { Calendar } from "./components/Calendar";
import {
  fetchTodos,
  fetchTrash,
  createTodo,
  updateTodo,
  setTodoCompletion,
  deleteTodo,
  restoreTodo,
  permanentlyDeleteTodo,
} from "./api/todosApi";

const PAGE_SIZE = 10;
const pad = (n) => String(n).padStart(2, "0");
const firstOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "incomplete", label: "Incomplete first" },
  { value: "completed", label: "Completed first" },
];

function itemsOf(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}
function metaOf(data) {
  return Array.isArray(data) ? null : data ?? null;
}

function App() {
  const [view, setView] = useState("tasks");
  const [error, setError] = useState("");

  // --- Tasks (active) ---
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState(null);
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [tasksRefresh, setTasksRefresh] = useState(0);

  // --- Trash ---
  const [trash, setTrash] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashPage, setTrashPage] = useState(1);
  const [trashMeta, setTrashMeta] = useState(null);

  // --- Calendar ---
  const [calMonth, setCalMonth] = useState(firstOfMonth(new Date()));
  const [calTasks, setCalTasks] = useState([]);
  const [calLoading, setCalLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calEditingId, setCalEditingId] = useState(null);
  const tasksRequest = useRef(0);
  const calendarRequest = useRef(0);

  // Debounce search (~300ms) + reset to first page on change.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => setPage(1), [debouncedSearch]);

  const loadTasks = useCallback(async () => {
    const request = (tasksRequest.current += 1);
    setTasksLoading(true);
    setError("");
    try {
      const data = await fetchTodos({
        page,
        pageSize: PAGE_SIZE,
        status,
        sort,
        search: debouncedSearch || undefined,
      });
      if (request !== tasksRequest.current) return;
      setTasks(itemsOf(data));
      setPageMeta(metaOf(data));
    } catch (err) {
      if (request !== tasksRequest.current) return;
      setError(err?.message ?? "Failed to load tasks.");
    } finally {
      if (request === tasksRequest.current) setTasksLoading(false);
    }
  }, [page, status, sort, debouncedSearch]);

  useEffect(() => {
    if (view === "tasks") loadTasks();
  }, [tasksRefresh, loadTasks, view]);

  const loadTrash = useCallback(async () => {
    setTrashLoading(true);
    setError("");
    try {
      const data = await fetchTrash({ page: trashPage, pageSize: PAGE_SIZE });
      setTrash(itemsOf(data));
      setTrashMeta(metaOf(data));
    } catch (err) {
      setError(err?.message ?? "Failed to load trash.");
    } finally {
      setTrashLoading(false);
    }
  }, [trashPage]);

  useEffect(() => {
    if (view === "trash") loadTrash();
  }, [loadTrash, view]);

  const loadCalendar = useCallback(async () => {
    const request = (calendarRequest.current += 1);
    setCalLoading(true);
    setError("");
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const from = `${year}-${pad(month + 1)}-01`;
    const to = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`;
    try {
      const all = [];
      let currentPage = 1;
      let hasNextPage = true;
      while (hasNextPage) {
        const data = await fetchTodos({
          dueDateFrom: from,
          dueDateTo: to,
          status: "all",
          sort: "oldest",
          page: currentPage,
          pageSize: 100,
        });
        if (request !== calendarRequest.current) return;
        all.push(...itemsOf(data));
        hasNextPage = Boolean(metaOf(data)?.hasNextPage);
        currentPage += 1;
      }
      if (request !== calendarRequest.current) return;
      setCalTasks(all);
    } catch (err) {
      if (request !== calendarRequest.current) return;
      setError(err?.message ?? "Failed to load calendar.");
    } finally {
      if (request === calendarRequest.current) setCalLoading(false);
    }
  }, [calMonth]);

  useEffect(() => {
    if (view === "calendar") loadCalendar();
  }, [loadCalendar, view]);

  // --- Tasks mutations ---
  async function handleAdd(todo) {
    setAdding(true);
    setError("");
    try {
      await createTodo(todo);
      await loadTasks();
    } catch (err) {
      setError(err?.message ?? "Failed to add task.");
      throw err;
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdate(id, todo) {
    setError("");
    try {
      await updateTodo(id, todo);
      setTasksRefresh((value) => value + 1);
    } catch (err) {
      setError(err?.message ?? "Failed to update task.");
      throw err;
    }
  }

  async function handleComplete(id, isCompleted) {
    setError("");
    try {
      await setTodoCompletion(id, isCompleted);
      setTasksRefresh((value) => value + 1);
    } catch (err) {
      setError(err?.message ?? "Failed to update task status.");
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await deleteTodo(id);
      const wasLastOnPage = tasks.length === 1 && page > 1;
      if (wasLastOnPage) setPage((p) => p - 1);
      else await loadTasks();
    } catch (err) {
      setError(err?.message ?? "Failed to move task to trash.");
    }
  }

  // --- Trash mutations ---
  async function handleRestore(id) {
    setError("");
    try {
      await restoreTodo(id);
      const wasLastOnPage = trash.length === 1 && trashPage > 1;
      if (wasLastOnPage) setTrashPage((p) => p - 1);
      else await loadTrash();
    } catch (err) {
      setError(err?.message ?? "Failed to restore task.");
    }
  }

  async function handlePermanentDelete(id) {
    setError("");
    try {
      await permanentlyDeleteTodo(id);
      const wasLastOnPage = trash.length === 1 && trashPage > 1;
      if (wasLastOnPage) setTrashPage((p) => p - 1);
      else await loadTrash();
    } catch (err) {
      setError(err?.message ?? "Failed to delete task permanently.");
    }
  }

  // --- Calendar mutations (reload month after each) ---
  async function calComplete(id, isCompleted) {
    setError("");
    try {
      await setTodoCompletion(id, isCompleted);
      await loadCalendar();
    } catch (err) {
      setError(err?.message ?? "Failed to update task status.");
    }
  }

  async function calUpdate(id, todo) {
    setError("");
    try {
      await updateTodo(id, todo);
      setCalEditingId(null);
      await loadCalendar();
    } catch (err) {
      setError(err?.message ?? "Failed to update task.");
    }
  }

  async function calDelete(id) {
    setError("");
    try {
      await deleteTodo(id);
      setCalEditingId(null);
      await loadCalendar();
    } catch (err) {
      setError(err?.message ?? "Failed to move task to trash.");
    }
  }

  function shiftMonth(delta) {
    setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
    setSelectedDate(null);
    setCalEditingId(null);
  }

  const totalPages = pageMeta?.totalPages ?? 1;
  const totalCount = pageMeta?.totalCount ?? tasks.length;

  return (
    <div className="page">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="app-header">
        <div className="app-header__inner">
          <h1>My Tasks</h1>
          <nav className="app-nav" aria-label="Views">
            <button
              type="button"
              className={`app-nav__btn${view === "tasks" ? " app-nav__btn--active" : ""}`}
              aria-pressed={view === "tasks"}
              onClick={() => setView("tasks")}
              data-testid="nav-tasks"
            >
              Tasks
            </button>
            <button
              type="button"
              className={`app-nav__btn${view === "trash" ? " app-nav__btn--active" : ""}`}
              aria-pressed={view === "trash"}
              onClick={() => setView("trash")}
              data-testid="nav-trash"
            >
              Trash
            </button>
            <button
              type="button"
              className={`app-nav__btn${view === "calendar" ? " app-nav__btn--active" : ""}`}
              aria-pressed={view === "calendar"}
              onClick={() => setView("calendar")}
              data-testid="nav-calendar"
            >
              Calendar
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main" id="main-content">
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

        {view === "tasks" && (
          <>
            <TodoForm onAdd={handleAdd} loading={adding} />

            <div className="toolbar" role="search">
              <label className="control control--grow">
                <span className="control__label">Search</span>
                <input
                  type="search"
                  className="control__field"
                  placeholder="Search title"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search tasks"
                  data-testid="search-input"
                />
              </label>
              <label className="control">
                <span className="control__label">Status</span>
                <select
                  className="control__field"
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  data-testid="status-filter"
                >
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="control">
                <span className="control__label">Sort</span>
                <select
                  className="control__field"
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  data-testid="sort-filter"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>

            <TodoList
              todos={tasks}
              loading={tasksLoading}
              onComplete={handleComplete}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />

            <div className="pagination" data-testid="pagination">
              <span className="pagination__meta" data-testid="page-info">
                {totalCount === 0
                  ? "No tasks"
                  : `Page ${pageMeta?.page ?? page} of ${totalPages} · ${totalCount} task${totalCount === 1 ? "" : "s"}`}
              </span>
              <div className="pagination__btns">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={!pageMeta?.hasPreviousPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  data-testid="page-prev"
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={!pageMeta?.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  data-testid="page-next"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {view === "trash" && (
          <>
            <h2 className="section-title">Trash</h2>
            <TrashList
              todos={trash}
              loading={trashLoading}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
            />
            <div className="pagination" data-testid="trash-pagination">
              <span className="pagination__meta">
                {trash.length === 0
                  ? "Trash empty"
                  : `Page ${trashMeta?.page ?? trashPage} of ${trashMeta?.totalPages ?? 1} · ${trashMeta?.totalCount ?? trash.length} item${(trashMeta?.totalCount ?? trash.length) === 1 ? "" : "s"}`}
              </span>
              <div className="pagination__btns">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={!trashMeta?.hasPreviousPage}
                  onClick={() => setTrashPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={!trashMeta?.hasNextPage}
                  onClick={() => setTrashPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {view === "calendar" && (
          <Calendar
            monthLabel={monthLabel.format(calMonth)}
            monthDate={calMonth}
            tasks={calTasks}
            loading={calLoading}
            selectedDate={selectedDate}
            editingId={calEditingId}
            onSelectDate={(d) => { setSelectedDate(d); setCalEditingId(null); }}
            onSelectTask={(id) => setCalEditingId(id)}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
            onComplete={calComplete}
            onUpdate={calUpdate}
            onDelete={calDelete}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>To-Do List App</p>
      </footer>
    </div>
  );
}

export default App;
