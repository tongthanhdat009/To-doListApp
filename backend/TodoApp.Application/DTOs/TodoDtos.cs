using System.ComponentModel.DataAnnotations;

namespace TodoApp.Application.DTOs;

/// <summary>A to-do item returned by the API.</summary>
public sealed record TodoItemResponse(Guid Id, string Title, bool IsCompleted, DateTime CreatedAt, DateTime UpdatedAt);

/// <summary>Payload for creating a to-do item.</summary>
public sealed record CreateTodoRequest
{
    [Required, StringLength(200, MinimumLength = 1)]
    public required string Title { get; init; }
}

/// <summary>Payload for replacing a to-do item.</summary>
public sealed record UpdateTodoRequest
{
    [Required, StringLength(200, MinimumLength = 1)]
    public required string Title { get; init; }

    public bool? IsCompleted { get; init; }
}

/// <summary>Payload for changing a to-do item's completion state.</summary>
public sealed record UpdateTodoCompletionRequest
{
    public required bool IsCompleted { get; init; }
}
