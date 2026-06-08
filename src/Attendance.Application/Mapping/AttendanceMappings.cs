using Attendance.Application.Dtos.Attendance;
using Attendance.Application.Entities;
using Attendance.Application.Enums;

namespace Attendance.Application.Mapping;

public static class AttendanceMappings
{
    /// <param name="now">
    /// Reference time used to measure still-open shifts/breaks.
    /// Supplied by the caller via ITimeProvider so the result is deterministic/testable.
    /// </param>
    public static AttendanceRecordDto ToDto(this AttendanceRecord record, DateTime now)
    {
        var breaks = record.Breaks
            .OrderBy(b => b.BreakStartTime)
            .Select(b => b.ToDto(now))
            .ToList();

        var breakMinutes = breaks.Sum(b => b.DurationMinutes);
        var breakSeconds = breaks.Sum(b => b.DurationSeconds);

        var end = record.ClockOutTime ?? now;
        var gross = end - record.ClockInTime;
        var grossMinutes = ToMinutes(gross);
        var grossSeconds = ToSeconds(gross);

        var workedMinutes = Math.Max(0, grossMinutes - breakMinutes);
        var workedSeconds = Math.Max(0, grossSeconds - breakSeconds);

        var activeBreak = record.Breaks.FirstOrDefault(b => b.Status == BreakStatus.Active);

        return new AttendanceRecordDto
        {
            Id = record.Id,
            UserId = record.UserId,
            WorkDate = record.WorkDate,
            Status = record.Status.ToString(),
            ClockInTime = record.ClockInTime,
            ClockOutTime = record.ClockOutTime,
            ExpectedDailyHoursSnapshot = record.ExpectedDailyHoursSnapshot,
            WorkedMinutes = workedMinutes,
            BreakMinutes = breakMinutes,
            WorkedSeconds = workedSeconds,
            BreakSeconds = breakSeconds,
            HasActiveBreak = activeBreak is not null,
            ActiveBreakStartTime = activeBreak?.BreakStartTime,
            Breaks = breaks
        };
    }

    public static BreakDto ToDto(this Break b, DateTime now)
    {
        var end = b.BreakEndTime ?? now;
        var span = end - b.BreakStartTime;
        return new BreakDto
        {
            Id = b.Id,
            BreakStartTime = b.BreakStartTime,
            BreakEndTime = b.BreakEndTime,
            Status = b.Status.ToString(),
            DurationMinutes = ToMinutes(span),
            DurationSeconds = ToSeconds(span),
        };
    }

    private static int ToMinutes(TimeSpan span) =>
        Math.Max(0, (int)Math.Round(span.TotalMinutes));

    private static int ToSeconds(TimeSpan span) =>
        Math.Max(0, (int)Math.Floor(span.TotalSeconds));
}
