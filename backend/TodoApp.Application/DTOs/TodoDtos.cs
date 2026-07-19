using System.ComponentModel.DataAnnotations;

namespace TodoApp.Application.DTOs;

/// <summary>A to-do item returned by the API.</summary>
public sealed record TodoItemResponse(
    Guid Id,
    string Title,
    string? Description,
    string Priority,
    DateOnly? DueDate,
    bool IsCompleted,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? DeletedAt);

/// <summary>A page of results and pagination metadata.</summary>
public sealed record PagedResponse<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages,
    bool HasPreviousPage,
    bool HasNextPage);

/// <summary>Query parameters for active to-do item listings.</summary>
public sealed record TodoListQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string Status { get; init; } = "all";
    public string? Search { get; init; }
    public string Sort { get; init; } = "newest";
    public DateOnly? DueDateFrom { get; init; }
    public DateOnly? DueDateTo { get; init; }
}

/// <summary>Query parameters for deleted to-do item listings.</summary>
public sealed record TrashTodoQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

/// <summary>Payload for creating a to-do item.</summary>
public sealed record CreateTodoRequest
{
    [Required, StringLength(200, MinimumLength = 1)]
    public required string Title { get; init; }

    public string? Description { get; init; }
    public string? Priority { get; init; } = "Medium";
    public DateOnly? DueDate { get; init; }
}

/// <summary>Payload for replacing a to-do item.</summary>
public sealed record UpdateTodoRequest
{
    [Required, StringLength(200, MinimumLength = 1)]
    public required string Title { get; init; }

    public string? Description { get; init; }
    public string? Priority { get; init; } = "Medium";
    public DateOnly? DueDate { get; init; }
    public bool? IsCompleted { get; init; }
}

/// <summary>Payload for changing a to-do item's completion state.</summary>
public sealed record UpdateTodoCompletionRequest
{
    public required bool IsCompleted { get; init; }
}
