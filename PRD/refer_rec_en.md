# Refer Tracking / Follow-up Specification (English Version)

> This document defines the **Refer Tracking & Follow-up** module, designed so that **one Visit can have multiple Refer cases (Refer #1, #2, …)** and **each Refer case can have multiple Follow-ups** (e.g. wound dressing visit #1, #2).
>
> This version is optimized for **AI CLI consumption**: concise, explicit, and low-ambiguity.

---

## 0) Existing Context

Existing tables in the system:

### `refer_types` (Lookup / Dropdown)
- `refer_type_id` (PK)
- `refer_code` (e.g. `ACCIDENT_REFER`)
- `refer_name_th`, `refer_name_en`
- `sort_order`, `is_active`

### `visits` (Legacy Refer info per Visit)
- `visit_id` (PK)
- `refer_flag` (bit 0/1 — whether this visit has refer)
- `refer_type_id` (FK → `refer_types`)
- `refer_type` (legacy nvarchar column)

### Other
- `hospitals` table already exists (hospital lookup)

**Goal**: Add a structured Refer tracking system with detailed follow-ups, without breaking existing logic.

---

## ✅ System Confirmation

- Primary Key of `visits` table is **`visit_id`**
- All new tables reference `visits.visit_id` as the source of truth

---

## 1) Project Overview

### Objectives
- Support **multiple Refer cases per Visit** (Refer #1, Refer #2, …)
- Support **multiple Follow-ups per Refer case** (timeline-based)
- Track hospital, room, outcomes, return-to-work date, and notes
- Provide clear CRUD + workflow for developers and AI CLI

### Target Users
- Clinic / Nurse / HR staff recording treatment and follow-ups
- Managers or auditors reviewing Refer history

---

## 2) Architecture Assumptions

- Database: Relational DB (SQL Server / PostgreSQL)
- Backend: REST API
- Frontend: Web UI
- Date/Time: `datetimeoffset` / `timestamptz`
- Soft delete: `is_deleted` flag

---

## 3) Core Concepts

### Visit → Refer Case → Follow-up

```
Visit (visit_id)
 ├─ Refer Case #1 (ACCIDENT_REFER)
 │   ├─ Follow-up #1 (Wound dressing)
 │   ├─ Follow-up #2 (Wound dressing)
 │   └─ Follow-up #3 (Back to Company)
 └─ Refer Case #2 (DRESSING_REFER)
     └─ Follow-up #1
```

---

## 4) Database Design

### 4.1 `refer_cases`
Represents **one Refer case** under a Visit.

**Fields**
- `refer_case_id` (PK)
- `visit_id` (FK → `visits.visit_id`)
- `refer_no` (int, sequential per visit)
- `refer_type_id` (FK → `refer_types`)
- `refer_reason` (text, optional)
- `status` (`OPEN`, `CLOSED`, `CANCELLED`)
- `opened_at`
- `closed_at` (nullable)
- `created_by`, `created_at`, `updated_by`, `updated_at`
- `is_deleted`

**Constraints**
- Unique `(visit_id, refer_no)`

---

### 4.2 `refer_followups`
Stores **all follow-up events** of a Refer case.

**Fields**
- `followup_id` (PK)
- `refer_case_id` (FK → `refer_cases`)
- `followup_no` (int, sequential per refer case)
- `followup_at`
- `hospital_id` (FK → `hospitals`, nullable)
- `room_no` (nullable)
- `outcome` enum:
  - `ADMISSION`
  - `BACK_TO_COMPANY`
  - `BACK_TO_HOME`
  - `FOLLOWUP_ONLY`
- `back_to_work_date` (required if BACK_TO_COMPANY)
- `followup_note`
- `next_appointment_at` (nullable)
- `created_by`, `created_at`, `updated_by`, `updated_at`
- `is_deleted`

**Constraints**
- Unique `(refer_case_id, followup_no)`

---

## 5) Backward Compatibility with `visits`

### Recommended Strategy (A)

- `visits` remains a **summary table**
- When a Refer Case is created:
  - `visits.refer_flag = 1`
  - `visits.refer_type_id` = latest / primary refer type
- Detailed history lives in `refer_cases` and `refer_followups`

---

## 6) CRUD Specification (REST-style)

### Refer Types
- `GET /refer-types?active=true`

### Refer Cases
- `GET /visits/{visitId}/refer-cases`
- `POST /visits/{visitId}/refer-cases`
- `PATCH /refer-cases/{referCaseId}`
- `DELETE /refer-cases/{referCaseId}` (soft delete)

**Create Refer Case Logic**
1. `refer_no = MAX(refer_no) + 1` per visit
2. Insert into `refer_cases`
3. Update `visits` summary fields

---

### Refer Follow-ups
- `GET /refer-cases/{referCaseId}/followups`
- `POST /refer-cases/{referCaseId}/followups`
- `PATCH /followups/{followupId}`
- `DELETE /followups/{followupId}` (soft delete)

**Create Follow-up Logic**
1. `followup_no = MAX(followup_no) + 1` per refer case
2. Insert follow-up
3. If outcome = `BACK_TO_COMPANY` or `BACK_TO_HOME` → optionally auto-close refer case

---

## 7) Workflow Examples

### Flow A: Create Refer from Visit
1. Save Visit (`visit_id = 11`)
2. Set `refer_flag = 1`, choose `ACCIDENT_REFER`
3. System creates Refer Case #1 (OPEN)

### Flow B: Multiple Follow-ups
- Follow-up #1: Wound dressing
- Follow-up #2: Wound dressing
- Follow-up #3: BACK_TO_COMPANY → close case

### Flow C: Second Refer in Same Visit
- Create Refer Case #2 under Visit #11
- Independent follow-up timeline

---

## 8) Sample Data

**Visit 11**
- Refer #1: ACCIDENT_REFER
- Refer #2: DRESSING_REFER

**Refer #1 Follow-ups**
1. FOLLOWUP_ONLY (Dressing #1)
2. FOLLOWUP_ONLY (Dressing #2)
3. BACK_TO_COMPANY (Return to work)

---

## 9) Implementation Notes

- Use DB transactions when generating `refer_no` / `followup_no`
- Always filter `is_deleted = 0`
- Keep audit fields consistent with auth system

---

## 10) Definition of Done

### Phase 1
- DB tables created
- CRUD APIs implemented

### Phase 2
- Visit → Refer → Follow-up UI

### Phase 3
- Dashboard: OPEN refers + next appointment

---

## 11) Optional Extensions

- Attachments (medical certificates, appointment slips)
- Doctor name / hospital case number
- Cost / insurance / workmen compensation

---
### 12) Database Views (AI-Safe Specification)

The following views MUST be used by API and reporting layers.

Do NOT re-implement the same join logic in application code.

---
#### View: vw_refer_cases_summary
**Purpose**
- One row per Refer Case
- Used for visit-level refer list and dashboard

**Source Tables**
- refer_cases rc
- refer_types rt

**Join Rules**
- rc.refer_type_id = rt.refer_type_id (INNER JOIN)

**Filter Rules**
- rc.is_deleted = 0

**Output Columns**
- refer_case_id (BIGINT)
- visit_id (INT)
- refer_no (INT)
- refer_code (VARCHAR)
- refer_name_en (NVARCHAR)
- status (VARCHAR)
- opened_at (DATETIME)
- closed_at (DATETIME)
---
#### View: vw_refer_followups_timeline
**Purpose**
- Timeline view of follow-ups per Refer Case
- Used by Refer Detail UI

**Source Tables**
- refer_followups rf
- hospitals h

**Join Rules**
- rf.hospital_id = h.hospital_id (LEFT JOIN)

**Filter Rules**
- rf.is_deleted = 0

**Output Columns**
- followup_id (BIGINT)
- refer_case_id (BIGINT)
- followup_no (INT)
- followup_at (DATETIME)
- outcome (VARCHAR)
- back_to_work_date (DATE)
- next_appointment_at (DATETIME)
- room_no (NVARCHAR)
- followup_note (NVARCHAR)
- hospital_name_th (NVARCHAR),
- hospital_name_en (NVARCHAR),
- hospital_code (VARCHAR)
---

#### View: vw_open_refer_cases
**Purpose**
- List of OPEN refer cases only
- Used for work queue and alerts
**Source Tables**
- refer_cases rc
- refer_types rt

**Join Rules**
- rc.refer_type_id = rt.refer_type_id (INNER JOIN)

**Filter Rules**
- rc.status = 'OPEN'
- rc.is_deleted = 0
**Output Columns**
- refer_case_id (BIGINT)
- visit_id (INT)
- refer_no (INT)
- refer_code (VARCHAR)
- opened_at (DATETIME)
---
#### View: vw_refer_latest_followup
**Purpose**
- Latest follow-up per Refer Case
- Used to show current refer state

**Source Tables**
- refer_followups rf

**Logic Rules**
- followup with MAX(followup_no) per refer_case_id
- rf.is_deleted = 0

**Output Columns**
- followup_id (BIGINT)
- refer_case_id (BIGINT)
- followup_no (INT)
- followup_at (DATETIME)
- outcome (VARCHAR)
- next_appointment_at (DATETIME)
---
#### View: vw_refer_followup_attachments

**Purpose**
- Files attached to follow-ups

**Source Tables**
- refer_followup_attachments a

**Filter Rules**
- a.is_deleted = 0

**Output Columns**
- attachment_id (BIGINT)
- followup_id (BIGINT)
- file_name (NVARCHAR)
- file_url (NVARCHAR)
- mime_type (NVARCHAR)
- created_at (DATETIME)

**This document is the English, AI-optimized version of `refer_rec.md`.**

---

## 13) Stored Procedures

> ⚠️ รันใน SSMS หลังจากสร้างตาราง `refer_cases` และ `refer_followups` แล้วเท่านั้น

---

### sp_Refer_01_CreateCase

**หน้าที่:** สร้าง Refer Case ใหม่ใต้ Visit พร้อม generate `refer_no` แบบ atomic และอัปเดต `visits.refer_flag`

```sql
IF EXISTS (
    SELECT * FROM sys.all_objects
    WHERE object_id = OBJECT_ID(N'[dbo].[sp_Refer_01_CreateCase]')
      AND type IN ('P', 'PC', 'RF', 'X')
)
    DROP PROCEDURE [dbo].[sp_Refer_01_CreateCase]
GO

CREATE PROCEDURE [dbo].[sp_Refer_01_CreateCase]
    @VisitId      INT,
    @ReferTypeId  INT,
    @ReferReason  NVARCHAR(MAX) = NULL,
    @OpenedAt     DATETIME      = NULL,
    @CreatedBy    NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- ตรวจสอบ visit
    IF NOT EXISTS (
        SELECT 1 FROM visits WHERE visit_id = @VisitId
    )
    BEGIN
        SELECT 0 AS Status, N'ไม่พบ visit_id = ' + CAST(@VisitId AS NVARCHAR) AS Message;
        RETURN;
    END;

    -- ตรวจสอบ refer_type
    IF NOT EXISTS (
        SELECT 1 FROM refer_types WHERE refer_type_id = @ReferTypeId AND is_active = 1
    )
    BEGIN
        SELECT 0 AS Status, N'ไม่พบ refer_type_id หรือ inactive' AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Generate refer_no แบบ atomic
        DECLARE @ReferNo INT;
        SELECT @ReferNo = ISNULL(MAX(refer_no), 0) + 1
        FROM refer_cases
        WHERE visit_id = @VisitId
          AND is_deleted = 0;

        -- INSERT refer_case
        INSERT INTO refer_cases (
            visit_id, refer_no, refer_type_id,
            refer_reason, status, opened_at,
            created_by, created_at
        )
        VALUES (
            @VisitId, @ReferNo, @ReferTypeId,
            @ReferReason, 'OPEN', ISNULL(@OpenedAt, GETDATE()),
            @CreatedBy, GETDATE()
        );

        DECLARE @NewReferCaseId BIGINT = SCOPE_IDENTITY();

        -- อัปเดต visits summary (backward compat)
        UPDATE visits
        SET refer_flag    = 1,
            refer_type_id = @ReferTypeId
        WHERE visit_id = @VisitId;

        COMMIT TRANSACTION;

        SELECT 1 AS Status,
               N'สร้าง Refer Case สำเร็จ' AS Message,
               @NewReferCaseId AS refer_case_id,
               @ReferNo        AS refer_no;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO
```

---

### sp_Refer_02_CreateFollowup

**หน้าที่:** สร้าง Follow-up ใหม่ใต้ Refer Case พร้อม generate `followup_no` แบบ atomic และ auto-close case เมื่อ outcome = `BACK_TO_COMPANY` หรือ `BACK_TO_HOME`

```sql
IF EXISTS (
    SELECT * FROM sys.all_objects
    WHERE object_id = OBJECT_ID(N'[dbo].[sp_Refer_02_CreateFollowup]')
      AND type IN ('P', 'PC', 'RF', 'X')
)
    DROP PROCEDURE [dbo].[sp_Refer_02_CreateFollowup]
GO

CREATE PROCEDURE [dbo].[sp_Refer_02_CreateFollowup]
    @ReferCaseId        BIGINT,
    @FollowupAt         DATETIME      = NULL,
    @HospitalId         INT           = NULL,
    @RoomNo             NVARCHAR(50)  = NULL,
    @Outcome            NVARCHAR(30),   -- ADMISSION | BACK_TO_COMPANY | BACK_TO_HOME | FOLLOWUP_ONLY
    @BackToWorkDate     DATE          = NULL,
    @FollowupNote       NVARCHAR(MAX) = NULL,
    @NextAppointmentAt  DATETIME      = NULL,
    @TreatmentCost      DECIMAL(10,2) = NULL,
    @CreatedBy          NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- ตรวจสอบ outcome enum
    IF @Outcome NOT IN ('ADMISSION', 'BACK_TO_COMPANY', 'BACK_TO_HOME', 'FOLLOWUP_ONLY')
    BEGIN
        SELECT 0 AS Status,
               N'outcome ต้องเป็น ADMISSION / BACK_TO_COMPANY / BACK_TO_HOME / FOLLOWUP_ONLY' AS Message;
        RETURN;
    END;

    -- ตรวจสอบ back_to_work_date เมื่อ BACK_TO_COMPANY
    IF @Outcome = 'BACK_TO_COMPANY' AND @BackToWorkDate IS NULL
    BEGIN
        SELECT 0 AS Status, N'กรุณาระบุ BackToWorkDate เมื่อ outcome = BACK_TO_COMPANY' AS Message;
        RETURN;
    END;

    -- ตรวจสอบ refer_case
    DECLARE @CaseStatus VARCHAR(20);
    SELECT @CaseStatus = status
    FROM refer_cases
    WHERE refer_case_id = @ReferCaseId AND is_deleted = 0;

    IF @CaseStatus IS NULL
    BEGIN
        SELECT 0 AS Status, N'ไม่พบ refer_case_id = ' + CAST(@ReferCaseId AS NVARCHAR) AS Message;
        RETURN;
    END;

    IF @CaseStatus = 'CLOSED'
    BEGIN
        SELECT 0 AS Status, N'ไม่สามารถเพิ่ม Follow-up ใน Refer Case ที่ปิดแล้ว' AS Message;
        RETURN;
    END;

    IF @CaseStatus = 'CANCELLED'
    BEGIN
        SELECT 0 AS Status, N'ไม่สามารถเพิ่ม Follow-up ใน Refer Case ที่ยกเลิกแล้ว' AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Generate followup_no แบบ atomic
        DECLARE @FollowupNo INT;
        SELECT @FollowupNo = ISNULL(MAX(followup_no), 0) + 1
        FROM refer_followups
        WHERE refer_case_id = @ReferCaseId
          AND is_deleted = 0;

        -- INSERT followup
        INSERT INTO refer_followups (
            refer_case_id, followup_no, followup_at,
            hospital_id, room_no, outcome,
            back_to_work_date, followup_note,
            next_appointment_at, treatment_cost,
            created_by, created_at
        )
        VALUES (
            @ReferCaseId, @FollowupNo, ISNULL(@FollowupAt, GETDATE()),
            @HospitalId, @RoomNo, @Outcome,
            @BackToWorkDate, @FollowupNote,
            @NextAppointmentAt, @TreatmentCost,
            @CreatedBy, GETDATE()
        );

        DECLARE @NewFollowupId BIGINT = SCOPE_IDENTITY();

        -- Auto-close refer_case เมื่อ outcome บ่งชี้ว่าจบแล้ว
        IF @Outcome IN ('BACK_TO_COMPANY', 'BACK_TO_HOME')
        BEGIN
            UPDATE refer_cases
            SET status     = 'CLOSED',
                closed_at  = GETDATE(),
                updated_by = @CreatedBy,
                updated_at = GETDATE()
            WHERE refer_case_id = @ReferCaseId;
        END;

        COMMIT TRANSACTION;

        SELECT 1 AS Status,
               N'สร้าง Follow-up สำเร็จ' AS Message,
               @NewFollowupId AS followup_id,
               @FollowupNo    AS followup_no,
               CASE WHEN @Outcome IN ('BACK_TO_COMPANY', 'BACK_TO_HOME')
                    THEN 1 ELSE 0
               END AS case_auto_closed;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO
```


---

## 15) Adding `treatment_cost` Field (Patch)

> รันใน SSMS เพื่อเพิ่มคอลัมน์ค่าใช้จ่ายในการรักษาให้กับตาราง `refer_followups`

### Step 1 — ALTER TABLE

```sql
ALTER TABLE refer_followups
ADD treatment_cost DECIMAL(10,2) NULL;
GO
```

### Step 2 — Re-run sp_Refer_02_CreateFollowup

รัน script ใน **Section 13** (`sp_Refer_02_CreateFollowup`) อีกครั้ง เพราะ SP ได้รับพารามิเตอร์ใหม่ `@TreatmentCost DECIMAL(10,2) = NULL`

---

## 14) Implementation Checklist

> ใช้สำหรับติดตามความคืบหน้าการพัฒนาฟีเจอร์ Refer Tracking  
> อัปเดต `[x]` เมื่อทำเสร็จ, `[ ]` คือยังไม่เสร็จ

---

### 🗄️ Phase 0 — Database (ดำเนินการใน SSMS)

- [x] รัน script สร้างตาราง `refer_cases`
- [x] รัน script สร้างตาราง `refer_followups`
- [x] รัน script สร้าง view `vw_refer_cases_summary`
- [x] รัน script สร้าง view `vw_refer_followups_timeline`
- [x] รัน script สร้าง view `vw_open_refer_cases`
- [x] รัน script สร้าง view `vw_refer_latest_followup`
- [x] รัน `sp_Refer_01_CreateCase` (Section 13)
- [x] รัน `sp_Refer_02_CreateFollowup` (Section 13)
- [ ] ทดสอบ SP ทั้ง 2 ตัวด้วย test data ใน SSMS
- [ ] **[treatment_cost]** รัน `ALTER TABLE refer_followups ADD treatment_cost DECIMAL(10,2) NULL` (Section 15)
- [ ] **[treatment_cost]** รัน `sp_Refer_02_CreateFollowup` เวอร์ชันใหม่อีกครั้ง (Section 15)

---

### 🖥️ Phase 1 — Server (NestJS)

#### 1.1 สร้างไฟล์ Refer Module

- [x] `server/src/apis/refer/refer.interface.ts`
  - [x] `ICreateReferCaseBody`
  - [x] `IPatchReferCaseBody`
  - [x] `ICreateFollowupBody`
  - [x] `IPatchFollowupBody`
- [x] `server/src/apis/refer/refer.service.ts`
  - [x] `getCasesByVisit(visitId)` — query `vw_refer_cases_summary`
  - [x] `getByPatient(patientId)` — query tables directly (includes `refer_type_id`, `visit_datetime`)
  - [x] `createCase(body)` — execute `sp_Refer_01_CreateCase`
  - [x] `patchCase(caseId, body)` — UPDATE `refer_cases`
  - [x] `deleteCase(caseId, userId)` — soft delete `refer_cases`
  - [x] `getFollowupsByCase(caseId)` — query tables directly (includes `hospital_id`)
  - [x] `createFollowup(body)` — execute `sp_Refer_02_CreateFollowup`
  - [x] `patchFollowup(followupId, body)` — UPDATE `refer_followups`
  - [x] `deleteFollowup(followupId, userId)` — soft delete `refer_followups`
- [x] `server/src/apis/refer/refer.controller.ts`
  - [x] `GET    /refer/by-patient/:patientId`
  - [x] `GET    /refer/cases/:visitId`
  - [x] `POST   /refer/cases`
  - [x] `PATCH  /refer/cases/:caseId`
  - [x] `DELETE /refer/cases/:caseId`
  - [x] `GET    /refer/followups/:caseId`
  - [x] `POST   /refer/followups`
  - [x] `PATCH  /refer/followups/:followupId`
  - [x] `DELETE /refer/followups/:followupId`
- [x] `server/src/apis/refer/refer.module.ts`
- [x] ลงทะเบียน `ReferModule` ใน `server/src/app.module.ts`

#### 1.2 ตรวจสอบ Server

- [x] `cd server && pnpm build` — ไม่มี error

---

### 🌐 Phase 2 — Client (Vue 3)

#### 2.1 Interfaces

- [x] เพิ่ม interfaces ใน `client/src/interfaces/treatment.interfaces.ts`
  - [x] `IReferCase`
  - [x] `IReferFollowup`

#### 2.2 Service

- [x] สร้าง `client/src/services/refer.service.ts`
  - [x] `getCasesByPatient(patientId)` → `GET /refer/by-patient/:patientId`
  - [x] `createCase(body)` → `POST /refer/cases`
  - [x] `patchCase(caseId, body)` → `PATCH /refer/cases/:caseId`
  - [x] `deleteCase(caseId)` → `DELETE /refer/cases/:caseId`
  - [x] `getFollowupsByCase(caseId)` → `GET /refer/followups/:caseId`
  - [x] `createFollowup(body)` → `POST /refer/followups`
  - [x] `patchFollowup(followupId, body)` → `PATCH /refer/followups/:followupId`
  - [x] `deleteFollowup(followupId)` → `DELETE /refer/followups/:followupId`

#### 2.3 UI — Tab 3 ใน TreatmentRecord.vue

- [x] แทนที่ placeholder (lines ~1463-1472) ด้วย UI จริง
- [x] แสดงรายการ Refer Cases (Card per case with expand/collapse)
  - [x] แสดง `refer_no`, `refer_type`, วันที่, สถานะ (OPEN/CLOSED/CANCELLED)
  - [x] ปุ่ม "เพิ่ม Refer Case"
  - [x] ปุ่ม แก้ไข / ลบ Case
- [x] Dialog — สร้าง/แก้ไข Refer Case
  - [x] `refer_type_id` (Dropdown — ใช้ `lookups.refer_types`)
  - [x] `visit_id` (Dropdown — ใช้ `historyVisits`)
  - [x] `refer_reason` (Textarea)
  - [x] `opened_at` (DateInput)
- [x] แสดง Follow-up Timeline ภายใน Case (expand/collapse)
  - [x] แสดง `followup_no`, วันที่ติดตาม, outcome (Tag), โรงพยาบาล, ห้อง, บันทึก
  - [x] ปุ่ม "บันทึกการติดตาม" (เฉพาะ OPEN case)
  - [x] ปุ่ม แก้ไข / ลบ Follow-up
- [x] Dialog — สร้าง/แก้ไข Follow-up
  - [x] `followup_at` (DateInput)
  - [x] `outcome` (Dropdown: ADMISSION / BACK_TO_COMPANY / BACK_TO_HOME / FOLLOWUP_ONLY)
  - [x] `hospital_id` (Dropdown — ใช้ `lookups.hospitals`)
  - [x] `room_no` (InputText)
  - [x] `back_to_work_date` (required เมื่อ outcome = BACK_TO_COMPANY)
  - [x] `next_appointment_at` (datetime-local)
  - [x] `followup_note` (Textarea)
- [x] เรียก `loadReferCases()` เมื่อ Tab 3 ถูกเปิด (lazy load)
- [x] Clear refer state เมื่อเปลี่ยน patient (`loadPatientProfile`) และ `resetForm`

#### 2.4 ตรวจสอบ Client

- [x] `cd client && pnpm build` — ไม่มี error ✅

---

### ✅ Phase 3 — Final Verification

- [x] ทดสอบ Create Refer Case → refer_no ถูกต้อง
- [x] ทดสอบ Create Follow-up → followup_no ถูกต้อง
- [x] ทดสอบ outcome = BACK_TO_COMPANY → case auto-close
- [x] ทดสอบ outcome = BACK_TO_HOME → case auto-close
- [x] ทดสอบ outcome = FOLLOWUP_ONLY → case ยัง OPEN
- [x] ทดสอบ Delete Case (soft delete) → ไม่แสดงใน list
- [x] ทดสอบ Delete Follow-up (soft delete) → ไม่แสดงใน timeline
- [x] ตรวจสอบว่า Tab 1, 2 ของ TreatmentRecord.vue ยังทำงานปกติ
- [x] ตรวจสอบว่า TreatmentHistory.vue ยังทำงานปกติ