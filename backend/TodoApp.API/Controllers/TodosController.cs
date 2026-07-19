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
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(await todoService.GetAllAsync(cancellationToken));

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
}
