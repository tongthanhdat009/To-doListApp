# Reflection

## How the problem was broken down before prompting

The assignment (`CODEX_GOAL_EN.md`) was read in full first, then split into the ordered phases it already defines: rename the template to `TodoApp`, build the PostgreSQL model and migration, complete backend CRUD with soft delete, connect React to the API, verify manually, add Playwright, then write the root documentation. Before any code was generated, the required scope was fixed: one entity (`TodoItem`), one controller (`TodosController`), one table (`todo_items`), the four-layer dependency direction, and the explicit list of ERP components to remove. This kept the prompt small and the success criteria concrete: builds pass, migration applies, CRUD works, soft-deleted rows stay in PostgreSQL, data survives a refresh.

## What the AI got wrong, and how it was corrected

The AI was used for mechanical scaffolding and boilerplate. Each output was checked against the goal rather than trusted. Two runtime issues were corrected: `PUT` originally required `isCompleted`, while the edit form sends only `title`; the request DTO was made nullable for that optional field so the current completion state is preserved. The CORS policy initially accepted only `localhost:5173`; `127.0.0.1:5173` was added for local Playwright MCP use. Soft delete was then verified to set `IsDeleted = true` and `DeletedAt` instead of issuing a physical `DELETE`, with the EF Core global query filter hiding deleted rows from list and detail results.

## What was deliberately not delegated to AI, and why

Architectural decisions were kept manual: the project/namespace names, the layer dependency direction, the soft-delete rule, and the choice of a single `docker-compose.yml` with PostgreSQL on host port `5433`. These define correctness for the assignment, so verifying them by hand was cheaper and safer than re-deriving intent from AI output. Secrets handling was also not delegated: only non-sensitive sample values were committed, and production password rotation is left to deployment.

## What would be done differently with more time

With more time, the Playwright MCP checks would be converted into a fully repeatable CI suite that starts PostgreSQL and the API automatically. The deleted-row database assertion would be automated. A CI pipeline would run the backend build, migration, frontend build, and browser suite. Finally, an OpenAPI/Swagger UI surface would be enabled for easier API exploration during evaluation.
