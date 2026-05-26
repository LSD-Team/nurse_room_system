# Refer Tracking / Refer Follow-up (Blueprint)

> เอกสารนี้ออกแบบ “ส่วนติดตามการ Refer” เพื่อให้ 1 การรักษา (Visit) สามารถมี Refer ได้มากกว่า 1 ครั้ง (Refer#1, Refer#2, …) และแต่ละ Refer มีรายการติดตาม (Follow-up) ได้หลายครั้ง (เช่น นัดล้างแผลครั้งที่ 1/2/3)

---

## 0) Context (ของเดิมในระบบ)

มีตารางเดิม:

- `refer_types` (Lookup สำหรับ dropdown)
  - `refer_type_id` (PK)
  - `refer_code` (เช่น `ACCIDENT_REFER`)
  - `refer_name_th`, `refer_name_en`
  - `sort_order`, `is_active`

- `visits` (บันทึก Refer ต่อ Visit แบบเดิม)
  - `refer_flag` (bit 0/1)
  - `refer_type_id` (FK → `refer_types`)
  - `refer_type` (legacy nvarchar)

และมี `hospitals` (lookup โรงพยาบาล) อยู่แล้ว

> เป้าหมาย: เพิ่ม “การติดตาม (Follow-up)” หลัง Refer โดยผูกกับ Visit → (หลาย Refer) → (หลาย Follow-up)


---

## ✅ System Confirmation (Updated)

- Primary Key ของตาราง `visits` คือ **`visit_id`** ✅
- Schema และ Foreign Key ทั้งหมดในเอกสารนี้อ้างอิง `visits.visit_id` เป็นแหล่งอ้างอิงหลัก (Source of Truth)


---

## 1) Project Overview

### วัตถุประสงค์
- รองรับการสร้างรายการ Refer หลายรายการภายใน Visit เดียว (เพื่อให้เกิด Refer#1, Refer#2 …)
- รองรับการบันทึก Follow-up ได้หลายครั้งต่อ Refer (timeline)
- เก็บรายละเอียดปลายทาง: โรงพยาบาล, ห้อง, สถานะผลลัพธ์ (Admission / Back to Company / Back to Home), วันกลับมาทำงาน, ฯลฯ
- ทำ CRUD + Flow ให้ทีม dev / AI CLI นำไป implement ได้ตรงกัน

### กลุ่มผู้ใช้
- เจ้าหน้าที่พยาบาล/คลินิก/HR ที่บันทึกการรักษา และติดตามผล
- ผู้จัดการ/ผู้ตรวจสอบที่ต้องการดูประวัติ Refer และผลการติดตาม

---

## 2) Tech Stack & Environment (ระบุแบบเป็นกลาง)

> หากระบบมี stack อยู่แล้ว ให้ map ตามของจริงได้เลย เอกสารนี้เขียนให้ implement ได้ทั้ง SQL Server / PostgreSQL

- DB: Relational DB (SQL Server หรือ PostgreSQL)
- Backend: REST API (เช่น .NET / Node / Java ได้หมด)
- Frontend: Web UI (เช่น React/Vue/Angular หรือ Razor)
- Date/Time: เก็บเป็น `datetimeoffset` (SQL Server) หรือ `timestamptz` (PostgreSQL) เพื่อรองรับ timezone
- Soft delete: ใช้ `is_deleted` (ถ้าระบบนิยม soft delete)

---

## 3) Core Features (User Stories)

### 3.1 Refer Case (หลาย Refer ต่อ Visit)
- [ ] **US-01**: ในหน้าบันทึกการรักษา (Visit) ผู้ใช้เลือก “ต้อง Refer” และเลือกประเภท Refer (`refer_type_id`)
  - ระบบสร้าง/อัปเดต Visit ตามของเดิม (`visits.refer_flag`, `visits.refer_type_id`) *เพื่อ backward compatibility*
  - ระบบสามารถสร้าง “Refer Case” ใหม่ 1 รายการผูกกับ Visit (ได้ Refer#1)

- [ ] **US-02**: ผู้ใช้สามารถ “เพิ่ม Refer ใหม่” ภายใน Visit เดิม (ได้ Refer#2, Refer#3)

- [ ] **US-03**: ผู้ใช้ดูรายการ Refer ทั้งหมดของ Visit (แสดงลำดับ, ประเภท, สถานะเปิด/ปิด)

### 3.2 Follow-up (หลายครั้งต่อ Refer)
- [ ] **US-04**: ผู้ใช้เพิ่ม Follow-up ให้ Refer (เช่น นัดล้างแผลครั้งที่ 1)
- [ ] **US-05**: ใน Follow-up เก็บข้อมูล
  - โรงพยาบาล (`hospital_id`), ห้อง (`room_no`)
  - ผลลัพธ์: `ADMISSION` / `BACK_TO_COMPANY` / `BACK_TO_HOME`
  - วันกลับมาทำงาน (`back_to_work_date`) เมื่อเลือก Back to Company
  - รายละเอียดการรักษา/ผลการติดตาม (`followup_note`)
  - วันนัดครั้งถัดไป (`next_appointment_at`) (optional)

- [ ] **US-06**: ผู้ใช้แก้ไข/ลบ Follow-up ได้ (ตามสิทธิ์)

### 3.3 สถานะ Refer และการปิดเคส
- [ ] **US-07**: Refer มีสถานะ `OPEN`/`CLOSED`
  - ปิดเคสเมื่อเกิดเหตุการณ์กลับบริษัท/กลับบ้าน หรือผู้ใช้กดปิด
- [ ] **US-08**: Dashboard/รายการงานค้าง: แสดง Refer ที่ยัง OPEN และมี next appointment

### 3.4 UI/UX Logic (แนวทาง)
- [ ] หน้าบันทึก Visit: ส่วน Refer แสดง toggle `refer_flag` + dropdown `refer_type_id` + ปุ่ม “สร้าง Refer Case”
- [ ] หน้ารายละเอียด Visit: แท็บ “Refer & Follow-up”
  - ซ้าย: รายการ Refer Cases (Refer#1, Refer#2)
  - ขวา: Timeline Follow-ups ของ Refer ที่เลือก
  - ปุ่ม “Add Follow-up”
- [ ] สถานะสี (suggestion): OPEN = สีส้ม, CLOSED = สีเขียว

---

## 4) Database Schema

> ตั้งใจออกแบบให้ **ไม่ต้องแก้ visits เดิมเยอะ** แต่เพิ่มตารางใหม่ แล้ว sync คอลัมน์เดิมเพื่อความเข้ากันได้

### 4.1 ตารางใหม่: `refer_cases`
ใช้แทน “หนึ่งการ refer หนึ่งเคส” (Refer#1, Refer#2 …) ภายใต้ Visit

**Columns**
- `refer_case_id` (PK, bigint/uuid)
- `visit_id` (FK → `visits.visit_id`)  ✅ *ต้องมี visit_id เป็น PK ใน visits*
- `refer_no` (int) ลำดับ Refer ภายใน Visit (เริ่ม 1)
- `refer_type_id` (FK → `refer_types.refer_type_id`)
- `refer_reason` (nvarchar/text, optional) หมายเหตุเหตุผล/สรุปก่อนส่ง
- `status` (varchar) enum: `OPEN`, `CLOSED`, `CANCELLED`
- `opened_at` (datetime)
- `closed_at` (datetime, nullable)
- `created_by`, `created_at`, `updated_by`, `updated_at`
- `is_deleted` (bit/bool, default 0) *ถ้าใช้ soft delete*

**Constraints**
- Unique `(visit_id, refer_no)`
- Index `(visit_id)`
- Index `(status, opened_at)` เพื่อทำ dashboard

```sql
-- SQL Server-ish (ปรับชนิดตาม DB)
CREATE TABLE refer_cases (
  refer_case_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  visit_id      INT NOT NULL,
  refer_no      INT NOT NULL,
  refer_type_id INT NOT NULL,
  refer_reason  NVARCHAR(1000) NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  opened_at     DATETIME NOT NULL DEFAULT GETUTCDATE(),
  closed_at     DATETIME NULL,
  created_by    NVARCHAR(100) NULL,
  created_at    DATETIME NOT NULL DEFAULT GETUTCDATE(),
  updated_by    NVARCHAR(100) NULL,
  updated_at    DATETIME NULL,
  is_deleted    BIT NOT NULL DEFAULT 0,
  CONSTRAINT FK_refer_cases_visits
      FOREIGN KEY (visit_id)
      REFERENCES visits(visit_id),
  CONSTRAINT FK_refer_cases_refer_types
      FOREIGN KEY (refer_type_id)
      REFERENCES refer_types(refer_type_id),
  CONSTRAINT UQ_refer_cases_visit_no
      UNIQUE (visit_id, refer_no)
);
GO
CREATE INDEX IX_refer_cases_visit
  ON refer_cases (visit_id);
GO
CREATE INDEX IX_refer_cases_status
  ON refer_cases (status, opened_at);
GO
```

### 4.2 ตารางใหม่: `refer_followups`
เก็บทุก event/การติดตามของ Refer เคสหนึ่งๆ

**Columns**
- `followup_id` (PK)
- `refer_case_id` (FK → `refer_cases.refer_case_id`)
- `followup_no` (int) ลำดับภายใน Refer (เริ่ม 1)
- `followup_at` (datetime) วันที่/เวลาติดตาม
- `hospital_id` (FK → `hospitals.hospital_id`, nullable) โรงพยาบาลที่ไป
- `room_no` (nvarchar(50), nullable) หมายเลขห้อง
- `outcome` (varchar) enum:
  - `ADMISSION`
  - `BACK_TO_COMPANY`
  - `BACK_TO_HOME`
  - `FOLLOWUP_ONLY` (กรณีมาอัปเดตเฉยๆ เช่น นัดล้างแผล)
- `back_to_work_date` (date, nullable) ใช้เมื่อ outcome = BACK_TO_COMPANY
- `followup_note` (nvarchar/text, nullable)
- `next_appointment_at` (datetime, nullable)
- `created_by`, `created_at`, `updated_by`, `updated_at`
- `is_deleted` (bit/bool)

**Rules/Constraints**
- Unique `(refer_case_id, followup_no)`
- Index `(refer_case_id, followup_at DESC)`
- Check constraint: ถ้า `outcome='BACK_TO_COMPANY'` ต้องมี `back_to_work_date`

```sql
CREATE TABLE refer_followups (
  followup_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  refer_case_id BIGINT NOT NULL,   -- ✅ MUST match refer_cases.refer_case_id
  followup_no INT NOT NULL,
  followup_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
  hospital_id INT NULL,            -- ✅ ต้องตรงกับ hospitals.hospital_id
  room_no NVARCHAR(50) NULL,
  outcome VARCHAR(30) NOT NULL DEFAULT 'FOLLOWUP_ONLY',
  back_to_work_date DATE NULL,
  followup_note NVARCHAR(2000) NULL,
  next_appointment_at DATETIME NULL,
  created_by NVARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
  updated_by NVARCHAR(100) NULL,
  updated_at DATETIME NULL,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT FK_refer_followups_case
      FOREIGN KEY (refer_case_id)
      REFERENCES refer_cases(refer_case_id),
  CONSTRAINT FK_refer_followups_hospitals
      FOREIGN KEY (hospital_id)
      REFERENCES hospitals(hospital_id),
  CONSTRAINT UQ_refer_followups_case_no
      UNIQUE (refer_case_id, followup_no)
);
GO
CREATE INDEX IX_refer_followups_case_at
ON refer_followups (refer_case_id, followup_at DESC);
GO
```

### 4.3 (Optional) ตารางแนบไฟล์: `refer_followup_attachments`
ถ้าต้องเก็บเอกสาร: ใบรับรองแพทย์, ใบนัด, ฯลฯ

```sql
CREATE TABLE refer_followup_attachments (
  attachment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  followup_id BIGINT NOT NULL,   -- ✅ match refer_followups.followup_id
  file_name NVARCHAR(255) NOT NULL,
  file_url  NVARCHAR(1000) NOT NULL,
  mime_type NVARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
  created_by NVARCHAR(100) NULL,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT FK_rfa_followup
      FOREIGN KEY (followup_id)
      REFERENCES refer_followups(followup_id)
);
GO
CREATE INDEX IX_rfa_followup
ON refer_followup_attachments (followup_id);
GO
```

---

## 5) การทำงานร่วมกับ `visits` (Backward Compatibility Strategy)

เนื่องจาก `visits` มี `refer_flag` + `refer_type_id` อยู่แล้ว แนะนำ 2 แนวทาง:

### แนวทาง A (แนะนำ): `visits` เป็น “สรุป/primary” ส่วนรายละเอียดอยู่ที่ตารางใหม่
- ตอนบันทึก visit ถ้า `refer_flag=1` และเลือก `refer_type_id`
  - สร้าง `refer_cases` 1 record อัตโนมัติ (refer_no = max+1)
  - update `visits.refer_flag=1` และ `visits.refer_type_id` = type ของ refer ล่าสุด/หลัก
- ตอน user เพิ่ม refer ใหม่ใน visit:
  - เพิ่ม refer_cases และ update visits summary ให้สะท้อน refer ล่าสุด

### แนวทาง B: ค่อยๆ deprecate คอลัมน์เดิม
- ใช้ `refer_cases` เป็นแหล่งความจริง 100%
- `visits.refer_flag/refer_type_id` เป็น computed/materialized เพื่อ report เก่าเท่านั้น

> เอกสารนี้ implement ได้ทั้ง A/B แต่ใน CRUD ด้านล่างจะอิงแนวทาง A เพื่อไม่กระทบระบบเดิม

---

## 6) CRUD Spec (API + Validation)

> ตั้งชื่อ endpoint เป็นแนวทาง REST (ปรับให้เข้ากับ backend ที่ใช้อยู่)

### 6.1 Refer Types (read-only)
- `GET /refer-types?active=true`

### 6.2 Refer Cases
- `GET /visits/{visitId}/refer-cases`
  - คืน list ของ refer cases (ไม่รวม is_deleted=1)
- `POST /visits/{visitId}/refer-cases`
  - ใช้สร้าง Refer#ใหม่ภายใต้ Visit
  - Request body:

```json
{
  "refer_type_id": 3,
  "refer_reason": "อุบัติเหตุจากเครื่องจักร มีบาดแผลลึก",
  "opened_at": "2026-05-23T03:00:00Z"
}
```

  - Server logic:
    1) หา `nextReferNo = MAX(refer_no)+1` ของ visit
    2) Insert refer_case
    3) Update `visits.refer_flag=1` และ `visits.refer_type_id = refer_type_id`

- `PATCH /refer-cases/{referCaseId}`
  - แก้ `refer_type_id`, `refer_reason`, `status`
  - ถ้าปิดเคส: set `status='CLOSED'`, `closed_at=now`

- `DELETE /refer-cases/{referCaseId}` (soft delete)
  - set `is_deleted=1`

**Validation**
- `refer_type_id` ต้องมีอยู่และ is_active=1
- การปิดเคส (`CLOSED`) ควรตรวจว่าไม่มี follow-up ที่ is_deleted=0 แล้วต้องการแก้ไขย้อนหลัง (ขึ้นกับ policy)

### 6.3 Refer Follow-ups
- `GET /refer-cases/{referCaseId}/followups`
- `POST /refer-cases/{referCaseId}/followups`

```json
{
  "followup_at": "2026-05-24T02:00:00Z",
  "hospital_id": 15,
  "room_no": "B-1203",
  "outcome": "FOLLOWUP_ONLY",
  "followup_note": "แพทย์นัดล้างแผลครั้งที่ 1",
  "next_appointment_at": "2026-05-31T02:00:00Z"
}
```

- `PATCH /followups/{followupId}`
- `DELETE /followups/{followupId}` (soft delete)

**Server logic (POST followup)**
1) หา `nextFollowupNo = MAX(followup_no)+1` ของ refer_case
2) Insert followup
3) ถ้า `outcome` เป็น `BACK_TO_COMPANY` หรือ `BACK_TO_HOME`:
   - แนะนำให้ปิด refer_case อัตโนมัติ (หรือให้เลือก checkbox “Close case”)

