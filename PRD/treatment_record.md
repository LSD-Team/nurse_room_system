# Treatment Record — แผนพัฒนาและคำสั่ง SQL ครบชุด

> สร้าง: 2026-05-20 | Branch: `feature/treatment_record`
> อ้างอิงจาก: `PRD/toTreatment_record.md` (ภาพรวมทั้งระบบ)

---

## 1. ภาพรวม Feature นี้

บันทึกการรักษาพยาบาลในห้องพยาบาล ครอบคลุม:
- บันทึก visit ใหม่ (พนักงาน/บุคคลภายนอก)
- กรอก Vital Signs, อาการ, กลุ่มโรค, การรักษา
- จ่ายยา/เวชภัณฑ์ → ลด stock ทันที (ไม่มี approval flow)
- แจ้งเตือนแพ้ยาก่อนจ่าย
- ดูประวัติการรักษาย้อนหลัง

---

## 2. User Flow

```
พยาบาลเปิดหน้า "บันทึกการรักษา"
           │
           ▼
  [ค้นหาผู้ป่วย]
  ├── ค้นหาพนักงาน (EmployeeID / ชื่อ) → EmployeesModule
  └── บุคคลภายนอก → กรอก ชื่อ-นามสกุล, บริษัท, เลขบัตร ฯลฯ
           │
           ▼
  [แสดง Patient Summary]   ← sp_PP_01_GetOrCreatePatientProfile (มีอยู่แล้ว)
  ├── ⚠️ แพ้ยา/อาหาร (patient_allergies) → แสดง ConfirmDialog ก่อนจ่าย
  ├── โรคประจำตัว (patient_underlying_diseases)
  └── น้ำหนัก/BMI ล่าสุด (patient_physical_info)
           │
           ▼
  [กรอกข้อมูล Visit]
  ├── วันเวลา + กะงาน (shift_code)
  ├── อาการ / chief complaint (symptoms)
  ├── Vital Signs → vitals_json
  ├── กลุ่มโรค (disease_groups) + ประเภทโรค (disease_sub_groups)
  ├── ประเภทการรักษา (treatment_types)
  ├── [ถ้า refer_flag] ประเภท Refer + โรงพยาบาล
  ├── [ถ้า accident_flag] ความรุนแรง (accident_severity_types) + โรคจากงาน
  ├── ยา/อุปกรณ์ที่ใช้ (visit_usages) ← DataTable เพิ่ม/ลบได้
  └── คำแนะนำพยาบาล (nursing_advice)
           │
           ▼
  [บันทึก] → sp_TR_01_CreateVisit
  ├── INSERT visits
  ├── INSERT visit_usages (loop from JSON)
  └── UPDATE stock_on_hand - qty  +  INSERT stock_movements (DISPENSE)
           │
           ▼
  [แสดงผลสำเร็จ] → ลิงก์ดูรายละเอียด / เริ่มบันทึกใหม่
```

---

## 3. Database Schema — ตารางที่ใช้ใน Feature นี้

> **หมายเหตุ:** ตารางทั้งหมดมีในฐานข้อมูลแล้ว ไม่ต้อง CREATE TABLE ใหม่

### 3.1 visits (ตารางหลัก)
```sql
visits (
  visit_id            INT IDENTITY PK
  visit_datetime      DATETIME NOT NULL          -- วันเวลาที่เข้า
  shift_code          NVARCHAR(50) NULL           -- กะงาน
  patient_type        NVARCHAR(20) NOT NULL       -- 'EMP' | 'EXT'
  employee_id         NVARCHAR(50) NULL           -- รหัสพนักงาน (EMP)
  external_person_id  INT NULL                    -- FK → external_people (EXT)
  patient_id          INT NULL                    -- FK → patient_profiles
  symptoms            NVARCHAR(1000) NULL         -- อาการ
  vitals_json         NVARCHAR(MAX) NULL          -- JSON vital signs
  group_id            INT NULL                    -- FK → disease_groups
  disease_id          INT NULL                    -- FK → disease_sub_groups
  treatment_type_id   INT NULL                    -- FK → treatment_types
  nursing_advice      NVARCHAR(1000) NULL         -- คำแนะนำพยาบาล
  accident_in_work_flag  BIT DEFAULT 0            -- อุบัติเหตุในงาน
  work_related_flag   BIT DEFAULT 0               -- โรคจากการทำงาน
  severity_id         INT NULL                    -- FK → accident_severity_types
  refer_flag          BIT DEFAULT 0               -- ส่งต่อหรือไม่
  refer_type_id       INT NULL                    -- FK → refer_types
  refer_type          NVARCHAR(50) NULL           -- (legacy, ใช้ refer_type_id แทน)
  created_by          NVARCHAR(100) NULL
  created_at          DATETIME DEFAULT GETDATE()
)
```

### 3.2 visit_usages (รายการยา/อุปกรณ์)
```sql
visit_usages (
  visit_usage_id  INT IDENTITY PK
  visit_id        INT NOT NULL       -- FK → visits
  item_id         INT NOT NULL       -- FK → items
  qty_base        INT NOT NULL       -- จำนวนที่จ่าย
  created_by      NVARCHAR(100) NULL
  created_at      DATETIME DEFAULT GETDATE()
)
```

### 3.3 visit_usage_edit_logs (log การแก้ไข)
```sql
visit_usage_edit_logs (
  log_id          INT IDENTITY PK
  visit_usage_id  INT NOT NULL
  edited_by       NVARCHAR(100) NOT NULL
  edited_at       DATETIME DEFAULT GETDATE()
  old_qty_base    INT NOT NULL
  new_qty_base    INT NOT NULL
  reason          NVARCHAR(500) NOT NULL
)
```

### 3.4 patient_profiles
```sql
patient_profiles (
  patient_id            INT IDENTITY PK
  patient_type          NVARCHAR(20) NOT NULL   -- 'EMP' | 'EXT'
  employee_id           NVARCHAR(50) NULL
  external_person_id    INT NULL
  no_known_allergy      BIT DEFAULT 0
  no_known_allergy_confirmed_by   NVARCHAR(100) NULL
  no_known_allergy_confirmed_at   DATETIME NULL
  created_at            DATETIME DEFAULT GETDATE()
  created_by            NVARCHAR(100) NOT NULL
)
```

### 3.5 patient_allergies
```sql
patient_allergies (
  allergy_id    INT IDENTITY PK
  patient_id    INT NOT NULL
  item_id       INT NULL        -- FK → items (ถ้าแพ้ยาที่มีในระบบ)
  drug_name     NVARCHAR(200) NULL
  reaction      NVARCHAR(500) NULL
  severity      NVARCHAR(20) DEFAULT 'MILD'    -- MILD | MODERATE | SEVERE
  allergy_type  NVARCHAR(20) DEFAULT 'DRUG'    -- DRUG | FOOD | OTHER
  source        NVARCHAR(30) NULL              -- SELF_REPORT | MEDICAL_RECORD
  noted_at      DATE NOT NULL
  noted_by      NVARCHAR(100) NOT NULL
  is_active     BIT DEFAULT 1
)
```

### 3.6 patient_underlying_diseases
```sql
patient_underlying_diseases (
  condition_id    INT IDENTITY PK
  patient_id      INT NOT NULL
  disease_name    NVARCHAR(200) NOT NULL
  sub_group_id    INT NULL          -- FK → disease_sub_groups
  diagnosed_year  INT NULL
  control_status  NVARCHAR(30) NULL
  note            NVARCHAR(500) NULL
  created_by      NVARCHAR(100) NOT NULL
  created_at      DATETIME DEFAULT GETDATE()
  is_active       BIT DEFAULT 1
)
```

### 3.7 external_people
```sql
external_people (
  external_person_id  INT IDENTITY PK
  full_name           NVARCHAR(200) NOT NULL
  company             NVARCHAR(200) NULL
  national_id         NVARCHAR(50) NULL
  passport_no         NVARCHAR(50) NULL
  phone               NVARCHAR(50) NULL
  created_at          DATETIME DEFAULT GETDATE()
  is_deleted          BIT DEFAULT 0
  deleted_at          DATETIME NULL
)
```

### 3.8 ตาราง Lookup (มีข้อมูลพร้อมใช้)
| Table | ข้อมูล |
|-------|--------|
| `treatment_types` | REST, DRESSING, SEND_HOME, DISPENSE, EYE_WASH |
| `refer_types` | EMERGENCY, REST_REFER, ACCIDENT_REFER, DRESSING_REFER |
| `accident_severity_types` | STOP_WORK, REST, WORK_NORMAL, REFER_HOSP |
| `disease_groups` | กลุ่มโรค 12 กลุ่ม |
| `disease_sub_groups` | กลุ่มย่อยโรค (FK → disease_groups) |
| `hospitals` | โรงพยาบาลในเชียงใหม่/ลำพูน/ลำปาง |

### 3.9 vitals_json Format
```json
{
  "bp_systolic": 120,
  "bp_diastolic": 80,
  "pulse": 72,
  "temp_c": 36.5,
  "spo2": 98,
  "rr": 18,
  "weight_kg": 65.0,
  "height_cm": 170.0
}
```

---

## 4. Stored Procedures ที่มีอยู่แล้ว (ไม่ต้องสร้างใหม่)

| SP | หน้าที่ |
|----|---------|
| `sp_PP_01_GetOrCreatePatientProfile` | สร้าง/ดึง patient_profile (EMP/EXT) |
| `sp_PP_02_UpsertPatientAllergy` | เพิ่ม/แก้ไขข้อมูลแพ้ยา |

---

## 5. Stored Procedures ที่ต้องสร้างใหม่

### SP-01: sp_TR_01_CreateVisit

บันทึก visit ใหม่ + รายการยา + ลด stock

**Input Parameters:**
- `@PatientType` NVARCHAR(20) — 'EMP' | 'EXT'
- `@EmployeeId` NVARCHAR(50) — รหัสพนักงาน (EMP)
- `@ExternalPersonId` INT — id บุคคลภายนอก (EXT)
- `@VisitDatetime` DATETIME — วันเวลาที่เข้า
- `@ShiftCode` NVARCHAR(50) — กะงาน
- `@Symptoms` NVARCHAR(1000) — อาการ
- `@VitalsJson` NVARCHAR(MAX) — JSON vital signs
- `@GroupId` INT — disease_groups FK
- `@DiseaseId` INT — disease_sub_groups FK
- `@TreatmentTypeId` INT — treatment_types FK
- `@NursingAdvice` NVARCHAR(1000) — คำแนะนำ
- `@AccidentInWorkFlag` BIT — อุบัติเหตุในงาน
- `@WorkRelatedFlag` BIT — โรคจากงาน
- `@SeverityId` INT — accident_severity_types FK
- `@ReferFlag` BIT — ส่งต่อหรือไม่
- `@ReferTypeId` INT — refer_types FK
- `@UsagesJson` NVARCHAR(MAX) — JSON array รายการยา
- `@CreatedBy` NVARCHAR(100) — ผู้บันทึก

**@UsagesJson Format:**
```json
[
  { "item_id": 1, "qty_base": 2 },
  { "item_id": 5, "qty_base": 1 }
]
```

**Output:** `Status` INT, `Message` NVARCHAR(500), `VisitId` INT

