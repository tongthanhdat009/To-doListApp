using TodoApp.Application.DTOs;
using TodoApp.Domain.Entities;

namespace TodoApp.Application.Interfaces;

/// <summary>Persistence abstraction for to-do items. Owns only data access, not business rules.</summary>
public interface ITodoRepository
{
    Task<PagedResponse<TodoItem>> GetPageAsync(TodoListQuery query, CancellationToken cancellationToken);
    Task<PagedResponse<TodoItem>> GetTrashPageAsync(TrashTodoQuery query, CancellationToken cancellationToken);
    Task<TodoItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<TodoItem?> GetForUpdateAsync(Guid id, CancellationToken cancellationToken);
    Task<TodoItem?> GetAnyForUpdateAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(TodoItem item, CancellationToken cancellationToken);
    void Remove(TodoItem item);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
