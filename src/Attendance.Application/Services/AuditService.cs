using System.Text.Json;
using Attendance.Application.Entities;
using Attendance.Application.Enums;
using Attendance.Application.Interfaces;

namespace Attendance.Application.Services;

public class AuditService : IAuditService
{
    private readonly IApplicationDbContext _db;
    private readonly ITimeProvider _time;

    public AuditService(IApplicationDbContext db, ITimeProvider time)
    {
        _db = db;
        _time = time;
    }

    public void Log(
        AuditAction action,
        string entityType,
        int entityId,
        int performedByUserId,
        object? oldValues = null,
        object? newValues = null,
        string? note = null)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            PerformedByUserId = performedByUserId,
            OldValueJson = Serialize(oldValues),
            NewValueJson = Serialize(newValues),
            Note = note,
            Timestamp = _time.UtcNow
        });
    }

    private static string? Serialize(object? value) =>
        value is null ? null : JsonSerializer.Serialize(value);
}
