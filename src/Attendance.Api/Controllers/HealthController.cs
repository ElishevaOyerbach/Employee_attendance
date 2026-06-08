using System.Security.Claims;
using Attendance.Application.Interfaces;
using Attendance.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Api.Controllers;

/// <summary>
/// Stage 0 sanity check: proves the app boots, DI resolves,
/// the DbContext maps to the existing tables, and SQL Server is reachable.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITimeProvider _time;

    public HealthController(AppDbContext db, ITimeProvider time)
    {
        _db = db;
        _time = time;
    }

    [HttpGet("db")]
    public async Task<IActionResult> Db()
    {
        var canConnect = await _db.Database.CanConnectAsync();
        var userCount = canConnect ? await _db.Users.CountAsync() : 0;

        return Ok(new
        {
            canConnect,
            userCount,
            serverTime = _time.Now,
            today = _time.Today
        });
    }

    /// <summary>
    /// Verifies the external Europe/Zurich time source is reachable and shows
    /// that the time is served by ExternalZurichTimeProvider (TimeAPI.io).
    /// </summary>
    [HttpGet("external-time")]
    public async Task<IActionResult> ExternalTime(
        [FromServices] IExternalTimeProvider externalTime, CancellationToken ct)
    {
        var zurichTime = await externalTime.GetCurrentTimeAsync(ct);
        return Ok(new
        {
            source = "ExternalZurichTimeProvider (TimeAPI.io, Europe/Zurich)",
            zurichTime,
            serverTime = _time.Now
        });
    }

    /// <summary>Protected probe: requires a valid JWT; echoes the caller's claims.</summary>
    [Authorize]
    [HttpGet("whoami")]
    public IActionResult WhoAmI()
    {
        return Ok(new
        {
            userId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier),
            email = User.FindFirstValue(ClaimTypes.Email),
            role = User.FindFirstValue(ClaimTypes.Role),
            name = User.FindFirstValue("name")
        });
    }
}
