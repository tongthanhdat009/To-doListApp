using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TodoApp.Domain.Entities;

namespace TodoApp.Infrastructure.Configurations;

public sealed class TodoItemConfiguration : IEntityTypeConfiguration<TodoItem>
{
    public void Configure(EntityTypeBuilder<TodoItem> builder)
    {
        builder.ToTable("todo_items");
        builder.HasKey(item => item.Id);
        builder.Property(item => item.Id).HasColumnName("id");
        builder.Property(item => item.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
        builder.Property(item => item.Description).HasColumnName("description").HasMaxLength(2000);
        builder.Property(item => item.Priority).HasColumnName("priority").HasConversion<string>().HasMaxLength(6)
            .HasDefaultValue(TodoPriority.Medium).HasSentinel(TodoPriority.Medium).IsRequired();
        builder.Property(item => item.DueDate).HasColumnName("due_date").HasColumnType("date");
        builder.Property(item => item.IsCompleted).HasColumnName("is_completed").IsRequired();
        builder.Property(item => item.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(item => item.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(item => item.IsDeleted).HasColumnName("is_deleted").IsRequired();
        builder.Property(item => item.DeletedAt).HasColumnName("deleted_at");
        builder.HasQueryFilter(item => !item.IsDeleted);
    }
}
