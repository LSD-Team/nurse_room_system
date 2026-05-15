# Stock Adjustment & Snapshot Workflow (Physical Count Flow)

> **เวอร์ชัน:** 1.0 | **วันที่:** 2026-05-14  
> **ผู้เขียน:** ทีมพัฒนา  
> เอกสารนี้รวม Flow การทำงาน, โครงสร้างฐานข้อมูล และ SQL สำหรับ Physical Count + Snapshot Workflow ไว้ครบในที่เดียว

---

## 1. ภาพรวม Flow การทำงาน

```
[พนักงาน (Staff)]
  │
  ├─ Step 1 ─ สร้าง period (sp_Snapshot_01_CreateStockPeriod)
  │            → stock_periods.period_status = OPEN
  │
  ├─ Step 2 ─ เริ่มนับ stock (sp_PhysCount_01_Create)
  │            → สร้าง physical_count_headers (DRAFT)
  │            → แช่แข็ง qty_system จาก stock_on_hand ลงใน physical_count_lines
  │              (qty_system คือ baseline ณ เวลานั้น — ใช้คำนวณ diff_qty = qty_counted - qty_system)
  │              (diff_qty นี้คือ discrepancy จริง ที่จะถูกนำไป apply กับ stock ปัจจุบัน ณ เวลาอนุมัติ)
  │            → stock_periods.period_status = COUNTING
  │
  ├─ Step 2b─ บันทึก/แก้ไขยอดนับ (sp_PhysCount_02_SaveLines)
  │            → อัปเดต physical_count_lines.qty_counted (เรียกได้หลายครั้ง)
  │
  ├─ Step 3 ─ ดูรายงานเปรียบเทียบ (sp_PhysCount_03_GetComparison)
  │            → qty_system vs qty_counted + diff_qty
  │
  └─ Step 4 ─ ส่งขออนุมัติ (sp_PhysCount_04_Submit)
               → physical_count_headers.count_status = SUBMITTED
               → stock_periods.period_status = PENDING_APPROVAL
               → 📧 Email แจ้ง GROUP_LEAD (ENotifyType.APPROVAL_PHYSICAL_COUNT)

[GROUP_LEAD]
  │
  ├─ Step 5 ─ ตรวจสอบข้อมูล (sp_PhysCount_03_GetComparison)
  │            → ดูการเปรียบเทียบก่อนตัดสินใจ
  │
  ├─ Step 6a─ อนุมัติ (sp_PhysCount_05_Approve)
  │            → Insert ADJUST_IN/OUT ด้วย diff_qty (ผลต่าง ณ เวลานับ)
  │              คำนวณ: approved_stock = stock_on_hand_ปัจจุบัน + diff_qty
  │              (ไม่ใช้ sp_SyncPhysicalStock เพราะจะ overwrite stock ด้วย qty_counted สัมบูรณ์ซึ่งผิดพลาดหาก stock เคลื่อนไหวระหว่างรออนุมัติ)
  │            → Update stock_on_hand += diff_qty ทุก item ที่มีผลต่าง
  │            → เรียก sp_Snapshot_02_CreatePeriodStockSnapshot @Mode='do' @ReturnResult=0
  │            → physical_count_headers.count_status = APPROVED
  │            → stock_periods.period_status = SNAPSHOT_DONE (โดย sp_Snapshot_02)
  │            → 📧 Email แจ้งพนักงานผู้ส่ง (ENotifyType.PHYSICAL_COUNT_APPROVED)
  │
  └─ Step 6b─ ปฏิเสธ (sp_PhysCount_06_Reject)
               → physical_count_headers.count_status = REJECTED
               → stock_periods.period_status = COUNTING (เปิดให้สร้าง count ใหม่ได้)
               → 📧 Email แจ้งพนักงานผู้ส่ง พร้อมเหตุผล (ENotifyType.PHYSICAL_COUNT_REJECTED)

หมายเหตุ: หลังถูก reject พนักงานสร้าง count ใหม่ด้วย sp_PhysCount_01_Create
          (count เดิมสถานะ REJECTED ยังอยู่ในระบบเพื่อ audit)
```

---

## 2. สถานะของ stock_periods.period_status

| สถานะ | ความหมาย | เปลี่ยนโดย |
|-------|---------|-----------|
| `OPEN` | สร้าง period แล้ว ยังไม่มีการนับ | sp_Snapshot_01 |
| `COUNTING` | กำลังนับ stock / ถูก reject กลับมา | sp_PhysCount_01, sp_PhysCount_06_Reject |
| `PENDING_APPROVAL` | ส่งให้ GROUP_LEAD อนุมัติแล้ว | sp_PhysCount_04_Submit |
| `SNAPSHOT_DONE` | snapshot เสร็จสิ้น | sp_Snapshot_02 (เรียกผ่าน sp_PhysCount_05_Approve) |
| `CLOSED` | ปิด period (manual) | Admin |

---

## 3. สถานะของ physical_count_headers.count_status

| สถานะ | ความหมาย |
|-------|---------|
| `DRAFT` | กำลังกรอกข้อมูลนับ (สร้างใหม่ / หลัง reject) |
| `SUBMITTED` | ส่งขออนุมัติแล้ว (รอ GROUP_LEAD) |
| `APPROVED` | GROUP_LEAD อนุมัติ + snapshot เรียบร้อยแล้ว |
| `REJECTED` | GROUP_LEAD ปฏิเสธ → เก็บไว้เพื่อ audit / ต้องสร้าง count ใหม่ |

---

## 4. ตารางใหม่ที่ต้องสร้าง

### 4.1 physical_count_headers

เก็บ session การนับ stock แต่ละครั้ง (1 period มีได้ 1 record ที่ DRAFT/SUBMITTED)

| คอลัมน์ | Type | หมายเหตุ |
|---------|------|---------|
| count_id | INT IDENTITY PK | |
| period_code | VARCHAR(10) | FK → stock_periods |
| count_status | VARCHAR(20) | DRAFT / SUBMITTED / APPROVED / REJECTED |
| note | NVARCHAR(500) | หมายเหตุ |
| created_by | NVARCHAR(100) | |
| created_at | DATETIME | |
| submitted_by | NVARCHAR(100) | |
| submitted_at | DATETIME | |
| approved_by | NVARCHAR(100) | |
| approved_at | DATETIME | |
| rejected_reason | NVARCHAR(500) | เหตุผลที่ปฏิเสธ |

### 4.2 physical_count_lines

เก็บยอดนับแต่ละรายการยา (1 count_id : N items)

