namespace TodoApp.Application.Exceptions;

/// <summary>Thrown when a to-do item fails domain validation (e.g. blank title).</summary>
public sealed class TodoValidationException(string message) : Exception(message);
