using TodoApp.Application.DTOs;
using TodoApp.Application.Exceptions;
using TodoApp.Application.Interfaces;
using TodoApp.Domain.Entities;

namespace TodoApp.Application.Services;

/// <summary>Owns to-do validation, lifecycle, and database-backed query composition.</summary>
public sealed class TodoService(ITodoRepository repository) : ITodoService
{
    public async Task<PagedResponse<TodoItemResponse>> GetAllAsync(TodoListQuery query, CancellationToken cancellationToken)
    {
        ValidatePage(query.Page, query.PageSize);
        ValidateStatus(query.Status);
        ValidateSort(query.Sort);
        if (query.DueDateFrom > query.DueDateTo)
            throw new TodoValidationException("dueDateFrom must be on or before dueDateTo.");

        var page = await repository.GetPageAsync(query, cancellationToken);
        return new PagedResponse<TodoItemResponse>(page.Items.Select(ToResponse).ToArray(),
            page.Page, page.PageSize, page.TotalCount, page.TotalPages, page.HasPreviousPage, page.HasNextPage);
    }

    public async Task<TodoItemResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var item = await repository.GetByIdAsync(id, cancellationToken);
        return item is null ? null : ToResponse(item);
    }

    public async Task<PagedResponse<TodoItemResponse>> GetTrashAsync(TrashTodoQuery query, CancellationToken cancellationToken)
    {
        ValidatePage(query.Page, query.PageSize);
        var page = await repository.GetTrashPageAsync(query, cancellationToken);
        return new PagedResponse<TodoItemResponse>(page.Items.Select(ToResponse).ToArray(),
            page.Page, page.PageSize, page.TotalCount, page.TotalPages, page.HasPreviousPage, page.HasNextPage);
    }

    public async Task<TodoItemResponse> CreateAsync(CreateTodoRequest request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var item = new TodoItem
        {
            Id = Guid.NewGuid(),
            Title = NormalizeTitle(request.Title),
            Description = NormalizeDescription(request.Description),
            Priority = ParsePriority(request.Priority),
            DueDate = request.DueDate,
            CreatedAt = now,
            UpdatedAt = now
        };
        await repository.AddAsync(item, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return ToResponse(item);
    }

    public async Task<TodoItemResponse?> UpdateAsync(Guid id, UpdateTodoRequest request, CancellationToken cancellationToken)
    {
        var title = NormalizeTitle(request.Title);
        var description = NormalizeDescription(request.Description);
        var priority = ParsePriority(request.Priority);
        var item = await repository.GetForUpdateAsync(id, cancellationToken);
        if (item is null) return null;
        item.Title = title;
        item.Description = description;
        item.Priority = priority;
        item.DueDate = request.DueDate;
        if (request.IsCompleted.HasValue)
            item.IsCompleted = request.IsCompleted.Value;
        item.UpdatedAt = DateTime.UtcNow;
        await repository.SaveChangesAsync(cancellationToken);
        return ToResponse(item);
    }

    public async Task<TodoItemResponse?> UpdateCompletionAsync(Guid id, UpdateTodoCompletionRequest request, CancellationToken cancellationToken)
    {
        var item = await repository.GetForUpdateAsync(id, cancellationToken);
        if (item is null) return null;
        item.IsCompleted = request.IsCompleted;
        item.UpdatedAt = DateTime.UtcNow;
        await repository.SaveChangesAsync(cancellationToken);
        return ToResponse(item);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var item = await repository.GetForUpdateAsync(id, cancellationToken);
        if (item is null) return false;
        var now = DateTime.UtcNow;
        item.IsDeleted = true;
        item.DeletedAt = now;
        item.UpdatedAt = now;
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<TodoItemResponse?> RestoreAsync(Guid id, CancellationToken cancellationToken)
    {
        var item = await repository.GetAnyForUpdateAsync(id, cancellationToken);
        if (item is null) return null;
        if (!item.IsDeleted)
            throw new TodoValidationException("Only deleted to-do items can be restored.");
        item.IsDeleted = false;
        item.DeletedAt = null;
        item.UpdatedAt = DateTime.UtcNow;
        await repository.SaveChangesAsync(cancellationToken);
        return ToResponse(item);
    }

    public async Task<bool?> PermanentDeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var item = await repository.GetAnyForUpdateAsync(id, cancellationToken);
        if (item is null) return null;
        if (!item.IsDeleted) return false;
        repository.Remove(item);
        await repository.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static void ValidatePage(int page, int pageSize)
    {
        if (page < 1) throw new TodoValidationException("page must be at least 1.");
        if (pageSize is < 1 or > 100) throw new TodoValidationException("pageSize must be between 1 and 100.");
    }

    private static string ValidateStatus(string? status) => status switch
    {
        "all" or "active" or "completed" => status,
        _ => throw new TodoValidationException("status must be all, active, or completed.")
    };

    private static string ValidateSort(string? sort) => sort switch
    {
        "newest" or "oldest" or "incomplete" or "completed" => sort,
        _ => throw new TodoValidationException("sort must be newest, oldest, incomplete, or completed.")
    };

    private static string NormalizeTitle(string? title)
    {
        var normalized = title?.Trim();
        if (string.IsNullOrEmpty(normalized)) throw new TodoValidationException("Title cannot be blank.");
        if (normalized.Length > 200) throw new TodoValidationException("Title cannot exceed 200 characters.");
        return normalized;
    }

    private static string? NormalizeDescription(string? description)
    {
        var normalized = description?.Trim();
        if (string.IsNullOrEmpty(normalized)) return null;
        if (normalized.Length > 2000) throw new TodoValidationException("Description cannot exceed 2000 characters.");
        return normalized;
    }

    private static TodoPriority ParsePriority(string? priority) => priority switch
    {
        "Low" => TodoPriority.Low,
        "Medium" or null => TodoPriority.Medium,
        "High" => TodoPriority.High,
        _ => throw new TodoValidationException("priority must be Low, Medium, or High.")
    };

    private static TodoItemResponse ToResponse(TodoItem item) =>
        new(item.Id, item.Title, item.Description, item.Priority.ToString(), item.DueDate, item.IsCompleted,
            item.CreatedAt, item.UpdatedAt, item.DeletedAt);
}
