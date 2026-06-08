using Attendance.Application.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Attendance.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.ToTable("AuditLogs");
        b.HasKey(x => x.Id);

        b.Property(x => x.EntityType).HasMaxLength(50).IsRequired();
        b.Property(x => x.Action).HasColumnType("tinyint");
        b.Property(x => x.OldValueJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.NewValueJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.Note).HasMaxLength(1000);
        b.Property(x => x.Timestamp).HasColumnType("datetime2(3)");

        b.HasOne(x => x.PerformedBy)
            .WithMany()
            .HasForeignKey(x => x.PerformedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => new { x.EntityType, x.EntityId });
    }
}
