using Attendance.Application.Entities;
using Microsoft.EntityFrameworkCore;

namespace Attendance.Application.Interfaces;

/// <summary>
/// Abstraction over the EF Core context so Application services do not
/// depend on the Infrastructure project directly.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<AttendanceRecord> AttendanceRecords { get; }
    DbSet<Break> Breaks { get; }
    DbSet<CorrectionRequest> CorrectionRequests { get; }
    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
