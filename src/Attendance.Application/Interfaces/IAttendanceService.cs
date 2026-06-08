using Attendance.Application.Dtos.Attendance;
using Attendance.Application.Dtos.Corrections;

namespace Attendance.Application.Interfaces;

/// <summary>
/// Core attendance operations for the currently authenticated user.
/// The acting user is always taken from ICurrentUser (the JWT), never from input.
/// </summary>
public interface IAttendanceService
{
    Task<AttendanceRecordDto> ClockInAsync(CancellationToken ct = default);
    Task<AttendanceRecordDto> ClockOutAsync(CancellationToken ct = default);
    Task<AttendanceRecordDto> StartBreakAsync(CancellationToken ct = default);
    Task<AttendanceRecordDto> EndBreakAsync(CancellationToken ct = default);

    /// <summary>The caller's currently open shift, or null if none.</summary>
    Task<AttendanceRecordDto?> GetCurrentAsync(CancellationToken ct = default);

    /// <summary>The caller's full attendance history, newest first.</summary>
    Task<IReadOnlyList<AttendanceRecordDto>> GetHistoryAsync(CancellationToken ct = default);

    /// <summary>
    /// The caller's shifts flagged as PendingReview (e.g. a missed clock-out).
    /// These await a correction request + manager approval (stage 5).
    /// </summary>
    Task<IReadOnlyList<AttendanceRecordDto>> GetPendingReviewAsync(CancellationToken ct = default);

    /// <summary>
    /// The employee submits the estimated clock-out (and break-end, if a break was left open)
    /// for a PendingReview shift. Creates Pending correction request(s); the shift stays
    /// PendingReview until a manager approves them.
    /// </summary>
    Task<IReadOnlyList<CorrectionResponse>> ResolvePendingReviewAsync(
        int attendanceRecordId, ResolvePendingReviewDto request, CancellationToken ct = default);
}
