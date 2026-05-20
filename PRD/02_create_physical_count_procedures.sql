-- ============================================================
-- Physical Count Stored Procedures - Complete Deployment
-- ============================================================

SET NOCOUNT ON;
GO

-- ============================================================
-- sp_PhysCount_01_Create — สร้าง session นับ stock
-- ============================================================
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

-- ============================================================
-- sp_PhysCount_02_SaveLines — บันทึก/แก้ไขยอดนับ
-- ============================================================
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

-- ============================================================
-- sp_PhysCount_03_GetComparison — ดูรายงานเปรียบเทียบ
-- ============================================================
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

    -- Result set 2: รายการเปรียบเทียบ
    SELECT
        pcl.line_id,
        pcl.item_id,
        i.item_code,
        i.item_name_th,
        u.unit_name_th,
        pcl.qty_system,
        pcl.qty_counted,
        pcl.diff_qty,
        CASE
            WHEN pcl.diff_qty > 0 THEN N'เกิน'
            WHEN pcl.diff_qty < 0 THEN N'ขาด'
            ELSE N'ตรง'
        END AS diff_status,
        pcl.note
    FROM physical_count_lines pcl
    INNER JOIN items i ON pcl.item_id = i.item_id
    LEFT JOIN units u ON i.usage_unit_id = u.unit_id
    WHERE pcl.count_id = @CountId
    ORDER BY i.item_code;
END;
GO

-- ============================================================
-- sp_PhysCount_04_Submit — ส่งขออนุมัติ GROUP_LEAD
-- ============================================================
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

-- ============================================================
-- sp_PhysCount_05_Approve — GROUP_LEAD อนุมัติ + ทำ snapshot จริง
-- ============================================================
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

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 3. Insert ADJUST movements จาก diff_qty ที่แช่แข็งไว้ตอนนับ
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

        COMMIT TRANSACTION;

        SELECT 1 AS Status,
               N'อนุมัติและสร้าง snapshot สำเร็จ' AS Message,
               @PeriodCode AS PeriodCode,
               @CountId AS CountId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO

-- ============================================================
-- sp_PhysCount_06_Reject — GROUP_LEAD ปฏิเสธ
-- ============================================================
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

PRINT '✅ All Physical Count Procedures created successfully!';
