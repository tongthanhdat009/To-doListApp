# To-Do List App
github: https://github.com/tongthanhdat009/To-doListApp
Single-page task manager with a React/Vite frontend, ASP.NET Core API, and PostgreSQL persistence. Tasks support descriptions, priorities, due dates, filtering, pagination, calendar viewing, trash restore, and permanent deletion.

## Stack

- React 19, Vite 8
- ASP.NET Core / .NET 10
- Entity Framework Core 10, Npgsql
- PostgreSQL 16 (Docker Compose)
- Playwright

## Prerequisites

- Docker with Compose
- .NET SDK 10
- Node.js and npm

## Clean-machine setup

From the repository root:

```bash
cp .env.example .env
cp todo-web/.env.example todo-web/.env

docker compose --env-file .env up -d

dotnet tool restore --tool-manifest backend/dotnet-tools.json

cd backend
dotnet ef database update \
  --project TodoApp.Infrastructure/TodoApp.Infrastructure.csproj \
  --startup-project TodoApp.API/TodoApp.API.csproj
cd ..
```

`.env.example` and `backend/TodoApp.API/appsettings.json` already agree on the same local development values (host `localhost`, port `5433`, database/user/password `todoapp`), so no shell export is required for local runs. Change `POSTGRES_PASSWORD` (and the matching value in `appsettings.json` or an environment override) before using anything beyond local development. Docker publishes PostgreSQL on host port `5433` (`5432` inside the container). The named `postgres-data` volume keeps database data between container restarts.

The API reads its connection string from `ConnectionStrings:TodoDb` in `appsettings.json`, which can be overridden per environment with the `ConnectionStrings__TodoDb` variable. The frontend reads `VITE_API_BASE_URL`.

## Run

Terminal 1 — API:

```bash
dotnet run --project backend/TodoApp.API/TodoApp.API.csproj
```

Terminal 2 — frontend:

```bash
cd todo-web
npm ci
npm run dev
```

URLs:

- Frontend: http://localhost:5173
- API: http://localhost:5162
- Health: http://localhost:5162/health
- Development OpenAPI document: http://localhost:5162/openapi/v1.json

The API CORS policy permits `http://localhost:5173` and `http://127.0.0.1:5173` for local frontend and Playwright MCP use.

## Data model

`todo_items` (EF Core mapping, snake_case):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `title` | varchar(200) | required, trimmed, non-blank |
| `description` | varchar(2000) | nullable; trimmed, blank → null |
| `priority` | varchar(6) | `Low`, `Medium`, `High`; required, default `Medium` |
| `due_date` | date | nullable |
| `is_completed` | boolean | required |
| `created_at` | timestamptz | required, `DateTime.UtcNow` |
| `updated_at` | timestamptz | required, `DateTime.UtcNow` on every change |
| `is_deleted` | boolean | required; hidden by EF Core global query filter |
| `deleted_at` | timestamptz | nullable; set on soft delete, cleared on restore |

Title limit 200 (create/edit payload and DB). Description limit 2000. IDs are `Guid.NewGuid()`. Timestamps are UTC.

## Database migration

Migrations live in `TodoApp.Infrastructure/Migrations`. Apply both from `backend/` after PostgreSQL starts (the migration step is already part of the setup block above; shown here standalone):

```bash
cd backend
dotnet ef database update \
  --project TodoApp.Infrastructure/TodoApp.Infrastructure.csproj \
  --startup-project TodoApp.API/TodoApp.API.csproj
```

