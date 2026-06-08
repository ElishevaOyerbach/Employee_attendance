using Attendance.Application.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Attendance.Infrastructure.Persistence.Configurations;

public class BreakConfiguration : IEntityTypeConfiguration<Break>
{
    public void Configure(EntityTypeBuilder<Break> b)
    {
        b.ToTable("Breaks");
        b.HasKey(x => x.Id);

        b.Property(x => x.BreakStartTime).HasColumnType("datetime2(3)");
        b.Property(x => x.BreakEndTime).HasColumnType("datetime2(3)");
        b.Property(x => x.Status).HasColumnType("tinyint");
        b.Property(x => x.CreatedAt).HasColumnType("datetime2(3)");
        b.Property(x => x.UpdatedAt).HasColumnType("datetime2(3)");

        b.HasOne(x => x.AttendanceRecord)
            .WithMany(a => a.Breaks)
            .HasForeignKey(x => x.AttendanceRecordId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => x.AttendanceRecordId);
    }
}