| คอลัมน์ | Type | หมายเหตุ |
|---------|------|---------|
| line_id | INT IDENTITY PK | |
| count_id | INT | FK → physical_count_headers |
| item_id | INT | FK → items |
| qty_system | DECIMAL(18,4) | ยอดในระบบ ณ เวลา sp_PhysCount_01 ถูกเรียก |
| qty_counted | DECIMAL(18,4) | ยอดที่นับได้จริง (default 0) |
| diff_qty | DECIMAL(18,4) COMPUTED | qty_counted - qty_system (PERSISTED) |
| note | NVARCHAR(500) | หมายเหตุต่อรายการ |

---

## 5. SQL: สร้างตาราง

```sql
-- ============================================================
-- CREATE TABLE: physical_count_headers
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM sys.all_objects
    WHERE object_id = OBJECT_ID(N'[dbo].[physical_count_headers]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[physical_count_headers] (
        [count_id]        INT            IDENTITY(1,1) NOT NULL,
        [period_code]     VARCHAR(10)    COLLATE Thai_CI_AS NOT NULL,
        [count_status]    VARCHAR(20)    COLLATE Thai_CI_AS NOT NULL DEFAULT 'DRAFT',
        [note]            NVARCHAR(500)  COLLATE Thai_CI_AS NULL,
        [created_by]      NVARCHAR(100)  COLLATE Thai_CI_AS NOT NULL,
        [created_at]      DATETIME       DEFAULT GETDATE() NOT NULL,
        [submitted_by]    NVARCHAR(100)  COLLATE Thai_CI_AS NULL,
        [submitted_at]    DATETIME       NULL,
        [approved_by]     NVARCHAR(100)  COLLATE Thai_CI_AS NULL,
        [approved_at]     DATETIME       NULL,
        [rejected_reason] NVARCHAR(500)  COLLATE Thai_CI_AS NULL,

        CONSTRAINT PK_physical_count_headers PRIMARY KEY (count_id),
        CONSTRAINT FK_phys_count_period
            FOREIGN KEY (period_code) REFERENCES stock_periods(period_code)
    );
    PRINT 'Created table: physical_count_headers';
END
ELSE
    PRINT 'Table already exists: physical_count_headers';
GO

-- ============================================================
-- CREATE TABLE: physical_count_lines
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM sys.all_objects
    WHERE object_id = OBJECT_ID(N'[dbo].[physical_count_lines]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[physical_count_lines] (
        [line_id]     INT            IDENTITY(1,1) NOT NULL,
        [count_id]    INT            NOT NULL,
        [item_id]     INT            NOT NULL,
        [qty_system]  DECIMAL(18,4)  NOT NULL,
        [qty_counted] DECIMAL(18,4)  NOT NULL DEFAULT 0,
        [diff_qty]    AS (qty_counted - qty_system) PERSISTED,
        [note]        NVARCHAR(500)  COLLATE Thai_CI_AS NULL,

        CONSTRAINT PK_physical_count_lines PRIMARY KEY (line_id),
        CONSTRAINT FK_phys_count_line_header
            FOREIGN KEY (count_id) REFERENCES physical_count_headers(count_id),
        CONSTRAINT UQ_phys_count_item UNIQUE (count_id, item_id)
    );
    PRINT 'Created table: physical_count_lines';
END
ELSE
    PRINT 'Table already exists: physical_count_lines';
GO
```

---

## 6. SQL: Stored Procedures ใหม่

### sp_PhysCount_01_Create — สร้าง session นับ stock

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_PhysCount_01_Create]
    @PeriodCode VARCHAR(10),
    @CreatedBy  NVARCHAR(100),
    @Note       NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- ตรวจสอบ period
    IF NOT EXISTS (
        SELECT 1 FROM stock_periods
        WHERE period_code = @PeriodCode
          AND period_status IN ('OPEN', 'COUNTING')
    )
    BEGIN
        SELECT 0 AS Status,
               N'ไม่พบ period หรือสถานะไม่อนุญาต (ต้องเป็น OPEN หรือ COUNTING)' AS Message;
        RETURN;
    END;

    -- ตรวจสอบว่ามี session ที่ยังค้างอยู่หรือไม่
    IF EXISTS (
        SELECT 1 FROM physical_count_headers
        WHERE period_code = @PeriodCode
          AND count_status IN ('DRAFT', 'SUBMITTED')
    )
    BEGIN
        SELECT 0 AS Status,
               N'มีการนับ stock ที่ยังไม่เสร็จสิ้นสำหรับ period นี้อยู่แล้ว' AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @CountId INT;

        -- สร้าง header
        INSERT INTO physical_count_headers
            (period_code, count_status, note, created_by, created_at)
        VALUES
            (@PeriodCode, 'DRAFT', @Note, @CreatedBy, GETDATE());

        SET @CountId = SCOPE_IDENTITY();

        -- Snapshot ยอดปัจจุบันจาก stock_on_hand (qty_system)
        INSERT INTO physical_count_lines (count_id, item_id, qty_system, qty_counted)
        SELECT @CountId, s.item_id, CAST(s.qty_base AS DECIMAL(18,4)), 0
        FROM stock_on_hand s
        INNER JOIN items i ON s.item_id = i.item_id
        WHERE i.is_active = 1;

        -- อัปเดต period status
        UPDATE stock_periods
        SET period_status = 'COUNTING'
        WHERE period_code = @PeriodCode;

        COMMIT TRANSACTION;

        SELECT 1 AS Status,
               N'สร้างรายการนับ stock สำเร็จ' AS Message,
               @CountId AS CountId,
               @PeriodCode AS PeriodCode;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO
```

---

### sp_PhysCount_02_SaveLines — บันทึก/แก้ไขยอดนับ

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_PhysCount_02_SaveLines]
    @CountId  INT,
    @JsonData NVARCHAR(MAX)
    -- JSON: [{"item_id": 4, "qty_counted": 18, "note": "หมายเหตุ"}]
AS
BEGIN
    SET NOCOUNT ON;

    -- ตรวจสอบ session
    IF NOT EXISTS (
        SELECT 1 FROM physical_count_headers
        WHERE count_id = @CountId AND count_status = 'DRAFT'
    )
    BEGIN
        SELECT 0 AS Status,
               N'ไม่พบรายการหรือสถานะไม่ถูกต้อง (ต้องเป็น DRAFT)' AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- อัปเดต qty_counted และ note สำหรับรายการที่ส่งมา
        UPDATE pcl
        SET pcl.qty_counted = j.qty_counted,
            pcl.note        = ISNULL(j.note, pcl.note)
        FROM physical_count_lines pcl
        INNER JOIN OPENJSON(@JsonData) WITH (
            item_id     INT              '$.item_id',
            qty_counted DECIMAL(18,4)    '$.qty_counted',
            note        NVARCHAR(500)    '$.note'
        ) j ON pcl.item_id = j.item_id AND pcl.count_id = @CountId;

        COMMIT TRANSACTION;

        SELECT 1 AS Status,
               N'บันทึกข้อมูลการนับสำเร็จ' AS Message,
               @@ROWCOUNT AS UpdatedRows;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO
```