```sql
-- ============================================================
-- sp_TR_01_CreateVisit
-- บันทึก visit + visit_usages + ลด stock_on_hand
-- ============================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_TR_01_CreateVisit]') AND type = 'P')
    DROP PROCEDURE [dbo].[sp_TR_01_CreateVisit]
GO

CREATE PROCEDURE [dbo].[sp_TR_01_CreateVisit]
    @PatientType        NVARCHAR(20),
    @EmployeeId         NVARCHAR(50)    = NULL,
    @ExternalPersonId   INT             = NULL,
    @VisitDatetime      DATETIME,
    @ShiftCode          NVARCHAR(50)    = NULL,
    @Symptoms           NVARCHAR(1000)  = NULL,
    @VitalsJson         NVARCHAR(MAX)   = NULL,
    @GroupId            INT             = NULL,
    @DiseaseId          INT             = NULL,
    @TreatmentTypeId    INT             = NULL,
    @NursingAdvice      NVARCHAR(1000)  = NULL,
    @AccidentInWorkFlag BIT             = 0,
    @WorkRelatedFlag    BIT             = 0,
    @SeverityId         INT             = NULL,
    @ReferFlag          BIT             = 0,
    @ReferTypeId        INT             = NULL,
    @UsagesJson         NVARCHAR(MAX)   = NULL,
    @CreatedBy          NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. ดึง/สร้าง patient_id
    DECLARE @PatientId INT;

    IF @PatientType = 'EMP'
    BEGIN
        SELECT @PatientId = patient_id
        FROM patient_profiles
        WHERE patient_type = 'EMP' AND employee_id = @EmployeeId;

        IF @PatientId IS NULL
        BEGIN
            INSERT INTO patient_profiles (patient_type, employee_id, created_by)
            VALUES ('EMP', @EmployeeId, @CreatedBy);
            SET @PatientId = SCOPE_IDENTITY();
        END;
    END
    ELSE IF @PatientType = 'EXT'
    BEGIN
        IF @ExternalPersonId IS NULL
        BEGIN
            SELECT 0 AS Status, N'ExternalPersonId จำเป็นต้องระบุสำหรับ patient_type = EXT' AS Message, NULL AS VisitId;
            RETURN;
        END;

        SELECT @PatientId = patient_id
        FROM patient_profiles
        WHERE patient_type = 'EXT' AND external_person_id = @ExternalPersonId;

        IF @PatientId IS NULL
        BEGIN
            INSERT INTO patient_profiles (patient_type, external_person_id, created_by)
            VALUES ('EXT', @ExternalPersonId, @CreatedBy);
            SET @PatientId = SCOPE_IDENTITY();
        END;
    END
    ELSE
    BEGIN
        SELECT 0 AS Status, N'patient_type ต้องเป็น EMP หรือ EXT เท่านั้น' AS Message, NULL AS VisitId;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 2. INSERT visit header
        INSERT INTO visits (
            visit_datetime, shift_code, patient_type,
            employee_id, external_person_id, patient_id,
            symptoms, vitals_json,
            group_id, disease_id, treatment_type_id, nursing_advice,
            accident_in_work_flag, work_related_flag, severity_id,
            refer_flag, refer_type_id,
            created_by, created_at
        )
        VALUES (
            @VisitDatetime, @ShiftCode, @PatientType,
            @EmployeeId, @ExternalPersonId, @PatientId,
            @Symptoms, @VitalsJson,
            @GroupId, @DiseaseId, @TreatmentTypeId, @NursingAdvice,
            @AccidentInWorkFlag, @WorkRelatedFlag, @SeverityId,
            @ReferFlag, @ReferTypeId,
            @CreatedBy, GETDATE()
        );

        DECLARE @NewVisitId INT = SCOPE_IDENTITY();

        -- 3. INSERT visit_usages + ลด stock (ถ้ามีรายการยา)
        IF @UsagesJson IS NOT NULL AND LEN(@UsagesJson) > 2
        BEGIN
            -- Parse JSON array
            DECLARE @UsagesTable TABLE (
                item_id     INT,
                qty_base    INT
            );

            INSERT INTO @UsagesTable (item_id, qty_base)
            SELECT
                CAST(JSON_VALUE(u.value, '$.item_id') AS INT),
                CAST(JSON_VALUE(u.value, '$.qty_base') AS INT)
            FROM OPENJSON(@UsagesJson) AS u;

            -- ตรวจสอบ stock คงเหลือก่อน
            IF EXISTS (
                SELECT 1 FROM @UsagesTable ut
                LEFT JOIN stock_on_hand soh ON soh.item_id = ut.item_id
                WHERE ISNULL(soh.qty_base, 0) < ut.qty_base
            )
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT 0 AS Status,
                       N'สินค้าบางรายการมี stock ไม่เพียงพอ' AS Message,
                       NULL AS VisitId;
                RETURN;
            END;

            -- INSERT visit_usages
            INSERT INTO visit_usages (visit_id, item_id, qty_base, created_by, created_at)
            SELECT @NewVisitId, item_id, qty_base, @CreatedBy, GETDATE()
            FROM @UsagesTable;

            -- INSERT stock_movements (DISPENSE)
            INSERT INTO stock_movements (item_id, qty_base, movement_type, ref_type, ref_id, created_by, created_at, reason)
            SELECT
                item_id,
                qty_base,
                'DISPENSE',
                'VISIT',
                CAST(@NewVisitId AS NVARCHAR(50)),
                @CreatedBy,
                GETDATE(),
                N'จ่ายยา/เวชภัณฑ์ในการรักษา Visit #' + CAST(@NewVisitId AS NVARCHAR(20))
            FROM @UsagesTable;

            -- UPDATE stock_on_hand (ลดยอด)
            UPDATE soh
            SET soh.qty_base   = soh.qty_base - ut.qty_base,
                soh.updated_at = GETDATE()
            FROM stock_on_hand soh
            INNER JOIN @UsagesTable ut ON soh.item_id = ut.item_id;
        END;

        COMMIT TRANSACTION;

        SELECT 1 AS Status,
               N'บันทึกการรักษาสำเร็จ' AS Message,
               @NewVisitId AS VisitId;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Status,
               N'เกิดข้อผิดพลาด: ' + ERROR_MESSAGE() AS Message,
               NULL AS VisitId;
    END CATCH;
END;
GO
```

---

### SP-02: sp_TR_02_GetVisitList

ดึงรายการ visits พร้อม filter

**Input Parameters:**
- `@DateFrom` DATE — วันเริ่มต้น (NULL = ไม่กรอง)
- `@DateTo` DATE — วันสิ้นสุด (NULL = ไม่กรอง)
- `@PatientType` NVARCHAR(20) — 'EMP' | 'EXT' | NULL (ทั้งหมด)
- `@EmployeeId` NVARCHAR(50) — กรองพนักงานคนเดียว (NULL = ทั้งหมด)
- `@TreatmentTypeId` INT — กรองประเภทการรักษา (NULL = ทั้งหมด)
- `@PageSize` INT — จำนวนต่อหน้า (default 50)
- `@PageNo` INT — หน้าที่ต้องการ (default 1)

```sql
-- ============================================================
-- sp_TR_02_GetVisitList
-- ดึงรายการ visits พร้อมข้อมูลผู้ป่วยและการรักษา
-- ============================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_TR_02_GetVisitList]') AND type = 'P')
    DROP PROCEDURE [dbo].[sp_TR_02_GetVisitList]
GO

CREATE PROCEDURE [dbo].[sp_TR_02_GetVisitList]
    @DateFrom           DATE            = NULL,
    @DateTo             DATE            = NULL,
    @PatientType        NVARCHAR(20)    = NULL,
    @EmployeeId         NVARCHAR(50)    = NULL,
    @TreatmentTypeId    INT             = NULL,
    @PageSize           INT             = 50,
    @PageNo             INT             = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNo - 1) * @PageSize;

    SELECT
        v.visit_id,
        v.visit_datetime,
        v.shift_code,
        v.patient_type,
        v.employee_id,
        v.external_person_id,
        v.patient_id,
        -- ชื่อผู้ป่วย (join ตาม type)
        CASE
            WHEN v.patient_type = 'EXT' THEN ep.full_name
            ELSE NULL  -- ฝั่ง client ดึงจาก employee API
        END AS patient_name,
        CASE
            WHEN v.patient_type = 'EXT' THEN ep.company
            ELSE NULL
        END AS patient_company,
        v.symptoms,
        dg.group_name_th    AS disease_group_name,
        ds.sub_group_name_th AS disease_sub_group_name,
        tt.treatment_name_th AS treatment_type_name,
        tt.treatment_code,
        v.accident_in_work_flag,
        v.work_related_flag,
        v.refer_flag,
        rt.refer_name_th    AS refer_type_name,
        v.created_by,
        v.created_at,
        -- นับจำนวนรายการยา
        (SELECT COUNT(*) FROM visit_usages vu WHERE vu.visit_id = v.visit_id) AS usage_count,
        -- total rows สำหรับ pagination
        COUNT(*) OVER() AS total_rows
    FROM visits v
    LEFT JOIN disease_groups dg       ON v.group_id = dg.group_id
    LEFT JOIN disease_sub_groups ds   ON v.disease_id = ds.sub_group_id
    LEFT JOIN treatment_types tt      ON v.treatment_type_id = tt.treatment_type_id
    LEFT JOIN refer_types rt          ON v.refer_type_id = rt.refer_type_id
    LEFT JOIN external_people ep      ON v.external_person_id = ep.external_person_id
    WHERE
        (@DateFrom IS NULL OR CAST(v.visit_datetime AS DATE) >= @DateFrom)
        AND (@DateTo IS NULL OR CAST(v.visit_datetime AS DATE) <= @DateTo)
        AND (@PatientType IS NULL OR v.patient_type = @PatientType)
        AND (@EmployeeId IS NULL OR v.employee_id = @EmployeeId)
        AND (@TreatmentTypeId IS NULL OR v.treatment_type_id = @TreatmentTypeId)
    ORDER BY v.visit_datetime DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO
```

---

### SP-03: sp_TR_03_GetVisitById

ดึงรายละเอียด 1 visit พร้อมรายการยา

**Input Parameters:**
- `@VisitId` INT

```sql
-- ============================================================
-- sp_TR_03_GetVisitById
-- ดึงรายละเอียด visit พร้อม usages, patient summary, vitals
-- ============================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_TR_03_GetVisitById]') AND type = 'P')
    DROP PROCEDURE [dbo].[sp_TR_03_GetVisitById]
GO

CREATE PROCEDURE [dbo].[sp_TR_03_GetVisitById]
    @VisitId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- ResultSet 1: Visit header
    SELECT
        v.visit_id,
        v.visit_datetime,
        v.shift_code,
        v.patient_type,
        v.employee_id,
        v.external_person_id,
        v.patient_id,
        ep.full_name        AS ext_patient_name,
        ep.company          AS ext_patient_company,
        ep.national_id      AS ext_national_id,
        ep.phone            AS ext_phone,
        v.symptoms,
        v.vitals_json,
        v.group_id,
        dg.group_name_th    AS disease_group_name,
        v.disease_id,
        ds.sub_group_name_th AS disease_sub_group_name,
        v.treatment_type_id,
        tt.treatment_name_th AS treatment_type_name,
        tt.treatment_code,
        v.nursing_advice,
        v.accident_in_work_flag,
        v.work_related_flag,
        v.severity_id,
        ast.severity_name_th AS severity_name,
        v.refer_flag,
        v.refer_type_id,
        rt.refer_name_th    AS refer_type_name,
        v.created_by,
        v.created_at
    FROM visits v
    LEFT JOIN disease_groups dg               ON v.group_id = dg.group_id
    LEFT JOIN disease_sub_groups ds           ON v.disease_id = ds.sub_group_id
    LEFT JOIN treatment_types tt              ON v.treatment_type_id = tt.treatment_type_id
    LEFT JOIN refer_types rt                  ON v.refer_type_id = rt.refer_type_id
    LEFT JOIN accident_severity_types ast     ON v.severity_id = ast.severity_id
    LEFT JOIN external_people ep              ON v.external_person_id = ep.external_person_id
    WHERE v.visit_id = @VisitId;

    -- ResultSet 2: Visit usages (รายการยา/อุปกรณ์)
    SELECT
        vu.visit_usage_id,
        vu.visit_id,
        vu.item_id,
        i.item_name_en,
        i.item_code,
        u.unit_name_th      AS unit_name,
        vu.qty_base,
        vu.created_by,
        vu.created_at
    FROM visit_usages vu
    JOIN items i    ON vu.item_id = i.item_id
    LEFT JOIN units u ON i.usage_unit_id = u.unit_id
    WHERE vu.visit_id = @VisitId
    ORDER BY vu.visit_usage_id;
END;
GO
```

---

### SP-04: sp_TR_04_UpdateVisitUsage

แก้ไขจำนวนยาใน visit ที่บันทึกแล้ว (บันทึก log ทุกครั้ง)

**Input Parameters:**
- `@VisitUsageId` INT — id ที่ต้องการแก้ไข
- `@NewQtyBase` INT — จำนวนใหม่
- `@EditedBy` NVARCHAR(100) — ผู้แก้ไข
- `@Reason` NVARCHAR(500) — เหตุผล (บังคับ)

