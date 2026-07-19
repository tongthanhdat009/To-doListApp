using TodoApp.Application.DTOs;

namespace TodoApp.Application.Interfaces;

public interface ITodoService
{
    Task<IReadOnlyList<TodoItemResponse>> GetAllAsync(CancellationToken cancellationToken);
    Task<TodoItemResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<TodoItemResponse> CreateAsync(CreateTodoRequest request, CancellationToken cancellationToken);
    Task<TodoItemResponse?> UpdateAsync(Guid id, UpdateTodoRequest request, CancellationToken cancellationToken);
    Task<TodoItemResponse?> UpdateCompletionAsync(Guid id, UpdateTodoCompletionRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
