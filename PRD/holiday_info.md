# Holiday Work Information Module

## 1. Overview
This module is part of the Nurse Room System.
It is used for communication between HR and Nurses regarding holiday work arrangements.

Key concepts:
- One announcement per date only
- HR manages data (Create / Edit / Delete)
- Nurse views information only
- The system shows active information (Today and Tomorrow) to ensure no missed announcements
- Notification appears immediately after HR saves data
- Auto refresh via polling every 1–5 minutes

---

## 2. Roles & Permissions

Assumption:
- users and roles tables already exist

Roles involved:
- HR: Create / Update / Delete holiday work information
- Nurse: View only

No additional user/role tables are required for this module.

---

## 3. Business Rules & Validation Logic

### HR (Create / Edit / Delete)
- One date can have only one record
- HR can:
  - Create new record
  - Edit existing record
  - Delete record (in case of mistake or no holiday work)
- Validation rules:
  - Day shift count >= 0
  - Night shift count >= 0
  - If message_type = 'OTHER', custom_message must not be NULL
  - If message_type != 'OTHER', custom_message must be NULL

### Nurse (View)
- Read-only
- System automatically shows Active data (Today & Tomorrow)
- If no data exists, show "No announcement yet"

---

## 4. Message Types

message_type values:
- CHECK_IN_5AM
- NO_SHIFT_ALL
- NORMAL_8AM
- OTHER

Display mapping:
- CHECK_IN_5AM: "Check-in at 5:00 AM, leave medicine bag at guard post"
- NO_SHIFT_ALL: "No shift for both day and night"
- NORMAL_8AM: "Normal shift starts at 8:00 AM"
- OTHER: Use custom_message

---

## 5. Database Schema (MSSQL)

### Table: holiday_work_announcements

```sql
CREATE TABLE holiday_work_announcements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    work_date DATE NOT NULL,
    day_shift_count INT NOT NULL DEFAULT 0,
    night_shift_count INT NOT NULL DEFAULT 0,
    message_type VARCHAR(30) NOT NULL,
    custom_message NVARCHAR(500) NULL,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_by INT NULL,
    updated_at DATETIME NULL,

    CONSTRAINT UQ_holiday_work_date UNIQUE (work_date),
    CONSTRAINT CK_shift_count CHECK (day_shift_count >= 0 AND night_shift_count >= 0),
    CONSTRAINT CK_message_other CHECK (
        (message_type = 'OTHER' AND custom_message IS NOT NULL)
        OR (message_type <> 'OTHER' AND custom_message IS NULL)
    )
);
```

---

## 6. Stored Procedures

### 6.1 Create Holiday Work Information

```sql
CREATE PROCEDURE sp_HolidayWork_Create
    @work_date DATE,
    @day_shift_count INT,
    @night_shift_count INT,
    @message_type VARCHAR(30),
    @custom_message NVARCHAR(500),
    @created_by INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 FROM holiday_work_announcements WHERE work_date = @work_date
    )
    BEGIN
        RAISERROR ('Record for this date already exists.', 16, 1);
        RETURN;
    END

    INSERT INTO holiday_work_announcements (
        work_date,
        day_shift_count,
        night_shift_count,
        message_type,
        custom_message,
        created_by
    )
    VALUES (
        @work_date,
        @day_shift_count,
        @night_shift_count,
        @message_type,
        @custom_message,
        @created_by
    );
END;
```

---

### 6.2 Update Holiday Work Information

```sql
CREATE PROCEDURE sp_HolidayWork_Update
    @work_date DATE,
    @day_shift_count INT,
    @night_shift_count INT,
    @message_type VARCHAR(30),
    @custom_message NVARCHAR(500),
    @updated_by INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE holiday_work_announcements
    SET
        day_shift_count = @day_shift_count,
        night_shift_count = @night_shift_count,
        message_type = @message_type,
        custom_message = @custom_message,
        updated_by = @updated_by,
        updated_at = GETDATE()
    WHERE work_date = @work_date;

    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR ('No record found for this date.', 16, 1);
    END
END;
```

---

### 6.3 Delete Holiday Work Information