---

### sp_PhysCount_03_GetComparison — ดูรายงานเปรียบเทียบ

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_PhysCount_03_GetComparison]
    @CountId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: ข้อมูล header
    SELECT
        pch.count_id,
        pch.period_code,
        sp.period_start,
        sp.period_end,
        pch.count_status,
        pch.note,
        pch.created_by,
        pch.created_at,
        pch.submitted_by,
        pch.submitted_at,
        pch.approved_by,
        pch.approved_at,
        pch.rejected_reason
    FROM physical_count_headers pch
    INNER JOIN stock_periods sp ON pch.period_code = sp.period_code
    WHERE pch.count_id = @CountId;

    -- Result set 2: รายการเปรียบเทียบ (พร้อมข้อมูลเพิ่มเติม)
    SELECT
        pcl.line_id,
        pcl.item_id,
        i.item_code,
        i.item_name_th,
        i.item_name_en,
        u.unit_name_th,
        i.item_min,
        i.item_max,
        pcl.qty_system,
        pcl.qty_counted,
        pcl.diff_qty,
        CASE
            WHEN pcl.diff_qty > 0 THEN N'เกิน'
            WHEN pcl.diff_qty < 0 THEN N'ขาด'
            ELSE N'ตรง'
        END AS diff_status,
        pcl.note,
        -- Snapshot ปิดจากเดือนก่อนหน้า (actual_closing ของ period_code ล่าสุดที่ period_end < period_start)
        ISNULL(sps_prev.actual_closing, 0) AS snapshot_prev_qty,
        -- รับเข้าช่วง period (RECEIVE, RETURN)
        ISNULL((
            SELECT SUM(sm.qty_base)
            FROM stock_movements sm
            WHERE sm.item_id = pcl.item_id
              AND sm.movement_type IN ('RECEIVE', 'RETURN')
              AND CAST(sm.created_at AS DATE) >= sp.period_start
              AND CAST(sm.created_at AS DATE) <= sp.period_end
        ), 0) AS received_qty,
        -- ใช้ออกช่วง period (USAGE, ISSUE, WITHDRAW)
        ISNULL((
            SELECT SUM(sm.qty_base)
            FROM stock_movements sm
            WHERE sm.item_id = pcl.item_id
              AND sm.movement_type IN ('USAGE', 'ISSUE', 'WITHDRAW')
              AND CAST(sm.created_at AS DATE) >= sp.period_start
              AND CAST(sm.created_at AS DATE) <= sp.period_end
        ), 0) AS issued_qty
    FROM physical_count_lines pcl
    INNER JOIN items i              ON pcl.item_id = i.item_id
    LEFT  JOIN units u              ON i.usage_unit_id = u.unit_id
    INNER JOIN physical_count_headers pch ON pcl.count_id = pch.count_id
    INNER JOIN stock_periods sp     ON pch.period_code = sp.period_code
    OUTER APPLY (
        SELECT TOP 1 sp_prev.period_code AS prev_period_code
        FROM stock_periods sp_prev
        WHERE sp_prev.period_end < sp.period_start
        ORDER BY sp_prev.period_end DESC
    ) prev_p
    LEFT JOIN stock_period_snapshot sps_prev
           ON sps_prev.period_code = prev_p.prev_period_code
          AND sps_prev.item_id     = pcl.item_id
    WHERE pcl.count_id = @CountId
    ORDER BY i.item_code;
END;
GO
```

---

### sp_PhysCount_04_Submit — ส่งขออนุมัติ GROUP_LEAD

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_PhysCount_04_Submit]
    @CountId     INT,
    @SubmittedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- ตรวจสอบ
    DECLARE @PeriodCode VARCHAR(10);
    SELECT @PeriodCode = period_code
    FROM physical_count_headers
    WHERE count_id = @CountId AND count_status = 'DRAFT';

    IF @PeriodCode IS NULL
    BEGIN
        SELECT 0 AS Status,
               N'ไม่พบรายการหรือสถานะไม่ถูกต้อง (ต้องเป็น DRAFT)' AS Message;
        RETURN;
    END;

    -- ตรวจสอบว่ามีการนับข้อมูลแล้ว (qty_counted > 0 อย่างน้อย 1 รายการ)
    IF NOT EXISTS (
        SELECT 1 FROM physical_count_lines
        WHERE count_id = @CountId AND qty_counted > 0
    )
    BEGIN
        SELECT 0 AS Status,
               N'ยังไม่มีการบันทึกยอดนับ กรุณานับ stock ก่อนส่งอนุมัติ' AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE physical_count_headers
        SET count_status  = 'SUBMITTED',
            submitted_by  = @SubmittedBy,
            submitted_at  = GETDATE()
        WHERE count_id = @CountId;

        UPDATE stock_periods
        SET period_status = 'PENDING_APPROVAL'
        WHERE period_code = @PeriodCode;

        COMMIT TRANSACTION;

        SELECT 1 AS Status,
               N'ส่งขออนุมัติสำเร็จ รอ GROUP_LEAD ตรวจสอบ' AS Message,
               @CountId AS CountId,
               @PeriodCode AS PeriodCode;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO
```

---

### sp_PhysCount_05_Approve — GROUP_LEAD อนุมัติ + ทำ snapshot จริง

