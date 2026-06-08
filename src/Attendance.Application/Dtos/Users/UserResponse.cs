namespace Attendance.Application.Dtos.Users;

public class UserResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
    public decimal ExpectedDailyHours { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
