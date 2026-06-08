namespace Attendance.Application.Common.Exceptions;

/// <summary>
/// The request conflicts with the current state of a resource
/// (e.g. duplicate email, deactivating a user who has an active shift).
/// </summary>
public sealed class ConflictException : AppException
{
    public override int StatusCode => 409;
    public override string Title => "Conflict";

    public ConflictException(string message) : base(message)
    {
    }
}
