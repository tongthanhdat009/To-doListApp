using Microsoft.AspNetCore.Mvc;
using TodoApp.Application.DTOs;
using TodoApp.Application.Exceptions;
using TodoApp.Application.Interfaces;

namespace TodoApp.API.Controllers;

[ApiController]
[Route("api/todos")]
public sealed class TodosController(ITodoService todoService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] TodoListQuery query, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await todoService.GetAllAsync(query, cancellationToken));
        }
        catch (TodoValidationException exception)
        {
            return ValidationProblem(detail: exception.Message);
        }
    }

    [HttpGet("trash")]
    public async Task<IActionResult> GetTrash([FromQuery] TrashTodoQuery query, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await todoService.GetTrashAsync(query, cancellationToken));
        }
        catch (TodoValidationException exception)
        {
            return ValidationProblem(detail: exception.Message);
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var item = await todoService.GetByIdAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTodoRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        try
        {
            var item = await todoService.CreateAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
        }
        catch (TodoValidationException exception)
        {
            return ValidationProblem(detail: exception.Message);
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTodoRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        try
        {
            var item = await todoService.UpdateAsync(id, request, cancellationToken);
            return item is null ? NotFound() : Ok(item);
        }
        catch (TodoValidationException exception)
        {
            return ValidationProblem(detail: exception.Message);
        }
    }

    [HttpPatch("{id:guid}/completion")]
    public async Task<IActionResult> UpdateCompletion(Guid id, [FromBody] UpdateTodoCompletionRequest request, CancellationToken cancellationToken)
    {
        var item = await todoService.UpdateCompletionAsync(id, request, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await todoService.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> Restore(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var item = await todoService.RestoreAsync(id, cancellationToken);
            return item is null ? NotFound() : Ok(item);
        }
        catch (TodoValidationException exception)
        {
            return ValidationProblem(detail: exception.Message);
        }
    }

    [HttpDelete("{id:guid}/permanent")]
    public async Task<IActionResult> PermanentDelete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await todoService.PermanentDeleteAsync(id, cancellationToken);
        return deleted switch
        {
            null => NotFound(),
            false => ValidationProblem(detail: "Only deleted to-do items can be permanently deleted."),
            true => NoContent()
        };
    }
}
