using System.ComponentModel.DataAnnotations;

namespace Attendance.Application.Dtos.Users;

public class UpdateUserRequest
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = null!;

    [Range(0, 24)]
    public decimal ExpectedDailyHours { get; set; }
}
