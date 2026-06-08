using System.ComponentModel.DataAnnotations;

namespace Attendance.Application.Dtos.Corrections;

public class ReviewCorrectionRequestDto
{
    /// <summary>True = approve, False = reject.</summary>
    [Required]
    public bool Approve { get; set; }

    /// <summary>
    /// Optional. When approving, the manager may override the time the employee
    /// requested. If null, the employee's RequestedTime is used.
    /// </summary>
    public DateTime? ApprovedTime { get; set; }

    [MaxLength(1000)]
    public string? ManagerNote { get; set; }
}
