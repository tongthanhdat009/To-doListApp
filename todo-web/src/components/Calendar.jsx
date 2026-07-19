import { TodoList } from "./TodoList";

const pad = (n) => String(n).padStart(2, "0");
const dateKey = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;
const today = () => {
  const date = new Date();
  return dateKey(date.getFullYear(), date.getMonth(), date.getDate());
};

function tasksForDate(tasks, date) {
  return tasks.filter((task) => task.dueDate === date);
}

export function Calendar({
  monthLabel,
  monthDate,
  tasks,
  loading,
  selectedDate,
  editingId,
  onSelectDate,
  onSelectTask,
  onPrev,
  onNext,
  onComplete,
  onUpdate,
  onDelete,
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: firstDay }, (_, index) => index);
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const selectedTasks = selectedDate ? tasksForDate(tasks, selectedDate) : [];

  return (
    <section className="calendar" aria-labelledby="calendar-title">
      <div className="calendar__header">
        <div>
          <h2 id="calendar-title" className="section-title">Calendar</h2>
          <p className="calendar__hint">Tasks due in {monthLabel}</p>
        </div>
        <div className="calendar__nav" aria-label="Calendar month navigation">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onPrev} aria-label="Previous month">Previous</button>
          <strong aria-live="polite">{monthLabel}</strong>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onNext} aria-label="Next month">Next</button>
        </div>
      </div>

      {loading ? (
        <div className="state-box" role="status" aria-live="polite"><span className="spinner spinner--lg" aria-hidden="true" /><p>Loading calendar…</p></div>
      ) : (
        <>
          <div className="calendar__weekdays" aria-hidden="true">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name) => <span key={name}>{name}</span>)}
          </div>
          <div className="calendar__grid" aria-label={`${monthLabel} due dates`}>
            {blanks.map((blank) => <div key={`blank-${blank}`} className="calendar__blank" />)}
            {days.map((day) => {
              const date = dateKey(year, month, day);
              const due = tasksForDate(tasks, date);
              const completeCount = due.filter((task) => task.isCompleted).length;
              const overdueCount = due.filter((task) => !task.isCompleted && task.dueDate < today()).length;
              const selected = selectedDate === date;
              const taskSummary = due.map((task) => task.title).join(", ");
              return (
                <button
                  key={date}
                  type="button"
                  className={`calendar__day${selected ? " calendar__day--selected" : ""}${due.length ? " calendar__day--has-tasks" : ""}`}
                  onClick={() => onSelectDate(date)}
                  aria-pressed={selected}
                  aria-label={`${date}: ${due.length} due task${due.length === 1 ? "" : "s"}${overdueCount ? `, ${overdueCount} overdue` : ""}${completeCount ? `, ${completeCount} completed` : ""}${taskSummary ? `: ${taskSummary}` : ""}`}
                >
                  <span className="calendar__date">{day}</span>
                  {due.length > 0 && (
                    <>
                      <span className="calendar__tasks" aria-hidden="true">
                        {due.map((task) => {
                          const isOverdue = !task.isCompleted && task.dueDate < today();
                          const status = task.isCompleted ? "completed" : isOverdue ? "overdue" : "open";
                          const marker = task.isCompleted ? "✓" : isOverdue ? "!" : "";
                          return <span key={task.id} className={`calendar__task calendar__task--${status}`}>{marker && `${marker} `}{task.title}</span>;
                        })}
                      </span>
                      <span className="calendar__counts">
                        <span>{due.length} task{due.length === 1 ? "" : "s"}</span>
                        {overdueCount > 0 && <strong>{overdueCount} overdue</strong>}
                        {completeCount > 0 && <span>✓ {completeCount} completed</span>}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <section className="calendar__agenda" aria-live="polite" aria-labelledby="agenda-title">
            <h3 id="agenda-title">{selectedDate ? `Due ${selectedDate}` : "Select a date"}</h3>
            {selectedDate && selectedTasks.length === 0 && <p className="calendar__hint">No tasks due this date.</p>}
            {selectedTasks.length > 0 && (
              <TodoList
                todos={selectedTasks}
                loading={false}
                editingId={editingId}
                onComplete={onComplete}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onSelectTask={onSelectTask}
              />
            )}
            {selectedTasks.length > 0 && !editingId && (
              <p className="calendar__hint">Select Edit on a task to change its details.</p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