> ⚠️ SP นี้เรียก sp_SyncPhysicalStock และ sp_Snapshot_02 ซึ่งต้องถูก ALTER ก่อนตามหัวข้อ 7

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_PhysCount_05_Approve]
    @CountId    INT,
    @ApprovedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. ตรวจสอบ session
    DECLARE @PeriodCode VARCHAR(10), @CountStatus VARCHAR(20);

    SELECT @PeriodCode  = period_code,
           @CountStatus = count_status
    FROM physical_count_headers
    WHERE count_id = @CountId;

    IF @PeriodCode IS NULL
    BEGIN
        SELECT 0 AS Status, N'ไม่พบรายการนับ stock' AS Message;
        RETURN;
    END;

    IF @CountStatus <> 'SUBMITTED'
    BEGIN
        SELECT 0 AS Status,
               N'สถานะต้องเป็น SUBMITTED เท่านั้น (ปัจจุบัน: ' + @CountStatus + ')' AS Message;
        RETURN;
    END;

    -- 2. ตรวจสอบ role GROUP_LEAD
    IF NOT EXISTS (
        SELECT 1 FROM approval_roles
        WHERE role_code = 'GROUP_LEAD'
          AND approver_id = @ApprovedBy
          AND is_active = 1
    )
    BEGIN
        SELECT 0 AS Status,
               N'เฉพาะผู้ที่มี role GROUP_LEAD เท่านั้นที่อนุมัติได้' AS Message;
        RETURN;
    END;

    -- 3. Insert ADJUST movements จาก diff_qty ที่แช่แข็งไว้ตอนนับ
    --    ไม่ใช้ sp_SyncPhysicalStock เพราะ SP นั้นส่ง qty_counted เป็น target สัมบูรณ์
    --    ซึ่งจะผิดพลาดหากมี stock movements เกิดขึ้นระหว่างรออนุมัติ
    --    วิธีที่ถูกต้องคือ นำ diff_qty (ผลต่าง ณ เวลานับ) ไปปรับกับ stock ปัจจุบัน
    --    approved_stock = stock_on_hand_ปัจจุบัน + diff_qty
    DECLARE @RefId VARCHAR(50) = 'PC-' + CAST(@CountId AS VARCHAR(10));

    INSERT INTO stock_movements
        (item_id, qty_base, movement_type, ref_type, ref_id, created_by, created_at, reason)
    SELECT
        pcl.item_id,
        ABS(CAST(pcl.diff_qty AS INT)),
        CASE WHEN pcl.diff_qty > 0 THEN 'ADJUST_IN' ELSE 'ADJUST_OUT' END,
        'PHYSICAL_COUNT',
        @RefId,
        @ApprovedBy,
        GETDATE(),
        N'Physical count adjustment (นับได้: ' + CAST(CAST(pcl.qty_counted AS INT) AS VARCHAR)
        + ', ระบบ ณ เวลานับ: ' + CAST(CAST(pcl.qty_system AS INT) AS VARCHAR) + ')'
    FROM physical_count_lines pcl
    WHERE pcl.count_id = @CountId
      AND CAST(pcl.diff_qty AS INT) <> 0;

    -- 4. อัปเดต stock_on_hand โดยบวก/ลบ diff_qty เข้ากับยอดปัจจุบัน
    UPDATE soh
    SET soh.qty_base   = soh.qty_base + CAST(pcl.diff_qty AS INT),
        soh.updated_at = GETDATE()
    FROM stock_on_hand soh
    INNER JOIN physical_count_lines pcl ON soh.item_id = pcl.item_id
    WHERE pcl.count_id = @CountId
      AND CAST(pcl.diff_qty AS INT) <> 0;

    -- 5. เรียก sp_Snapshot_02 (สร้าง snapshot จริง)
    EXEC dbo.sp_Snapshot_02_CreatePeriodStockSnapshot
        @PeriodCode   = @PeriodCode,
        @Mode         = 'do',
        @CreatedBy    = @ApprovedBy,
        @ReturnResult = 0;  -- ไม่ return resultset เพื่อหลีกเลี่ยง nested resultset

    -- 6. อัปเดต header เป็น APPROVED
    UPDATE physical_count_headers
    SET count_status = 'APPROVED',
        approved_by  = @ApprovedBy,
        approved_at  = GETDATE()
    WHERE count_id = @CountId;

    SELECT 1 AS Status,
           N'อนุมัติและสร้าง snapshot สำเร็จ' AS Message,
           @PeriodCode AS PeriodCode,
           @CountId AS CountId;