```sql
-- ============================================================
-- sp_TR_04_UpdateVisitUsage
-- แก้ไขจำนวนยา + ปรับ stock + บันทึก log
-- ============================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_TR_04_UpdateVisitUsage]') AND type = 'P')
    DROP PROCEDURE [dbo].[sp_TR_04_UpdateVisitUsage]
GO

CREATE PROCEDURE [dbo].[sp_TR_04_UpdateVisitUsage]
    @VisitUsageId   INT,
    @NewQtyBase     INT,
    @EditedBy       NVARCHAR(100),
    @Reason         NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    -- ดึงข้อมูลเดิม
    DECLARE @OldQtyBase INT;
    DECLARE @ItemId INT;
    DECLARE @VisitId INT;

    SELECT @OldQtyBase = qty_base,
           @ItemId = item_id,
           @VisitId = visit_id
    FROM visit_usages
    WHERE visit_usage_id = @VisitUsageId;

    IF @OldQtyBase IS NULL
    BEGIN
        SELECT 0 AS Status, N'ไม่พบ visit_usage_id นี้' AS Message;
        RETURN;
    END;

    IF @NewQtyBase <= 0
    BEGIN
        SELECT 0 AS Status, N'จำนวนต้องมากกว่า 0' AS Message;
        RETURN;
    END;

    IF @OldQtyBase = @NewQtyBase
    BEGIN
        SELECT 1 AS Status, N'ไม่มีการเปลี่ยนแปลง' AS Message;
        RETURN;
    END;

    DECLARE @DiffQty INT = @NewQtyBase - @OldQtyBase;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- ตรวจสอบ stock ถ้าจะเพิ่มจำนวน
        IF @DiffQty > 0
        BEGIN
            DECLARE @CurrentStock INT;
            SELECT @CurrentStock = qty_base FROM stock_on_hand WHERE item_id = @ItemId;

            IF ISNULL(@CurrentStock, 0) < @DiffQty
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT 0 AS Status, N'Stock ไม่เพียงพอสำหรับการเพิ่มจำนวน' AS Message;
                RETURN;
            END;
        END;

        -- UPDATE visit_usages
        UPDATE visit_usages
        SET qty_base = @NewQtyBase
        WHERE visit_usage_id = @VisitUsageId;

        -- INSERT log
        INSERT INTO visit_usage_edit_logs
            (visit_usage_id, edited_by, edited_at, old_qty_base, new_qty_base, reason)
        VALUES
            (@VisitUsageId, @EditedBy, GETDATE(), @OldQtyBase, @NewQtyBase, @Reason);

        -- UPDATE stock_on_hand (ปรับ diff)
        UPDATE stock_on_hand
        SET qty_base   = qty_base - @DiffQty,
            updated_at = GETDATE()
        WHERE item_id = @ItemId;

        -- INSERT stock_movements (adjustment)
        INSERT INTO stock_movements
            (item_id, qty_base, movement_type, ref_type, ref_id, created_by, created_at, reason)
        VALUES (
            @ItemId,
            ABS(@DiffQty),
            CASE WHEN @DiffQty > 0 THEN 'DISPENSE' ELSE 'DISPENSE_RETURN' END,
            'VISIT',
            CAST(@VisitId AS NVARCHAR(50)),
            @EditedBy,
            GETDATE(),
            N'แก้ไขจำนวนยา: ' + @Reason
        );

        COMMIT TRANSACTION;

        SELECT 1 AS Status, N'แก้ไขสำเร็จ' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Status,
               N'เกิดข้อผิดพลาด: ' + ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO
```

---

### SP-05: sp_EXT_01_SearchExternalPerson

ค้นหาบุคคลภายนอกจากชื่อ / เลขบัตรประชาชน / พาสปอร์ต / บริษัท

**Input Parameters:**
- `@SearchText` NVARCHAR(200) — คำค้นหา (NULL = คืนทั้งหมด top 20)

**Output:** รายการ external_people พร้อมจำนวน visit

```sql
-- ============================================================
-- sp_EXT_01_SearchExternalPerson
-- ค้นหาบุคคลภายนอก (fuzzy search ชื่อ/เลขบัตร/บริษัท)
-- ============================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_EXT_01_SearchExternalPerson]') AND type = 'P')
    DROP PROCEDURE [dbo].[sp_EXT_01_SearchExternalPerson]
GO

CREATE PROCEDURE [dbo].[sp_EXT_01_SearchExternalPerson]
    @SearchText NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 20
        ep.external_person_id,
        ep.full_name,
        ep.company,
        ep.national_id,
        ep.passport_no,
        ep.phone,
        ep.created_at,
        (SELECT COUNT(*) FROM visits v WHERE v.external_person_id = ep.external_person_id) AS visit_count
    FROM external_people ep
    WHERE ep.is_deleted = 0
      AND (
          @SearchText IS NULL
          OR ep.full_name    LIKE N'%' + @SearchText + N'%'
          OR ep.national_id  LIKE N'%' + @SearchText + N'%'
          OR ep.passport_no  LIKE N'%' + @SearchText + N'%'
          OR ep.company      LIKE N'%' + @SearchText + N'%'
      )
    ORDER BY ep.full_name;
END;
GO
```

---

### SP-06: sp_EXT_02_CreateExternalPerson

สร้างบุคคลภายนอกใหม่ พร้อมตรวจสอบเลขบัตรซ้ำ

**Input Parameters:**
- `@FullName` NVARCHAR(200) — ชื่อ-นามสกุล (บังคับ)
- `@Company` NVARCHAR(200) — บริษัท/หน่วยงาน
- `@NationalId` NVARCHAR(50) — เลขบัตรประชาชน
- `@PassportNo` NVARCHAR(50) — เลขพาสปอร์ต
- `@Phone` NVARCHAR(50) — เบอร์โทร
- `@CreatedBy` NVARCHAR(100) — ผู้สร้าง

**Output:** `Status` INT, `Message` NVARCHAR(500), `ExternalPersonId` INT

```sql
-- ============================================================
-- sp_EXT_02_CreateExternalPerson
-- สร้างบุคคลภายนอกใหม่ พร้อมตรวจสอบเลขบัตรซ้ำ
-- ============================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_EXT_02_CreateExternalPerson]') AND type = 'P')
    DROP PROCEDURE [dbo].[sp_EXT_02_CreateExternalPerson]
GO

CREATE PROCEDURE [dbo].[sp_EXT_02_CreateExternalPerson]
    @FullName       NVARCHAR(200),
    @Company        NVARCHAR(200)   = NULL,
    @NationalId     NVARCHAR(50)    = NULL,
    @PassportNo     NVARCHAR(50)    = NULL,
    @Phone          NVARCHAR(50)    = NULL,
    @CreatedBy      NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- ตรวจสอบเลขบัตรซ้ำ
    IF @NationalId IS NOT NULL AND LEN(LTRIM(RTRIM(@NationalId))) > 0
    BEGIN
        DECLARE @DuplicateId INT;
        SELECT @DuplicateId = external_person_id
        FROM external_people
        WHERE national_id = @NationalId AND is_deleted = 0;

        IF @DuplicateId IS NOT NULL
        BEGIN
            SELECT 0 AS Status,
                   N'มีข้อมูลบุคคลนี้ในระบบแล้ว (เลขบัตรประชาชนซ้ำ)' AS Message,
                   @DuplicateId AS ExternalPersonId;
            RETURN;
        END;
    END;

    INSERT INTO external_people (full_name, company, national_id, passport_no, phone, created_at, is_deleted)
    VALUES (@FullName, @Company, @NationalId, @PassportNo, @Phone, GETDATE(), 0);

    SELECT
        1 AS Status,
        N'สร้างข้อมูลบุคคลภายนอกสำเร็จ' AS Message,
        CAST(SCOPE_IDENTITY() AS INT) AS ExternalPersonId;
END;
GO
```

---

## 6. SQL Test Script

คัดลอกไปรันใน SSMS เพื่อทดสอบ SP ทั้งหมด

```sql
-- ============================================================
-- TEST: sp_EXT_01_SearchExternalPerson
-- ============================================================
EXEC sp_EXT_01_SearchExternalPerson @SearchText = NULL;        -- ดูทั้งหมด
GO
EXEC sp_EXT_01_SearchExternalPerson @SearchText = N'สมชาย';    -- ค้นชื่อ
GO
EXEC sp_EXT_01_SearchExternalPerson @SearchText = N'1234';     -- ค้นเลขบัตร
GO

-- ============================================================
-- TEST: sp_EXT_02_CreateExternalPerson
-- ============================================================
EXEC sp_EXT_02_CreateExternalPerson
    @FullName   = N'สมชาย ใจดี',
    @Company    = N'บริษัท ABC',
    @NationalId = N'1234567890123',
    @Phone      = N'0812345678',
    @CreatedBy  = '8300';
GO

-- ทดสอบกรณีเลขบัตรซ้ำ (ควรได้ Status = 0)
EXEC sp_EXT_02_CreateExternalPerson
    @FullName   = N'สมชาย ใจดี คนที่สอง',
    @NationalId = N'1234567890123',
    @CreatedBy  = '8300';
GO

-- ============================================================
-- TEST: sp_TR_01_CreateVisit (EMP, มียา)
-- ============================================================
EXEC sp_TR_01_CreateVisit
    @PatientType        = 'EMP',
    @EmployeeId         = '8300',
    @VisitDatetime      = '2026-05-20 09:00:00',
    @ShiftCode          = 'DAY',
    @Symptoms           = N'ปวดหัว มีไข้',
    @VitalsJson         = N'{"bp_systolic":120,"bp_diastolic":80,"pulse":80,"temp_c":37.5,"spo2":98}',
    @GroupId            = 1,
    @DiseaseId          = 1,
    @TreatmentTypeId    = 4,
    @NursingAdvice      = N'พักผ่อนให้เพียงพอ ดื่มน้ำมาก',
    @AccidentInWorkFlag = 0,
    @WorkRelatedFlag    = 0,
    @ReferFlag          = 0,
    @UsagesJson         = N'[{"item_id":1,"qty_base":2},{"item_id":3,"qty_base":1}]',
    @CreatedBy          = '8300';
GO

-- ============================================================
-- TEST: sp_TR_01_CreateVisit (EXT, ไม่มียา)
-- ============================================================
EXEC sp_TR_01_CreateVisit
    @PatientType        = 'EXT',
    @ExternalPersonId   = 2,
    @VisitDatetime      = '2026-05-20 10:30:00',
    @ShiftCode          = 'DAY',
    @Symptoms           = N'แผลถลอก',
    @GroupId            = 4,
    @DiseaseId          = 19,
    @TreatmentTypeId    = 2,
    @NursingAdvice      = N'ทำแผลเรียบร้อยแล้ว',
    @ReferFlag          = 0,
    @CreatedBy          = '8300';
GO

-- ============================================================
-- TEST: sp_TR_02_GetVisitList (ทั้งหมดวันนี้)
-- ============================================================
EXEC sp_TR_02_GetVisitList
    @DateFrom = '2026-05-20',
    @DateTo   = '2026-05-20',
    @PageSize = 50,
    @PageNo   = 1;
GO

-- ============================================================
-- TEST: sp_TR_03_GetVisitById
-- ============================================================
EXEC sp_TR_03_GetVisitById @VisitId = 1;
GO

-- ============================================================
-- TEST: sp_TR_04_UpdateVisitUsage
-- ============================================================
EXEC sp_TR_04_UpdateVisitUsage
    @VisitUsageId = 1,
    @NewQtyBase   = 3,
    @EditedBy     = '8300',
    @Reason       = N'แก้ไขตามคำสั่งแพทย์';
GO

-- ============================================================
-- ตรวจสอบผลลัพธ์
-- ============================================================
SELECT * FROM visits ORDER BY visit_id DESC;
SELECT * FROM visit_usages ORDER BY visit_usage_id DESC;
SELECT * FROM visit_usage_edit_logs ORDER BY log_id DESC;
SELECT * FROM stock_movements WHERE ref_type = 'VISIT' ORDER BY movement_id DESC;
SELECT * FROM patient_profiles ORDER BY patient_id DESC;
GO
```

---

## 7. NestJS Backend Module

### โครงสร้างไฟล์
```
server/src/apis/treatment/
  treatment.interface.ts   — interfaces
  treatment.service.ts     — business logic (เรียก SP)
  treatment.controller.ts  — REST endpoints
  treatment.module.ts      — module registration
```

