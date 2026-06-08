using Attendance.Application.Dtos.Corrections;
using Attendance.Application.Enums;

namespace Attendance.Application.Interfaces;

public interface ICorrectionService
{
    /// <summary>Employee creates a correction request for one of their own shifts.</summary>
    Task<CorrectionResponse> CreateAsync(CreateCorrectionRequestDto request, CancellationToken ct = default);

    /// <summary>The caller's own correction requests, newest first.</summary>
    Task<IReadOnlyList<CorrectionResponse>> GetMineAsync(CancellationToken ct = default);

    /// <summary>All correction requests (manager only), optionally filtered by status.</summary>
    Task<IReadOnlyList<CorrectionResponse>> GetAllAsync(CorrectionStatus? status = null, CancellationToken ct = default);

    /// <summary>Manager approves or rejects a pending request, applying the change on approval.</summary>
    Task<CorrectionResponse> ReviewAsync(int id, ReviewCorrectionRequestDto request, CancellationToken ct = default);
}