END;
GO
```

---

### sp_PhysCount_06_Reject — GROUP_LEAD ปฏิเสธ

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_PhysCount_06_Reject]
    @CountId        INT,
    @RejectedBy     NVARCHAR(100),
    @RejectedReason NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. ตรวจสอบ role GROUP_LEAD
    IF NOT EXISTS (
        SELECT 1 FROM approval_roles
        WHERE role_code = 'GROUP_LEAD'
          AND approver_id = @RejectedBy
          AND is_active = 1
    )
    BEGIN
        SELECT 0 AS Status,
               N'เฉพาะผู้ที่มี role GROUP_LEAD เท่านั้นที่ปฏิเสธได้' AS Message;
        RETURN;
    END;

    -- 2. ตรวจสอบ session
    DECLARE @PeriodCode VARCHAR(10);
    SELECT @PeriodCode = period_code
    FROM physical_count_headers
    WHERE count_id = @CountId AND count_status = 'SUBMITTED';

    IF @PeriodCode IS NULL
    BEGIN
        SELECT 0 AS Status,
               N'ไม่พบรายการหรือสถานะไม่ถูกต้อง (ต้องเป็น SUBMITTED)' AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE physical_count_headers
        SET count_status    = 'REJECTED',
            rejected_reason = @RejectedReason,
            approved_by     = @RejectedBy,  -- เก็บว่าใครเป็นคนดำเนินการ
            approved_at     = GETDATE()
        WHERE count_id = @CountId;

        -- คืนสถานะ period กลับเป็น COUNTING เพื่อให้นับใหม่ได้
        UPDATE stock_periods
        SET period_status = 'COUNTING'
        WHERE period_code = @PeriodCode;

        COMMIT TRANSACTION;

        SELECT 1 AS Status,
               N'ปฏิเสธการอนุมัติสำเร็จ' AS Message,
               @CountId AS CountId,
               @PeriodCode AS PeriodCode;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO
```
### SP เพิ่มเติม sp_Snapshot_04_editPeriodEnd สำหรับแก้ไข
```sql
CREATE OR ALTER PROCEDURE dbo.sp_Snapshot_04_editPeriodEnd
    @PeriodCode   VARCHAR(20),
    @NewPeriodEnd DATE
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE
        @PeriodStart  DATE,
        @OldPeriodEnd DATE,
        @PeriodStatus VARCHAR(20);

    BEGIN TRY
        BEGIN TRAN;

        SELECT
            @PeriodStart  = period_start,
            @OldPeriodEnd = period_end,
            @PeriodStatus = period_status
        FROM dbo.stock_periods WITH (UPDLOCK, HOLDLOCK)
        WHERE period_code = @PeriodCode;

        IF @PeriodStart IS NULL
        BEGIN
            SELECT
                'Error' AS Status,
                'ไม่พบ period_code: ' + ISNULL(@PeriodCode, '') AS Message;

            ROLLBACK TRAN;
            RETURN;
        END;

        IF ISNULL(@PeriodStatus, '') <> 'OPEN'
        BEGIN
            SELECT
                'Error' AS Status,
                'แก้ไขไม่ได้ เนื่องจาก period_status ไม่ใช่ OPEN' AS Message,
                @PeriodCode AS period_code,
                @PeriodStatus AS current_period_status;

            ROLLBACK TRAN;
            RETURN;
        END;

        IF @NewPeriodEnd IS NULL
        BEGIN
            SELECT
                'Error' AS Status,
                'NewPeriodEnd ห้ามเป็นค่าว่าง' AS Message;

            ROLLBACK TRAN;
            RETURN;
        END;

        IF @NewPeriodEnd < @PeriodStart
        BEGIN
            SELECT
                'Error' AS Status,
                'period_end ใหม่ ('
                + CONVERT(VARCHAR(10), @NewPeriodEnd, 120)
                + ') ต้องไม่น้อยกว่า period_start ('
                + CONVERT(VARCHAR(10), @PeriodStart, 120)
                + ')' AS Message;

            ROLLBACK TRAN;
            RETURN;
        END;

        IF EXISTS (
            SELECT 1
            FROM dbo.stock_periods WITH (HOLDLOCK)
            WHERE period_code <> @PeriodCode
              AND period_start <= @NewPeriodEnd
              AND @PeriodStart <= period_end
        )
        BEGIN
            SELECT
                'Error' AS Status,
                'แก้ไขไม่ได้: ช่วงวันที่ใหม่ซ้อนทับกับ period อื่น' AS Message;

            ROLLBACK TRAN;
            RETURN;
        END;

        UPDATE dbo.stock_periods
        SET period_end = @NewPeriodEnd
        WHERE period_code = @PeriodCode
          AND period_status = 'OPEN';

        IF @@ROWCOUNT = 0
        BEGIN
            SELECT
                'Error' AS Status,
                'แก้ไขไม่สำเร็จ อาจมีการเปลี่ยนสถานะระหว่างทำรายการ' AS Message;

            ROLLBACK TRAN;
            RETURN;
        END;

        COMMIT TRAN;

        SELECT
            'Success' AS Status,
            'แก้ไข period_end สำเร็จ' AS Message,
            @PeriodCode AS period_code,
            @OldPeriodEnd AS old_period_end,
            @NewPeriodEnd AS new_period_end;

        SELECT
            period_code,
            period_start,
            period_end,
            created_at,
            created_by,
            period_status
        FROM dbo.stock_periods
        WHERE period_code = @PeriodCode;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRAN;

        SELECT
            'Error' AS Status,
            ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO
```
### SP เพิ่มเติม sp_Snapshot_05_deletePeriod
```sql
CREATE OR ALTER PROCEDURE dbo.sp_Snapshot_05_deletePeriod
    @PeriodCode VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE
        @PeriodStart  DATE,
        @PeriodEnd    DATE,
        @PeriodStatus VARCHAR(20);

    BEGIN TRY
        BEGIN TRAN;

        SELECT
            @PeriodStart  = period_start,
            @PeriodEnd    = period_end,
            @PeriodStatus = period_status
        FROM dbo.stock_periods WITH (UPDLOCK, HOLDLOCK)
        WHERE period_code = @PeriodCode;

        IF @PeriodStart IS NULL
        BEGIN
            SELECT
                'Error' AS Status,
                'ไม่พบ period_code: ' + ISNULL(@PeriodCode, '') AS Message;

            ROLLBACK TRAN;
            RETURN;
        END;

        IF ISNULL(@PeriodStatus, '') <> 'OPEN'
        BEGIN
            SELECT
                'Error' AS Status,
                'ลบไม่ได้ เนื่องจาก period_status ไม่ใช่ OPEN' AS Message,
                @PeriodCode AS period_code,
                @PeriodStatus AS current_period_status;

            ROLLBACK TRAN;
            RETURN;
        END;

        DELETE FROM dbo.stock_periods
        WHERE period_code = @PeriodCode
          AND period_status = 'OPEN';

        IF @@ROWCOUNT = 0
        BEGIN
            SELECT
                'Error' AS Status,
                'ลบไม่สำเร็จ อาจมีการเปลี่ยนสถานะระหว่างทำรายการ' AS Message;

            ROLLBACK TRAN;
            RETURN;
        END;

        COMMIT TRAN;

        SELECT
            'Success' AS Status,
            'ลบ period สำเร็จ' AS Message,
            @PeriodCode AS period_code,
            @PeriodStart AS deleted_period_start,
            @PeriodEnd AS deleted_period_end;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRAN;

        SELECT
            'Error' AS Status,
            ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO
```
---

## 7. SQL: แก้ไข SP ที่มีอยู่แล้ว

> SP ทั้ง 2 ตัวนี้ต้องถูก ALTER ก่อนที่จะ deploy SP ชุดใหม่
>
> **หมายเหตุ:** `sp_SyncPhysicalStock` ไม่ได้ถูกเรียกจาก `sp_PhysCount_05_Approve` อีกต่อไป
> เนื่องจาก SP นั้นตั้ง `stock_on_hand = qty_counted` แบบสัมบูรณ์ ซึ่งจะผิดพลาดเมื่อมี
> stock movements เกิดขึ้นระหว่างเวลานับกับเวลาอนุมัติ  
> `sp_PhysCount_05_Approve` ใช้ `diff_qty` โดยตรงแทน (บวก/ลบกับยอดปัจจุบัน)  
> อย่างไรก็ตามยังต้อง ALTER `sp_SyncPhysicalStock` เพื่อเพิ่ม `@ReturnResult`
> สำหรับการเรียกจาก SP อื่นในอนาคต

### 7.1 ALTER sp_SyncPhysicalStock