### treatment.interface.ts
```typescript
export interface ICreateVisitBody {
  patient_type: 'EMP' | 'EXT';
  employee_id?: string;
  external_person_id?: number;
  visit_datetime: string;
  shift_code?: string;
  symptoms?: string;
  vitals_json?: string;            // JSON string
  group_id?: number;
  disease_id?: number;
  treatment_type_id?: number;
  nursing_advice?: string;
  accident_in_work_flag?: boolean;
  work_related_flag?: boolean;
  severity_id?: number;
  refer_flag?: boolean;
  refer_type_id?: number;
  usages?: { item_id: number; qty_base: number }[];
}

export interface IGetVisitListQuery {
  date_from?: string;
  date_to?: string;
  patient_type?: string;
  employee_id?: string;
  treatment_type_id?: number;
  page_size?: number;
  page_no?: number;
}

export interface IVisitListItem {
  visit_id: number;
  visit_datetime: string;
  shift_code: string;
  patient_type: string;
  employee_id: string;
  external_person_id: number;
  patient_id: number;
  patient_name: string;
  patient_company: string;
  symptoms: string;
  disease_group_name: string;
  disease_sub_group_name: string;
  treatment_type_name: string;
  treatment_code: string;
  accident_in_work_flag: boolean;
  work_related_flag: boolean;
  refer_flag: boolean;
  refer_type_name: string;
  created_by: string;
  created_at: string;
  usage_count: number;
  total_rows: number;
}

export interface IVisitDetail {
  visit_id: number;
  visit_datetime: string;
  shift_code: string;
  patient_type: string;
  employee_id: string;
  external_person_id: number;
  ext_patient_name: string;
  ext_patient_company: string;
  symptoms: string;
  vitals_json: string;
  group_id: number;
  disease_group_name: string;
  disease_id: number;
  disease_sub_group_name: string;
  treatment_type_id: number;
  treatment_type_name: string;
  treatment_code: string;
  nursing_advice: string;
  accident_in_work_flag: boolean;
  work_related_flag: boolean;
  severity_id: number;
  severity_name: string;
  refer_flag: boolean;
  refer_type_id: number;
  refer_type_name: string;
  created_by: string;
  created_at: string;
}

export interface IVisitUsage {
  visit_usage_id: number;
  visit_id: number;
  item_id: number;
  item_name_en: string;
  item_code: string;
  unit_name: string;
  qty_base: number;
  created_by: string;
  created_at: string;
}

export interface IUpdateVisitUsageBody {
  new_qty_base: number;
  reason: string;
}

export interface IExternalPerson {
  external_person_id: number;
  full_name: string;
  company: string;
  national_id: string;
  passport_no: string;
  phone: string;
  created_at: string;
  visit_count: number;
}

export interface ICreateExternalPersonBody {
  full_name: string;
  company?: string;
  national_id?: string;
  passport_no?: string;
  phone?: string;
}

export interface ILookupItem {
  id: number;
  code: string;
  name_th: string;
  name_en: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface IDiseaseSubGroup extends ILookupItem {
  group_id: number;
}

export interface IHospital {
  hospital_id: number;
  hospital_code: string;
  hospital_name_th: string;
  hospital_name_en: string;
  hospital_type: string;
  is_active: boolean;
}
```

### treatment.service.ts (โครงสร้าง)
```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import {
  ICreateVisitBody, IGetVisitListQuery,
  IUpdateVisitUsageBody
} from './treatment.interface';

@Injectable()
export class TreatmentService {
  constructor(private readonly db: DatabaseService) {}

  async createVisit(body: ICreateVisitBody, createdBy: string) {
    const usagesJson = body.usages ? JSON.stringify(body.usages) : null;
    return this.db.executeStoredProcedure('sp_TR_01_CreateVisit', {
      PatientType:        body.patient_type,
      EmployeeId:         body.employee_id ?? null,
      ExternalPersonId:   body.external_person_id ?? null,
      VisitDatetime:      body.visit_datetime,
      ShiftCode:          body.shift_code ?? null,
      Symptoms:           body.symptoms ?? null,
      VitalsJson:         body.vitals_json ?? null,
      GroupId:            body.group_id ?? null,
      DiseaseId:          body.disease_id ?? null,
      TreatmentTypeId:    body.treatment_type_id ?? null,
      NursingAdvice:      body.nursing_advice ?? null,
      AccidentInWorkFlag: body.accident_in_work_flag ? 1 : 0,
      WorkRelatedFlag:    body.work_related_flag ? 1 : 0,
      SeverityId:         body.severity_id ?? null,
      ReferFlag:          body.refer_flag ? 1 : 0,
      ReferTypeId:        body.refer_type_id ?? null,
      UsagesJson:         usagesJson,
      CreatedBy:          createdBy,
    });
  }

  async getVisitList(query: IGetVisitListQuery) {
    return this.db.executeStoredProcedure('sp_TR_02_GetVisitList', {
      DateFrom:         query.date_from ?? null,
      DateTo:           query.date_to ?? null,
      PatientType:      query.patient_type ?? null,
      EmployeeId:       query.employee_id ?? null,
      TreatmentTypeId:  query.treatment_type_id ?? null,
      PageSize:         query.page_size ?? 50,
      PageNo:           query.page_no ?? 1,
    });
  }

  async getVisitById(visitId: number) {
    return this.db.executeStoredProcedure('sp_TR_03_GetVisitById', { VisitId: visitId });
  }

  async updateVisitUsage(usageId: number, body: IUpdateVisitUsageBody, editedBy: string) {
    return this.db.executeStoredProcedure('sp_TR_04_UpdateVisitUsage', {
      VisitUsageId: usageId,
      NewQtyBase:   body.new_qty_base,
      EditedBy:     editedBy,
      Reason:       body.reason,
    });
  }

  async searchExternalPeople(searchText?: string) {
    return this.db.executeStoredProcedure('sp_EXT_01_SearchExternalPerson', {
      SearchText: searchText ?? null,
    });
  }

  async createExternalPerson(body: ICreateExternalPersonBody, createdBy: string) {
    return this.db.executeStoredProcedure('sp_EXT_02_CreateExternalPerson', {
      FullName:   body.full_name,
      Company:    body.company ?? null,
      NationalId: body.national_id ?? null,
      PassportNo: body.passport_no ?? null,
      Phone:      body.phone ?? null,
      CreatedBy:  createdBy,
    });
  }

  async getLookups() {
    const result = await this.db.query(`
      SELECT treatment_type_id AS id, treatment_code AS code,
             treatment_name_th AS name_th, treatment_name_en AS name_en,
             sort_order, is_active
      FROM treatment_types WHERE is_active = 1 ORDER BY sort_order;

      SELECT refer_type_id AS id, refer_code AS code,
             refer_name_th AS name_th, refer_name_en AS name_en,
             sort_order, is_active
      FROM refer_types WHERE is_active = 1 ORDER BY sort_order;

      SELECT severity_id AS id, severity_code AS code,
             severity_name_th AS name_th, severity_name_en AS name_en,
             sort_order, is_active
      FROM accident_severity_types WHERE is_active = 1 ORDER BY sort_order;

      SELECT group_id AS id, group_code AS code,
             group_name_th AS name_th, group_name_en AS name_en,
             sort_order, is_active
      FROM disease_groups WHERE is_active = 1 ORDER BY sort_order;

      SELECT sub_group_id AS id, group_id, sub_group_code AS code,
             sub_group_name_th AS name_th, sub_group_name_en AS name_en,
             sort_order, is_active
      FROM disease_sub_groups WHERE is_active = 1 ORDER BY group_id, sort_order;

      SELECT hospital_id, hospital_code, hospital_name_th, hospital_name_en,
             hospital_type, is_active
      FROM hospitals WHERE is_active = 1 ORDER BY hospital_code;
    `);
    return {
      treatment_types:    result.recordsets[0],
      refer_types:        result.recordsets[1],
      severity_types:     result.recordsets[2],
      disease_groups:     result.recordsets[3],
      disease_sub_groups: result.recordsets[4],
      hospitals:          result.recordsets[5],
    };
  }
}
```

### treatment.controller.ts (endpoints)
```typescript
// POST   /treatment/visits           — สร้าง visit ใหม่
// GET    /treatment/visits           — รายการ visits (query params)
// GET    /treatment/visits/:id       — รายละเอียด 1 visit
// PUT    /treatment/visits/:id/usages/:usageId — แก้ไขจำนวนยา
// GET    /treatment/lookups          — ข้อมูล dropdown ทั้งหมด
// GET    /treatment/external-people  — ค้นหาบุคคลภายนอก (?search=...)
// POST   /treatment/external-people  — ลงทะเบียนบุคคลภายนอกใหม่
```

**เพิ่มใน `server/src/app.module.ts`:**
```typescript
import { TreatmentModule } from '@/src/apis/treatment/treatment.module';
// เพิ่มใน imports array: TreatmentModule,
```

---

## 8. Vue Frontend

### ไฟล์ที่ต้องสร้าง
```
client/src/services/treatment.service.ts
client/src/interfaces/treatment.interfaces.ts
client/src/views/pages/TreatmentRecord.vue      ← หน้าหลัก บันทึก visit
client/src/views/pages/TreatmentHistory.vue     ← ประวัติการรักษา
```

### treatment.service.ts (client)
```typescript
import Api from '@/services/api.service';
import type { ICreateVisitBody, IGetVisitListQuery, IUpdateVisitUsageBody } from '@/interfaces/treatment.interfaces';

const TreatmentService = {
  createVisit: (data: ICreateVisitBody) =>
    Api.post('/treatment/visits', data),

  getVisits: (params?: IGetVisitListQuery) =>
    Api.get('/treatment/visits', { params }),

  getVisitById: (visitId: number) =>
    Api.get(`/treatment/visits/${visitId}`),

  updateVisitUsage: (visitId: number, usageId: number, data: IUpdateVisitUsageBody) =>
    Api.put(`/treatment/visits/${visitId}/usages/${usageId}`, data),

  getLookups: () =>
    Api.get('/treatment/lookups'),

  // External people management
  searchExternalPeople: (search?: string) =>
    Api.get('/treatment/external-people', { params: { search } }),

  createExternalPerson: (data: ICreateExternalPersonBody) =>
    Api.post('/treatment/external-people', data),

  // Re-use existing APIs
  searchEmployees: (query: string) =>
    Api.get('/employees', { params: { search: query } }),

  getItems: (search?: string) =>
    Api.get('/stock/items', { params: { search } }),

  getPatientProfile: (type: string, id: string | number) =>
    Api.get(`/treatment/patients/${type}/${id}`),
};

export default TreatmentService;
```

### ไฟล์ที่ต้องแก้ไข
```typescript
// client/src/router/index.ts — เปลี่ยน Empty.vue → TreatmentRecord.vue, TreatmentHistory.vue
{
  path: '/treatment-record',
  name: 'treatmentRecord',
  component: () => import('@/views/pages/TreatmentRecord.vue'),
},
{
  path: '/treatment-history',
  name: 'treatmentHistory',
  component: () => import('@/views/pages/TreatmentHistory.vue'),
},
```

### TreatmentRecord.vue — โครงสร้าง Steps
```
Step 1: ค้นหาผู้ป่วย
  ├── Tab: พนักงาน → AutoComplete ค้นจาก EmployeesModule
  └── Tab: บุคคลภายนอก
        ├── AutoComplete ค้นหาจาก external_people (ชื่อ/เลขบัตร/บริษัท)
        ├── แสดงผล: ชื่อ, บริษัท, เลขบัตร, จำนวน visit ก่อนหน้า
        └── ถ้าไม่พบ → Button "ลงทะเบียนใหม่" → Dialog กรอก
              ├── ชื่อ-นามสกุล * (required)
              ├── บริษัท/หน่วยงาน
              ├── เลขบัตรประชาชน
              ├── เลขพาสปอร์ต
              └── เบอร์โทร

Step 2: Patient Summary (Dialog/Panel แสดงอัตโนมัติ)
  ├── ⚠️ แพ้ยา → แสดง Tag + รายละเอียด
  ├── โรคประจำตัว → แสดง list
  └── น้ำหนัก/BMI ล่าสุด

Step 3: ข้อมูล Visit
  ├── วันเวลา (DatePicker, default = now)
  ├── กะงาน (Dropdown: เช้า/บ่าย/ดึก)
  ├── อาการ (Textarea)
  └── Vital Signs (InputNumber แต่ละ field)

Step 4: การวินิจฉัย + การรักษา
  ├── กลุ่มโรค (Dropdown → กรอง disease_sub_groups)
  ├── ประเภทโรค (Dropdown cascade)
  ├── ประเภทการรักษา (Dropdown)
  ├── [Conditional] อุบัติเหตุ → ความรุนแรง
  └── [Conditional] refer_flag → ประเภท Refer + โรงพยาบาล

Step 5: รายการยา/อุปกรณ์ที่ใช้
  ├── DataTable: เพิ่ม/ลบ row
  ├── AutoComplete ค้นหา item
  ├── ⚠️ เตือนแพ้ยา (ConfirmDialog)
  └── แสดง stock คงเหลือ

Step 6: คำแนะนำ + บันทึก
  ├── Textarea nursing_advice
  └── Button บันทึก → เรียก sp_TR_01_CreateVisit
```

