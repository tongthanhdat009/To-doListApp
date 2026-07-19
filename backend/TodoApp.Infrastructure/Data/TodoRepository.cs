using Microsoft.EntityFrameworkCore;
using TodoApp.Application.DTOs;
using TodoApp.Application.Interfaces;
using TodoApp.Domain.Entities;

namespace TodoApp.Infrastructure.Data;

/// <summary>EF Core persistence implementation. The active soft-delete global filter applies to normal queries.</summary>
public sealed class TodoRepository(TodoDbContext dbContext) : ITodoRepository
{
    public async Task<PagedResponse<TodoItem>> GetPageAsync(TodoListQuery query, CancellationToken cancellationToken)
    {
        IQueryable<TodoItem> items = dbContext.TodoItems.AsNoTracking();
        items = query.Status switch
        {
            "active" => items.Where(item => !item.IsCompleted),
            "completed" => items.Where(item => item.IsCompleted),
            _ => items
        };

        var search = query.Search?.Trim();
        if (!string.IsNullOrEmpty(search))
            items = items.Where(item => EF.Functions.ILike(item.Title, $"%{search}%"));
        if (query.DueDateFrom.HasValue)
            items = items.Where(item => item.DueDate >= query.DueDateFrom);
        if (query.DueDateTo.HasValue)
            items = items.Where(item => item.DueDate <= query.DueDateTo);

        items = query.Sort switch
        {
            "oldest" => items.OrderBy(item => item.CreatedAt).ThenBy(item => item.Id),
            "incomplete" => items.OrderBy(item => item.IsCompleted).ThenByDescending(item => item.CreatedAt).ThenBy(item => item.Id),
            "completed" => items.OrderByDescending(item => item.IsCompleted).ThenByDescending(item => item.CreatedAt).ThenBy(item => item.Id),
            _ => items.OrderByDescending(item => item.CreatedAt).ThenBy(item => item.Id)
        };
        return await ToPageAsync(items, query.Page, query.PageSize, cancellationToken);
    }

    public Task<PagedResponse<TodoItem>> GetTrashPageAsync(TrashTodoQuery query, CancellationToken cancellationToken) =>
        ToPageAsync(dbContext.TodoItems.IgnoreQueryFilters().AsNoTracking().Where(item => item.IsDeleted)
            .OrderByDescending(item => item.DeletedAt).ThenBy(item => item.Id), query.Page, query.PageSize, cancellationToken);

    public Task<TodoItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.TodoItems.AsNoTracking().SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

    public Task<TodoItem?> GetForUpdateAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.TodoItems.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

    public Task<TodoItem?> GetAnyForUpdateAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.TodoItems.IgnoreQueryFilters().SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

    public Task AddAsync(TodoItem item, CancellationToken cancellationToken) =>
        dbContext.TodoItems.AddAsync(item, cancellationToken).AsTask();

    public void Remove(TodoItem item) => dbContext.TodoItems.Remove(item);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken) => dbContext.SaveChangesAsync(cancellationToken);

    private static async Task<PagedResponse<TodoItem>> ToPageAsync(
        IQueryable<TodoItem> query, int page, int pageSize, CancellationToken cancellationToken)
    {
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PagedResponse<TodoItem>(items, page, pageSize, totalCount, totalPages, page > 1, page < totalPages);
    }
}
