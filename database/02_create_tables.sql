/* ============================================================
   02_create_tables.sql
   Schema for the attendance system (MVP).

   Enum encoding (TINYINT + CHECK):
     UserRole              : Employee=0, Manager=1
     AttendanceStatus      : Active=0, Completed=1, PendingReview=2
     BreakStatus           : Active=0, Completed=1, PendingReview=2
     CorrectionRequestType : MissingAction=0, TimeAdjustment=1
     CorrectionTargetField : ClockIn=0, ClockOut=1, BreakStart=2, BreakEnd=3
     CorrectionStatus      : Pending=0, Approved=1, Rejected=2
     AuditAction           : DirectEdit=0, CorrectionApproved=1, CorrectionRejected=2,
                             UserDeactivated=3, UserCreated=4, ShiftAutoFlagged=5

   Notes:
     - All time columns are DATETIME2(3). For the MVP they hold whatever the
       server-side TimeProvider writes (single timezone). When the time source
       is later switched to Europe/Zurich, only the TimeProvider changes - the
       schema does not.
     - Nothing is ever hard-deleted: users are deactivated (IsActive), and
       records move through their Status values. All FKs are NO ACTION (RESTRICT).
   ============================================================ */

USE AttendanceDb;
GO

-- Required for the filtered (partial) unique indexes below.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ------------------------------------------------------------
   Users  (employees and managers - same table, separated by Role)
   ------------------------------------------------------------ */
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        Id                  INT            IDENTITY(1,1) NOT NULL,
        FullName            NVARCHAR(200)  NOT NULL,
        Email               NVARCHAR(256)  NOT NULL,
        PasswordHash        NVARCHAR(500)  NOT NULL,
        Role                TINYINT        NOT NULL,                 -- UserRole
        ExpectedDailyHours  DECIMAL(4,2)   NOT NULL,                 -- current quota (hours)
        IsActive            BIT            NOT NULL CONSTRAINT DF_Users_IsActive  DEFAULT (1),
        CreatedByUserId     INT            NULL,                     -- who created this user (NULL for seed manager)
        CreatedAt           DATETIME2(3)   NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Users PRIMARY KEY (Id),
        CONSTRAINT UX_Users_Email UNIQUE (Email),
        CONSTRAINT CK_Users_Role CHECK (Role IN (0,1)),
        CONSTRAINT CK_Users_ExpectedDailyHours CHECK (ExpectedDailyHours >= 0),
        CONSTRAINT FK_Users_CreatedBy FOREIGN KEY (CreatedByUserId)
            REFERENCES dbo.Users(Id)
    );
END
GO

/* ------------------------------------------------------------
   AttendanceRecords  (one row per shift)
   ------------------------------------------------------------ */