**Validation**
- outcome ∈ {ADMISSION, BACK_TO_COMPANY, BACK_TO_HOME, FOLLOWUP_ONLY}
- ถ้า outcome=BACK_TO_COMPANY ต้องมี `back_to_work_date`

---

## 7) Flow การทำงาน (End-to-End)

### Flow 1: บันทึก Visit แล้วต้อง Refer (สร้าง Refer#1)
1) ผู้ใช้บันทึกการรักษาใน `visits`
2) เปิด refer toggle (`refer_flag=1`) + เลือก `refer_type_id=ACCIDENT_REFER`
3) กด Save
4) ระบบ:
   - Update `visits.refer_flag=1`, `visits.refer_type_id=<accident>`
   - Create `refer_cases` (visit_id=#11, refer_no=1, status=OPEN)
5) UI แสดง Refer#1 และปุ่ม Add Follow-up

### Flow 2: ติดตามผลครั้งที่ 1/2/3
1) เปิด Visit #11 → แท็บ Refer
2) เลือก Refer#1
3) กด Add Follow-up → กรอก “นัดล้างแผลครั้งที่ 1”
4) Save → ได้ followup_no=1
5) ทำซ้ำครั้งที่ 2 → followup_no=2

### Flow 3: ปิดเคสเมื่อกลับบริษัท
1) เพิ่ม Follow-up outcome=`BACK_TO_COMPANY`
2) ระบุ `back_to_work_date`
3) ระบบปิดเคส refer_case (status=CLOSED)
4) Dashboard ไม่แสดงเคสนี้ใน OPEN

