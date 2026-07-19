using TodoApp.Application.DTOs;
using TodoApp.Application.Exceptions;
using TodoApp.Application.Interfaces;
using TodoApp.Domain.Entities;

namespace TodoApp.Application.Services;

/// <summary>Owns to-do title validation/normalization and create/update/complete/delete business rules.</summary>
public sealed class TodoService(ITodoRepository repository) : ITodoService
{
    public async Task<IReadOnlyList<TodoItemResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        var items = await repository.GetAllAsync(cancellationToken);
        return items.Select(ToResponse).ToArray();
    }

    public async Task<TodoItemResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var item = await repository.GetByIdAsync(id, cancellationToken);
        return item is null ? null : ToResponse(item);
    }

    public async Task<TodoItemResponse> CreateAsync(CreateTodoRequest request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var item = new TodoItem
        {
            Id = Guid.NewGuid(),
            Title = NormalizeTitle(request.Title),
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
        var item = await repository.GetForUpdateAsync(id, cancellationToken);
        if (item is null) return null;
        item.Title = title;
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

    private static string NormalizeTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new TodoValidationException("Title cannot be blank.");
        return title.Trim();
    }

    private static TodoItemResponse ToResponse(TodoItem item) =>
        new(item.Id, item.Title, item.IsCompleted, item.CreatedAt, item.UpdatedAt);
}