เปลี่ยนเฉพาะ: เพิ่ม `@ReturnResult BIT = 1` และ wrap SELECT ท้ายด้วย `IF @ReturnResult = 1`

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_SyncPhysicalStock]
    @JsonData     NVARCHAR(MAX),   -- ยอดนับจริง [{"item_id": 4, "qty": 18}]
    @RefId        VARCHAR(50)    = '0',
    @CreatedBy    NVARCHAR(100),
    @Reason       NVARCHAR(255)  = 'Physical Stock Adjustment',
    @ReturnResult BIT            = 1  -- 1=return resultset, 0=suppress (สำหรับเรียกจาก SP อื่น)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        SELECT
            CAST(JSON_VALUE(j.value, '$.item_id') AS INT) AS item_id,
            CAST(JSON_VALUE(j.value, '$.qty')     AS INT) AS physical_qty
        INTO #PhysicalCount
        FROM OPENJSON(@JsonData) AS j
        WHERE ISJSON(j.value) = 1
          AND JSON_VALUE(j.value, '$.item_id') IS NOT NULL
          AND ISNUMERIC(JSON_VALUE(j.value, '$.item_id')) = 1
          AND JSON_VALUE(j.value, '$.qty') IS NOT NULL
          AND ISNUMERIC(JSON_VALUE(j.value, '$.qty')) = 1;

        BEGIN TRANSACTION;

        SELECT
            p.item_id,
            p.physical_qty,
            ISNULL(sm.current_sum, 0) AS current_movement_sum,
            (p.physical_qty - ISNULL(sm.current_sum, 0)) AS diff_to_adjust
        INTO #Adjustments
        FROM #PhysicalCount p
        LEFT JOIN (
            SELECT
                item_id,
                SUM(CASE
                    WHEN movement_type IN ('ADJUST_IN','RECEIVE','RETURN','INITIAL_LOAD') THEN  qty_base
                    WHEN movement_type IN ('ADJUST_OUT','USAGE','ISSUE','WITHDRAW')       THEN -qty_base
                    ELSE qty_base
                END) AS current_sum
            FROM stock_movements
            GROUP BY item_id
        ) sm ON p.item_id = sm.item_id;

        INSERT INTO stock_movements
            (item_id, qty_base, movement_type, ref_type, ref_id, created_by, created_at, reason)
        SELECT
            item_id,
            ABS(diff_to_adjust),
            CASE WHEN diff_to_adjust > 0 THEN 'ADJUST_IN' ELSE 'ADJUST_OUT' END,
            'PHYSICAL_COUNT',
            @RefId,
            @CreatedBy,
            GETDATE(),
            @Reason + ' (Movement Sum: ' + CAST(current_movement_sum AS VARCHAR)
                    + ', Actual: ' + CAST(physical_qty AS VARCHAR) + ')'
        FROM #Adjustments
        WHERE diff_to_adjust <> 0;

        MERGE stock_on_hand AS target
        USING #PhysicalCount AS source ON (target.item_id = source.item_id)
        WHEN MATCHED THEN
            UPDATE SET target.qty_base   = source.physical_qty,
                       target.updated_at = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (item_id, qty_base, updated_at)
            VALUES (source.item_id, source.physical_qty, GETDATE());

        COMMIT TRANSACTION;

        -- ⬇ เพิ่ม: ส่งผลลัพธ์เฉพาะเมื่อ @ReturnResult = 1
        IF @ReturnResult = 1
            SELECT 'Success' AS Status, 'Stock synchronized using OPENJSON.' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Err, 16, 1);
    END CATCH;
END;
GO
```

---

### 7.2 ALTER sp_Snapshot_02_CreatePeriodStockSnapshot

เปลี่ยนเฉพาะ 3 จุด:
1. เพิ่ม `@ReturnResult BIT = 1`
2. เพิ่ม `'PENDING_APPROVAL'` ใน valid status สำหรับ `@Mode = 'do'`
3. Wrap SELECT 'Success'/'Preview' ด้วย `IF @ReturnResult = 1`

```sql
CREATE OR ALTER PROCEDURE [dbo].[sp_Snapshot_02_CreatePeriodStockSnapshot]
    @PeriodCode   VARCHAR(20),
    @Mode         NVARCHAR(10)  = 'show',
    @CreatedBy    NVARCHAR(100) = NULL,
    @ReturnResult BIT           = 1  -- 1=return resultset, 0=suppress (สำหรับเรียกจาก SP อื่น)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE
        @PeriodStart    DATE,
        @PeriodEnd      DATE,
        @PeriodStatus   VARCHAR(20),
        @LastPeriodCode VARCHAR(20);

    SELECT
        @PeriodStart  = period_start,
        @PeriodEnd    = period_end,
        @PeriodStatus = period_status
    FROM stock_periods
    WHERE period_code = @PeriodCode;

    IF @PeriodStart IS NULL
    BEGIN
        DECLARE @ErrMsg1 NVARCHAR(200) = N'ไม่พบ period_code = ' + @PeriodCode;
        IF @ReturnResult = 1
            SELECT 'Error' AS Status, @ErrMsg1 AS Message;
        ELSE
            RAISERROR(@ErrMsg1, 16, 1);
        RETURN;
    END;

    SELECT TOP (1)
        @LastPeriodCode = period_code
    FROM stock_periods
    ORDER BY period_end DESC, period_code DESC;

    IF LOWER(@Mode) = 'do'
    BEGIN
        IF @PeriodStatus = 'SNAPSHOT_DONE' AND @PeriodCode <> @LastPeriodCode
        BEGIN
            DECLARE @ErrMsg2 NVARCHAR(200) = N'period นี้เคย snapshot แล้ว และไม่ใช่ period สุดท้าย';
            IF @ReturnResult = 1
                SELECT 'Error' AS Status, @ErrMsg2 AS Message;
            ELSE
                RAISERROR(@ErrMsg2, 16, 1);
            RETURN;
        END;

        -- ⬇ เพิ่ม: รับ PENDING_APPROVAL ด้วย (สถานะจาก sp_PhysCount_04_Submit)
        IF @PeriodStatus NOT IN ('OPEN', 'SNAPSHOT_DONE', 'PENDING_APPROVAL')
        BEGIN
            DECLARE @ErrMsg3 NVARCHAR(200) =
                N'period อยู่ในสถานะ ' + ISNULL(@PeriodStatus,'(null)') + N' ไม่อนุญาตให้ทำ snapshot';
            IF @ReturnResult = 1
                SELECT 'Error' AS Status, @ErrMsg3 AS Message;
            ELSE
                RAISERROR(@ErrMsg3, 16, 1);
            RETURN;
        END;
    END;

    ;WITH MovementsBefore AS (
        SELECT m.item_id, m.movement_type, m.qty_base, mt.direction
        FROM stock_movements m
        JOIN movement_types mt ON m.movement_type = mt.movement_type_code
        WHERE mt.affect_on_hand = 1 AND m.created_at < @PeriodStart
    ),
    MovementsInPeriod AS (
        SELECT m.item_id, m.movement_type, m.qty_base, mt.direction
        FROM stock_movements m
        JOIN movement_types mt ON m.movement_type = mt.movement_type_code
        WHERE mt.affect_on_hand = 1
          AND m.created_at >= @PeriodStart
          AND m.created_at < DATEADD(DAY, 1, @PeriodEnd)
    ),
    MovementsUntilEnd AS (
        SELECT m.item_id, m.movement_type, m.qty_base, mt.direction
        FROM stock_movements m
        JOIN movement_types mt ON m.movement_type = mt.movement_type_code
        WHERE mt.affect_on_hand = 1
          AND m.created_at < DATEADD(DAY, 1, @PeriodEnd)
    ),
    OpeningAgg AS (
        SELECT item_id, SUM(qty_base * direction) AS opening_qty
        FROM MovementsBefore GROUP BY item_id
    ),
    PeriodAgg AS (
        SELECT
            item_id,
            SUM(CASE WHEN movement_type IN ('RECEIVE','RETURN') THEN qty_base ELSE 0 END) AS receipts,
            SUM(CASE WHEN movement_type IN ('USAGE','ISSUE','WITHDRAW') THEN qty_base ELSE 0 END) AS issues,
            SUM(CASE WHEN movement_type IN ('ADJUST_IN','ADJUST_OUT') THEN qty_base * direction ELSE 0 END) AS adjustments,
            SUM(qty_base * direction) AS net_movement
        FROM MovementsInPeriod GROUP BY item_id
    ),
    ClosingAgg AS (
        SELECT item_id, SUM(qty_base * direction) AS actual_closing
        FROM MovementsUntilEnd GROUP BY item_id
    ),
    AllItems AS (SELECT item_id FROM items),
    Combined AS (
        SELECT
            ai.item_id,
            ISNULL(o.opening_qty,    0) AS opening_qty,
            ISNULL(p.receipts,       0) AS receipts,
            ISNULL(p.issues,         0) AS issues,
            ISNULL(p.adjustments,    0) AS adjustments,
            ISNULL(p.net_movement,   0) AS net_movement,
            ISNULL(c.actual_closing, 0) AS actual_closing
        FROM AllItems ai
        LEFT JOIN OpeningAgg o ON ai.item_id = o.item_id
        LEFT JOIN PeriodAgg  p ON ai.item_id = p.item_id
        LEFT JOIN ClosingAgg c ON ai.item_id = c.item_id
    )
    SELECT
        item_id, opening_qty, receipts, issues, adjustments, net_movement,
        opening_qty + net_movement AS expected_closing,
        actual_closing,
        actual_closing - (opening_qty + net_movement) AS diff_qty
    INTO #SnapshotPreview
    FROM Combined;

    IF LOWER(@Mode) = 'show'
    BEGIN
        IF @ReturnResult = 1
        BEGIN
            SELECT
                @PeriodCode  AS period_code,
                @PeriodStart AS period_start,
                @PeriodEnd   AS period_end,
                item_id, opening_qty, receipts, issues, adjustments,
                net_movement, expected_closing, actual_closing, diff_qty
            FROM #SnapshotPreview
            ORDER BY item_id;

            SELECT 'Preview' AS Status,
                   N'โหมด SHOW: period_code = ' + @PeriodCode AS Message;
        END;
        RETURN;
    END;

    IF LOWER(@Mode) = 'do'
    BEGIN
        BEGIN TRY
            BEGIN TRANSACTION;

            IF @PeriodStatus = 'SNAPSHOT_DONE'
            BEGIN
                DELETE FROM stock_period_snapshot WHERE period_code = @PeriodCode;
            END;

            INSERT INTO stock_period_snapshot (
                period_code, item_id, opening_qty, receipts, issues,
                adjustments, net_movement, expected_closing,
                actual_closing, diff_qty, created_at, created_by
            )
            SELECT
                @PeriodCode, item_id, opening_qty, receipts, issues,
                adjustments, net_movement, expected_closing,
                actual_closing, diff_qty, GETDATE(), @CreatedBy
            FROM #SnapshotPreview;
