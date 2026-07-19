const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5162";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseErrorMessage(response) {
  try {
    const data = await response.json();
    if (typeof data?.message === "string" && data.message.trim()) return data.message;
    if (typeof data?.title === "string" && data.title.trim()) return data.title;
    if (data?.errors && typeof data.errors === "object") {
      const firstField = Object.values(data.errors)[0];
      const firstMessage = Array.isArray(firstField) ? firstField[0] : firstField;
      if (firstMessage) return String(firstMessage);
    }
  } catch {
    // Non-JSON error body.
  }
  return null;
}

function friendlyStatusMessage(status) {
  if (status === 404) return "Task not found. It may have already been removed.";
  if (status === 400) return "Please check the task details and try again.";
  if (status >= 500) return "Server error. Please try again in a moment.";
  return "Something went wrong. Please try again.";
}

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Check your connection and that the API is running.",
      0,
    );
  }

  if (!response.ok) {
    const parsedMessage = await parseErrorMessage(response);
    throw new ApiError(parsedMessage ?? friendlyStatusMessage(response.status), response.status);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
