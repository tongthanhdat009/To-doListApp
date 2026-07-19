using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TodoApp.Application.Interfaces;
using TodoApp.Application.Services;
using TodoApp.Infrastructure.Data;

namespace TodoApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<TodoDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<ITodoRepository, TodoRepository>();
        services.AddScoped<ITodoService, TodoService>();
        return services;
    }
}
