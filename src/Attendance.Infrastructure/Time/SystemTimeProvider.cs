using Attendance.Application.Interfaces;

namespace Attendance.Infrastructure.Time;

/// <summary>
/// Returns wall-clock time in Europe/Zurich so that display calculations are
/// consistent with the timestamps recorded by ExternalZurichTimeProvider.
/// On .NET 6+ both Windows IANA and Linux IANA IDs are supported natively.
/// </summary>
public sealed class SystemTimeProvider : ITimeProvider
{
    private static readonly TimeZoneInfo _zurich =
        TimeZoneInfo.FindSystemTimeZoneById("Europe/Zurich");

    public DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _zurich);
    public DateTime UtcNow => DateTime.UtcNow;
    public DateOnly Today => DateOnly.FromDateTime(Now);
}
