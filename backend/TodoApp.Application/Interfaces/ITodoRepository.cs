using TodoApp.Domain.Entities;

namespace TodoApp.Application.Interfaces;

/// <summary>Persistence abstraction for to-do items. Owns only data access, not business rules.</summary>
public interface ITodoRepository
{
    Task<IReadOnlyList<TodoItem>> GetAllAsync(CancellationToken cancellationToken);
    Task<TodoItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<TodoItem?> GetForUpdateAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(TodoItem item, CancellationToken cancellationToken);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
