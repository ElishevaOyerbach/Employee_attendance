using System.ComponentModel.DataAnnotations;
using Attendance.Application.Enums;

namespace Attendance.Application.Dtos.Users;

public class CreateUserRequest
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = null!;

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = null!;

    [Required]
    [MinLength(6)]
    [MaxLength(100)]
    public string Password { get; set; } = null!;

    [Required]
    [EnumDataType(typeof(UserRole))]
    public UserRole Role { get; set; }

    [Range(0, 24)]
    public decimal ExpectedDailyHours { get; set; }
}
