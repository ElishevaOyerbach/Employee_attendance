using System.ComponentModel.DataAnnotations;
using Attendance.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reports;

    public ReportsController(IReportService reports)
    {
        _reports = reports;
    }

    /// <summary>Monthly summary for the authenticated caller. Defaults to the current month.</summary>
    [HttpGet("me/monthly")]
    public async Task<IActionResult> MyMonthly(
        [FromQuery, Range(2000, 2100)] int? year,
        [FromQuery, Range(1, 12)] int? month,
        CancellationToken ct)
        => Ok(await _reports.GetMyMonthlyAsync(year, month, ct));

    /// <summary>Monthly summary for a specific employee (manager only).</summary>
    [HttpGet("employee/{id:int}/monthly")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> EmployeeMonthly(
        int id,
        [FromQuery, Range(2000, 2100)] int? year,
        [FromQuery, Range(1, 12)] int? month,
        CancellationToken ct)
        => Ok(await _reports.GetEmployeeMonthlyAsync(id, year, month, ct));

    /// <summary>Date-range attendance report for the authenticated caller.</summary>
    [HttpGet("me/range")]
    public async Task<IActionResult> MyRange(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        CancellationToken ct)
        => Ok(await _reports.GetMyRangeReportAsync(from, to, ct));

    /// <summary>Date-range attendance report for the whole team (manager only). Pass userId to filter to one employee.</summary>
    [HttpGet("team/range")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> TeamRange(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        [FromQuery] int? userId,
        CancellationToken ct)
        => Ok(await _reports.GetTeamRangeReportAsync(from, to, userId, ct));
}