---

## 9. ลำดับการพัฒนาแนะนำ

### Phase 1 — Database (SSMS)
- [x] รันคำสั่ง SP ทั้ง 6 ตัว (Section 5 — TR_01 ถึง TR_04 + EXT_01 + EXT_02) ใน SSMS
- [x] รัน Test Script (Section 6) และตรวจสอบผลลัพธ์
- [x] ตรวจสอบ sp_EXT_01 ค้นหาได้ถูกต้อง
- [x] ตรวจสอบ sp_EXT_02 สร้างใหม่ + ตรวจ duplicate เลขบัตร
- [x] ตรวจสอบ stock_on_hand ลดลงถูกต้อง
- [x] ตรวจสอบ stock_movements มี record DISPENSE

### Phase 2 — Backend API
- [x] สร้าง `treatment.interface.ts` (รวม IExternalPerson, ICreateExternalPersonBody)
- [x] สร้าง `treatment.service.ts` (รวม searchExternalPeople, createExternalPerson)
- [x] สร้าง `treatment.controller.ts` (รวม GET/POST /external-people)
- [x] สร้าง `treatment.module.ts`
- [x] เพิ่ม `TreatmentModule` ใน `app.module.ts`
- [x] `pnpm build` ผ่าน ✅
- [x] ทดสอบ endpoints ใน Swagger (`/api`)

### Phase 3 — Frontend
- [ ] สร้าง `treatment.interfaces.ts` (client — รวม IExternalPerson)
- [ ] สร้าง `treatment.service.ts` (client — รวม searchExternalPeople, createExternalPerson)
- [ ] สร้าง `TreatmentRecord.vue` (form หลัก — Step 1 รองรับ dialog ลงทะเบียน EXT)
- [ ] สร้าง `TreatmentHistory.vue` (ตาราง + filter + ดูรายละเอียด)
- [ ] แก้ไข `router/index.ts`
- [ ] `pnpm build` ผ่าน ✅
- [ ] ทดสอบ flow ครบ: ค้นหาพนักงาน / ลงทะเบียนบุคคลภายนอก → กรอกข้อมูล → บันทึก → ตรวจ stock

---

## 10. ข้อพิจารณาพิเศษ

### Stock Deduction
- ลด `stock_on_hand` ทันทีเมื่อบันทึก visit (ไม่มี approval)
- บันทึก `stock_movements` type = `DISPENSE` / `DISPENSE_RETURN`
- ตรวจสอบ stock ก่อนบันทึก → return error ถ้าไม่พอ

### แพ้ยา Warning (Client-side)
```typescript
// ตรวจสอบ allergy ก่อน confirm
const allergicItems = selectedUsages.filter(usage =>
  patientAllergies.some(a => a.item_id === usage.item_id && a.is_active)
);
if (allergicItems.length > 0) {
  // แสดง ConfirmDialog — ไม่บล็อก แต่ต้อง confirm ก่อน
}
```

### Vitals JSON (parse ฝั่ง client)
```typescript
const vitals = JSON.parse(visit.vitals_json || '{}');
const bp = `${vitals.bp_systolic}/${vitals.bp_diastolic}`;
```

### Patient Profile Auto-Create
SP `sp_TR_01_CreateVisit` จัดการ auto-create patient_profile ภายใน ไม่ต้องเรียกแยก

### Re-use ของที่มีอยู่
- Employee search → ใช้ `/employees` API ที่มีอยู่
- Items search → ใช้ `/stock/items` API ที่มีอยู่
- Format utils → `utils/format.utils.ts` (Thai locale)
- Loading/error → Axios interceptor จัดการอัตโนมัติ
- PrimeVue components → auto-import ไม่ต้อง import manual

---

*อ้างอิง branch: `feature/treatment_record` | เริ่มจาก `develop`*

---

## 11. CREATE TABLE — คำสั่งสร้างตาราง (Reference / Sync)

> **วัตถุประสงค์:** ใช้เป็น reference เพื่อให้ schema ตรงกันระหว่าง dev และ DB จริง
> หากมีการแก้ไข schema ให้อัปเดตส่วนนี้ด้วยทุกครั้ง
>
> ⚠️ คำสั่งด้านล่างมี `DROP TABLE IF EXISTS` — **อย่ารันบน DB ที่มีข้อมูล production** โดยไม่ backup

---

### 11.1 ตาราง Core — visits

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[visits]') AND type IN ('U'))
    DROP TABLE [dbo].[visits]
GO

CREATE TABLE [dbo].[visits] (
  [visit_id]              int           IDENTITY(1,1) NOT NULL,
  [visit_datetime]        datetime      NOT NULL,
  [shift_code]            nvarchar(50)  COLLATE Thai_CI_AS NULL,
  [patient_type]          nvarchar(20)  COLLATE Thai_CI_AS NOT NULL,       -- 'EMP' | 'EXT'
  [employee_id]           nvarchar(50)  COLLATE Thai_CI_AS NULL,
  [external_person_id]    int           NULL,
  [patient_id]            int           NULL,
  [symptoms]              nvarchar(1000) COLLATE Thai_CI_AS NULL,
  [vitals_json]           nvarchar(max) COLLATE Thai_CI_AS NULL,
  [group_id]              int           NULL,                              -- FK → disease_groups
  [disease_id]            int           NULL,                              -- FK → disease_sub_groups
  [treatment_type_id]     int           NULL,                              -- FK → treatment_types
  [nursing_advice]        nvarchar(1000) COLLATE Thai_CI_AS NULL,
  [accident_in_work_flag] bit           DEFAULT 0 NOT NULL,
  [work_related_flag]     bit           DEFAULT 0 NOT NULL,
  [severity_id]           int           NULL,                              -- FK → accident_severity_types
  [refer_flag]            bit           DEFAULT 0 NOT NULL,
  [refer_type_id]         int           NULL,                              -- FK → refer_types
  [refer_type]            nvarchar(50)  COLLATE Thai_CI_AS NULL,           -- legacy column
  [created_by]            nvarchar(100) COLLATE Thai_CI_AS NULL,
  [created_at]            datetime      DEFAULT getdate() NOT NULL
)
GO
ALTER TABLE [dbo].[visits] SET (LOCK_ESCALATION = TABLE)
GO
```

---

### 11.2 ตาราง Core — visit_usages

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[visit_usages]') AND type IN ('U'))
    DROP TABLE [dbo].[visit_usages]
GO

CREATE TABLE [dbo].[visit_usages] (
  [visit_usage_id] int           IDENTITY(1,1) NOT NULL,
  [visit_id]       int           NOT NULL,                -- FK → visits
  [item_id]        int           NOT NULL,                -- FK → items
  [qty_base]       int           NOT NULL,
  [created_by]     nvarchar(100) COLLATE Thai_CI_AS NULL,
  [created_at]     datetime      DEFAULT getdate() NOT NULL
)
GO
ALTER TABLE [dbo].[visit_usages] SET (LOCK_ESCALATION = TABLE)
GO
```

---

### 11.3 ตาราง Core — visit_usage_edit_logs

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[visit_usage_edit_logs]') AND type IN ('U'))
    DROP TABLE [dbo].[visit_usage_edit_logs]
GO

CREATE TABLE [dbo].[visit_usage_edit_logs] (
  [log_id]          int           IDENTITY(1,1) NOT NULL,
  [visit_usage_id]  int           NOT NULL,               -- FK → visit_usages
  [edited_by]       nvarchar(100) COLLATE Thai_CI_AS NOT NULL,
  [edited_at]       datetime      DEFAULT getdate() NOT NULL,
  [old_qty_base]    int           NOT NULL,
  [new_qty_base]    int           NOT NULL,
  [reason]          nvarchar(500) COLLATE Thai_CI_AS NOT NULL
)
GO
ALTER TABLE [dbo].[visit_usage_edit_logs] SET (LOCK_ESCALATION = TABLE)
GO
```

---

### 11.4 ตาราง Patient — patient_profiles

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_profiles]') AND type IN ('U'))
    DROP TABLE [dbo].[patient_profiles]
GO

CREATE TABLE [dbo].[patient_profiles] (
  [patient_id]                        int           IDENTITY(1,1) NOT NULL,
  [patient_type]                      nvarchar(20)  COLLATE Thai_CI_AS NOT NULL,   -- 'EMP' | 'EXT'
  [employee_id]                       nvarchar(50)  COLLATE Thai_CI_AS NULL,
  [external_person_id]                int           NULL,
  [no_known_allergy]                  bit           DEFAULT 0 NOT NULL,
  [no_known_allergy_confirmed_by]     nvarchar(100) COLLATE Thai_CI_AS NULL,
  [no_known_allergy_confirmed_at]     datetime      NULL,
  [created_at]                        datetime      DEFAULT getdate() NOT NULL,
  [created_by]                        nvarchar(100) COLLATE Thai_CI_AS NOT NULL
)
GO
ALTER TABLE [dbo].[patient_profiles] SET (LOCK_ESCALATION = TABLE)
GO
```

---

### 11.5 ตาราง Patient — patient_allergies

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_allergies]') AND type IN ('U'))
    DROP TABLE [dbo].[patient_allergies]
GO

CREATE TABLE [dbo].[patient_allergies] (
  [allergy_id]   int           IDENTITY(1,1) NOT NULL,
  [patient_id]   int           NOT NULL,                -- FK → patient_profiles
  [item_id]      int           NULL,                    -- FK → items (ถ้าแพ้ยาในระบบ)
  [drug_name]    nvarchar(200) COLLATE Thai_CI_AS NULL,
  [reaction]     nvarchar(500) COLLATE Thai_CI_AS NULL,
  [severity]     nvarchar(20)  COLLATE Thai_CI_AS DEFAULT 'MILD' NULL,    -- MILD | MODERATE | SEVERE
  [allergy_type] nvarchar(20)  COLLATE Thai_CI_AS DEFAULT 'DRUG' NOT NULL, -- DRUG | FOOD | OTHER
  [source]       nvarchar(30)  COLLATE Thai_CI_AS NULL,                   -- SELF_REPORT | MEDICAL_RECORD
  [noted_at]     date          NOT NULL,
  [noted_by]     nvarchar(100) COLLATE Thai_CI_AS NOT NULL,
  [is_active]    bit           DEFAULT 1 NOT NULL
)
GO
ALTER TABLE [dbo].[patient_allergies] SET (LOCK_ESCALATION = TABLE)
GO
```

---

### 11.6 ตาราง Patient — patient_physical_info

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_physical_info]') AND type IN ('U'))
    DROP TABLE [dbo].[patient_physical_info]
GO

CREATE TABLE [dbo].[patient_physical_info] (
  [physical_id]  int           IDENTITY(1,1) NOT NULL,
  [patient_id]   int           NOT NULL,                -- FK → patient_profiles
  [weight_kg]    decimal(5,2)  NOT NULL,
  [height_cm]    decimal(5,2)  NOT NULL,
  [bmi]          AS (round([weight_kg]/power([height_cm]/(100.0),(2)),(2))) PERSISTED,
  [waist_cm]     decimal(5,2)  NULL,
  [measured_at]  date          NOT NULL,
  [measured_by]  nvarchar(100) COLLATE Thai_CI_AS NOT NULL,
  [note]         nvarchar(500) COLLATE Thai_CI_AS NULL,
  [created_at]   datetime      DEFAULT getdate() NOT NULL
)
GO
ALTER TABLE [dbo].[patient_physical_info] SET (LOCK_ESCALATION = TABLE)
GO
```

