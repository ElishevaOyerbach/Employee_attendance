using Attendance.Application.Dtos.Corrections;
using Attendance.Application.Enums;
using Attendance.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/corrections")]
[Authorize]
public class CorrectionsController : ControllerBase
{
    private readonly ICorrectionService _corrections;

    public CorrectionsController(ICorrectionService corrections)
    {
        _corrections = corrections;
    }

    /// <summary>Employee creates a correction request for one of their own shifts.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCorrectionRequestDto request, CancellationToken ct)
        => Ok(await _corrections.CreateAsync(request, ct));

    /// <summary>The caller's own correction requests.</summary>
    [HttpGet("me")]
    public async Task<IActionResult> Mine(CancellationToken ct)
        => Ok(await _corrections.GetMineAsync(ct));

    /// <summary>All correction requests (manager only), optionally filtered by ?status=Pending.</summary>
    [HttpGet]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> All([FromQuery] CorrectionStatus? status, CancellationToken ct)
        => Ok(await _corrections.GetAllAsync(status, ct));

    /// <summary>Manager approves or rejects a pending request.</summary>
    [HttpPost("{id:int}/review")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Review(int id, [FromBody] ReviewCorrectionRequestDto request, CancellationToken ct)
        => Ok(await _corrections.ReviewAsync(id, request, ct));
}
