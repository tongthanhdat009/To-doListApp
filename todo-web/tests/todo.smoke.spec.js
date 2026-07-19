import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

const API_BASE_URL = process.env.VITE_API_BASE_URL ?? "http://localhost:5162";

// Repeatability: a prior failed run can leave pw-e2e-* rows behind. Sweep
// only those real API rows before each test, preserving non-test data.
async function cleanupStaleTestTodos() {
  const response = await fetch(`${API_BASE_URL}/api/todos`);
  expect(response.ok).toBe(true);
  const todos = await response.json();
  const stale = Array.isArray(todos)
    ? todos.filter((todo) => typeof todo.title === "string" && todo.title.startsWith("pw-e2e-"))
    : [];
  await Promise.all(stale.map(async (todo) => {
    const deleteResponse = await fetch(`${API_BASE_URL}/api/todos/${todo.id}`, { method: "DELETE" });
    expect(deleteResponse.ok).toBe(true);
  }));
}

test.beforeEach(async () => {
  await cleanupStaleTestTodos();
});

const title = (suffix) => `pw-e2e-${suffix}-${randomUUID()}`;
// Item scope by title text. Only valid while the item is NOT in edit mode
// (edit mode replaces the title span with an input, so hasText stops matching).
const todoByTitle = (page, value) =>
  page.getByTestId("todo-item").filter({ hasText: value });

async function openApp(page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();
  await expect(page.getByTestId("loading-state")).toHaveCount(0);
}

async function addTodo(page, value) {
  await page.getByTestId("new-todo-input").fill(value);
  await page.getByTestId("add-todo-btn").click();
  await expect(todoByTitle(page, value)).toBeVisible();
}

async function editTodoTitle(page, oldValue, newValue) {
  await page.getByRole("button", { name: `Edit task: ${oldValue}` }).click();
  await page.getByTestId("edit-todo-input").fill(newValue);
  await page.getByTestId("save-todo-btn").click();
}

async function deleteTodo(page, value) {
  const item = todoByTitle(page, value);
  // confirm() blocks the click synchronously; register before clicking.
  page.once("dialog", (dialog) => dialog.accept());
  await item.getByTestId("delete-todo-btn").click();
  await expect(item).toHaveCount(0);
}

function collectSeriousBrowserErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function expectNoHorizontalOverflow(page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
}

async function expectControlInViewport(locator, viewport) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, "visible control must have a layout box").not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
}

test.describe("Todo app real E2E", () => {
  test("creates, reloads, edits, toggles, soft-deletes, and stays clean after reload", async ({ page }) => {
    const initialTitle = title("initial");
    const updatedTitle = title("updated");
    const errors = collectSeriousBrowserErrors(page);

    await openApp(page);
    await addTodo(page, initialTitle);
    await page.reload();
    await expect(todoByTitle(page, initialTitle)).toBeVisible();

    await editTodoTitle(page, initialTitle, updatedTitle);
    await expect(todoByTitle(page, updatedTitle)).toBeVisible();
    await expect(todoByTitle(page, initialTitle)).toHaveCount(0);

    const updatedItem = todoByTitle(page, updatedTitle);
    const checkbox = updatedItem.getByTestId("todo-complete-checkbox");
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();

    await deleteTodo(page, updatedTitle);
    await page.reload();
    await expect(todoByTitle(page, updatedTitle)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("blocks a blank title client-side", async ({ page }) => {
    await openApp(page);
    await page.getByTestId("add-todo-btn").click();
    await expect(page.getByText("Title cannot be empty.")).toBeVisible();
    await expect(page.getByTestId("app-error")).toHaveCount(0);
  });

  test("shows the empty state after UI soft delete", async ({ page }) => {
    const value = title("empty-state");
    await openApp(page);
    await addTodo(page, value);
    await deleteTodo(page, value);
    await expect(page.getByTestId("empty-state")).toBeVisible();
  });

  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 375, height: 812 },
  ]) {
    test(`keeps form and todo controls usable without overflow on ${viewport.name}`, async ({ page }) => {
      const value = title(`responsive-${viewport.name}`);
      const updatedValue = title(`responsive-edit-${viewport.name}`);
      await page.setViewportSize(viewport);
      await openApp(page);
      await expectNoHorizontalOverflow(page);
      await expectControlInViewport(page.getByTestId("new-todo-input"), viewport);
      await expectControlInViewport(page.getByTestId("add-todo-btn"), viewport);

      await addTodo(page, value);
      const item = todoByTitle(page, value);
      await expectControlInViewport(item.getByTestId("todo-complete-checkbox"), viewport);
      await expectControlInViewport(item.getByTestId("edit-todo-btn"), viewport);
      await expectControlInViewport(item.getByTestId("delete-todo-btn"), viewport);

      await page.getByRole("button", { name: `Edit task: ${value}` }).click();
      await expectControlInViewport(page.getByTestId("edit-todo-input"), viewport);
      await expectControlInViewport(page.getByTestId("save-todo-btn"), viewport);
      await expectControlInViewport(page.getByTestId("cancel-edit-btn"), viewport);
      await page.getByTestId("edit-todo-input").fill(updatedValue);
      await page.getByTestId("save-todo-btn").click();
      await expect(todoByTitle(page, updatedValue)).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await deleteTodo(page, updatedValue);
    });
  }
});
