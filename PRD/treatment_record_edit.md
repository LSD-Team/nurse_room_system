# Treatment History Edit — แผนการ implement

## Checklist

### Phase 0: SQL Scripts (ผู้ดูแลรันใน SSMS)
- [x] ALTER TABLE visits ADD updated_by, updated_at
- [x] ALTER TABLE visit_usages ADD is_active BIT DEFAULT 1 NOT NULL
- [x] CREATE OR ALTER sp_TR_03_GetVisitById (เพิ่ม `AND vu.is_active = 1`)
- [x] CREATE OR ALTER sp_TR_05_GetLastApprovedStockDate
- [x] CREATE OR ALTER sp_TR_06_UpdateVisit (combined: header + usages, atomic)

### Phase 2: Server NestJS
- [x] treatment.interface.ts — เพิ่ม IUpdateUsageItem, IUpdateVisitBody (+ updated_by/updated_at ใน IVisitDetail)
- [x] treatment.service.ts — เพิ่ม getLastApprovedStockDate(), updateVisit()
- [x] treatment.controller.ts — เพิ่ม 2 endpoints (GET last-stock-count-date, PUT visits/:visitId)
- [x] pnpm build (server/) — ✅ exit 0

### Phase 3: Client Vue
- [x] treatment.interfaces.ts — เพิ่ม IUpdateUsageItem, IUpdateVisitBody (+ updated_by/updated_at ใน IVisitDetail)
- [x] treatment.service.ts — เพิ่ม getLastStockCountDate(), updateVisit()
- [x] TreatmentRecord.vue — เพิ่ม edit mode ใน history detail dialog
- [x] pnpm build (client/) — ✅ exit 0

---

## Key Design Decisions

1. **Atomicity**: ONE combined SP (`sp_TR_06_UpdateVisit`) จัดการทั้ง header + usages ในอยู่ transaction เดียว
2. **Soft-delete**: เพิ่ม `is_active BIT DEFAULT 1` ใน visit_usages แทน hard-delete (ป้องกัน FK violation กับ visit_usage_edit_logs)
3. **stock_movements**: บันทึก DISPENSE (เพิ่ม), DISPENSE_RETURN (ลบ/ลดจำนวน) ทุกครั้งที่มีการเปลี่ยนแปลง
4. **Server-side lock check**: SP ตรวจสอบ `visit_datetime >= MAX(approved_at)` ใน physical_count_headers ไม่ใช้แค่ client-side
5. **Ownership validation**: ตรวจสอบ visit_usage_id ทุกตัวต้องเป็นของ @VisitId นั้น
6. **UPDLOCK**: ใช้ `WITH (UPDLOCK)` บน stock_on_hand เพื่อป้องกัน race condition
7. **Full snapshot**: ส่งค่าทุก field เสมอ ไม่ใช้ PATCH semantics

---

## SQL Scripts

### STEP 1: ALTER TABLE visits

```sql
-- เพิ่ม updated_by และ updated_at ใน visits table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'visits') AND name = N'updated_by')
    ALTER TABLE visits ADD updated_by NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'visits') AND name = N'updated_at')
    ALTER TABLE visits ADD updated_at DATETIME NULL;
GO
```

### STEP 2: ALTER TABLE visit_usages (soft-delete)

```sql
-- เพิ่ม is_active สำหรับ soft-delete
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'visit_usages') AND name = N'is_active')
    ALTER TABLE visit_usages ADD is_active BIT NOT NULL DEFAULT 1;
GO
-- Backfill existing rows (ทุก record เก่าถือว่า active)
UPDATE visit_usages SET is_active = 1 WHERE is_active IS NULL;
GO
```

### STEP 3: CREATE OR ALTER sp_TR_03_GetVisitById (เพิ่ม is_active filter)

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_TR_03_GetVisitById]
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
        v.created_at,
        v.updated_by,
        v.updated_at
    FROM visits v
    LEFT JOIN disease_groups dg               ON v.group_id = dg.group_id
    LEFT JOIN disease_sub_groups ds           ON v.disease_id = ds.sub_group_id
    LEFT JOIN treatment_types tt              ON v.treatment_type_id = tt.treatment_type_id
    LEFT JOIN refer_types rt                  ON v.refer_type_id = rt.refer_type_id
    LEFT JOIN accident_severity_types ast     ON v.severity_id = ast.severity_id
    LEFT JOIN external_people ep              ON v.external_person_id = ep.external_person_id
    WHERE v.visit_id = @VisitId;

    -- ResultSet 2: Visit usages (เฉพาะ is_active = 1)
    SELECT
        vu.visit_usage_id,
        vu.visit_id,
        vu.item_id,
        i.item_name_en,
        i.item_name_th,
        i.item_code,
        u.unit_name_th      AS unit_name,
        vu.qty_base,
        vu.created_by,
        vu.created_at
    FROM visit_usages vu
    JOIN items i    ON vu.item_id = i.item_id
    LEFT JOIN units u ON i.usage_unit_id = u.unit_id
    WHERE vu.visit_id = @VisitId AND vu.is_active = 1
    ORDER BY vu.visit_usage_id;
