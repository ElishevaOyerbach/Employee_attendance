using Attendance.Application.Dtos.Corrections;
using Attendance.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // any authenticated user (Employee or Manager) may clock their own time
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendance;

    public AttendanceController(IAttendanceService attendance)
    {
        _attendance = attendance;
    }

    [HttpPost("clock-in")]
    public async Task<IActionResult> ClockIn(CancellationToken ct)
        => Ok(await _attendance.ClockInAsync(ct));

    [HttpPost("clock-out")]
    public async Task<IActionResult> ClockOut(CancellationToken ct)
        => Ok(await _attendance.ClockOutAsync(ct));

    [HttpPost("break/start")]
    public async Task<IActionResult> StartBreak(CancellationToken ct)
        => Ok(await _attendance.StartBreakAsync(ct));

    [HttpPost("break/end")]
    public async Task<IActionResult> EndBreak(CancellationToken ct)
        => Ok(await _attendance.EndBreakAsync(ct));

    [HttpGet("me/active")]
    public async Task<IActionResult> Current(CancellationToken ct)
        => Ok(await _attendance.GetCurrentAsync(ct));

    [HttpGet("me")]
    public async Task<IActionResult> History(CancellationToken ct)
        => Ok(await _attendance.GetHistoryAsync(ct));

    [HttpGet("me/pending-review")]
    public async Task<IActionResult> PendingReview(CancellationToken ct)
        => Ok(await _attendance.GetPendingReviewAsync(ct));

    /// <summary>
    /// Resolve a PendingReview shift (missed clock-out): submit the estimated
    /// clock-out (and break-end if a break was left open). Creates correction request(s).
    /// </summary>
    [HttpPost("{id:int}/resolve")]
    public async Task<IActionResult> Resolve(int id, [FromBody] ResolvePendingReviewDto request, CancellationToken ct)
        => Ok(await _attendance.ResolvePendingReviewAsync(id, request, ct));
}
