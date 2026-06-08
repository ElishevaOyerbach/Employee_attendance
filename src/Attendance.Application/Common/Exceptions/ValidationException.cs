namespace Attendance.Application.Common.Exceptions;

/// <summary>The request is well-formed but contains an invalid value.</summary>
public sealed class ValidationException : AppException
{
    public override int StatusCode => 400;
    public override string Title => "Validation failed";

    public ValidationException(string message) : base(message)
    {
    }
}
