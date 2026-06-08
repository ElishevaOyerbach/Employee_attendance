using Attendance.Application.Common.Exceptions;
using Attendance.Application.Dtos.Reports;
using Attendance.Application.Entities;
using Attendance.Application.Enums;
using Attendance.Application.Interfaces;
using Attendance.Application.Mapping;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Application.Services;

public class ReportService : IReportService
{
    private readonly IApplicationDbContext _db;
    private readonly ITimeProvider _time;
    private readonly ICurrentUser _currentUser;

    public ReportService(IApplicationDbContext db, ITimeProvider time, ICurrentUser currentUser)
    {
        _db = db;
        _time = time;
        _currentUser = currentUser;
    }

    public Task<MonthlySummaryResponse> GetMyMonthlyAsync(int? year, int? month, CancellationToken ct = default)
        => BuildMonthlyAsync(_currentUser.UserId, year, month, ct);

    public async Task<MonthlySummaryResponse> GetEmployeeMonthlyAsync(int userId, int? year, int? month, CancellationToken ct = default)
    {
        var exists = await _db.Users.AnyAsync(u => u.Id == userId, ct);
        if (!exists)
            throw NotFoundException.For(nameof(User), userId);

        return await BuildMonthlyAsync(userId, year, month, ct);
    }

    private async Task<MonthlySummaryResponse> BuildMonthlyAsync(int userId, int? year, int? month, CancellationToken ct)
    {
        var today = _time.Today;
        var y = year ?? today.Year;
        var m = month ?? today.Month;

        if (m is < 1 or > 12)
            throw new ValidationException("Month must be between 1 and 12.");

        var first = new DateOnly(y, m, 1);
        var last = first.AddMonths(1).AddDays(-1);

        // Only Completed shifts count toward final figures (PendingReview/Active are excluded).
        var records = await _db.AttendanceRecords
            .AsNoTracking()
            .Where(r => r.UserId == userId
                        && r.Status == AttendanceStatus.Completed
                        && r.WorkDate >= first
                        && r.WorkDate <= last)
            .ToListAsync(ct);

        await PopulateBreaksAsync(records, ct);

        var now = _time.Now;
        var days = records
            .GroupBy(r => r.WorkDate)
            .Select(g => BuildDay(g, now))
            .OrderBy(d => d.Date)
            .ToList();

        return new MonthlySummaryResponse
        {
            UserId = userId,
            Year = y,
            Month = m,
            DaysWorked = days.Count,
            TotalWorkedMinutes = days.Sum(d => d.WorkedMinutes),
            TotalBreakMinutes = days.Sum(d => d.BreakMinutes),
            TotalExpectedMinutes = days.Sum(d => d.ExpectedMinutes),
            TotalOvertimeMinutes = days.Sum(d => d.OvertimeMinutes),
            TotalMissingMinutes = days.Sum(d => d.MissingMinutes),
            NetDifferenceMinutes = days.Sum(d => d.WorkedMinutes) - days.Sum(d => d.ExpectedMinutes),
            Days = days
        };
    }

    public Task<RangeReportResponse> GetMyRangeReportAsync(DateOnly from, DateOnly to, CancellationToken ct = default)
        => BuildRangeAsync(from, to, userId: _currentUser.UserId, ct);

    public Task<RangeReportResponse> GetTeamRangeReportAsync(DateOnly from, DateOnly to, int? userId, CancellationToken ct = default)
        => BuildRangeAsync(from, to, userId, ct);

    private async Task<RangeReportResponse> BuildRangeAsync(
        DateOnly from, DateOnly to, int? userId, CancellationToken ct)
    {
        if (to < from)
            throw new ValidationException("'to' date must be on or after 'from'.");
        if (to.DayNumber - from.DayNumber > 366)
            throw new ValidationException("Date range cannot exceed one year.");

        var query = _db.AttendanceRecords
            .AsNoTracking()
            .Include(r => r.User)
            .Where(r => r.WorkDate >= from && r.WorkDate <= to);

        if (userId.HasValue)
            query = query.Where(r => r.UserId == userId.Value);

        var records = await query
            .OrderBy(r => r.WorkDate)
            .ThenBy(r => r.ClockInTime)
            .ToListAsync(ct);

        await PopulateBreaksAsync(records, ct);

        var now = _time.Now;

        var rows = records.Select(r =>
        {
            var dto = r.ToDto(now);
            return new AttendanceReportRow
            {
                UserId = r.UserId,
                FullName = r.User.FullName,
                WorkDate = r.WorkDate,
                ClockInTime = r.ClockInTime,
                ClockOutTime = r.ClockOutTime,
                WorkedMinutes = dto.WorkedMinutes,
                BreakMinutes = dto.BreakMinutes,
                Status = r.Status.ToString()
            };
        }).ToList();

        var completed = rows.Where(r => r.Status == "Completed").ToList();

        return new RangeReportResponse
        {
            From = from,
            To = to,
            TotalWorkedMinutes = completed.Sum(r => r.WorkedMinutes),
            TotalBreakMinutes = completed.Sum(r => r.BreakMinutes),
            DaysWorked = completed.DistinctBy(r => r.WorkDate).Count(),
            OpenShiftsCount = rows.Count(r => r.Status is "Active" or "PendingReview"),
            Rows = rows
        };
    }

    private async Task PopulateBreaksAsync(List<AttendanceRecord> records, CancellationToken ct)
    {
        if (records.Count == 0) return;

        var ids = records.Select(r => r.Id).ToList();
        var breaks = await _db.Breaks
            .AsNoTracking()
            .Where(b => ids.Contains(b.AttendanceRecordId))
            .ToListAsync(ct);

        var grouped = breaks.ToLookup(b => b.AttendanceRecordId);
        foreach (var record in records)
            record.Breaks = grouped[record.Id].ToList();
    }

    /// <summary>
    /// Aggregates one work-day. Worked/break reuse the same calculation as the
    /// attendance DTO; the day's expected quota comes from the per-shift snapshot.
    /// Overtime/missing are computed on the daily totals (the quota is daily).
    /// </summary>
    private static DailySummaryResponse BuildDay(IGrouping<DateOnly, AttendanceRecord> dayShifts, DateTime now)
    {
        var dtos = dayShifts.Select(r => r.ToDto(now)).ToList();

        var worked = dtos.Sum(d => d.WorkedMinutes);
        var breaks = dtos.Sum(d => d.BreakMinutes);
        var expected = (int)Math.Round((double)dayShifts.First().ExpectedDailyHoursSnapshot * 60);

        return new DailySummaryResponse
        {
            Date = dayShifts.Key,
            WorkedMinutes = worked,
            BreakMinutes = breaks,
            ExpectedMinutes = expected,
            OvertimeMinutes = Math.Max(0, worked - expected),
            MissingMinutes = Math.Max(0, expected - worked)
        };
    }
}
