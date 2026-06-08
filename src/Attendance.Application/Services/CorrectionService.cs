using Attendance.Application.Common.Exceptions;
using Attendance.Application.Dtos.Corrections;
using Attendance.Application.Entities;
using Attendance.Application.Enums;
using Attendance.Application.Interfaces;
using Attendance.Application.Mapping;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Application.Services;

public class CorrectionService : ICorrectionService
{
    private readonly IApplicationDbContext _db;
    private readonly ITimeProvider _time;
    private readonly ICurrentUser _currentUser;
    private readonly IAuditService _audit;

    public CorrectionService(IApplicationDbContext db, ITimeProvider time, ICurrentUser currentUser, IAuditService audit)
    {
        _db = db;
        _time = time;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<CorrectionResponse> CreateAsync(CreateCorrectionRequestDto request, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;

        var record = await _db.AttendanceRecords
            .Include(r => r.Breaks)
            .FirstOrDefaultAsync(r => r.Id == request.AttendanceRecordId, ct);

        // Hide existence of records that aren't the caller's.
        if (record is null || record.UserId != userId)
            throw NotFoundException.For(nameof(AttendanceRecord), request.AttendanceRecordId);

        // Resolve the target's current value (OriginalTime) and validate the break reference.
        int? breakId = null;
        DateTime? originalTime;
        switch (request.TargetField)
        {
            case CorrectionTargetField.ClockIn:
                originalTime = record.ClockInTime;
                break;
            case CorrectionTargetField.ClockOut:
                originalTime = record.ClockOutTime;
                break;
            case CorrectionTargetField.BreakStart:
                var bs = GetBreakOrThrow(record, request.BreakId);
                breakId = bs.Id;
                originalTime = bs.BreakStartTime;
                break;
            case CorrectionTargetField.BreakEnd:
                var be = GetBreakOrThrow(record, request.BreakId);
                breakId = be.Id;
                originalTime = be.BreakEndTime;
                break;
            default:
                throw new ConflictException("Unsupported correction target.");
        }

        var duplicatePending = await _db.CorrectionRequests.AnyAsync(c =>
            c.AttendanceRecordId == record.Id &&
            c.Status == CorrectionStatus.Pending &&
            c.TargetField == request.TargetField &&
            c.BreakId == breakId, ct);
        if (duplicatePending)
            throw new ConflictException("A pending correction request already exists for this field.");

        var correction = new CorrectionRequest
        {
            AttendanceRecordId = record.Id,
            BreakId = breakId,
            RequestType = request.RequestType,
            TargetField = request.TargetField,
            OriginalTime = originalTime,
            RequestedTime = request.RequestedTime,
            Status = CorrectionStatus.Pending,
            EmployeeNote = request.Note,
            RequestedByUserId = userId,
            CreatedAt = _time.UtcNow
        };

        _db.CorrectionRequests.Add(correction);
        await _db.SaveChangesAsync(ct);
        return correction.ToResponse();
    }

    public async Task<IReadOnlyList<CorrectionResponse>> GetMineAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;

        var items = await _db.CorrectionRequests
            .AsNoTracking()
            .Where(c => c.RequestedByUserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);

        return items.Select(c => c.ToResponse()).ToList();
    }

    public async Task<IReadOnlyList<CorrectionResponse>> GetAllAsync(CorrectionStatus? status = null, CancellationToken ct = default)
    {
        var query = _db.CorrectionRequests.AsNoTracking();

        if (status is not null)
            query = query.Where(c => c.Status == status);

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);