---

### 11.7 ตาราง Patient — patient_underlying_diseases

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_underlying_diseases]') AND type IN ('U'))
    DROP TABLE [dbo].[patient_underlying_diseases]
GO

CREATE TABLE [dbo].[patient_underlying_diseases] (
  [condition_id]   int           IDENTITY(1,1) NOT NULL,
  [patient_id]     int           NOT NULL,              -- FK → patient_profiles
  [disease_name]   nvarchar(200) COLLATE Thai_CI_AS NOT NULL,
  [sub_group_id]   int           NULL,                  -- FK → disease_sub_groups
  [diagnosed_year] int           NULL,
  [control_status] nvarchar(30)  COLLATE Thai_CI_AS NULL,
  [note]           nvarchar(500) COLLATE Thai_CI_AS NULL,
  [created_by]     nvarchar(100) COLLATE Thai_CI_AS NOT NULL,
  [created_at]     datetime      DEFAULT getdate() NOT NULL,
  [is_active]      bit           DEFAULT 1 NOT NULL
)
GO
ALTER TABLE [dbo].[patient_underlying_diseases] SET (LOCK_ESCALATION = TABLE)
GO
```

---

### 11.8 ตาราง Patient — patient_social_security

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_social_security]') AND type IN ('U'))
    DROP TABLE [dbo].[patient_social_security]
GO

CREATE TABLE [dbo].[patient_social_security] (
  [ss_id]          int           IDENTITY(1,1) NOT NULL,
  [patient_id]     int           NOT NULL,              -- FK → patient_profiles
  [hospital_id]    int           NULL,                  -- FK → hospitals
  [effective_year] int           NULL,
  [note]           nvarchar(200) COLLATE Thai_CI_AS NULL,
  [updated_by]     nvarchar(100) COLLATE Thai_CI_AS NULL,
  [updated_at]     datetime      NULL,
  [ss_status]      nvarchar(20)  COLLATE Thai_CI_AS DEFAULT 'ACTIVE' NOT NULL
)
GO
ALTER TABLE [dbo].[patient_social_security] SET (LOCK_ESCALATION = TABLE)
GO
```

---

### 11.9 ตาราง Patient — external_people

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[external_people]') AND type IN ('U'))
    DROP TABLE [dbo].[external_people]
GO

CREATE TABLE [dbo].[external_people] (
  [external_person_id] int           IDENTITY(1,1) NOT NULL,
  [full_name]          nvarchar(200) COLLATE Thai_CI_AS NOT NULL,
  [company]            nvarchar(200) COLLATE Thai_CI_AS NULL,
  [national_id]        nvarchar(50)  COLLATE Thai_CI_AS NULL,
  [passport_no]        nvarchar(50)  COLLATE Thai_CI_AS NULL,
  [phone]              nvarchar(50)  COLLATE Thai_CI_AS NULL,
  [created_at]         datetime      DEFAULT getdate() NOT NULL,
  [is_deleted]         bit           DEFAULT 0 NOT NULL,
  [deleted_at]         datetime      NULL
)
GO
ALTER TABLE [dbo].[external_people] SET (LOCK_ESCALATION = TABLE)
GO
```

---

### 11.10 Lookup — treatment_types (พร้อม seed data)

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[treatment_types]') AND type IN ('U'))
    DROP TABLE [dbo].[treatment_types]
GO

CREATE TABLE [dbo].[treatment_types] (
  [treatment_type_id] int           IDENTITY(1,1) NOT NULL,
  [treatment_code]    nvarchar(20)  COLLATE Thai_CI_AS NOT NULL,
  [treatment_name_th] nvarchar(100) COLLATE Thai_CI_AS NOT NULL,
  [treatment_name_en] nvarchar(100) COLLATE Thai_CI_AS NULL,
  [sort_order]        int           DEFAULT 0 NOT NULL,
  [is_active]         bit           DEFAULT 1 NOT NULL
)
GO
ALTER TABLE [dbo].[treatment_types] SET (LOCK_ESCALATION = TABLE)
GO

SET IDENTITY_INSERT [dbo].[treatment_types] ON
GO
INSERT INTO [dbo].[treatment_types] VALUES (1, N'REST',      N'พักรักษาตัว',  N'Rest',          1, 1)
INSERT INTO [dbo].[treatment_types] VALUES (2, N'DRESSING',  N'ทำแผล',        N'Dressing',      2, 1)
INSERT INTO [dbo].[treatment_types] VALUES (3, N'SEND_HOME', N'ลากลับบ้าน',   N'Send Home',     3, 1)
INSERT INTO [dbo].[treatment_types] VALUES (4, N'DISPENSE',  N'รับยาแล้วกลับ',N'Dispense & Go', 4, 1)
INSERT INTO [dbo].[treatment_types] VALUES (5, N'EYE_WASH',  N'ล้างตา',       N'Eye Wash',      5, 1)
GO
SET IDENTITY_INSERT [dbo].[treatment_types] OFF
GO
```

---

### 11.11 Lookup — refer_types (พร้อม seed data)

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[refer_types]') AND type IN ('U'))
    DROP TABLE [dbo].[refer_types]
GO

CREATE TABLE [dbo].[refer_types] (
  [refer_type_id]  int           IDENTITY(1,1) NOT NULL,
  [refer_code]     nvarchar(20)  COLLATE Thai_CI_AS NOT NULL,
  [refer_name_th]  nvarchar(100) COLLATE Thai_CI_AS NOT NULL,
  [refer_name_en]  nvarchar(100) COLLATE Thai_CI_AS NULL,
  [sort_order]     int           DEFAULT 0 NOT NULL,
  [is_active]      bit           DEFAULT 1 NOT NULL
)
GO
ALTER TABLE [dbo].[refer_types] SET (LOCK_ESCALATION = TABLE)
GO

SET IDENTITY_INSERT [dbo].[refer_types] ON
GO
INSERT INTO [dbo].[refer_types] VALUES (1, N'EMERGENCY',      N'ส่งด่วนฉุกเฉิน',              N'Emergency Refer',          1, 1)
INSERT INTO [dbo].[refer_types] VALUES (2, N'REST_REFER',      N'นอนพักและส่งโรงพยาบาล',       N'Rest & Refer',             2, 1)
INSERT INTO [dbo].[refer_types] VALUES (3, N'ACCIDENT_REFER',  N'อุบัติเหตุในงานและส่งโรงพยาบาล', N'Accident In Work & Refer', 3, 1)
INSERT INTO [dbo].[refer_types] VALUES (4, N'DRESSING_REFER',  N'ทำแผลและส่งโรงพยาบาล',        N'Dressing & Refer',         4, 1)
GO
SET IDENTITY_INSERT [dbo].[refer_types] OFF
GO
```

---

### 11.12 Lookup — accident_severity_types (พร้อม seed data)

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[accident_severity_types]') AND type IN ('U'))
    DROP TABLE [dbo].[accident_severity_types]
GO

CREATE TABLE [dbo].[accident_severity_types] (
  [severity_id]      int           IDENTITY(1,1) NOT NULL,
  [severity_code]    nvarchar(20)  COLLATE Thai_CI_AS NOT NULL,
  [severity_name_th] nvarchar(100) COLLATE Thai_CI_AS NOT NULL,
  [severity_name_en] nvarchar(100) COLLATE Thai_CI_AS NULL,
  [sort_order]       int           DEFAULT 0 NOT NULL,
  [is_active]        bit           DEFAULT 1 NOT NULL
)
GO
ALTER TABLE [dbo].[accident_severity_types] SET (LOCK_ESCALATION = TABLE)
GO

SET IDENTITY_INSERT [dbo].[accident_severity_types] ON
GO
INSERT INTO [dbo].[accident_severity_types] VALUES (1, N'STOP_WORK',    N'หยุดงาน',          N'Stop Work',       1, 1)
INSERT INTO [dbo].[accident_severity_types] VALUES (2, N'REST',         N'นอนพัก',           N'Rest at Clinic',  2, 1)
INSERT INTO [dbo].[accident_severity_types] VALUES (3, N'WORK_NORMAL',  N'ทำงานต่อได้',      N'Work as Normal',  3, 1)
INSERT INTO [dbo].[accident_severity_types] VALUES (4, N'REFER_HOSP',   N'ส่งโรงพยาบาล',    N'Refer to Hospital',4, 1)
GO
SET IDENTITY_INSERT [dbo].[accident_severity_types] OFF
GO
```

---

### 11.13 Lookup — disease_groups (พร้อม seed data)

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[disease_groups]') AND type IN ('U'))
    DROP TABLE [dbo].[disease_groups]
GO

CREATE TABLE [dbo].[disease_groups] (
  [group_id]       int           IDENTITY(1,1) NOT NULL,
  [group_code]     nvarchar(20)  COLLATE Thai_CI_AS NOT NULL,
  [group_name_th]  nvarchar(200) COLLATE Thai_CI_AS NOT NULL,
  [group_name_en]  nvarchar(200) COLLATE Thai_CI_AS NULL,
  [is_active]      bit           DEFAULT 1 NOT NULL,
  [created_at]     datetime      DEFAULT getdate() NOT NULL,
  [updated_at]     datetime      NULL,
  [sort_order]     int           DEFAULT 0 NOT NULL
)
GO
ALTER TABLE [dbo].[disease_groups] SET (LOCK_ESCALATION = TABLE)
GO

SET IDENTITY_INSERT [dbo].[disease_groups] ON
GO
INSERT INTO [dbo].[disease_groups] ([group_id],[group_code],[group_name_th],[group_name_en],[is_active],[created_at],[updated_at],[sort_order]) VALUES
 (1,  N'DG01', N'ระบบทางเดินหายใจ',      N'Respiratory System',        1, GETDATE(), NULL, 0),
 (2,  N'DG02', N'ระบบทางเดินอาหาร',      N'Digestive System',          1, GETDATE(), NULL, 0),
 (3,  N'DG03', N'ระบบกล้ามเนื้อและกระดูก', N'Musculoskeletal System',   1, GETDATE(), NULL, 0),
 (4,  N'DG04', N'ระบบผิวหนัง',           N'Skin & Integumentary System',1, GETDATE(), NULL, 0),
 (5,  N'DG05', N'ระบบหัวใจและหลอดเลือด', N'Cardiovascular System',     1, GETDATE(), NULL, 0),
 (6,  N'DG06', N'ระบบประสาท',            N'Nervous System',             1, GETDATE(), NULL, 0),
 (7,  N'DG07', N'ระบบทางเดินปัสสาวะ',   N'Urinary System',             1, GETDATE(), NULL, 0),
 (8,  N'DG08', N'ระบบต่อมไร้ท่อ',        N'Endocrine System',          1, GETDATE(), NULL, 0),
 (9,  N'DG09', N'ระบบตาและหู',           N'Eye & Ear System',           1, GETDATE(), NULL, 0),
 (10, N'DG10', N'อาการทั่วไป / อื่น ๆ', N'General / Others',           1, GETDATE(), NULL, 0),
 (11, N'DG11', N'อุบัติเหตุและการบาดเจ็บ', N'Accidents & Injuries',    1, GETDATE(), NULL, 0),
 (12, N'DG12', N'สุขภาพจิต',             N'Mental Health',              1, GETDATE(), NULL, 0)
