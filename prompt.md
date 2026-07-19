# CODEX GOAL — To-Do List App

## 1. Objective

Build a complete, working To-Do List application with:

- Frontend: ReactJS with Vite.
- Backend: ASP.NET Core Web API on .NET 10.
- Database: PostgreSQL.
- ORM: Entity Framework Core with Npgsql.
- A layered backend architecture simplified from the attached architecture document.
- Priority on correct functionality, clear structure, and easy explanation during evaluation.
- No out-of-scope features that significantly increase complexity or implementation time.

## 2. Required Features

The application must allow users to:

- View all tasks.
- Create a new task.
- Edit an existing task.
- Delete a task.
- Mark a task as completed or incomplete.
- Keep data after page refreshes or application restarts by using PostgreSQL.
- Delete tasks through soft delete instead of physically removing records from the database.

Minimum user experience requirements:

- Do not allow creation of a task with an empty title.
- Show a loading state while data is being fetched or updated.
- Show clear, user-friendly error messages.
- Show an empty state when no active tasks exist.
- After every operation, the UI must reflect the current backend data correctly.

## 3. Backend Architecture to Preserve

Keep an inward dependency direction:

- `TodoApp.Domain`: entities and core business rules; no dependency on other projects.
- `TodoApp.Application`: interfaces, DTOs, use cases, or services; depends only on Domain.
- `TodoApp.Infrastructure`: EF Core, PostgreSQL, DbContext, migrations, repositories, or implementations; depends on Application and Domain.
- `TodoApp.API`: controllers, dependency injection, CORS, and error middleware; depends on Application and Infrastructure.

Domain and Application must not depend on API or Infrastructure.

## 4. Rename the Template Architecture

Rename all ERP-specific names to To-Do application names:

- `ErpPlatform` → `TodoApp`.
- `ErpPlatform.slnx` → `TodoApp.slnx`.
- `ErpPlatform.Domain` → `TodoApp.Domain`.
- `ErpPlatform.Application` → `TodoApp.Application`.
- `ErpPlatform.Infrastructure` → `TodoApp.Infrastructure`.
- `ErpPlatform.API` → `TodoApp.API`.
- `ErpDbContext` → `TodoDbContext`.
- `customer-web` → `todo-web`.
- All namespaces, assembly names, project references, and related configuration must consistently use `TodoApp`.

Main entity name:

- `TodoItem`.

Main controller name:

- `TodosController`.

Main table name:

- `todo_items`.

## 5. Target Directory Structure

Repository root:

- `backend`
  - `TodoApp.slnx`
  - `TodoApp.Domain`
  - `TodoApp.Application`
  - `TodoApp.Infrastructure`
  - `TodoApp.API`
- `todo-web`
- `Screenshots`
- `README.md`
- `prompt.md`
- `reflection.md`
- `CODEX_GOAL.md`

Keep only folders needed by the To-Do application:

- Domain: `Entities`.
- Application: `DTOs`, `Interfaces`, `Services`, or `UseCases`.
- Infrastructure: `Data`, `Configurations`, `Migrations`.
- API: `Controllers`, optional `Middleware`, `Properties`, and standard configuration files.
- Frontend: `components`, `services` or `api`, and `hooks` only when actually used.

Do not create empty folders or unnecessary intermediate layers.

## 6. Components to Remove

Do not carry the following ERP components into the To-Do application because they are outside the assignment scope:

- Tenant, company, branch, and warehouse.
- User, role, permission, and membership.
- JWT, login, session, and refresh token.
- Multi-tenant query filters.
- Company scope.
- Idempotency middleware.
- Audit logs.
- Outbox and inbox processing.
- Document number service.
- Complex PostgreSQL enums.
- Multiple database schemas.
- ERP business seeders.
- Raw SQL foundation migrations.
- ERP system controllers.
- Next.js App Router.
- Axios server client and `server-only`.
- Mock catalog, order, quotation, or receivable pages.
- Large test projects or complex integration-test infrastructure.
- Docker, CI/CD, message brokers, cache, or observability unless required to run the assignment reliably.