        return items.Select(c => c.ToResponse()).ToList();
    }

    public async Task<CorrectionResponse> ReviewAsync(int id, ReviewCorrectionRequestDto request, CancellationToken ct = default)
    {
        var correction = await _db.CorrectionRequests
            .Include(c => c.AttendanceRecord)
                .ThenInclude(r => r.Breaks)
            .FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw NotFoundException.For(nameof(CorrectionRequest), id);

        if (correction.Status != CorrectionStatus.Pending)
            throw new ConflictException("This correction request has already been reviewed.");

        var managerId = _currentUser.UserId;
        correction.ReviewedByUserId = managerId;
        correction.ReviewedAt = _time.UtcNow;
        correction.ManagerNote = request.ManagerNote;

        if (request.Approve)
        {
            var approvedTime = request.ApprovedTime ?? correction.RequestedTime;
            var (oldValue, newValue) = ApplyApprovedCorrection(correction, approvedTime);

            correction.ApprovedTime = approvedTime;
            correction.Status = CorrectionStatus.Approved;

            _audit.Log(AuditAction.CorrectionApproved, nameof(CorrectionRequest), correction.Id, managerId,
                oldValues: oldValue, newValues: newValue,
                note: $"{correction.TargetField} approved.");
        }
        else
        {
            // Reject: the shift/break stays as-is (e.g. PendingReview); the employee may submit a new request.
            correction.Status = CorrectionStatus.Rejected;

            _audit.Log(AuditAction.CorrectionRejected, nameof(CorrectionRequest), correction.Id, managerId,
                note: request.ManagerNote);
        }

        await _db.SaveChangesAsync(ct);
        return correction.ToResponse();
    }

    /// <summary>
    /// Applies an approved correction to the underlying record/break and returns
    /// the (old, new) values for the audit trail. Validates time coherence up-front
    /// so we never hit a DB CHECK violation.
    /// </summary>
    private (object? oldValue, object? newValue) ApplyApprovedCorrection(CorrectionRequest c, DateTime approvedTime)
    {
        var record = c.AttendanceRecord;
        record.UpdatedAt = _time.UtcNow;

        switch (c.TargetField)
        {
            case CorrectionTargetField.ClockIn:
            {
                if (record.ClockOutTime is not null && approvedTime >= record.ClockOutTime)
                    throw new ConflictException("Approved clock-in must be before the clock-out time.");

                var old = record.ClockInTime;
                record.ClockInTime = approvedTime;
                return (new { ClockInTime = old }, new { ClockInTime = approvedTime });
            }
            case CorrectionTargetField.ClockOut:
            {
                if (approvedTime <= record.ClockInTime)
                    throw new ConflictException("Approved clock-out must be after the clock-in time.");

                var old = record.ClockOutTime;
                record.ClockOutTime = approvedTime;
                if (record.Status is AttendanceStatus.PendingReview or AttendanceStatus.Active)
                    record.Status = AttendanceStatus.Completed;

                return (new { ClockOutTime = old }, new { ClockOutTime = approvedTime });
            }
            case CorrectionTargetField.BreakStart:
            {
                var b = GetBreakOrThrow(record, c.BreakId);
                if (approvedTime < record.ClockInTime)
                    throw new ConflictException("Approved break start must be within the shift.");
                if (b.BreakEndTime is not null && approvedTime >= b.BreakEndTime)
                    throw new ConflictException("Approved break start must be before the break end time.");

                var old = b.BreakStartTime;
                b.BreakStartTime = approvedTime;
                b.UpdatedAt = _time.UtcNow;
                return (new { BreakStartTime = old }, new { BreakStartTime = approvedTime });
            }
            case CorrectionTargetField.BreakEnd:
            {
                var b = GetBreakOrThrow(record, c.BreakId);
                if (approvedTime <= b.BreakStartTime)
                    throw new ConflictException("Approved break end must be after the break start time.");

                var old = b.BreakEndTime;
                b.BreakEndTime = approvedTime;
                if (b.Status is BreakStatus.PendingReview or BreakStatus.Active)
                    b.Status = BreakStatus.Completed;
                b.UpdatedAt = _time.UtcNow;
                return (new { BreakEndTime = old }, new { BreakEndTime = approvedTime });
            }
            default:
                throw new ConflictException("Unsupported correction target.");
        }
    }

    private static Break GetBreakOrThrow(AttendanceRecord record, int? breakId)
    {
        if (breakId is null)
            throw new ConflictException("This correction targets a break, but no break was specified.");

        return record.Breaks.FirstOrDefault(b => b.Id == breakId)
            ?? throw new ConflictException("The referenced break does not belong to this shift.");
    }
}
