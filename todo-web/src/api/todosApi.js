import { apiRequest } from "./http";

function queryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") query.set(key, value);
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

export function fetchTodos(params) {
  return apiRequest(`/api/todos${queryString(params)}`);
}

export function fetchTrash(params) {
  return apiRequest(`/api/todos/trash${queryString(params)}`);
}

export function createTodo(todo) {
  return apiRequest("/api/todos", { method: "POST", body: JSON.stringify(todo) });
}

export function updateTodo(id, todo) {
  return apiRequest(`/api/todos/${id}`, { method: "PUT", body: JSON.stringify(todo) });
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

export function restoreTodo(id) {
  return apiRequest(`/api/todos/${id}/restore`, { method: "POST" });
}

export function permanentlyDeleteTodo(id) {
  return apiRequest(`/api/todos/${id}/permanent`, { method: "DELETE" });
}
