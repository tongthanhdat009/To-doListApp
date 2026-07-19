import { apiRequest } from "./http";

export function fetchTodos() {
  return apiRequest("/api/todos");
}

export function createTodo(title) {
  return apiRequest("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function updateTodo(id, title) {
  return apiRequest(`/api/todos/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title }),
  });
}

export function setTodoCompletion(id, isCompleted) {
  return apiRequest(`/api/todos/${id}/completion`, {
    method: "PATCH",
    body: JSON.stringify({ isCompleted }),
  });
}

export function deleteTodo(id) {
  return apiRequest(`/api/todos/${id}`, { method: "DELETE" });
}
