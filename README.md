# Employee Attendance System

An employee attendance management system: clock‑in/out and break tracking, correction requests, manager approvals, and monthly reports. Built as a Clean Architecture solution with an ASP.NET Core API and a React frontend.

## Key Features

- **Attendance tracking** – Clock‑in / clock‑out and break start/end for every employee.
- **Trusted external clock** – Attendance timestamps are taken from an external time service (TimeAPI.io, Europe/Zurich), not the local machine clock. If the service is unavailable the action fails and is not recorded (fail‑closed).
- **Missed‑shift handling** – A shift with no clock‑out is flagged `PendingReview`, and the employee can complete it via a correction request.
- **Correction requests & approvals** – Employees submit corrections (missing action / time adjustment); managers approve or reject them.
- **Reports** – Monthly summaries and date‑range reports, per individual employee or for the whole team.
- **Role‑based access** – `Employee` and `Manager` roles, secured with JWT authentication.
- **Audit log** – Sensitive operations are recorded (edits, approvals/rejections, user creation/deactivation).

## Architecture

```
src/
├── Attendance.Api             # API layer: controllers, JWT, global error handling
├── Attendance.Application     # Business logic: entities, services, DTOs, interfaces
└── Attendance.Infrastructure  # Implementations: EF Core (SQL Server), security, external time provider

frontend/                      # React + TypeScript + Vite
database/                      # SQL scripts to create the database and seed the initial manager
```

Layers are kept separate: `Application` defines interfaces (`IApplicationDbContext`, `IExternalTimeProvider`, etc.) and `Infrastructure` provides the implementations. The API wires everything together through dependency injection.

## Tech Stack

| Area | Technology |
|------|-----------|
| Backend | .NET 10, ASP.NET Core Web API |
| ORM / DB | Entity Framework Core, SQL Server |
| Security | JWT Bearer, PBKDF2 password hashing |
| Frontend | React 19, TypeScript, Vite, React Router, Axios |

## Prerequisites

- .NET SDK 10
- SQL Server (local or Express)
- Node.js 20+

## Getting Started

### 1. Database

Run the scripts under `database/` in order:

```sql
01_create_database.sql   -- create the database
02_create_tables.sql     -- create the tables
03_seed_manager.sql      -- seed the initial manager
```

Update `ConnectionStrings:AttendanceDb` in `src/Attendance.Api/appsettings.json` for your environment.

### 2. Backend

```bash
cd src/Attendance.Api
dotnet run
```

In the Development environment, OpenAPI documentation is exposed and a seeder replaces the manager's placeholder password with a real hash.

**Default user (development only):**

```
Email:    admin@attendance.local
Password: Admin#12345
```
> Change the password after the first login.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Log in, returns a JWT |
| `POST` | `/api/attendance/clock-in` \| `/clock-out` | Clock in / out |
| `POST` | `/api/attendance/break/start` \| `/break/end` | Start / end a break |
| `GET`  | `/api/attendance/me` | Personal attendance history |
| `POST` | `/api/attendance/{id}/resolve` | Complete a PendingReview shift |
| `POST` | `/api/corrections` | Submit a correction request |
| `POST` | `/api/corrections/{id}/review` | Approve / reject (manager) |
| `GET`  | `/api/reports/me/monthly` | Personal monthly summary |
| `GET`  | `/api/reports/team/range` | Team date‑range report (manager) |

All endpoints except `login` require a JWT. Some endpoints are restricted to the `Manager` role.

## Security Notes

The values in `appsettings.json` (JWT key, seed password) are for development only. In production, replace them and inject secrets through environment variables or a secrets store.