END;
GO
```

### STEP 4: sp_TR_05_GetLastApprovedStockDate

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_TR_05_GetLastApprovedStockDate]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MAX(approved_at) AS last_approved_date
    FROM physical_count_headers
    WHERE count_status = 'APPROVED';
END;
GO
```

### STEP 5: sp_TR_06_UpdateVisit (combined, atomic)

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_TR_06_UpdateVisit]
    @VisitId            INT,
    @EditedBy           NVARCHAR(100),
    @Reason             NVARCHAR(500)   = NULL,
    -- Non-stock fields (full snapshot overwrite)
    @Symptoms           NVARCHAR(1000)  = NULL,
    @VitalsJson         NVARCHAR(MAX)   = NULL,
    @NursingAdvice      NVARCHAR(1000)  = NULL,
    @GroupId            INT             = NULL,
    @DiseaseId          INT             = NULL,
    @TreatmentTypeId    INT             = NULL,
    @AccidentInWorkFlag BIT             = NULL,
    @WorkRelatedFlag    BIT             = NULL,
    @ReferFlag          BIT             = NULL,
    @ReferTypeId        INT             = NULL,
    @SeverityId         INT             = NULL,
    -- Usage changes JSON (NULL = no usage changes)
    -- Format: [{"action":"ADD","item_id":5,"qty_base":3},
    --          {"action":"EDIT","visit_usage_id":12,"qty_base":5},
    --          {"action":"DELETE","visit_usage_id":15}]
    @UsagesJson         NVARCHAR(MAX)   = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    BEGIN TRY

        -- 1. Verify visit exists
        IF NOT EXISTS (SELECT 1 FROM visits WHERE visit_id = @VisitId)
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS Status, N'ไม่พบ Visit ID นี้' AS Message;
            RETURN;
        END;

        -- 2. Server-side lock check
        DECLARE @LastApprovedAt DATETIME;
        SELECT @LastApprovedAt = MAX(approved_at)
        FROM physical_count_headers
        WHERE count_status = 'APPROVED';

        DECLARE @VisitDatetime DATETIME;
        SELECT @VisitDatetime = visit_datetime FROM visits WHERE visit_id = @VisitId;

        DECLARE @IsLocked BIT = 0;
        IF @LastApprovedAt IS NOT NULL AND @VisitDatetime < @LastApprovedAt
            SET @IsLocked = 1;

        -- 3. If locked and usage changes requested → reject
        IF @IsLocked = 1 AND @UsagesJson IS NOT NULL AND LEN(@UsagesJson) > 2
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS Status, N'Visit นี้ถูกล็อค ไม่สามารถแก้ไขรายการยาได้ (visit_datetime อยู่ก่อน stock count ที่อนุมัติล่าสุด)' AS Message;
            RETURN;
        END;

        -- 4. Update non-stock fields (full snapshot)
        UPDATE visits
        SET symptoms              = @Symptoms,
            vitals_json           = @VitalsJson,
            nursing_advice        = @NursingAdvice,
            group_id              = @GroupId,
            disease_id            = @DiseaseId,
            treatment_type_id     = @TreatmentTypeId,
            accident_in_work_flag = @AccidentInWorkFlag,
            work_related_flag     = @WorkRelatedFlag,
            refer_flag            = @ReferFlag,
            refer_type_id         = @ReferTypeId,
            severity_id           = @SeverityId,
            updated_by            = @EditedBy,
            updated_at            = GETDATE()
        WHERE visit_id = @VisitId;

        -- 5. Process usage changes (only if not locked and JSON provided)
        IF @IsLocked = 0 AND @UsagesJson IS NOT NULL AND LEN(@UsagesJson) > 2
        BEGIN
            -- Parse JSON into temp table
            CREATE TABLE #changes (
                action          NVARCHAR(10),
                visit_usage_id  INT,
                item_id         INT,
                qty_base        INT
            );
            INSERT INTO #changes (action, visit_usage_id, item_id, qty_base)
            SELECT j.action, j.visit_usage_id, j.item_id, j.qty_base
            FROM OPENJSON(@UsagesJson) WITH (
                action          NVARCHAR(10)  '$.action',
                visit_usage_id  INT           '$.visit_usage_id',
                item_id         INT           '$.item_id',
                qty_base        INT           '$.qty_base'
            ) j;

            -- Ownership validation (all EDIT/DELETE usage_ids must belong to this visit & be active)
            IF EXISTS (
                SELECT 1 FROM #changes c
                WHERE c.action IN ('EDIT', 'DELETE')
                AND NOT EXISTS (
                    SELECT 1 FROM visit_usages vu
                    WHERE vu.visit_usage_id = c.visit_usage_id
                    AND vu.visit_id = @VisitId
                    AND vu.is_active = 1
                )
            )
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT 0 AS Status, N'พบรายการยาที่ไม่ถูกต้องหรือไม่ได้เป็นของ Visit นี้' AS Message;
                RETURN;
            END;

            -- Enrich with DB values (item_id and old_qty from DB for EDIT/DELETE)
            SELECT
                c.action,
                c.visit_usage_id,
                CASE WHEN c.action = 'ADD' THEN c.item_id ELSE vu.item_id END AS item_id,
                c.qty_base AS new_qty_base,
                ISNULL(vu.qty_base, 0) AS old_qty_base
            INTO #enriched
            FROM #changes c
            LEFT JOIN visit_usages vu ON vu.visit_usage_id = c.visit_usage_id AND vu.is_active = 1;

            -- ── Stock availability check (ADD + EDIT increases) ───────────────
            IF EXISTS (
                SELECT 1
                FROM stock_on_hand soh WITH (UPDLOCK)
                JOIN (
                    SELECT item_id, SUM(total_needed) AS total_needed
                    FROM (
                        SELECT item_id, SUM(new_qty_base) AS total_needed
                        FROM #enriched WHERE action = 'ADD' GROUP BY item_id
                        UNION ALL
                        SELECT item_id, SUM(new_qty_base - old_qty_base) AS total_needed
                        FROM #enriched WHERE action = 'EDIT' AND new_qty_base > old_qty_base GROUP BY item_id
                    ) x GROUP BY item_id
                ) req ON req.item_id = soh.item_id
                WHERE soh.qty_base < req.total_needed
            )
            BEGIN
                ROLLBACK TRANSACTION;
                SELECT 0 AS Status, N'สต็อกไม่เพียงพอ กรุณาตรวจสอบจำนวนรายการยา' AS Message;
                RETURN;
            END;

            -- ── ADD ──────────────────────────────────────────────────────────
            DECLARE @AddedUsages TABLE (usage_id INT, item_id INT, qty_base INT);
            INSERT INTO visit_usages (visit_id, item_id, qty_base, created_by, created_at, is_active)
            OUTPUT INSERTED.visit_usage_id, INSERTED.item_id, INSERTED.qty_base INTO @AddedUsages (usage_id, item_id, qty_base)
            SELECT @VisitId, item_id, new_qty_base, @EditedBy, GETDATE(), 1
            FROM #enriched WHERE action = 'ADD';

            INSERT INTO visit_usage_edit_logs (visit_usage_id, edited_by, edited_at, old_qty_base, new_qty_base, reason)
            SELECT usage_id, @EditedBy, GETDATE(), 0, qty_base, @Reason FROM @AddedUsages;

            INSERT INTO stock_movements (item_id, qty_base, movement_type, ref_type, ref_id, created_by, created_at, reason)
            SELECT item_id, qty_base, 'DISPENSE', 'VISIT', CAST(@VisitId AS NVARCHAR(50)), @EditedBy, GETDATE(),
                   N'แก้ไข Visit #' + CAST(@VisitId AS NVARCHAR(20)) + N': เพิ่มรายการ - ' + ISNULL(@Reason, '')
            FROM @AddedUsages;

            UPDATE soh WITH (UPDLOCK)
            SET qty_base = soh.qty_base - agg.total_qty, updated_at = GETDATE()
            FROM stock_on_hand soh
            JOIN (SELECT item_id, SUM(qty_base) AS total_qty FROM @AddedUsages GROUP BY item_id) agg
            ON soh.item_id = agg.item_id;

            -- ── EDIT ─────────────────────────────────────────────────────────
            UPDATE vu
            SET vu.qty_base = e.new_qty_base
            FROM visit_usages vu JOIN #enriched e ON vu.visit_usage_id = e.visit_usage_id
            WHERE e.action = 'EDIT';

            INSERT INTO visit_usage_edit_logs (visit_usage_id, edited_by, edited_at, old_qty_base, new_qty_base, reason)
            SELECT visit_usage_id, @EditedBy, GETDATE(), old_qty_base, new_qty_base, @Reason
            FROM #enriched WHERE action = 'EDIT';

            INSERT INTO stock_movements (item_id, qty_base, movement_type, ref_type, ref_id, created_by, created_at, reason)
            SELECT item_id, ABS(new_qty_base - old_qty_base),
                   CASE WHEN new_qty_base > old_qty_base THEN 'DISPENSE' ELSE 'DISPENSE_RETURN' END,
                   'VISIT', CAST(@VisitId AS NVARCHAR(50)), @EditedBy, GETDATE(),
                   N'แก้ไขจำนวนยา Visit #' + CAST(@VisitId AS NVARCHAR(20)) + N': ' + ISNULL(@Reason, '')
            FROM #enriched WHERE action = 'EDIT' AND new_qty_base <> old_qty_base;

            UPDATE soh WITH (UPDLOCK)
            SET qty_base = soh.qty_base - agg.delta_qty, updated_at = GETDATE()
            FROM stock_on_hand soh
            JOIN (SELECT item_id, SUM(new_qty_base - old_qty_base) AS delta_qty FROM #enriched WHERE action = 'EDIT' GROUP BY item_id) agg
            ON soh.item_id = agg.item_id;

            -- ── DELETE (soft-delete) ──────────────────────────────────────────
            UPDATE vu SET vu.is_active = 0
            FROM visit_usages vu JOIN #enriched e ON vu.visit_usage_id = e.visit_usage_id
            WHERE e.action = 'DELETE';

            INSERT INTO visit_usage_edit_logs (visit_usage_id, edited_by, edited_at, old_qty_base, new_qty_base, reason)
            SELECT visit_usage_id, @EditedBy, GETDATE(), old_qty_base, 0, @Reason
            FROM #enriched WHERE action = 'DELETE';

            INSERT INTO stock_movements (item_id, qty_base, movement_type, ref_type, ref_id, created_by, created_at, reason)
            SELECT item_id, old_qty_base, 'DISPENSE_RETURN', 'VISIT', CAST(@VisitId AS NVARCHAR(50)), @EditedBy, GETDATE(),
                   N'แก้ไข Visit #' + CAST(@VisitId AS NVARCHAR(20)) + N': ลบรายการ - ' + ISNULL(@Reason, '')
            FROM #enriched WHERE action = 'DELETE' AND old_qty_base > 0;

            UPDATE soh WITH (UPDLOCK)
            SET qty_base = soh.qty_base + agg.total_qty, updated_at = GETDATE()
            FROM stock_on_hand soh
            JOIN (SELECT item_id, SUM(old_qty_base) AS total_qty FROM #enriched WHERE action = 'DELETE' GROUP BY item_id) agg
            ON soh.item_id = agg.item_id;
        END;

        COMMIT TRANSACTION;
        SELECT 1 AS Status, N'บันทึกการแก้ไขสำเร็จ' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Status, N'เกิดข้อผิดพลาด: ' + ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO
```

---

## Test Script

```sql
-- ทดสอบ sp_TR_05
EXEC sp_TR_05_GetLastApprovedStockDate;
GO

-- ทดสอบ sp_TR_06 (แก้ไข non-stock fields เท่านั้น)
EXEC sp_TR_06_UpdateVisit
    @VisitId   = 1,
    @EditedBy  = N'8300',
    @Reason    = N'ทดสอบแก้ไข',
    @Symptoms  = N'ปวดหัวมาก มีไข้สูง',
    @NursingAdvice = N'พักผ่อนให้เพียงพอ',
    @GroupId   = 1,
    @DiseaseId = 1,
    @TreatmentTypeId = 4,
    @AccidentInWorkFlag = 0,
    @WorkRelatedFlag = 0,
    @ReferFlag = 0;
GO

-- ตรวจสอบผล
SELECT visit_id, symptoms, nursing_advice, updated_by, updated_at FROM visits WHERE visit_id = 1;
SELECT * FROM visit_usages WHERE visit_id = 1;
SELECT * FROM visit_usage_edit_logs ORDER BY log_id DESC;
SELECT * FROM stock_movements WHERE ref_type = 'VISIT' ORDER BY movement_id DESC;
GO
```

---

### STEP 6: ALTER TABLE visits ADD is_active (soft-delete)

```sql
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'visits') AND name = N'is_active')
    ALTER TABLE visits ADD is_active BIT NOT NULL DEFAULT 1;
