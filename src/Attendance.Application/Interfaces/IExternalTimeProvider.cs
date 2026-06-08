namespace Attendance.Application.Interfaces;

/// <summary>
/// Authoritative current time for attendance punches, fetched from an external
/// source (TimeAPI.io, Europe/Zurich). Unlike <see cref="ITimeProvider"/> this is
/// asynchronous and may fail; on failure it throws and the punch must NOT proceed
/// (no fallback to the server clock).
/// </summary>
public interface IExternalTimeProvider
{
    Task<DateTimeOffset> GetCurrentTimeAsync(CancellationToken ct = default);
}
