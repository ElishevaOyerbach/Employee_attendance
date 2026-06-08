using Attendance.Application.Common.Exceptions;
using Attendance.Application.Dtos.Attendance;
using Attendance.Application.Dtos.Corrections;
using Attendance.Application.Entities;
using Attendance.Application.Enums;
using Attendance.Application.Interfaces;
using Attendance.Application.Mapping;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Application.Services;

public class AttendanceService : IAttendanceService
{
    private readonly IApplicationDbContext _db;
    private readonly ITimeProvider _time;
    private readonly IExternalTimeProvider _externalTime;
    private readonly ICurrentUser _currentUser;
    private readonly IAuditService _audit;

    public AttendanceService(
        IApplicationDbContext db,
        ITimeProvider time,
        IExternalTimeProvider externalTime,
        ICurrentUser currentUser,
        IAuditService audit)
    {
        _db = db;
        _time = time;
        _externalTime = externalTime;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<AttendanceRecordDto> ClockInAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;

        // Authoritative Europe/Zurich time. Throws (and aborts the punch) if unavailable.
        var now = (await _externalTime.GetCurrentTimeAsync(ct)).DateTime;
        var today = DateOnly.FromDateTime(now);

        var activeShift = await _db.AttendanceRecords
            .Include(r => r.Breaks)
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Status == AttendanceStatus.Active, ct);

        if (activeShift is not null)
        {
            // An open shift from today means a genuine double clock-in - reject it.
            if (activeShift.WorkDate >= today)
                throw new ConflictException("You already have an open shift today. Clock out before clocking in again.");

            // An open shift from a previous day means a missed clock-out:
            // flag it (and any open break) for review so a new shift can start.
            // Persisted BEFORE inserting the new shift so the "one active shift"
            // filtered unique index never sees two active rows at once.
            await FlagStaleShiftForReviewAsync(activeShift, today, userId, now, ct);
        }