### Flow 4: Refer เพิ่มครั้งใหม่ (Refer#2) ใน Visit เดิม
1) ใน Visit #11 ผู้ใช้กด “Add Refer Case”
2) เลือก refer_type_id ใหม่
3) ระบบสร้าง refer_no=2 (Refer#2)
4) Follow-up ของ Refer#1 และ Refer#2 แยก timeline

---

## 8) ตัวอย่าง Data (Sample)

### refer_cases
- Visit #11
  - Refer#1: `ACCIDENT_REFER` (OPENED 2026-05-23)
  - Refer#2: `DRESSING_REFER` (OPENED 2026-06-01)

### refer_followups (Refer#1)
1) 2026-05-24: FOLLOWUP_ONLY — ล้างแผลครั้งที่ 1 (Hospital A)
2) 2026-05-31: FOLLOWUP_ONLY — ล้างแผลครั้งที่ 2 (Hospital A)
3) 2026-06-07: BACK_TO_COMPANY — กลับเข้าทำงาน 2026-06-08

---

## 9) Coding Standards & Constraints

- ใช้ transaction ตอนสร้าง refer_case + update visits summary
- หลีกเลี่ยง race condition ของ `refer_no`/`followup_no`
  - ใช้ transaction + lock (หรือใช้ sequence/identity แทน refer_no แล้วคำนวณจาก row_number ตอนแสดง)
  - แต่เพราะต้องการ Refer#1/#2 ที่ “คงที่” แนะนำเก็บ `refer_no` เป็น field และสร้างด้วย transaction
