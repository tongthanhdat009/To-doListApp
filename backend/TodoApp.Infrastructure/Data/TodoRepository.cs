using Microsoft.EntityFrameworkCore;
using TodoApp.Application.Interfaces;
using TodoApp.Domain.Entities;

namespace TodoApp.Infrastructure.Data;

/// <summary>EF Core persistence implementation. Reads are no-tracking; the active soft-delete
/// global query filter (<see cref="Configurations.TodoItemConfiguration"/>) applies to all queries.</summary>
public sealed class TodoRepository(TodoDbContext dbContext) : ITodoRepository
{
    public async Task<IReadOnlyList<TodoItem>> GetAllAsync(CancellationToken cancellationToken) =>
        await dbContext.TodoItems.AsNoTracking().OrderByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<TodoItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.TodoItems.AsNoTracking().SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

    public Task<TodoItem?> GetForUpdateAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.TodoItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

    public Task AddAsync(TodoItem item, CancellationToken cancellationToken) =>
        dbContext.TodoItems.AddAsync(item, cancellationToken).AsTask();

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
