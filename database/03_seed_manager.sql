/* ============================================================
   03_seed_manager.sql
   Creates the first Manager (bootstrap). Idempotent by Email.

   !!! IMPORTANT !!!
   PasswordHash below is a PLACEHOLDER, not a real hash.
   The real hash will be produced by the ASP.NET Core backend
   using whatever password hasher is chosen there, and this row
   should be updated (or re-seeded) at that point. Until then
   this account cannot actually log in.
   ============================================================ */

USE AttendanceDb;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = N'admin@attendance.local')
BEGIN
    INSERT INTO dbo.Users (FullName, Email, PasswordHash, Role, ExpectedDailyHours, IsActive, CreatedByUserId)
    VALUES
    (
        N'System Manager',
        N'admin@attendance.local',
        N'__REPLACE_WITH_REAL_HASH__',   -- placeholder, see header note
        1,                                -- Role = Manager
        8.00,                             -- default daily quota
        1,                                -- IsActive
        NULL                              -- seed manager has no creator
    );
    PRINT 'Seed manager created: admin@attendance.local';
END
ELSE
BEGIN
    PRINT 'Seed manager already exists - skipping.';
END
GO
