using Attendance.Application.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Attendance.Infrastructure.Persistence.Configurations;

public class CorrectionRequestConfiguration : IEntityTypeConfiguration<CorrectionRequest>
{
    public void Configure(EntityTypeBuilder<CorrectionRequest> b)
    {
        b.ToTable("CorrectionRequests");
        b.HasKey(x => x.Id);

        b.Property(x => x.RequestType).HasColumnType("tinyint");
        b.Property(x => x.TargetField).HasColumnType("tinyint");
        b.Property(x => x.Status).HasColumnType("tinyint");
        b.Property(x => x.OriginalTime).HasColumnType("datetime2(3)");
        b.Property(x => x.RequestedTime).HasColumnType("datetime2(3)");
        b.Property(x => x.ApprovedTime).HasColumnType("datetime2(3)");
        b.Property(x => x.EmployeeNote).HasMaxLength(1000);
        b.Property(x => x.ManagerNote).HasMaxLength(1000);
        b.Property(x => x.CreatedAt).HasColumnType("datetime2(3)");
        b.Property(x => x.ReviewedAt).HasColumnType("datetime2(3)");

        b.HasOne(x => x.AttendanceRecord)
            .WithMany()
            .HasForeignKey(x => x.AttendanceRecordId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Break)
            .WithMany()
            .HasForeignKey(x => x.BreakId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.RequestedBy)
            .WithMany()
            .HasForeignKey(x => x.RequestedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.ReviewedBy)
            .WithMany()
            .HasForeignKey(x => x.ReviewedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.AttendanceRecordId);
        b.HasIndex(x => x.RequestedByUserId);
    }
}
