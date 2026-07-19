using Microsoft.EntityFrameworkCore;
using TodoApp.Application.DTOs;
using TodoApp.Application.Interfaces;
using TodoApp.Domain.Entities;

namespace TodoApp.Infrastructure.Data;

public sealed class TodoService(TodoDbContext dbContext) : ITodoService
{
    public async Task<IReadOnlyList<TodoItemResponse>> GetAllAsync(CancellationToken cancellationToken) =>
        await dbContext.TodoItems.AsNoTracking().OrderByDescending(item => item.CreatedAt)
            .Select(item => ToResponse(item)).ToListAsync(cancellationToken);

    public async Task<TodoItemResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        await dbContext.TodoItems.AsNoTracking().Where(item => item.Id == id)
            .Select(item => ToResponse(item)).SingleOrDefaultAsync(cancellationToken);

    public async Task<TodoItemResponse> CreateAsync(CreateTodoRequest request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var item = new TodoItem { Id = Guid.NewGuid(), Title = NormalizeTitle(request.Title), CreatedAt = now, UpdatedAt = now };
        dbContext.TodoItems.Add(item);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(item);
    }

    public async Task<TodoItemResponse?> UpdateAsync(Guid id, UpdateTodoRequest request, CancellationToken cancellationToken)
    {
        var item = await dbContext.TodoItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (item is null) return null;
        item.Title = NormalizeTitle(request.Title);
        if (request.IsCompleted.HasValue)
            item.IsCompleted = request.IsCompleted.Value;
        item.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(item);
    }

    public async Task<TodoItemResponse?> UpdateCompletionAsync(Guid id, UpdateTodoCompletionRequest request, CancellationToken cancellationToken)
    {
        var item = await dbContext.TodoItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (item is null) return null;
        item.IsCompleted = request.IsCompleted;
        item.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(item);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var item = await dbContext.TodoItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (item is null) return false;
        var now = DateTime.UtcNow;
        item.IsDeleted = true;
        item.DeletedAt = now;
        item.UpdatedAt = now;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string NormalizeTitle(string title) => title.Trim();
    private static TodoItemResponse ToResponse(TodoItem item) => new(item.Id, item.Title, item.IsCompleted, item.CreatedAt, item.UpdatedAt);
}
