# CODEX GOAL — To-Do App Feature Expansion

## 1. Objective

Extend the existing To-Do application while preserving the current architecture and working CRUD flow.

Current stack must remain:

- Frontend: ReactJS with Vite.
- Backend: ASP.NET Core Web API on .NET 10.
- Database: PostgreSQL.
- ORM: Entity Framework Core with Npgsql.
- Architecture: Domain, Application, Infrastructure, and API layers.

The expansion must add:

- Trash and restore.
- Optional permanent deletion.
- Server-side filter, search, sort, and pagination.
- Priority and due date.
- Detailed task descriptions.
- Calendar-based task display.
- Responsive UI.
- Playwright verification for all new behavior.

Do not add source code to this goal document. Use it only as implementation guidance and completion criteria.

## 2. Preserve Existing Behavior

Do not break existing features:

- Create a task.
- View active tasks.
- Edit a task.
- Mark a task as completed or incomplete.
- Soft-delete a task.
- Persist data in PostgreSQL.
- Keep responsive behavior on desktop, tablet, and mobile.
- Keep existing Playwright CRUD tests passing.

## 3. Extend the Task Model

Extend `TodoItem` with:

- `Description`: optional detailed task content.
- `Priority`: Low, Medium, or High.
- `DueDate`: optional deadline.
- Existing fields such as `Id`, `Title`, `IsCompleted`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, and `DeletedAt` must remain.

Rules:

- Title remains required.
- Description is optional and may contain longer text.
- Priority must accept only Low, Medium, or High.
- Due date is optional.
- Store timestamps consistently in UTC.
- Add an EF Core migration for all model changes.
- Keep PostgreSQL table and column names in snake_case.
- Existing records must receive a safe default priority, preferably Medium.

Do not add categories, tags, users, subtasks, recurring tasks, or reminders in this phase.

## 4. Complete Soft-Delete Lifecycle

Implement the complete soft-delete lifecycle.

### Active tasks

- Normal list APIs must exclude soft-deleted records.
- Normal detail APIs must not return soft-deleted records.
- Edit and completion-toggle operations must reject soft-deleted records.
- Deleting an active task must set `IsDeleted = true` and `DeletedAt` to the current UTC time.

### Trash page

Add a dedicated Trash page or Trash view.

It must:

- Show only soft-deleted tasks.
- Display title, description preview, priority, due date, deletion time, and completion state when relevant.
- Support pagination.
- Show an empty state when Trash has no tasks.
- Remain responsive on desktop, tablet, and mobile.

### Restore

Allow users to restore a soft-deleted task.

Restoring must:

- Set `IsDeleted = false`.
- Set `DeletedAt = null`.
- Return the task to the active list.
- Preserve title, description, priority, due date, and completion state.
- Reject restore attempts for tasks that are not deleted.
- Return an appropriate API response when the task does not exist.

### Permanent delete

Provide an optional permanent-delete action only from Trash.

Permanent deletion must:

- Physically remove the selected soft-deleted record from PostgreSQL.
- Reject permanent deletion for active tasks.
- Require an explicit confirmation dialog.
- Clearly warn that the action cannot be undone.
- Use a separate API operation from normal soft delete.
- Never be triggered by the standard delete action.

Trash and Restore are mandatory. Permanent delete may be omitted only when the deadline is strict and all mandatory features are already stable.

## 5. Filter Tasks

Add status filters:

- All.
- Active.
- Completed.

Definitions:

- All: all non-deleted tasks.
- Active: non-deleted tasks where `IsCompleted = false`.
- Completed: non-deleted tasks where `IsCompleted = true`.

Requirements:

- Filtering must be performed by the backend.
- The selected filter must remain visible in the UI.
- Changing the filter must reset pagination to page 1.
- Filter state may use URL query parameters or component state.
- Soft-deleted tasks must never appear in these filters.

## 6. Search Tasks

Add case-insensitive search by title.

Requirements:

- Search must be performed by the backend.
- Trim leading and trailing whitespace.
- Empty search behaves as no search filter.
- Search must work together with filter, sort, and pagination.
- Use a short frontend debounce.
- Reset pagination to page 1 when search changes.
- Do not search Trash unless Trash search is intentionally added.

Searching descriptions is not required.

## 7. Sort Tasks

Support sorting by:

- Created date.
- Completion status.

Recommended options:

- Newest first.
- Oldest first.
- Incomplete first.
- Completed first.

Requirements:

- Sorting must be performed by the backend.
- The frontend must show the active sort option.
- Sorting must work with filter, search, and pagination.
- Apply a stable secondary sort, such as `CreatedAt` or `Id`.
- Changing sort must reset pagination to page 1.

Due-date sorting is optional after required sorting works.

## 8. Priority