GO
UPDATE visits SET is_active = 1 WHERE is_active IS NULL;
GO
```

---

### STEP 7: CREATE OR ALTER sp_TR_02_GetVisitList (เพิ่ม is_active filter)

เพิ่ม `AND v.is_active = 1` ใน WHERE clause เพื่อซ่อน visit ที่ถูก soft-delete

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_TR_02_GetVisitList]
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
        CASE
            WHEN v.patient_type = 'EXT' THEN ep.full_name
            ELSE NULL
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
        (SELECT COUNT(*) FROM visit_usages vu WHERE vu.visit_id = v.visit_id AND vu.is_active = 1) AS usage_count,
        COUNT(*) OVER() AS total_rows
    FROM visits v
    LEFT JOIN disease_groups dg       ON v.group_id = dg.group_id
    LEFT JOIN disease_sub_groups ds   ON v.disease_id = ds.sub_group_id
    LEFT JOIN treatment_types tt      ON v.treatment_type_id = tt.treatment_type_id
    LEFT JOIN refer_types rt          ON v.refer_type_id = rt.refer_type_id
    LEFT JOIN external_people ep      ON v.external_person_id = ep.external_person_id
    WHERE
        v.is_active = 1
        AND (@DateFrom IS NULL OR CAST(v.visit_datetime AS DATE) >= @DateFrom)
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

### STEP 8: CREATE OR ALTER sp_TR_07_DeleteVisit

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_TR_07_DeleteVisit]
    @VisitId    INT,
    @DeletedBy  NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. ตรวจสอบว่า visit มีอยู่และยัง active
        DECLARE @VisitDatetime DATETIME;
        SELECT @VisitDatetime = visit_datetime
        FROM visits
        WHERE visit_id = @VisitId AND is_active = 1;

        IF @VisitDatetime IS NULL
        BEGIN
            RAISERROR(N'ไม่พบข้อมูล Visit หรือถูกลบไปแล้ว', 16, 1);
            RETURN;
        END

        -- 2. ตรวจสอบ stock lock (เช็คเหมือนกับการแก้ไขยา)
        DECLARE @LastApprovedAt DATETIME;
        SELECT @LastApprovedAt = MAX(approved_at)
        FROM physical_count_headers
        WHERE count_status = 'APPROVED';

        IF @LastApprovedAt IS NOT NULL AND @VisitDatetime < @LastApprovedAt
 BEGIN
     DECLARE @LockMsg NVARCHAR(300) = N'ไม่สามารถลบ Visit นี้ได้ เนื่องจากอยู่ใน Period ที่นับ Stock แล้ว (นับเมื่อ '
         + CONVERT(NVARCHAR(20), @LastApprovedAt, 103) + N')';
     RAISERROR(@LockMsg, 16, 1);
     RETURN;
 END

        -- 3. คืน stock สำหรับทุก usage ที่ยัง active
        UPDATE soh
        SET soh.qty_base   = soh.qty_base + vu.qty_base,
            soh.updated_at = GETDATE()
        FROM stock_on_hand soh
        INNER JOIN visit_usages vu ON soh.item_id = vu.item_id
        WHERE vu.visit_id = @VisitId AND vu.is_active = 1;

        -- 4. บันทึก stock_movements (DISPENSE_RETURN)
        INSERT INTO stock_movements (movement_type, item_id, qty_base, ref_type, ref_id, created_by, reason)
        SELECT
            'DISPENSE_RETURN',
            vu.item_id,
            vu.qty_base,
            'VISIT',
            CAST(@VisitId AS VARCHAR(50)),
            @DeletedBy,
            N'ลบบันทึกการรักษา Visit #' + CAST(@VisitId AS NVARCHAR(20))
        FROM visit_usages vu
        WHERE vu.visit_id = @VisitId AND vu.is_active = 1;

        -- 5. Soft-delete รายการยาทั้งหมด
        UPDATE visit_usages
        SET is_active = 0
        WHERE visit_id = @VisitId AND is_active = 1;

        -- 6. Soft-delete visit
        UPDATE visits
        SET is_active  = 0,
            updated_by = @DeletedBy,
            updated_at = GETDATE()
        WHERE visit_id = @VisitId;

        COMMIT TRANSACTION;

        SELECT 1 AS Status, N'ลบบันทึกการรักษาสำเร็จ' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Status, ERROR_MESSAGE() AS Message;
    END CATCH
END
GO

-- ทดสอบ
EXEC sp_TR_07_DeleteVisit @VisitId = 1, @DeletedBy = N'8300';
GO
-- ตรวจสอบผล
SELECT visit_id, is_active, updated_by, updated_at FROM visits WHERE visit_id = 1;
SELECT visit_usage_id, is_active FROM visit_usages WHERE visit_id = 1;
SELECT * FROM stock_movements WHERE ref_type = 'VISIT' ORDER BY movement_id DESC;
GO
```