```

---

## 12. Implementation Checklist

### Phase 1: Database Setup
- [x] สร้างตาราง physical_count_headers
- [x] สร้างตาราง physical_count_lines
- [x] แก้ไข sp_SyncPhysicalStock (เพิ่ม @ReturnResult param)
- [x] แก้ไข sp_Snapshot_02_CreatePeriodStockSnapshot (เพิ่ม @ReturnResult param, รับ PENDING_APPROVAL)
- [x] สร้าง sp_PhysCount_01_Create
- [x] สร้าง sp_PhysCount_02_SaveLines
- [x] สร้าง sp_PhysCount_03_GetComparison
- [x] สร้าง sp_PhysCount_04_Submit
- [x] สร้าง sp_PhysCount_05_Approve
- [x] สร้าง sp_PhysCount_06_Reject
- [x] ทดสอบ SQL queries ทั้งหมด

### Phase 2: Backend API (NestJS)
- [x] สร้าง physical-count.interface.ts (DTOs)
- [x] สร้าง physical-count.service.ts (6 methods)
- [x] สร้าง physical-count.controller.ts (6 endpoints)
- [x] สร้าง physical-count.module.ts
- [x] ลงทะเบียน PhysicalCountModule ใน app.module.ts
- [x] เพิ่ม Email Notifications (3 types):
  - [x] APPROVAL_PHYSICAL_COUNT
  - [x] PHYSICAL_COUNT_APPROVED
  - [x] PHYSICAL_COUNT_REJECTED
- [x] สร้าง email templates (3 ไฟล์)
- [x] ทดสอบ pnpm build (server)

### Phase 3: Frontend (Vue 3)
- [x] สร้าง physical-count.service.ts (client)
- [x] สร้าง physical-count.interfaces.ts
- [x] สร้าง PhysicalCount.vue page
- [x] เพิ่ม route ใน router/index.ts
- [x] เพิ่ม menu item ใน "ปรับยอด" section
- [x] ทดสอบ pnpm build (client)

### Phase 4: Integration Testing
- [ ] ทดสอบ 6-step flow จากเริ่มต้นจนจบ
- [ ] ทดสอบ reject → recount flow
- [ ] ทดสอบ stock movement ระหว่างรอการอนุมัติ
- [ ] ทดสอบ email notifications
- [ ] ทดสอบ snapshot data เหมาะสม

### Phase 5: Documentation & Deployment
- [ ] เตรียม migration scripts
- [ ] ทดสอบ end-to-end ใน production-like environment
- [ ] เขียน user guide

            UPDATE stock_periods
            SET period_status = 'SNAPSHOT_DONE'
            WHERE period_code = @PeriodCode;

            COMMIT TRANSACTION;

            -- ⬇ ส่งผลลัพธ์เฉพาะเมื่อ @ReturnResult = 1
            IF @ReturnResult = 1
                SELECT 'Success' AS Status,
                       N'สร้าง snapshot เรียบร้อย: ' + @PeriodCode AS Message;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            DECLARE @ErrDo NVARCHAR(4000) = ERROR_MESSAGE();
            IF @ReturnResult = 1
                SELECT 'Error' AS Status, @ErrDo AS Message;
            ELSE
                RAISERROR(@ErrDo, 16, 1);
        END CATCH;
    END;
END;
GO
```

---

## 8. ลำดับการ Deploy ไปยัง SQL Server

> **รันตามลำดับนี้เท่านั้น** เพราะมี FK dependency

