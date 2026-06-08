namespace Attendance.Application.Common.Exceptions;

/// <summary>
/// Base for expected, domain-level failures that map to a specific HTTP status.
/// Anything not derived from this is treated as an unexpected 500.
/// </summary>
public abstract class AppException : Exception
{
    public abstract int StatusCode { get; }
    public abstract string Title { get; }

    protected AppException(string message) : base(message)
    {
    }
}
