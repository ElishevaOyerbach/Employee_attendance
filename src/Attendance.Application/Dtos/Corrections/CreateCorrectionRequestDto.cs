using System.ComponentModel.DataAnnotations;
using Attendance.Application.Enums;

namespace Attendance.Application.Dtos.Corrections;

public class CreateCorrectionRequestDto
{
    [Range(1, int.MaxValue)]
    public int AttendanceRecordId { get; set; }

    /// <summary>Required only when TargetField is BreakStart or BreakEnd.</summary>
    public int? BreakId { get; set; }

    [EnumDataType(typeof(CorrectionRequestType))]
    public CorrectionRequestType RequestType { get; set; }

    [EnumDataType(typeof(CorrectionTargetField))]
    public CorrectionTargetField TargetField { get; set; }

    [Required]
    public DateTime RequestedTime { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }
}