```sql
CREATE PROCEDURE sp_HolidayWork_Delete
    @work_date DATE
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM holiday_work_announcements
    WHERE work_date = @work_date;

    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR ('No record found for this date.', 16, 1);
    END
END;
```

---

### 6.4 Get Holiday Work Information by Date

```sql
CREATE PROCEDURE sp_HolidayWork_GetByDate
    @work_date DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        work_date,
        day_shift_count,
        night_shift_count,
        message_type,
        custom_message,
        created_at,
        updated_at,
        created_by,
        updated_by
    FROM holiday_work_announcements
    WHERE work_date = @work_date;
END;
```

---

### 6.5 Get Active Holiday Work Information (For Nurse Home Page)

```sql
CREATE PROCEDURE sp_HolidayWork_GetActive
AS
BEGIN
    SET NOCOUNT ON;

    -- Fetch announcements for Today and Tomorrow to ensure no missed updates
    DECLARE @today DATE = CAST(GETDATE() AS DATE);
    DECLARE @tomorrow DATE = DATEADD(DAY, 1, @today);

    SELECT
        work_date,
        day_shift_count,
        night_shift_count,
        message_type,
        custom_message,
        updated_at
    FROM holiday_work_announcements
    WHERE work_date IN (@today, @tomorrow)
    ORDER BY work_date ASC;
END;
```

---

## 7. Auto Refresh & API Strategy

* **Polling:** Frontend uses polling every 1–5 minutes calling `sp_HolidayWork_GetActive`.
* **API Error Handling:** API should map SQL `RAISERROR` to proper HTTP Status Codes (e.g., 404 Not Found for Updates/Deletes on non-existent records, 409 Conflict for Duplicates).
* **UI Update:** When HR modifies data, Nurse view reflects changes automatically on the next poll.

---

## 8. UX Notes

* HR uses a single form (Create/Edit/Delete) with clear validations.
* Nurse sees information on Home Page without selecting a date. If both Today and Tomorrow have records, UI should gracefully display both or highlight Today if active.
* Highlight color by `message_type` (optional enhancement) for quick scanning.

---

## 9. Definition of Done

* HR can create, edit, and delete holiday work information.
* Nurse sees active (Today/Tomorrow) information automatically.
* One record per date is strictly enforced at the database level.
* Stored procedures handle all core operations perfectly.
* API maps errors properly and logs them if necessary.
* Does not negatively impact or break other parts of the system.

---

## 10. Implementation Checklist

### Phase 1: Database Setup
- [x] Create `holiday_work_announcements` table with `updated_by` column.
- [x] Create `sp_HolidayWork_Create`.
- [x] Create `sp_HolidayWork_Update` (with `updated_by` logic).
- [x] Create `sp_HolidayWork_Delete`.
- [x] Create `sp_HolidayWork_GetByDate`.
- [x] Create `sp_HolidayWork_GetActive`.

### Phase 2: Backend (API & Services)
- [x] Create DTOs (Data Transfer Objects) for Create/Update requests.
- [x] Create `HolidayWorkService` to handle business logic and call Stored Procedures.
- [x] Create `HolidayWorkController` to expose REST endpoints (GET, POST, PUT, DELETE).
- [x] Implement proper Error Handling in Controller (404 for Not Found, 400/409 for Business Rule violations).

### Phase 3: Frontend - HR Management
- [x] Create HR Holiday Work Management Page / Component.
- [x] Implement Form with Validation (Date picker, Shift counts >= 0, Message type dropdown, Custom message rules).
- [x] Integrate API for Create, Read, Update, and Delete operations.
- [x] Add success/error Toast/SweetAlert notifications.

### Phase 4: Frontend - Nurse View (Topbar Notification)
- [x] Create `HolidayWorkNotification` component with Bell icon and Popover.
- [x] Integrate GET Active API endpoint with 3-minute polling.
- [x] Integrate component into `AppTopbar.vue` for global visibility.
- [x] Implement UI conditional styling and Thai language support.

### Phase 5: Testing & QA
- [x] Test Database constraints (prevent duplicate dates, check shift count negative values).
- [x] Test API endpoints using Postman or Swagger.
- [x] End-to-End Test: HR creates an announcement, Nurse dashboard updates automatically within the polling interval.
- [x] Test Edge Cases (e.g., trying to update an already deleted record).