Keep a health endpoint only when it helps verify the backend and does not significantly increase scope.

## 7. Minimum Data Model

`TodoItem` must contain enough data to support the required functionality:

- `Id`.
- `Title`.
- `IsCompleted`.
- `CreatedAt`.
- `UpdatedAt`.
- `IsDeleted`.
- `DeletedAt`.

Use `Guid` or PostgreSQL `uuid` for `Id`. Use snake_case for PostgreSQL table and column names.

Soft-delete rules:

- When a user deletes a task, the backend must set `IsDeleted = true` and `DeletedAt` to the current UTC time.
- Do not perform a physical SQL `DELETE` for the normal delete flow.
- List and detail APIs must exclude soft-deleted records by default.
- Configure an EF Core global query filter for `TodoItem` to automatically exclude records where `IsDeleted = true`.
- Update and completion-toggle operations must reject soft-deleted records.
- The API may keep an HTTP `DELETE` endpoint, but its implementation must perform a soft delete.
- Restore and permanent-delete APIs are not required unless all mandatory work is complete and time remains.
- The migration must add `is_deleted` and `deleted_at` columns.
- Playwright must verify that a deleted item disappears from the UI. Where practical, also verify that the row still exists in PostgreSQL with soft-delete state.

Do not add ownership, priority, category, due date, or tags unless all mandatory requirements are complete and time remains.

## 8. Target API

The backend must provide the minimum REST API needed to:

- Retrieve the task list.
- Create a task.
- Update task content or completion status.
- Delete a task through soft delete.

The API must:

- Return appropriate HTTP status codes.
- Validate request data.
- Return errors in a consistent format.
- Never expose stack traces to the frontend.
- Allow CORS from the local frontend origin.
- Use asynchronous database operations.
- Use EF Core migrations and never use `EnsureCreated`.

## 9. PostgreSQL

Configure the database through environment variables or local configuration that does not contain real secrets.

Requirements:

- Use the Npgsql provider.
- Include a migration that creates the `todo_items` table.
- Document database creation, migration, and backend startup steps in `README.md`.
- Do not commit production passwords.
- Data must remain after browser refresh and API restart.

A PostgreSQL `docker-compose` file may be added only when it makes evaluation easier. When added, keep a single compose file at the repository root and document it clearly.

## 10. ReactJS Frontend

Use ReactJS with Vite. Do not use Next.js.

The frontend must include:

- One main page for the To-Do list.
- A form for creating tasks.
- An edit mode for existing tasks.
- A delete action.
- A checkbox or button for changing completion state.
- A dedicated service for API calls.
- An API base URL loaded from an environment variable.
- Loading, error, and empty states.
- A simple, clear, responsive interface.
- Support for desktop, tablet, and mobile layouts.
- No unexpected horizontal overflow, hidden content, or unusable controls on small viewports.
- Forms, lists, and CRUD controls that adapt to screen size.

A router, global state-management library, or design system is unnecessary for a single-page application.

## 11. Implementation Rules

Codex must:

- Inspect the existing repository structure before making changes.
- Rename files, projects, namespaces, and references consistently.
- Remove unused parts only after confirming that no references remain.
- Keep code simple, readable, and easy to explain.
- Avoid abstractions that add no clear value.
- Avoid fake features and mock data once the backend is available.
- Never hardcode connection strings or API URLs in source code.
- Run builds after each major group of changes.
- Apply migrations and verify real CRUD behavior against PostgreSQL.
- Run the frontend and verify the complete user flow.
- After implementation is complete, use Playwright to test CRUD and responsive behavior.
- Fix build, runtime, CORS, migration, and Playwright failures before stopping.
- Do not stop after scaffolding; deliver a working end-to-end application.
- Run Playwright against the real application, not mocked primary API flows.
- When a required Playwright test fails, fix the issue and rerun tests until all required tests pass.

## 12. Definition of Done

The task is complete only when:

