-- ============================================================
-- Physical Count - ALTER Existing Procedures
-- ============================================================
-- Note: Must run AFTER creating new tables and before creating new SPs
--
-- Changes:
-- 1. sp_SyncPhysicalStock: Add @ReturnResult parameter (suppress output when called from other SPs)
-- 2. sp_Snapshot_02_CreatePeriodStockSnapshot: Add @ReturnResult parameter + allow PENDING_APPROVAL status

SET NOCOUNT ON;
GO

-- ============================================================
-- 7.1 ALTER sp_SyncPhysicalStock
-- ============================================================
-- Add @ReturnResult parameter to conditionally suppress output
-- when called from sp_PhysCount_05_Approve
--
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

        -- ⬇ Conditional: ส่งผลลัพธ์เฉพาะเมื่อ @ReturnResult = 1
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

-- ============================================================
-- 7.2 ALTER sp_Snapshot_02_CreatePeriodStockSnapshot
-- ============================================================
-- Changes:
-- 1. Add @ReturnResult BIT = 1 parameter
-- 2. Allow 'PENDING_APPROVAL' in valid period status
-- 3. Wrap result SELECT with IF @ReturnResult = 1
--
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

        -- ⬇ Update: รับ PENDING_APPROVAL ด้วย (สถานะจาก sp_PhysCount_04_Submit)
        IF @PeriodStatus NOT IN ('OPEN', 'SNAPSHOT_DONE', 'PENDING_APPROVAL', 'COUNTING')
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

            UPDATE stock_periods
            SET period_status = 'SNAPSHOT_DONE'
            WHERE period_code = @PeriodCode;

            COMMIT TRANSACTION;

            -- ⬇ Conditional: ส่งผลลัพธ์เฉพาะเมื่อ @ReturnResult = 1
            IF @ReturnResult = 1
                SELECT 'Success' AS Status,
                       N'Snapshot created successfully: ' + @PeriodCode AS Message;

        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
            IF @ReturnResult = 1
                SELECT 'Error' AS Status, @ErrMsg AS Message;
            ELSE
                RAISERROR(@ErrMsg, 16, 1);
        END CATCH;
    END;
END;
GO

PRINT '✅ All ALTER procedures completed successfully!';