```
1. CREATE TABLE physical_count_headers     (หัวข้อ 5)
2. CREATE TABLE physical_count_lines       (หัวข้อ 5)
3. ALTER sp_SyncPhysicalStock              (หัวข้อ 7.1 — เพิ่ม @ReturnResult เพื่อ future use)
4. ALTER sp_Snapshot_02_CreatePeriodStockSnapshot  (หัวข้อ 7.2 — เพิ่ม @ReturnResult + รับ PENDING_APPROVAL)
5. CREATE sp_PhysCount_01_Create           (หัวข้อ 6)
6. CREATE sp_PhysCount_02_SaveLines        (หัวข้อ 6)
7. CREATE sp_PhysCount_03_GetComparison    (หัวข้อ 6)
8. CREATE sp_PhysCount_04_Submit           (หัวข้อ 6)
9. CREATE sp_PhysCount_05_Approve          (หัวข้อ 6 — ใช้ diff_qty โดยตรง ไม่ผ่าน sp_SyncPhysicalStock)
10. CREATE sp_PhysCount_06_Reject          (หัวข้อ 6)
```

---

## 9. API Plan (NestJS)

| Method | Endpoint | SP ที่เรียก | Role |
|--------|----------|------------|------|
| POST | `/physical-count/create` | sp_PhysCount_01_Create | Staff |
| PUT | `/physical-count/:id/lines` | sp_PhysCount_02_SaveLines | Staff |
| GET | `/physical-count/:id/comparison` | sp_PhysCount_03_GetComparison | Staff, GROUP_LEAD |
| PUT | `/physical-count/:id/submit` | sp_PhysCount_04_Submit | Staff |
| PUT | `/physical-count/:id/approve` | sp_PhysCount_05_Approve | GROUP_LEAD |
| PUT | `/physical-count/:id/reject` | sp_PhysCount_06_Reject | GROUP_LEAD |

---

## 10. Checklist การทดสอบ

- [ ] สร้าง period ใหม่ → period_status = `OPEN`
- [ ] sp_PhysCount_01 → สร้าง header + insert lines จาก stock_on_hand → period_status = `COUNTING`
- [ ] sp_PhysCount_02 → อัปเดต qty_counted หลายรายการ
- [ ] sp_PhysCount_03 → ดู comparison ถูกต้อง (diff_qty ถูก)
- [ ] sp_PhysCount_04 → ส่งอนุมัติ → count_status = `SUBMITTED`, period_status = `PENDING_APPROVAL`
- [ ] sp_PhysCount_06_Reject → count_status = `REJECTED`, period_status = `COUNTING`
- [ ] สร้าง count ใหม่หลัง reject → สำเร็จ
- [ ] sp_PhysCount_05_Approve → stock_movements มี ADJUST records (จาก diff_qty, ไม่ใช่ qty_counted สัมบูรณ์)
- [ ] ทดสอบสถานการณ์ที่ stock เปลี่ยนระหว่างนับกับอนุมัติ: stock_on_hand_ปัจจุบัน + diff_qty = ค่าที่ถูกต้อง
- [ ] ทดสอบ sp_Snapshot_03_GetSnapshotByPeriodCode เพื่อดูผล

---

## 11. Email Notifications

ระบบส่ง email อัตโนมัติ 3 กรณีใน Physical Count workflow ผ่าน `EmailService.sendPhysicalCountEmail()`

### 11.1 ตารางสรุป Email Events

| Event | Trigger | ผู้รับ | ENotifyType | Template |
|-------|---------|--------|-------------|----------|
| ส่งขออนุมัติ | `sp_PhysCount_04_Submit` สำเร็จ | GROUP_LEAD (ทุกคนใน role) | `APPROVAL_PHYSICAL_COUNT` | `approval-physical-count.template.html` |
| อนุมัติแล้ว | `sp_PhysCount_05_Approve` สำเร็จ | พนักงานที่ `submitted_by` | `PHYSICAL_COUNT_APPROVED` | `physical-count-approved.template.html` |
| ถูกปฏิเสธ | `sp_PhysCount_06_Reject` สำเร็จ | พนักงานที่ `submitted_by` | `PHYSICAL_COUNT_REJECTED` | `physical-count-rejected.template.html` |

### 11.2 วิธีเรียกใช้ใน NestJS Service

```typescript
// Step 4: ส่งขออนุมัติ → แจ้ง GROUP_LEAD
await this.emailService.sendPhysicalCountEmail({
  notifyType: ENotifyType.APPROVAL_PHYSICAL_COUNT,
  countId: result.CountId,
  periodCode: result.PeriodCode,
  toRoleCode: 'GROUP_LEAD',
  sentByEmployeeId: submittedBy,
});

// Step 6a: อนุมัติ → แจ้งพนักงานผู้ส่ง
await this.emailService.sendPhysicalCountEmail({
  notifyType: ENotifyType.PHYSICAL_COUNT_APPROVED,
  countId: countId,
  periodCode: periodCode,
  toEmployeeId: submittedBy,       // employee ID จาก physical_count_headers.submitted_by
  approvedByName: approverName,
  sentByEmployeeId: approvedBy,
});

// Step 6b: ปฏิเสธ → แจ้งพนักงานผู้ส่ง + เหตุผล
await this.emailService.sendPhysicalCountEmail({
  notifyType: ENotifyType.PHYSICAL_COUNT_REJECTED,
  countId: countId,
  periodCode: periodCode,
  toEmployeeId: submittedBy,       // employee ID จาก physical_count_headers.submitted_by
  rejectedByName: rejecterName,
  rejectedReason: reason,
  sentByEmployeeId: rejectedBy,
});
```

### 11.3 Template Variables

| Template | Variables ที่ใช้ |
|----------|----------------|
| `approval-physical-count` | `{{document_no}}`, `{{period_code}}`, `{{document_title}}`, `{{sent_at}}` |
| `physical-count-approved` | `{{document_no}}`, `{{period_code}}`, `{{approved_by_name}}`, `{{sent_at}}` |
| `physical-count-rejected` | `{{document_no}}`, `{{period_code}}`, `{{rejected_by_name}}`, `{{rejected_reason}}`, `{{sent_at}}` |

### 11.4 Color Scheme ของ Templates

| Template | Header Color | ความหมาย |
|----------|-------------|---------|
| `approval-physical-count` | Teal `#0d9488` | รอดำเนินการ |
| `physical-count-approved` | Green `#16a34a` | สำเร็จ |
| `physical-count-rejected` | Red `#dc2626` | ถูกปฏิเสธ |

### 11.5 ไฟล์ที่เกี่ยวข้อง

```
server/src/email/
  dto/
    send-approval-email.dto.ts      ← ENotifyType enum (3 type ใหม่)
    email-log.interfaces.ts         ← EmailDocumentType, EmailNotifyType
  email.service.ts                  ← sendPhysicalCountEmail(), template mapping
  templates/
    approval-physical-count.template.html
    physical-count-approved.template.html
    physical-count-rejected.template.html
```
