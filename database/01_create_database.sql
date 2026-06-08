/* ============================================================
   01_create_database.sql
   Creates the AttendanceDb database (idempotent).
   Run order: 01 -> 02 -> 03
   ============================================================ */

IF DB_ID(N'AttendanceDb') IS NULL
BEGIN
    PRINT 'Creating database AttendanceDb...';
    CREATE DATABASE AttendanceDb;
END
ELSE
BEGIN
    PRINT 'Database AttendanceDb already exists - skipping create.';
END
GO