- The backend builds successfully.
- The frontend builds successfully.
- PostgreSQL connects successfully.
- Migrations apply successfully.
- Users can create, edit, soft-delete, and change completion state.
- Data remains after page refresh.
- Soft-deleted records do not appear in default API results but remain in PostgreSQL with soft-delete state.
- Basic Playwright CRUD tests pass.
- Playwright responsive checks pass for at least desktop and mobile viewports.
- Playwright covers create, read, update, completion toggle, and delete flows.
- The interface remains usable on desktop and mobile.
- No `ErpPlatform` or `customer-web` names remain in primary source files.
- No unused ERP folders remain.
- `README.md` contains setup instructions for a clean machine.
- `prompt.md` contains the exact original prompt without editing or cleanup.
- `Screenshots` contains images of the interface and main features.
- `reflection.md` is no more than 500 words and answers all four assignment questions.

## 13. Required README Content

`README.md` must include:

- A short application description.
- Technologies used.
- Environment prerequisites.
- PostgreSQL configuration.
- Migration commands.
- Backend startup instructions.
- Frontend startup instructions.
- Frontend and API URLs.
- Main API endpoints.
- Steps for verifying required features.
- Important architecture decisions.
- Known limitations or unfinished work, when applicable.
- Playwright browser installation and test commands.

## 14. Required reflection.md Content

Maximum 500 words. Clearly answer:

- How was the problem broken down before prompting?
- What did the AI get wrong, and how was it corrected?
- What was deliberately not delegated to AI, and why?
- What would be done differently with more time?

The reflection must describe the actual implementation process, not generic statements.

## 15. Implementation Priority

Follow this order:

1. Clean and rename the project structure.
2. Create the PostgreSQL model and migration.
3. Complete backend CRUD and soft delete.
4. Connect React to the API.
5. Perform manual end-to-end verification.
6. Write and run Playwright tests for CRUD, soft delete, and responsive behavior.
7. Write `README.md`.
8. Capture screenshots.
9. Complete `prompt.md` and `reflection.md`.
10. Remove unused files, folders, and dependencies.
11. Run the final builds, migrations, and Playwright suite.
12. Package the entire project as a ZIP file.

Do not prioritize visual polish over stability, correctness, and explainability.

## 16. Playwright Verification After Completion

Begin this stage only after the backend, frontend, and PostgreSQL are running reliably.

Set up Playwright to test the real end-to-end application. Do not mock the primary API flows.

Required scenarios:

- Open the application and load the task list successfully.
- Create a task and confirm that it appears in the list.
- Reload the page and confirm that the task still exists.
- Edit the task title and confirm that the updated value appears.
- Mark the task as completed, then return it to incomplete when the UI supports both actions.
- Delete the task and confirm that it disappears from the list.
- Reload the page and confirm that the soft-deleted task does not reappear.
- Submit an empty title and confirm that the UI blocks the action or shows validation feedback.
- Verify the empty state when no active tasks exist.
- Verify loading or pending feedback where it can be observed reliably.
- Confirm that no serious browser console errors occur during the main flow.

Minimum responsive viewports:

- Desktop: approximately `1440 × 900`.
- Tablet: approximately `768 × 1024`.
- Mobile: approximately `375 × 812`.

At each viewport, verify:

- No unexpected horizontal overflow.
- Create and edit forms remain usable.
- Task content is not clipped outside the viewport.
- Edit, delete, and completion controls remain visible and interactive.
- Layout elements do not overlap.
- Text and touch targets remain readable and usable.

Test execution rules:

- Configure Playwright to start or connect to the correct frontend and backend services.
- Use clearly identifiable, unique test data.
- Clean up test data through soft delete or a controlled test-database reset when appropriate.
- Tests must be independent and repeatable.
- Tests must not depend on execution order.
- Avoid fixed delays when a locator, response, or UI state can be awaited instead.
- Prefer stable selectors such as roles, labels, and test IDs when needed.
- Capture screenshots or traces when tests fail.
- Run Playwright headlessly during final verification.
- Before packaging the ZIP file, run the complete Playwright suite one final time and ensure every required test passes.