The `TodoExpansion` migration adds `description`, `due_date`, and `priority` to the existing `todo_items` table.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/todos` | Page active (non-deleted) tasks |
| `GET` | `/api/todos/trash` | Page soft-deleted tasks |
| `GET` | `/api/todos/{id}` | Get active task (404 if soft-deleted) |
| `POST` | `/api/todos` | Create task |
| `PUT` | `/api/todos/{id}` | Replace task fields |
| `PATCH` | `/api/todos/{id}/completion` | Set completion |
| `DELETE` | `/api/todos/{id}` | Soft-delete (move to trash) |
| `POST` | `/api/todos/{id}/restore` | Restore a deleted task |
| `DELETE` | `/api/todos/{id}/permanent` | Permanently delete a trashed task |
| `GET` | `/health` | Health check |

`GET /api/todos` query parameters:

| Param | Default | Allowed | Notes |
| --- | --- | --- | --- |
| `page` | `1` | int ≥ 1 | validation Problem Details below 1 |
| `pageSize` | `10` | 1–100 | validation Problem Details outside range |
| `status` | `all` | `all`, `active`, `completed` | `active` = incomplete, `completed` = complete |
| `search` | — | string | case-insensitive `ILIKE` on `title` |
| `sort` | `newest` | `newest`, `oldest`, `incomplete`, `completed` | tiebreak by `created_at` then `id` |
| `dueDateFrom` | — | date (`YYYY-MM-DD`) | must be ≤ `dueDateTo` |
| `dueDateTo` | — | date (`YYYY-MM-DD`) | inclusive |

`GET /api/todos/trash` query parameters:

| Param | Default | Allowed |
| --- | --- | --- |
| `page` | `1` | int ≥ 1 |
| `pageSize` | `10` | 1–100 |

List endpoints return a paged envelope:

```json
{
  "items": [ { "id": "…", "title": "…", "description": null, "priority": "Medium",
               "dueDate": null, "isCompleted": false, "createdAt": "…",
               "updatedAt": "…", "deletedAt": null } ],
  "page": 1,
  "pageSize": 10,
  "totalCount": 0,
  "totalPages": 0,
  "hasPreviousPage": false,
  "hasNextPage": false
}
```

Single-item and mutation responses return one `TodoItemResponse` (same item shape). `POST` returns `201 CreatedAtAction`; `DELETE`, and permanent delete on success return `204 NoContent`. Invalid pagination/filter values and business-rule violations return `400` Problem Details.

Request payloads:

- Create/Update: `{ "title": "…", "description": "…", "priority": "Medium", "dueDate": "2026-08-01", "isCompleted": false }` (`title` required, 1–200 chars; `isCompleted` is Update-only).
- Completion: `{ "isCompleted": true }`.

### Soft delete, restore, permanent delete

- `DELETE /api/todos/{id}` — soft delete: sets `is_deleted = true`, `deleted_at = now`, `updated_at = now`. The row stays in PostgreSQL but is hidden by EF Core's global `!is_deleted` query filter, so active reads, `GET /{id}`, and updates no longer find it. Returns `204` on success, `404` if the task is already absent (already deleted/never existed).
- `POST /api/todos/{id}/restore` — restore: clears `is_deleted`, sets `deleted_at = null`, `updated_at = now`. Restoring a task that is not deleted returns `400` Problem Details; missing task returns `404`.
- `DELETE /api/todos/{id}/permanent` — permanent delete: physically removes the row. Only works on a soft-deleted task; permanent-deleting an active task returns `400` Problem Details (`Only deleted to-do items can be permanently deleted.`), missing task returns `404`.

## Verify required behavior

1. Start PostgreSQL, apply migration, then start API and frontend.
2. Open http://localhost:5173. Confirm loading then empty-state feedback.
3. Create a task with description, `Low`/`Medium`/`High` priority, and optional due date. Reload; it remains.
4. Filter by status, search title, sort, page results, and verify due-date filtering through the calendar view.
5. Edit a task. Toggle completion both directions.
6. Move it to trash. Confirm it disappears from active tasks and appears in Trash; restore it, then permanently delete it from Trash after confirming the irreversible action.
7. Optional database check: `todo_items` keeps soft-deleted rows with `is_deleted = true` and `deleted_at`; permanent deletion removes the row.

## Real-stack Playwright MCP verification

Use **Playwright MCP** only after all three real services are running: PostgreSQL, API, frontend. MCP does not provision the database or API.

1. Prepare the stack with **Clean-machine setup**, then run the API and frontend commands in **Run**. Verify `http://localhost:5162/health` returns `{ "status": "healthy" }`.
2. Navigate MCP to `http://127.0.0.1:5173` (the CORS policy allows it). Exercise create, reload persistence, metadata edit, completion toggle, status/search/sort/pagination, calendar due-date filtering, trash, restore, and permanent delete. Accept browser confirmations for moving to trash and permanent delete.
3. Check browser console errors and responsive layouts at `1440x900`, `768x1024`, and `375x812`.
4. Keep created test data uniquely prefixed. Delete it permanently through the Trash UI when finished; this action is irreversible.

A repeatable Chromium smoke suite is at `todo-web/tests/todo.smoke.spec.js`. It starts Vite at `127.0.0.1:5173`, but PostgreSQL and API must already be running:

```bash
cd todo-web
npm ci
npx playwright install chromium
VITE_API_BASE_URL=http://localhost:5162 E2E_BASE_URL=http://127.0.0.1:5173 npm test -- --workers=1
```

The API CORS policy accepts both supported local frontend origins.

## Architecture

`TodoApp.Domain` holds `TodoItem`. `TodoApp.Application` owns DTOs, service contracts, validation, and `TodoService`. `TodoApp.Infrastructure` contains EF Core, the Npgsql `TodoDbContext`, migrations, mappings, and repository implementation. `TodoApp.API` contains controllers, CORS, exception handling, and DI.

The `todo_items` mapping uses snake_case. EF Core's global query filter excludes `is_deleted = true`; the `DELETE` endpoint sets soft-delete state rather than removing the row.

## Limitations

- The checked-in npm test is a smoke test; full end-to-end verification is performed with Playwright MCP against the real running stack.
- Development configuration contains local sample credentials; do not use them in production.
- Backend restore/build reports known high-severity vulnerabilities in `System.Security.Cryptography.Xml` 9.0.0 (`GHSA-37gx-xxp4-5rgx`, `GHSA-w3x6-4m5h-cxqf`) and `Microsoft.OpenApi` 2.0.0 (`GHSA-v5pm-xwqc-g5wc`). Update transitive package resolution before production use.
- ASP.NET Core's default Problem Details behavior includes exception details only when `ASPNETCORE_ENVIRONMENT=Development`; production environments never expose stack traces.