- Soft delete: ทุก query ต้องกรอง `is_deleted=0`
- Audit fields: ให้บันทึกผู้สร้าง/ผู้แก้ไขตามระบบ auth ที่มีอยู่

---

## 10) Definition of Done / Milestones

### Phase 1 — DB & API
- [ ] สร้างตาราง `refer_cases`, `refer_followups` (+ optional attachments)
- [ ] API CRUD ตามข้อ 6
- [ ] Unit tests validation (outcome/back_to_work_date)

### Phase 2 — UI
- [ ] Tab Refer & Follow-up ในหน้า Visit
- [ ] List Refer Cases + Timeline Follow-ups
- [ ] ฟอร์ม Add/Edit Follow-up

### Phase 3 — Dashboard & Reporting
- [ ] หน้างานค้าง Refer OPEN + นัดครั้งถัดไป
- [ ] Export/Report (ถ้ามี requirement)

---

## 11) จุดที่ควร confirm กับระบบจริง (เพื่อให้ implement เป๊ะ)

> ส่วนนี้เป็น checklist สำหรับคุณอ่านแล้วบอกผมว่าต้องปรับอะไรบ้าง

1) `visits` ใช้ PK ชื่ออะไรแน่ (`visit_id` หรือ `id`)?
2) ต้องการให้ “1 visit มีได้หลาย refer” แน่นอนใช่ไหม (ตามโจทย์) — ถ้าใช่ schema นี้รองรับแล้ว
3) สถานะ outcome ต้องมีเพิ่มไหม (เช่น `TRANSFER`, `DEATH`, `REHAB` ฯลฯ)
4) ต้องเก็บ “ชื่อโรงพยาบาลที่กรอกเอง” กรณีไม่อยู่ใน `hospitals` ไหม?
5) สิทธิ์การแก้ไขย้อนหลัง: แก้ follow-up ย้อนหลังได้ถึงกี่วัน/ต้อง audit เพิ่มไหม?

---

## 12) Quick Mapping กับของเดิม (สรุป)

- ของเดิม (visits): เก็บว่า visit นี้ “มี refer” และ “ประเภท refer ล่าสุด/หลัก”
- ของใหม่ (refer_cases): เก็บ “แต่ละ refer ภายใน visit” เป็น Refer#1/#2
- ของใหม่ (refer_followups): เก็บ “timeline การติดตาม” ของแต่ละ refer

> ถ้าคุณโอเคกับ blueprint นี้ บอกผมได้เลยว่าต้องการเพิ่ม field อะไร (เช่น ค่ารักษา, เลขเคส รพ., หมอผู้รักษา) ผมจะปรับเอกสารให้พร้อมสำหรับ implement จริงทันที
