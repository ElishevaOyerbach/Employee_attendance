using System.ComponentModel.DataAnnotations;

namespace Attendance.Application.Dtos.Corrections;

public class ResolvePendingReviewDto
{
    [Required]
    public DateTime EstimatedClockOutTime { get; set; }

    /// <summary>Required only if the shift has an open break left in PendingReview.</summary>
    public DateTime? EstimatedBreakEndTime { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }
}