        var expectedDailyHours = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.ExpectedDailyHours)
            .FirstAsync(ct);

        var record = new AttendanceRecord
        {
            UserId = userId,
            WorkDate = today,
            ClockInTime = now,
            Status = AttendanceStatus.Active,
            ExpectedDailyHoursSnapshot = expectedDailyHours,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.AttendanceRecords.Add(record);
        await _db.SaveChangesAsync(ct);

        return record.ToDto(now);
    }

    private async Task FlagStaleShiftForReviewAsync(
        AttendanceRecord staleShift, DateOnly today, int userId, DateTime now, CancellationToken ct)
    {
        staleShift.Status = AttendanceStatus.PendingReview;
        staleShift.UpdatedAt = now;

        foreach (var b in staleShift.Breaks.Where(b => b.Status == BreakStatus.Active))
        {
            b.Status = BreakStatus.PendingReview;
            b.UpdatedAt = now;
        }

        _audit.Log(
            AuditAction.ShiftAutoFlagged,
            nameof(AttendanceRecord),
            staleShift.Id,
            userId,
            note: $"Shift from {staleShift.WorkDate:yyyy-MM-dd} had no clock-out; " +
                  $"auto-flagged as PendingReview when a new shift started on {today:yyyy-MM-dd}.");

        await _db.SaveChangesAsync(ct);
    }

    public async Task<AttendanceRecordDto> ClockOutAsync(CancellationToken ct = default)
    {
        var now = (await _externalTime.GetCurrentTimeAsync(ct)).DateTime;

        var record = await GetActiveShiftOrThrow(ct);

        if (record.Breaks.Any(b => b.Status == BreakStatus.Active))
            throw new ConflictException("End your active break before clocking out.");

        record.ClockOutTime = now;
        record.Status = AttendanceStatus.Completed;
        record.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
        return record.ToDto(now);
    }

    public async Task<AttendanceRecordDto> StartBreakAsync(CancellationToken ct = default)
    {
        var now = (await _externalTime.GetCurrentTimeAsync(ct)).DateTime;

        var record = await GetActiveShiftOrThrow(ct);

        if (record.Breaks.Any(b => b.Status == BreakStatus.Active))
            throw new ConflictException("You already have an active break. End it before starting a new one.");

        record.Breaks.Add(new Break
        {
            BreakStartTime = now,
            Status = BreakStatus.Active,
            CreatedAt = now,
            UpdatedAt = now
        });
        record.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
        return record.ToDto(now);
    }

    public async Task<AttendanceRecordDto> EndBreakAsync(CancellationToken ct = default)
    {
        var now = (await _externalTime.GetCurrentTimeAsync(ct)).DateTime;

        var record = await GetActiveShiftOrThrow(ct);

        var activeBreak = record.Breaks.FirstOrDefault(b => b.Status == BreakStatus.Active)
            ?? throw new ConflictException("You don't have an active break to end.");

        activeBreak.BreakEndTime = now;
        activeBreak.Status = BreakStatus.Completed;
        activeBreak.UpdatedAt = now;
        record.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
        return record.ToDto(now);
    }

    public async Task<AttendanceRecordDto?> GetCurrentAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;

        var record = await _db.AttendanceRecords
            .AsNoTracking()
            .Include(r => r.Breaks)
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Status == AttendanceStatus.Active, ct);

        return record?.ToDto(_time.Now);
    }

    public async Task<IReadOnlyList<AttendanceRecordDto>> GetHistoryAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        var now = _time.Now;

        var records = await _db.AttendanceRecords
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.WorkDate)
            .ThenByDescending(r => r.ClockInTime)
            .ToListAsync(ct);

        await PopulateBreaksAsync(records, ct);

        return records.Select(r => r.ToDto(now)).ToList();
    }

    public async Task<IReadOnlyList<AttendanceRecordDto>> GetPendingReviewAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        var now = _time.Now;

        var records = await _db.AttendanceRecords
            .AsNoTracking()
            .Where(r => r.UserId == userId && r.Status == AttendanceStatus.PendingReview)
            .OrderByDescending(r => r.WorkDate)
            .ThenByDescending(r => r.ClockInTime)
            .ToListAsync(ct);

        await PopulateBreaksAsync(records, ct);

        return records.Select(r => r.ToDto(now)).ToList();
    }

    /// <summary>Loads breaks in a separate query and populates each record's Breaks collection.</summary>
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

    public async Task<IReadOnlyList<CorrectionResponse>> ResolvePendingReviewAsync(
        int attendanceRecordId, ResolvePendingReviewDto request, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;

        var record = await _db.AttendanceRecords
            .Include(r => r.Breaks)
            .FirstOrDefaultAsync(r => r.Id == attendanceRecordId, ct);

        if (record is null || record.UserId != userId)
            throw NotFoundException.For(nameof(AttendanceRecord), attendanceRecordId);

        if (record.Status != AttendanceStatus.PendingReview)
            throw new ConflictException("Only a shift in PendingReview can be resolved.");

        if (request.EstimatedClockOutTime <= record.ClockInTime)
            throw new ConflictException("Estimated clock-out must be after the clock-in time.");

        // Block duplicates: a shift can have only one open set of pending corrections at a time.
        var hasPending = await _db.CorrectionRequests
            .AnyAsync(c => c.AttendanceRecordId == record.Id && c.Status == CorrectionStatus.Pending, ct);
        if (hasPending)
            throw new ConflictException("There is already a pending correction request for this shift.");

        var openBreak = record.Breaks
            .FirstOrDefault(b => b.Status is BreakStatus.PendingReview or BreakStatus.Active);

        var created = new List<CorrectionRequest>
        {
            new()
            {
                AttendanceRecordId = record.Id,
                RequestType = CorrectionRequestType.MissingAction,
                TargetField = CorrectionTargetField.ClockOut,
                OriginalTime = null,
                RequestedTime = request.EstimatedClockOutTime,
                Status = CorrectionStatus.Pending,
                EmployeeNote = request.Note,
                RequestedByUserId = userId,
                CreatedAt = _time.UtcNow
            }
        };

        if (openBreak is not null)
        {
            if (request.EstimatedBreakEndTime is null)
                throw new ConflictException("This shift has an open break; EstimatedBreakEndTime is required.");
            if (request.EstimatedBreakEndTime.Value <= openBreak.BreakStartTime)
                throw new ConflictException("Estimated break end must be after the break start time.");

            created.Add(new CorrectionRequest
            {
                AttendanceRecordId = record.Id,
                BreakId = openBreak.Id,
                RequestType = CorrectionRequestType.MissingAction,
                TargetField = CorrectionTargetField.BreakEnd,
                OriginalTime = null,
                RequestedTime = request.EstimatedBreakEndTime.Value,
                Status = CorrectionStatus.Pending,
                EmployeeNote = request.Note,
                RequestedByUserId = userId,
                CreatedAt = _time.UtcNow
            });
        }

        _db.CorrectionRequests.AddRange(created);
        await _db.SaveChangesAsync(ct);

        // The shift stays PendingReview until a manager approves.
        return created.Select(c => c.ToResponse()).ToList();
    }

    /// <summary>Loads the caller's open shift (with breaks) or throws a 409.</summary>
    private async Task<AttendanceRecord> GetActiveShiftOrThrow(CancellationToken ct)
    {
        var userId = _currentUser.UserId;

        return await _db.AttendanceRecords
            .Include(r => r.Breaks)
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Status == AttendanceStatus.Active, ct)
            ?? throw new ConflictException("You don't have an open shift.");
    }
}