Add task priorities:

- Low.
- Medium.
- High.

Requirements:

- Users select priority when creating a task.
- Users can change priority when editing.
- Existing tasks receive a default priority.
- Show priority clearly in the task list.
- Do not rely on color alone; include text or an accessible label.
- Priority controls must remain usable on mobile.
- Backend validation must reject unsupported values.

Priority filtering is optional.

## 9. Due Date and Overdue State

Allow an optional due date during task creation and editing.

Requirements:

- Tasks may exist without a due date.
- Display due dates clearly in the frontend.
- Store the value consistently in PostgreSQL.
- Prefer a date-only deadline unless the existing app already uses time-specific scheduling.

A task is overdue when:

- It has a due date.
- The due date is earlier than the current date.
- It is not completed.
- It is not soft-deleted.

Overdue behavior:

- Highlight overdue tasks.
- Include an accessible `Overdue` text indicator.
- Do not rely only on red color.
- Completed tasks must not appear overdue.
- Trash tasks may display their previous due date but do not need active overdue styling.

No reminders, notifications, recurring schedules, or complex calendar logic.

## 10. Detailed Task Description

Allow users to create and edit a detailed description.

Requirements:

- Add a multiline description field to create and edit flows.
- Description is optional.
- Apply a reasonable maximum length.
- Validate length in frontend and backend.
- Show the full description in a detail/edit view or a shortened preview with expand support.
- Long descriptions must not break responsive layout or cause horizontal overflow.

Do not add rich text, Markdown editing, or attachments.

## 11. Server-Side Pagination

The backend must accept:

- `page`
- `pageSize`

Rules:

- `page` starts at 1.
- Reject or normalize invalid values.
- Define a default page size.
- Define a maximum page size.
- Apply filtering, search, and sorting before pagination.
- Do not load all database rows and paginate in memory.

The response must include:

- Current page.
- Page size.
- Total item count.
- Total page count.
- Current page items.
- Previous/next availability or equivalent metadata.

Frontend requirements:

- Show pagination controls.
- Disable invalid previous/next actions.
- Preserve filter, search, and sort state while changing pages.
- Reset to page 1 when filter, search, or sort changes.
- Handle deleting the last item on a page.
- Keep pagination usable on mobile.

Trash should reuse the same pagination format where practical.

## 12. Calendar Task View

Add a simple calendar view for tasks.

Purpose:

- Show tasks grouped by due date.
- Help users understand upcoming and overdue work.

Scope:

- Simple month view.
- No drag-and-drop.
- No recurring events.
- No reminders.
- No external calendar synchronization.
- No complex timezone scheduling.

Requirements:

- Display tasks on their due-date cells.
- Tasks without a due date do not appear.
- Soft-deleted tasks do not appear.
- Completed tasks remain visible with a completed indicator.
- Overdue incomplete tasks must be identifiable.
- Allow previous/next month navigation.
- Selecting a date should show tasks due on that date.
- Selecting a task should open details or edit mode.
- On mobile, a compact agenda/list fallback is acceptable.

Implementation guidance:

- Use a lightweight maintained calendar library only when it reduces complexity.
- Prefer a simple custom month grid if sufficient.
- Query only the visible date range.
- Backend must support due-date range queries.
- Do not load every task for each calendar render.

## 13. API Behavior

Extend the REST API for:

- Paginated active-task listing.
- Status filtering.
- Title search.
- Sorting.
- Due-date-range calendar queries.
- Trash listing.
- Restore.
- Permanent delete.
- Create/update of description, priority, and due date.

API rules:

- Use async database operations.
- Return appropriate HTTP status codes.
- Validate query parameters and request bodies.
- Return errors consistently.
- Do not expose stack traces.
- Keep soft delete and permanent delete as separate operations.
- Compose EF Core queries so filtering and pagination run in PostgreSQL.
- Avoid returning EF Core entities directly when DTOs are used.
- Document endpoints and query parameters in `README.md`.

## 14. Frontend Views

Frontend should include:

- Main task-list view.
- Trash view.
- Calendar view.
- Create form.
- Edit form or edit mode.
- Task detail or expanded-description view when needed.

Main task-list view must include:

- Status filter.
- Search input.
- Sort selector.
- Paginated task list.
- Priority indicator.
- Due date.
- Overdue indicator.
- Completion control.
- Edit action.
- Soft-delete action.
- Navigation to Trash and Calendar.

Trash view must include:

- Deleted-task list.
- Restore action.
- Optional permanent-delete action.
- Confirmation before permanent deletion.
- Pagination.
- Empty state.

Calendar view must include:

- Month navigation.
- Tasks grouped by due date.
- Date selection.
- Mobile-friendly layout or agenda fallback.