IF OBJECT_ID(N'dbo.AttendanceRecords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AttendanceRecords
    (
        Id                          INT          IDENTITY(1,1) NOT NULL,
        UserId                      INT          NOT NULL,
        WorkDate                    DATE         NOT NULL,             -- date of ClockIn (daily aggregation key)
        ClockInTime                 DATETIME2(3) NOT NULL,
        ClockOutTime                DATETIME2(3) NULL,                 -- NULL while shift is open
        Status                      TINYINT      NOT NULL,             -- AttendanceStatus
        ExpectedDailyHoursSnapshot  DECIMAL(4,2) NOT NULL,             -- quota captured at ClockIn
        CreatedAt                   DATETIME2(3) NOT NULL CONSTRAINT DF_Attendance_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt                   DATETIME2(3) NOT NULL CONSTRAINT DF_Attendance_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_AttendanceRecords PRIMARY KEY (Id),
        CONSTRAINT FK_Attendance_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        CONSTRAINT CK_Attendance_Status CHECK (Status IN (0,1,2)),
        CONSTRAINT CK_Attendance_Snapshot CHECK (ExpectedDailyHoursSnapshot >= 0),
        CONSTRAINT CK_Attendance_OutAfterIn
            CHECK (ClockOutTime IS NULL OR ClockOutTime > ClockInTime),
        -- A Completed shift must have a ClockOut time.
        CONSTRAINT CK_Attendance_CompletedHasOut
            CHECK (Status <> 1 OR ClockOutTime IS NOT NULL)
    );

    -- Only ONE Active shift per user at any time.
    CREATE UNIQUE INDEX UX_Attendance_OneActivePerUser
        ON dbo.AttendanceRecords(UserId)
        WHERE Status = 0;

    -- Reporting / daily & monthly summaries.
    CREATE INDEX IX_Attendance_User_WorkDate
        ON dbo.AttendanceRecords(UserId, WorkDate);
END
GO

/* ------------------------------------------------------------
   Breaks  (zero or more per shift)
   ------------------------------------------------------------ */
IF OBJECT_ID(N'dbo.Breaks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Breaks
    (
        Id                  INT          IDENTITY(1,1) NOT NULL,
        AttendanceRecordId  INT          NOT NULL,
        BreakStartTime      DATETIME2(3) NOT NULL,
        BreakEndTime        DATETIME2(3) NULL,                        -- NULL while break is open
        Status              TINYINT      NOT NULL,                    -- BreakStatus
        CreatedAt           DATETIME2(3) NOT NULL CONSTRAINT DF_Breaks_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt           DATETIME2(3) NOT NULL CONSTRAINT DF_Breaks_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Breaks PRIMARY KEY (Id),
        CONSTRAINT FK_Breaks_Attendance FOREIGN KEY (AttendanceRecordId)
            REFERENCES dbo.AttendanceRecords(Id),
        CONSTRAINT CK_Breaks_Status CHECK (Status IN (0,1,2)),
        CONSTRAINT CK_Breaks_EndAfterStart
            CHECK (BreakEndTime IS NULL OR BreakEndTime > BreakStartTime),
        CONSTRAINT CK_Breaks_CompletedHasEnd
            CHECK (Status <> 1 OR BreakEndTime IS NOT NULL)
    );

    -- Only ONE Active break per shift at any time.
    CREATE UNIQUE INDEX UX_Breaks_OneActivePerShift
        ON dbo.Breaks(AttendanceRecordId)
        WHERE Status = 0;

    CREATE INDEX IX_Breaks_Attendance
        ON dbo.Breaks(AttendanceRecordId);
END
GO

/* ------------------------------------------------------------
   CorrectionRequests
   ------------------------------------------------------------ */
IF OBJECT_ID(N'dbo.CorrectionRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CorrectionRequests
    (
        Id                  INT           IDENTITY(1,1) NOT NULL,
        AttendanceRecordId  INT           NOT NULL,
        BreakId             INT           NULL,                       -- set when the request targets a break
        RequestType         TINYINT       NOT NULL,                   -- CorrectionRequestType
        TargetField         TINYINT       NOT NULL,                   -- CorrectionTargetField
        OriginalTime        DATETIME2(3)  NULL,                       -- current value (TimeAdjustment)
        RequestedTime       DATETIME2(3)  NOT NULL,                   -- value the employee asks for
        ApprovedTime        DATETIME2(3)  NULL,                       -- value actually approved (may differ)
        Status              TINYINT       NOT NULL,                   -- CorrectionStatus
        EmployeeNote        NVARCHAR(1000) NULL,
        ManagerNote         NVARCHAR(1000) NULL,
        RequestedByUserId   INT           NOT NULL,
        ReviewedByUserId    INT           NULL,
        CreatedAt           DATETIME2(3)  NOT NULL CONSTRAINT DF_Correction_CreatedAt DEFAULT (SYSUTCDATETIME()),
        ReviewedAt          DATETIME2(3)  NULL,

        CONSTRAINT PK_CorrectionRequests PRIMARY KEY (Id),
        CONSTRAINT FK_Correction_Attendance FOREIGN KEY (AttendanceRecordId)
            REFERENCES dbo.AttendanceRecords(Id),
        CONSTRAINT FK_Correction_Break FOREIGN KEY (BreakId)
            REFERENCES dbo.Breaks(Id),
        CONSTRAINT FK_Correction_RequestedBy FOREIGN KEY (RequestedByUserId)
            REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Correction_ReviewedBy FOREIGN KEY (ReviewedByUserId)
            REFERENCES dbo.Users(Id),
        CONSTRAINT CK_Correction_Type   CHECK (RequestType IN (0,1)),
        CONSTRAINT CK_Correction_Target CHECK (TargetField IN (0,1,2,3)),
        CONSTRAINT CK_Correction_Status CHECK (Status IN (0,1,2)),
        -- Approved => must have an approved time AND a reviewer.
        CONSTRAINT CK_Correction_Approved
            CHECK (Status <> 1 OR (ApprovedTime IS NOT NULL AND ReviewedByUserId IS NOT NULL AND ReviewedAt IS NOT NULL)),
        -- Rejected => must have a reviewer.
        CONSTRAINT CK_Correction_Rejected
            CHECK (Status <> 2 OR (ReviewedByUserId IS NOT NULL AND ReviewedAt IS NOT NULL))
    );

    CREATE INDEX IX_Correction_Status      ON dbo.CorrectionRequests(Status);
    CREATE INDEX IX_Correction_Attendance  ON dbo.CorrectionRequests(AttendanceRecordId);
    CREATE INDEX IX_Correction_RequestedBy ON dbo.CorrectionRequests(RequestedByUserId);
END
GO

/* ------------------------------------------------------------
   AuditLogs  (soft, polymorphic reference via EntityType/EntityId)
   ------------------------------------------------------------ */
IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLogs
    (
        Id                INT            IDENTITY(1,1) NOT NULL,
        EntityType        NVARCHAR(50)   NOT NULL,                    -- 'AttendanceRecord' | 'Break' | 'CorrectionRequest' | 'User'
        EntityId          INT            NOT NULL,
        Action            TINYINT        NOT NULL,                    -- AuditAction
        PerformedByUserId INT            NOT NULL,
        OldValueJson      NVARCHAR(MAX)  NULL,
        NewValueJson      NVARCHAR(MAX)  NULL,
        Note              NVARCHAR(1000) NULL,
        Timestamp         DATETIME2(3)   NOT NULL CONSTRAINT DF_Audit_Timestamp DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_AuditLogs PRIMARY KEY (Id),
        CONSTRAINT FK_Audit_PerformedBy FOREIGN KEY (PerformedByUserId)
            REFERENCES dbo.Users(Id),
        CONSTRAINT CK_Audit_Action CHECK (Action IN (0,1,2,3,4,5))
    );

    CREATE INDEX IX_Audit_Entity ON dbo.AuditLogs(EntityType, EntityId);
END
GO

PRINT 'Schema created / verified.';
GO
