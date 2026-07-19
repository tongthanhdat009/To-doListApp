using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TodoApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TodoExpansion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "todo_items",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "due_date",
                table: "todo_items",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "priority",
                table: "todo_items",
                type: "character varying(6)",
                maxLength: 6,
                nullable: false,
                defaultValue: "Medium");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "description",
                table: "todo_items");

            migrationBuilder.DropColumn(
                name: "due_date",
                table: "todo_items");

            migrationBuilder.DropColumn(
                name: "priority",
                table: "todo_items");
        }
    }
}