## 15. Responsive Requirements

Verify at minimum:

- Desktop: approximately `1440 × 900`.
- Tablet: approximately `768 × 1024`.
- Mobile: approximately `375 × 812`.

Requirements:

- No unexpected horizontal overflow.
- Filter, search, sort, and pagination controls wrap or stack correctly.
- Long titles and descriptions do not break layout.
- Trash actions remain accessible.
- Confirmation dialogs fit small screens.
- Calendar remains usable on mobile.
- Touch targets remain usable.
- Important states do not rely only on color.

## 16. Playwright Verification

Run Playwright against the real frontend, backend, and PostgreSQL database.

### Trash and restore

- Create a task.
- Soft-delete it.
- Confirm it disappears from the active list.
- Open Trash.
- Confirm the deleted task appears.
- Restore it.
- Confirm it disappears from Trash.
- Confirm it returns to the active list with original data preserved.

### Permanent delete

When implemented:

- Soft-delete a task.
- Open Trash.
- Trigger permanent delete.
- Confirm the warning dialog.
- Cancel once and verify the task remains.
- Confirm permanent delete.
- Verify the task no longer appears in Trash.
- Verify restore is no longer possible.

### Filter and search

- Create active and completed tasks.
- Verify All, Active, and Completed filters.
- Search by title.
- Verify case-insensitive matching.
- Verify no-result state.
- Verify search combined with status filtering.

### Sorting

- Create tasks with different creation times or statuses.
- Verify newest and oldest sorting.
- Verify incomplete-first and completed-first sorting.
- Verify ordering remains correct after reload.

### Priority and due date

- Create Low, Medium, and High tasks.
- Edit task priority.
- Create a task with a due date.
- Prepare an overdue incomplete task.
- Verify overdue indication.
- Complete it and verify overdue indication disappears.

### Description

- Create a task with a detailed description.
- Verify description or preview.
- Edit the description.
- Reload and confirm persistence.
- Verify long text does not break mobile layout.

### Pagination

- Create enough tasks for multiple pages.
- Verify next and previous navigation.
- Verify page metadata behavior.
- Verify filter/search/sort reset to page 1.
- Verify state remains correct across pages.
- Verify deletion of the last item on a page is handled correctly.

### Calendar

- Create tasks with due dates in the visible month.
- Verify tasks appear on correct dates.
- Verify tasks without due dates do not appear.
- Verify soft-deleted tasks do not appear.
- Verify completed and overdue states are distinguishable.
- Navigate between months.
- Select a date and open a task.

### Responsive

Run important flows at desktop, tablet, and mobile sizes.

Verify:

- No horizontal overflow.
- All controls remain accessible.
- Calendar remains usable.
- Trash actions remain usable.
- Create/edit forms remain usable.
- Pagination and filters remain usable.

## 17. Documentation Updates

Update `README.md` with:

- New model fields.
- Migration instructions.
- New API endpoints.
- Filter, search, sort, and pagination parameters.
- Soft-delete, restore, and permanent-delete behavior.
- Calendar behavior.
- Frontend views.
- Playwright commands.
- Optional features not implemented.
- Known limitations.

Update `reflection.md` after implementation. Describe real issues involving:

- Soft-delete query handling.
- Pagination state.
- Calendar date handling.
- Responsive layout.
- Playwright data cleanup.

## 18. Implementation Order

1. Inspect existing implementation and tests.
2. Extend the domain model.
3. Add and apply PostgreSQL migration.
4. Implement backend filter, search, sort, and pagination.
5. Implement description, priority, and due date.
6. Implement Trash listing and restore.
7. Implement optional permanent deletion.
8. Update the main task-list UI.
9. Add Trash UI.
10. Add calendar date-range API.
11. Add Calendar UI.
12. Verify responsive behavior.
13. Extend Playwright tests.
14. Fix build, runtime, migration, UI, and test failures.
15. Update documentation.
16. Run final backend build, frontend build, migrations, and Playwright suite.

## 19. Definition of Done

Complete only when:

- Existing CRUD still works.
- Description, priority, and due date persist.
- Overdue tasks are identified correctly.
- All, Active, and Completed filters work.
- Case-insensitive title search works.
- Created-date and completion-status sorting work.
- Backend pagination avoids loading the full table.
- Trash lists only soft-deleted tasks.
- Restore returns tasks to the active list.
- Permanent delete, when included, works only for soft-deleted tasks and requires confirmation.
- Calendar displays non-deleted tasks on correct due dates.
- Desktop, tablet, and mobile layouts remain usable.
- PostgreSQL migrations apply.
- Backend and frontend builds pass.
- Required Playwright tests pass.
- `README.md` documents all new behavior.
- No unrelated architecture or unnecessary feature is added.
