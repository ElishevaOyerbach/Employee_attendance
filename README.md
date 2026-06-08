# Employee Attendance System

מערכת לניהול נוכחות עובדים: רישום כניסה/יציאה והפסקות, בקשות תיקון, אישורי מנהל ודוחות חודשיים. בנויה כ‑Clean Architecture עם ‎ASP.NET Core API‎ ו‑React frontend.

## תכונות עיקריות

- **רישום נוכחות** – Clock‑in / Clock‑out והפסקות (Break start/end) עבור כל עובד.
- **שעון חיצוני אמין** – זמני הנוכחות נלקחים משירות זמן חיצוני (TimeAPI.io, אזור Europe/Zurich) ולא משעון המקומי. אם השירות לא זמין הפעולה נכשלת ולא נרשמת (fail‑closed).
- **טיפול במשמרות חסרות** – משמרת ללא Clock‑out מסומנת `PendingReview`, והעובד יכול להשלים אותה דרך בקשת תיקון.
- **בקשות תיקון ואישורים** – עובד מגיש בקשת תיקון (פעולה חסרה / התאמת זמן); מנהל מאשר או דוחה.
- **דוחות** – סיכום חודשי ודוח טווח תאריכים, ברמת עובד בודד או צוות שלם.
- **הרשאות מבוססות תפקיד** – `Employee` ו‑`Manager`, עם אימות JWT.
- **Audit log** – תיעוד פעולות רגישות (עריכות, אישורים/דחיות, יצירת/השבתת משתמשים).

## ארכיטקטורה

```
src/
├── Attendance.Api             # שכבת ה-API: Controllers, JWT, טיפול שגיאות גלובלי
├── Attendance.Application     # לוגיקה עסקית: Entities, Services, DTOs, Interfaces
└── Attendance.Infrastructure  # מימושים: EF Core (SQL Server), אבטחה, ספק זמן חיצוני

frontend/                      # React + TypeScript + Vite
database/                      # סקריפטי SQL ליצירת המסד ולזריעת מנהל ראשוני
```

הפרדה לשכבות: `Application` מגדירה ממשקים (`IApplicationDbContext`, `IExternalTimeProvider` וכו'), ו‑`Infrastructure` מספקת את המימושים. ה‑API מחווט הכול ב‑Dependency Injection.

## טכנולוגיות

| תחום | טכנולוגיה |
|------|-----------|
| Backend | .NET 10, ASP.NET Core Web API |
| ORM / DB | Entity Framework Core, SQL Server |
| אבטחה | JWT Bearer, PBKDF2 password hashing |
| Frontend | React 19, TypeScript, Vite, React Router, Axios |

## דרישות מקדימות

- .NET SDK 10
- SQL Server (מקומי או Express)
- Node.js 20+

## התקנה והרצה

### 1. מסד הנתונים

הריצו את הסקריפטים שתחת `database/` לפי הסדר:

```sql
01_create_database.sql   -- יצירת המסד
02_create_tables.sql     -- יצירת הטבלאות
03_seed_manager.sql      -- זריעת מנהל ראשוני
```

עדכנו את ‎`ConnectionStrings:AttendanceDb`‎ בקובץ `src/Attendance.Api/appsettings.json` בהתאם לסביבה.

### 2. Backend

```bash
cd src/Attendance.Api
dotnet run
```

בסביבת Development נטענת תיעוד OpenAPI ומופעל seeder שמחליף את סיסמת ה‑placeholder של המנהל בסיסמה אמיתית.

**משתמש ברירת מחדל (פיתוח בלבד):**

```
Email:    admin@attendance.local
Password: Admin#12345
```
> יש להחליף את הסיסמה לאחר ההתחברות הראשונה.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## עיקרי ה-API

| Method | Endpoint | תיאור |
|--------|----------|-------|
| `POST` | `/api/auth/login` | התחברות, מחזיר JWT |
| `POST` | `/api/attendance/clock-in` \| `/clock-out` | רישום כניסה/יציאה |
| `POST` | `/api/attendance/break/start` \| `/break/end` | התחלת/סיום הפסקה |
| `GET`  | `/api/attendance/me` | היסטוריית נוכחות אישית |
| `POST` | `/api/attendance/{id}/resolve` | השלמת משמרת ב‑PendingReview |
| `POST` | `/api/corrections` | הגשת בקשת תיקון |
| `POST` | `/api/corrections/{id}/review` | אישור/דחייה (מנהל) |
| `GET`  | `/api/reports/me/monthly` | סיכום חודשי אישי |
| `GET`  | `/api/reports/team/range` | דוח טווח לצוות (מנהל) |

כל ה‑endpoints (מלבד `login`) דורשים JWT. נקודות קצה מסוימות מוגבלות לתפקיד `Manager`.

## הערות אבטחה

הערכים שב‑`appsettings.json` (מפתח JWT, סיסמת seed) מיועדים לפיתוח בלבד. בסביבת production יש להחליפם ולהזריקם דרך משתני סביבה או secrets store.