GO
SET IDENTITY_INSERT [dbo].[disease_groups] OFF
GO
```

---

### 11.14 Lookup — disease_sub_groups (พร้อม seed data ครบ 50 รายการ)

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[disease_sub_groups]') AND type IN ('U'))
    DROP TABLE [dbo].[disease_sub_groups]
GO

CREATE TABLE [dbo].[disease_sub_groups] (
  [sub_group_id]       int           IDENTITY(1,1) NOT NULL,
  [group_id]           int           NOT NULL,              -- FK → disease_groups
  [sub_group_code]     nvarchar(20)  COLLATE Thai_CI_AS NOT NULL,
  [sub_group_name_th]  nvarchar(200) COLLATE Thai_CI_AS NOT NULL,
  [sub_group_name_en]  nvarchar(200) COLLATE Thai_CI_AS NULL,
  [is_active]          bit           DEFAULT 1 NOT NULL,
  [created_at]         datetime      DEFAULT getdate() NOT NULL,
  [updated_at]         datetime      NULL,
  [sort_order]         int           DEFAULT 0 NOT NULL
)
GO
ALTER TABLE [dbo].[disease_sub_groups] SET (LOCK_ESCALATION = TABLE)
GO

SET IDENTITY_INSERT [dbo].[disease_sub_groups] ON
GO
INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id],[group_id],[sub_group_code],[sub_group_name_th],[sub_group_name_en],[is_active],[created_at],[updated_at],[sort_order]) VALUES
-- DG01 ระบบทางเดินหายใจ
 (1,  1, N'DS0101', N'ไข้หวัด / หวัด',            N'Common Cold / Flu',               1, GETDATE(), NULL, 0),
 (2,  1, N'DS0102', N'ไซนัสอักเสบ',                N'Sinusitis',                       1, GETDATE(), NULL, 0),
 (3,  1, N'DS0103', N'คออักเสบ / เจ็บคอ',          N'Pharyngitis / Sore Throat',       1, GETDATE(), NULL, 0),
 (4,  1, N'DS0104', N'หลอดลมอักเสบ',               N'Bronchitis',                      1, GETDATE(), NULL, 0),
 (5,  1, N'DS0105', N'หอบหืด / หายใจลำบาก',        N'Asthma / Dyspnea',               1, GETDATE(), NULL, 0),
 (6,  1, N'DS0106', N'ปอดอักเสบ / ปอดบวม',         N'Pneumonia',                       1, GETDATE(), NULL, 0),
-- DG02 ระบบทางเดินอาหาร
 (7,  2, N'DS0201', N'ปวดท้อง / ท้องเสีย',         N'Abdominal Pain / Diarrhea',       1, GETDATE(), NULL, 0),
 (8,  2, N'DS0202', N'คลื่นไส้ อาเจียน',            N'Nausea / Vomiting',               1, GETDATE(), NULL, 0),
 (9,  2, N'DS0203', N'ท้องผูก',                    N'Constipation',                    1, GETDATE(), NULL, 0),
 (10, 2, N'DS0204', N'กระเพาะอาหารอักเสบ / แผลในกระเพาะ', N'Gastritis / Peptic Ulcer',1, GETDATE(), NULL, 0),
 (11, 2, N'DS0205', N'ท้องอืด / แน่นท้อง',          N'Bloating / Flatulence',          1, GETDATE(), NULL, 0),
 (12, 2, N'DS0206', N'ริดสีดวงทวาร',               N'Hemorrhoids',                     1, GETDATE(), NULL, 0),
-- DG03 ระบบกล้ามเนื้อและกระดูก
 (13, 3, N'DS0301', N'ปวดหลัง / ปวดเอว',           N'Back Pain / Lumbago',             1, GETDATE(), NULL, 0),
 (14, 3, N'DS0302', N'ปวดคอ / ปวดบ่า',             N'Neck / Shoulder Pain',            1, GETDATE(), NULL, 0),
 (15, 3, N'DS0303', N'ปวดข้อ / ข้ออักเสบ',          N'Joint Pain / Arthritis',         1, GETDATE(), NULL, 0),
 (16, 3, N'DS0304', N'กล้ามเนื้ออักเสบ / เกร็ง',    N'Muscle Strain / Spasm',          1, GETDATE(), NULL, 0),
 (17, 3, N'DS0305', N'ปวดเข่า',                    N'Knee Pain',                       1, GETDATE(), NULL, 0),
-- DG04 ระบบผิวหนัง
 (18, 4, N'DS0401', N'ผื่นคัน / ลมพิษ',             N'Rash / Urticaria',               1, GETDATE(), NULL, 0),
 (19, 4, N'DS0402', N'แผลถลอก / แผลฉีกขาด',         N'Abrasion / Laceration',          1, GETDATE(), NULL, 0),
 (20, 4, N'DS0403', N'แผลไฟไหม้ / น้ำร้อนลวก',       N'Burn / Scald',                  1, GETDATE(), NULL, 0),
 (21, 4, N'DS0404', N'เชื้อรา / กลากเกลื้อน',        N'Fungal Infection / Tinea',      1, GETDATE(), NULL, 0),
 (22, 4, N'DS0405', N'สิว / ฝี / ตุ่มหนอง',          N'Acne / Abscess / Pustule',      1, GETDATE(), NULL, 0),
-- DG05 ระบบหัวใจและหลอดเลือด
 (23, 5, N'DS0501', N'ความดันโลหิตสูง',             N'Hypertension',                    1, GETDATE(), NULL, 0),
 (24, 5, N'DS0502', N'ความดันโลหิตต่ำ / เป็นลม',    N'Hypotension / Syncope',          1, GETDATE(), NULL, 0),
 (25, 5, N'DS0503', N'ใจสั่น / เจ็บหน้าอก',          N'Palpitation / Chest Pain',      1, GETDATE(), NULL, 0),
-- DG06 ระบบประสาท
 (26, 6, N'DS0601', N'ปวดหัว / ไมเกรน',             N'Headache / Migraine',            1, GETDATE(), NULL, 0),
 (27, 6, N'DS0602', N'เวียนศีรษะ / บ้านหมุน',        N'Dizziness / Vertigo',           1, GETDATE(), NULL, 0),
 (28, 6, N'DS0603', N'นอนไม่หลับ',                  N'Insomnia',                       1, GETDATE(), NULL, 0),
 (29, 6, N'DS0604', N'ชาปลายมือปลายเท้า',            N'Peripheral Neuropathy',         1, GETDATE(), NULL, 0),
-- DG07 ระบบทางเดินปัสสาวะ
 (30, 7, N'DS0701', N'กระเพาะปัสสาวะอักเสบ',        N'Cystitis / UTI',                 1, GETDATE(), NULL, 0),
 (31, 7, N'DS0702', N'นิ่วในไต / ปวดบั้นเอว',        N'Kidney Stone / Renal Colic',    1, GETDATE(), NULL, 0),
-- DG08 ระบบต่อมไร้ท่อ
 (32, 8, N'DS0801', N'เบาหวาน',                     N'Diabetes Mellitus',              1, GETDATE(), NULL, 0),
 (33, 8, N'DS0802', N'โรคไทรอยด์',                  N'Thyroid Disorder',               1, GETDATE(), NULL, 0),
 (34, 8, N'DS0803', N'ภาวะอ้วน / น้ำหนักเกิน',       N'Obesity / Overweight',          1, GETDATE(), NULL, 0),
-- DG09 ระบบตาและหู
 (35, 9, N'DS0901', N'ตาแดง / ตาอักเสบ',             N'Conjunctivitis',                 1, GETDATE(), NULL, 0),
 (36, 9, N'DS0902', N'ตาแห้ง / ระคายเคืองตา',        N'Dry Eye / Eye Irritation',      1, GETDATE(), NULL, 0),
 (37, 9, N'DS0903', N'หูอื้อ / หูอักเสบ',             N'Tinnitus / Otitis',             1, GETDATE(), NULL, 0),
-- DG10 อาการทั่วไป
 (38, 10, N'DS1001', N'ไข้ / มีไข้สูง',              N'Fever / High Fever',            1, GETDATE(), NULL, 0),
 (39, 10, N'DS1002', N'อ่อนเพลีย / เหนื่อยง่าย',     N'Fatigue / Weakness',            1, GETDATE(), NULL, 0),
 (40, 10, N'DS1003', N'แพ้ยา / แพ้อาหาร',            N'Drug / Food Allergy',           1, GETDATE(), NULL, 0),
 (41, 10, N'DS1004', N'ตรวจสุขภาพประจำปี',           N'Annual Health Check',            1, GETDATE(), NULL, 0),
 (42, 10, N'DS1005', N'อื่น ๆ ที่ไม่จัดกลุ่ม',       N'Unclassified / Others',          1, GETDATE(), NULL, 0),
-- DG11 อุบัติเหตุ
 (43, 11, N'DS1101', N'บาดเจ็บจากการทำงาน',          N'Occupational Injury',           1, GETDATE(), NULL, 0),
 (44, 11, N'DS1102', N'อุบัติเหตุทั่วไป (นอกงาน)',   N'General Accident (Non-work)',   1, GETDATE(), NULL, 0),
 (45, 11, N'DS1103', N'ข้อเคล็ด / ข้อแพลง',          N'Sprain / Strain',               1, GETDATE(), NULL, 0),
 (46, 11, N'DS1104', N'กระดูกหัก / ข้อหลุด',          N'Fracture / Dislocation',        1, GETDATE(), NULL, 0),
 (47, 11, N'DS1105', N'แมลงกัด / สัตว์กัด',           N'Insect / Animal Bite',          1, GETDATE(), NULL, 0),
-- DG12 สุขภาพจิต
 (48, 12, N'DS1201', N'ความเครียด / วิตกกังวล',       N'Stress / Anxiety',              1, GETDATE(), NULL, 0),
 (49, 12, N'DS1202', N'ภาวะซึมเศร้า',                N'Depression',                     1, GETDATE(), NULL, 0),
 (50, 12, N'DS1203', N'เหนื่อยล้าจากการทำงาน (Burnout)', N'Burnout Syndrome',          1, GETDATE(), NULL, 0)
GO
SET IDENTITY_INSERT [dbo].[disease_sub_groups] OFF
GO
```

---

### 11.15 Lookup — hospitals (พร้อม seed data 18 รายการ)

```sql
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[hospitals]') AND type IN ('U'))
    DROP TABLE [dbo].[hospitals]
GO

CREATE TABLE [dbo].[hospitals] (
  [hospital_id]       int           IDENTITY(1,1) NOT NULL,
  [hospital_code]     nvarchar(20)  COLLATE Thai_CI_AS NOT NULL,
  [hospital_name_th]  nvarchar(200) COLLATE Thai_CI_AS NOT NULL,
  [hospital_name_en]  nvarchar(200) COLLATE Thai_CI_AS NULL,
  [address]           nvarchar(500) COLLATE Thai_CI_AS NULL,
  [phone]             nvarchar(50)  COLLATE Thai_CI_AS NULL,
  [hospital_type]     nvarchar(50)  COLLATE Thai_CI_AS NULL,               -- รัฐ | เอกชน
  [is_active]         bit           DEFAULT 1 NOT NULL,
  [created_at]        datetime      DEFAULT getdate() NOT NULL
)
GO
ALTER TABLE [dbo].[hospitals] SET (LOCK_ESCALATION = TABLE)
GO

SET IDENTITY_INSERT [dbo].[hospitals] ON
GO
INSERT INTO [dbo].[hospitals] ([hospital_id],[hospital_code],[hospital_name_th],[hospital_name_en],[address],[phone],[hospital_type],[is_active],[created_at]) VALUES
-- เชียงใหม่
 (1,  N'CM001', N'โรงพยาบาลนครพิงค์',                    N'Nakornping Hospital',                     N'เชียงใหม่', NULL, N'รัฐ',   1, GETDATE()),
 (2,  N'CM002', N'โรงพยาบาลมหาราชนครเชียงใหม่',           N'Maharaj Nakorn Chiang Mai Hospital',       N'เชียงใหม่', NULL, N'รัฐ',   1, GETDATE()),
 (3,  N'CM003', N'โรงพยาบาลราชเวชเชียงใหม่',              N'Rajavej Chiang Mai Hospital',              N'เชียงใหม่', NULL, N'เอกชน', 1, GETDATE()),
 (4,  N'CM004', N'โรงพยาบาลลานนา',                       N'Lanna Hospital',                           N'เชียงใหม่', NULL, N'เอกชน', 1, GETDATE()),
 (5,  N'CM005', N'โรงพยาบาลเทพปัญญา',                    N'Thep Paniya Hospital',                     N'เชียงใหม่', NULL, N'เอกชน', 1, GETDATE()),
 (6,  N'CM006', N'โรงพยาบาลเชียงใหม่ใกล้หมอ',             N'Chiang Mai Close to Doctor Hospital',      N'เชียงใหม่', NULL, N'เอกชน', 1, GETDATE()),
 (7,  N'CM007', N'โรงพยาบาลสันป่าตอง',                   N'San Pa Tong Hospital',                     N'เชียงใหม่', NULL, N'รัฐ',   1, GETDATE()),
 (8,  N'CM008', N'โรงพยาบาลหางดง',                       N'Hang Dong Hospital',                       N'เชียงใหม่', NULL, N'รัฐ',   1, GETDATE()),
 (9,  N'CM009', N'โรงพยาบาลสันทราย',                     N'San Sai Hospital',                         N'เชียงใหม่', NULL, N'รัฐ',   1, GETDATE()),
 (10, N'CM010', N'โรงพยาบาลจอมทอง',                      N'Chom Thong Hospital',                      N'เชียงใหม่', NULL, N'รัฐ',   1, GETDATE()),
-- ลำพูน
 (11, N'LP001', N'โรงพยาบาลลำพูน',                       N'Lamphun Hospital',                         N'ลำพูน',    NULL, N'รัฐ',   1, GETDATE()),
 (12, N'LP002', N'โรงพยาบาลหริภุญชัยเมโมเรียล',           N'Hariphunchai Memorial Hospital',           N'ลำพูน',    NULL, N'เอกชน', 1, GETDATE()),
 (13, N'LP003', N'โรงพยาบาลศิริเวชลำพูน',                 N'Sirivej Lamphun Hospital',                 N'ลำพูน',    NULL, N'เอกชน', 1, GETDATE()),
 (14, N'LP004', N'โรงพยาบาลพริ้นซ์ ลำพูน',               N'Prince Lamphun Hospital',                  N'ลำพูน',    NULL, N'เอกชน', 1, GETDATE()),
 (15, N'LP005', N'โรงพยาบาลลำพูนใกล้หมอ',                N'Lamphun Close to Doctor Hospital',          N'ลำพูน',    NULL, N'เอกชน', 1, GETDATE()),
-- ลำปาง
 (16, N'LPA001', N'โรงพยาบาลลำปาง',                      N'Lampang Hospital',                         N'ลำปาง',    NULL, N'รัฐ',   1, GETDATE()),
 (17, N'LPA002', N'โรงพยาบาลค่ายสุรศักดิ์มนตรี',          N'Surasak Montri Army Hospital',             N'ลำปาง',    NULL, N'รัฐ',   1, GETDATE()),
 (18, N'LPA003', N'โรงพยาบาลงาว',                        N'Ngao Hospital',                            N'ลำปาง',    NULL, N'รัฐ',   1, GETDATE())
GO
SET IDENTITY_INSERT [dbo].[hospitals] OFF
GO
```

