using Attendance.Application.Dtos.Corrections;
using Attendance.Application.Entities;

namespace Attendance.Application.Mapping;

public static class CorrectionMappings
{
    public static CorrectionResponse ToResponse(this CorrectionRequest c) => new()
    {
        Id = c.Id,
        AttendanceRecordId = c.AttendanceRecordId,
        BreakId = c.BreakId,
        RequestType = c.RequestType.ToString(),
        TargetField = c.TargetField.ToString(),
        OriginalTime = c.OriginalTime,
        RequestedTime = c.RequestedTime,
        ApprovedTime = c.ApprovedTime,
        Status = c.Status.ToString(),
        EmployeeNote = c.EmployeeNote,
        ManagerNote = c.ManagerNote,
        RequestedByUserId = c.RequestedByUserId,
        ReviewedByUserId = c.ReviewedByUserId,
        CreatedAt = c.CreatedAt,
        ReviewedAt = c.ReviewedAt
    };
}
