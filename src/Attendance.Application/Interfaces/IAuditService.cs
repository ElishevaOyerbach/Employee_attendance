using Attendance.Application.Enums;

namespace Attendance.Application.Interfaces;

/// <summary>
/// Writes an entry to the audit trail. The entry is added to the current
/// DbContext but NOT persisted here - the calling service owns SaveChanges,
/// so the audit row commits in the same unit of work as the change it records.
/// </summary>
public interface IAuditService
{
    void Log(
        AuditAction action,
        string entityType,
        int entityId,
        int performedByUserId,
        object? oldValues = null,
        object? newValues = null,
        string? note = null);
}