---

### 11.16 หมายเหตุ — ตารางที่ใช้ร่วม (ไม่ได้สร้างใหม่)

ตารางด้านล่างนี้ **ใช้ร่วมกับ module อื่น** ไม่รวม DDL ไว้ในไฟล์นี้ — ดูใน `PRD/Tables.md`

| Table | ใช้ใน Treatment อย่างไร |
|-------|------------------------|
| `items` | FK จาก `visit_usages.item_id` — รายการยา/เวชภัณฑ์ |
| `stock_on_hand` | UPDATE qty_base -= qty_base เมื่อจ่ายยา |
| `stock_movements` | INSERT record ประเภท `DISPENSE` เมื่อจ่ายยา |
| `units` | JOIN เพื่อแสดงหน่วย (เม็ด, ขวด ฯลฯ) |

● ต้องการครับ views จะช่วยลด JOIN ใน SP และทำให้ backend query ง่ายขึ้นมาก โดยเฉพาะ 3 views นี้:

   1. view_visits — visits + joins ทุก lookup ในครั้งเดียว
   2. view_visit_usages — usages + ชื่อยา/หน่วย
   3. view_patient_summary — patient profile + สรุปแพ้ยา + โรคประจำตัว + น้ำหนักล่าสุด

  คำสั่ง SQL ทั้งหมดนี้ครับ รันใน SSMS ทีเดียวได้เลย:

   -- ============================================================
   -- VIEW 1: view_visits
   -- visits + lookup joins ทั้งหมด (disease, treatment, refer, severity)
   -- + ชื่อผู้ป่วย (EMP จาก view_employee_all, EXT จาก external_people)
   -- ============================================================
   IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_visits]') AND type IN ('V'))
       DROP VIEW [dbo].[view_visits]
   GO
   
   CREATE VIEW [dbo].[view_visits] AS
   SELECT
       v.visit_id,
       v.visit_datetime,
       v.shift_code,
       v.patient_type,
       v.employee_id,
       v.external_person_id,
       v.patient_id,
   
       -- ชื่อผู้ป่วย
       CASE
           WHEN v.patient_type = 'EMP' THEN emp.thai_name
           WHEN v.patient_type = 'EXT' THEN ext.full_name
           ELSE N'[Unknown]'
       END AS patient_name,
       CASE
           WHEN v.patient_type = 'EXT' THEN ext.company
           ELSE NULL
       END AS patient_company,
       CASE
           WHEN v.patient_type = 'EXT' THEN ext.national_id
           ELSE NULL
       END AS patient_national_id,
   
       v.symptoms,
       v.vitals_json,
       v.nursing_advice,
   
       -- กลุ่มโรค
       v.group_id,
       dg.group_code,
       dg.group_name_th        AS disease_group_name,
   
       -- ประเภทโรค
       v.disease_id,
       ds.sub_group_code,
       ds.sub_group_name_th    AS disease_sub_group_name,
   
       -- ประเภทการรักษา
       v.treatment_type_id,
       tt.treatment_code,
       tt.treatment_name_th    AS treatment_type_name,
   
       -- อุบัติเหตุ
       v.accident_in_work_flag,
       v.work_related_flag,
       v.severity_id,
       ast.severity_code,
       ast.severity_name_th    AS severity_name,
   
       -- Refer
       v.refer_flag,
       v.refer_type_id,
       rt.refer_code,
       rt.refer_name_th        AS refer_type_name,
   
       v.created_by,
       v.created_at
   FROM dbo.visits v
   LEFT JOIN dbo.view_employee_all       emp ON v.employee_id = emp.id
   LEFT JOIN dbo.external_people         ext ON v.external_person_id = ext.external_person_id
   LEFT JOIN dbo.disease_groups          dg  ON v.group_id = dg.group_id
   LEFT JOIN dbo.disease_sub_groups      ds  ON v.disease_id = ds.sub_group_id
   LEFT JOIN dbo.treatment_types         tt  ON v.treatment_type_id = tt.treatment_type_id
   LEFT JOIN dbo.accident_severity_types ast ON v.severity_id = ast.severity_id
   LEFT JOIN dbo.refer_types             rt  ON v.refer_type_id = rt.refer_type_id;
   GO
   
   
   -- ============================================================
   -- VIEW 2: view_visit_usages
   -- visit_usages + ชื่อยา + หน่วย + stock คงเหลือ
   -- ============================================================
   IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_visit_usages]') AND type IN ('V'))
       DROP VIEW [dbo].[view_visit_usages]
   GO
   
   CREATE VIEW [dbo].[view_visit_usages] AS
   SELECT
       vu.visit_usage_id,
       vu.visit_id,
       vu.item_id,
       i.item_code,
       i.item_name_en,
       i.item_name_th,
       u.unit_id,
       u.unit_code,
       u.unit_name_th      AS unit_name,
       vu.qty_base,
       soh.qty_base        AS stock_on_hand,
       vu.created_by,
       vu.created_at
   FROM dbo.visit_usages vu
   JOIN dbo.items        i   ON vu.item_id = i.item_id
   LEFT JOIN dbo.units   u   ON i.usage_unit_id = u.unit_id
   LEFT JOIN dbo.stock_on_hand soh ON soh.item_id = vu.item_id;
   GO
   
   
   -- ============================================================
   -- VIEW 3: view_patient_summary
   -- patient_profiles + ชื่อผู้ป่วย + สรุปแพ้ยา + โรคประจำตัว
   --                  + น้ำหนัก/BMI ล่าสุด + จำนวน visit
   -- ============================================================
   IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_patient_summary]') AND type IN ('V'))
       DROP VIEW [dbo].[view_patient_summary]
   GO
   
   CREATE VIEW [dbo].[view_patient_summary] AS
   SELECT
       p.patient_id,
       p.patient_type,
       p.employee_id,
       p.external_person_id,
       p.no_known_allergy,
       p.created_at        AS profile_created_at,
   
       -- ชื่อผู้ป่วย
       CASE
           WHEN p.patient_type = 'EMP' THEN emp.thai_name
           WHEN p.patient_type = 'EXT' THEN ext.full_name
           ELSE N'[Unknown]'
       END AS patient_name,
       CASE
           WHEN p.patient_type = 'EXT' THEN ext.company
           ELSE emp.department
       END AS department_or_company,
       CASE
           WHEN p.patient_type = 'EXT' THEN ext.national_id
           ELSE NULL
       END AS national_id,
       CASE
           WHEN p.patient_type = 'EXT' THEN ext.phone
           ELSE NULL
       END AS phone,
   
       -- สรุปแพ้ยา
       (SELECT COUNT(*) FROM dbo.patient_allergies
        WHERE patient_id = p.patient_id AND is_active = 1 AND allergy_type = 'DRUG') AS drug_allergy_count,
       (SELECT COUNT(*) FROM dbo.patient_allergies
        WHERE patient_id = p.patient_id AND is_active = 1 AND allergy_type = 'FOOD') AS food_allergy_count,
   
       -- โรคประจำตัว
       (SELECT COUNT(*) FROM dbo.patient_underlying_diseases
        WHERE patient_id = p.patient_id AND is_active = 1) AS underlying_disease_count,
   
       -- น้ำหนัก/BMI ล่าสุด
       (SELECT TOP 1 weight_kg FROM dbo.patient_physical_info
        WHERE patient_id = p.patient_id ORDER BY measured_at DESC) AS latest_weight_kg,
       (SELECT TOP 1 height_cm FROM dbo.patient_physical_info
        WHERE patient_id = p.patient_id ORDER BY measured_at DESC) AS latest_height_cm,
       (SELECT TOP 1 bmi FROM dbo.patient_physical_info
        WHERE patient_id = p.patient_id ORDER BY measured_at DESC) AS latest_bmi,
       (SELECT TOP 1 measured_at FROM dbo.patient_physical_info
        WHERE patient_id = p.patient_id ORDER BY measured_at DESC) AS latest_measured_at,
   
       -- จำนวน visit ทั้งหมด
       (SELECT COUNT(*) FROM dbo.visits
        WHERE patient_id = p.patient_id) AS total_visits,
   
       -- visit ล่าสุด
       (SELECT TOP 1 visit_datetime FROM dbo.visits
        WHERE patient_id = p.patient_id ORDER BY visit_datetime DESC) AS last_visit_datetime
   
   FROM dbo.patient_profiles p
   LEFT JOIN dbo.view_employee_all   emp ON p.employee_id = emp.id
   LEFT JOIN dbo.external_people     ext ON p.external_person_id = ext.external_person_id;
   GO
   
   
   -- ============================================================
   -- ทดสอบ views
   -- ============================================================
   SELECT TOP 10 * FROM view_visits ORDER BY visit_datetime DESC;
   SELECT TOP 10 * FROM view_visit_usages;
   SELECT TOP 10 * FROM view_patient_summary;
   GO

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  สรุปประโยชน์ของแต่ละ View

  ┌────────────────────────┬──────────────────────────────────────────────────────────┐
  │ View                   │ ใช้ใน                                                     │
  ├────────────────────────┼──────────────────────────────────────────────────────────┤
  │ view_visits            │ sp_TR_02 (list), sp_TR_03 (detail), หน้า TreatmentHistory │
  ├────────────────────────┼──────────────────────────────────────────────────────────┤
  │ view_visit_usages      │ sp_TR_03 (detail), แสดงรายการยาพร้อม stock คงเหลือ         │
  ├────────────────────────┼──────────────────────────────────────────────────────────┤
  │ view_patient_summary   │ แสดง patient card (แพ้ยา/โรค/BMI) ก่อนบันทึก visit           │
  └────────────────────────┴──────────────────────────────────────────────────────────┘

  หลังจากสร้าง views แล้ว SP ใน treatment_record.md ก็จะ simplify ลงได้อีก เช่น sp_TR_02 จะ SELECT * FROM view_visits WHERE ... แทนการ JOIN เองครับ