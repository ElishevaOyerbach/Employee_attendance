using Attendance.Application.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Attendance.Infrastructure.Persistence.Configurations;

public class AttendanceRecordConfiguration : IEntityTypeConfiguration<AttendanceRecord>
{
    public void Configure(EntityTypeBuilder<AttendanceRecord> b)
    {
        b.ToTable("AttendanceRecords");
        b.HasKey(x => x.Id);

        b.Property(x => x.WorkDate).HasColumnType("date");
        b.Property(x => x.ClockInTime).HasColumnType("datetime2(3)");
        b.Property(x => x.ClockOutTime).HasColumnType("datetime2(3)");
        b.Property(x => x.Status).HasColumnType("tinyint");
        b.Property(x => x.ExpectedDailyHoursSnapshot).HasColumnType("decimal(4,2)");
        b.Property(x => x.CreatedAt).HasColumnType("datetime2(3)");
        b.Property(x => x.UpdatedAt).HasColumnType("datetime2(3)");

        b.HasOne(x => x.User)
            .WithMany(u => u.AttendanceRecords)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => new { x.UserId, x.WorkDate });
    }
}
