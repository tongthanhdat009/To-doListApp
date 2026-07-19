# To-Do List App

Single-page task manager with a React/Vite frontend, ASP.NET Core API, and PostgreSQL persistence. Tasks can be created, edited, marked complete/incomplete, and soft-deleted.

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

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/todos` | List active tasks |
| `GET` | `/api/todos/{id}` | Get active task |
| `POST` | `/api/todos` | Create task (`{ "title": "..." }`) |
| `PUT` | `/api/todos/{id}` | Change title (`{ "title": "..." }`) |
| `PATCH` | `/api/todos/{id}/completion` | Set completion (`{ "isCompleted": true }`) |
| `DELETE` | `/api/todos/{id}` | Soft-delete task |
| `GET` | `/health` | Health check |

## Verify required behavior

1. Start PostgreSQL, apply migration, then start API and frontend.
2. Open http://localhost:5173. Confirm loading then empty-state feedback.
3. Add a non-empty task. Reload; it remains.
4. Edit its title. Toggle complete and incomplete.
5. Delete it. Reload; it does not return.
6. Optional database check: connect to PostgreSQL on `localhost:5433` and inspect `todo_items`; deleted rows remain with `is_deleted = true` and `deleted_at` set.

## Browser verification

Final verification used **Playwright MCP** against the real frontend, API, and PostgreSQL. It covered create, reload persistence, edit, completion toggle both directions, delete, reload absence, blank-title validation, empty state, no console errors, and overflow/control checks at `1440x900`, `768x1024`, and `375x812`. Screenshots are in `Screenshots/`.

A repeatable real API Playwright suite is checked in at `todo-web/tests/todo.smoke.spec.js`. Start PostgreSQL and the API first, then run:

```bash
cd todo-web
npm ci
npx playwright install chromium
E2E_BASE_URL=http://127.0.0.1:5173 npm test -- --workers=1
```

The API CORS policy accepts both supported local frontend origins.

## Architecture

`TodoApp.Domain` holds `TodoItem`. `TodoApp.Application` owns DTOs and service contracts. `TodoApp.Infrastructure` contains EF Core, the Npgsql `TodoDbContext`, migration, mapping, and service implementation. `TodoApp.API` contains controllers, CORS, exception handling, and DI.

The `todo_items` mapping uses snake_case. EF Core's global query filter excludes `is_deleted = true`; the `DELETE` endpoint sets soft-delete state rather than removing the row.

## Limitations

- The checked-in npm test is a smoke test; full end-to-end verification is performed with Playwright MCP against the real running stack.
- Development configuration contains local sample credentials; do not use them in production.
- Backend restore/build reports known high-severity vulnerabilities in `System.Security.Cryptography.Xml` 9.0.0 (`GHSA-37gx-xxp4-5rgx`, `GHSA-w3x6-4m5h-cxqf`) and `Microsoft.OpenApi` 2.0.0 (`GHSA-v5pm-xwqc-g5wc`). Update transitive package resolution before production use.
- ASP.NET Core's default Problem Details behavior includes exception details only when `ASPNETCORE_ENVIRONMENT=Development`; production environments never expose stack traces.
