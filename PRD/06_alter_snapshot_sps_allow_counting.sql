-- ============================================================
-- Migration: Allow COUNTING status for period Edit and Delete
-- Created: 2026-05-22
-- Purpose: sp_Snapshot_04_editPeriodEnd and sp_Snapshot_05_deletePeriod
--          previously only allowed OPEN status.
--          Now also allow COUNTING so staff can edit/delete
--          periods that have an active or rejected count in progress.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- ALTER sp_Snapshot_04_editPeriodEnd
-- Allow period_status IN ('OPEN', 'COUNTING')
-- ──────────────────────────────────────────────────────────────
ALTER PROCEDURE [dbo].[sp_Snapshot_04_editPeriodEnd]
    @PeriodCode   NVARCHAR(20),
    @NewPeriodEnd DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate period exists
    IF NOT EXISTS (SELECT 1 FROM stock_periods WHERE period_code = @PeriodCode)
    BEGIN
        SELECT 'Error' AS Status, N'ไม่พบ Period นี้ในระบบ' AS Message;
        RETURN;
    END

    -- Validate status (OPEN or COUNTING allowed)
    DECLARE @CurrentStatus NVARCHAR(30);
    SELECT @CurrentStatus = period_status FROM stock_periods WHERE period_code = @PeriodCode;

    IF @CurrentStatus NOT IN ('OPEN', 'COUNTING')
    BEGIN
        SELECT 'Error' AS Status,
               N'ไม่สามารถแก้ไขวันสิ้นสุดได้ เนื่องจากสถานะ Period เป็น ' + @CurrentStatus AS Message;
        RETURN;
    END

    -- Validate new period end is after period start
    DECLARE @PeriodStart DATE;
    SELECT @PeriodStart = period_start FROM stock_periods WHERE period_code = @PeriodCode;

    IF @NewPeriodEnd <= @PeriodStart
    BEGIN
        SELECT 'Error' AS Status, N'วันที่สิ้นสุดต้องมากกว่าวันเริ่มต้น Period' AS Message;
        RETURN;
    END

    -- Update period end
    UPDATE stock_periods
    SET period_end = @NewPeriodEnd
    WHERE period_code = @PeriodCode;

    SELECT 'Success' AS Status, N'แก้ไขวันสิ้นสุด Period เรียบร้อยแล้ว' AS Message;

    -- Return updated period record
    SELECT
        period_code, period_start, period_end,
        period_status, created_by, created_at
    FROM stock_periods
    WHERE period_code = @PeriodCode;
END
GO

-- ──────────────────────────────────────────────────────────────
-- ALTER sp_Snapshot_05_deletePeriod
-- Allow period_status IN ('OPEN', 'COUNTING')
-- Cascade deletes physical_count_headers/lines when COUNTING
-- ──────────────────────────────────────────────────────────────
ALTER PROCEDURE [dbo].[sp_Snapshot_05_deletePeriod]
    @PeriodCode NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate period exists
    IF NOT EXISTS (SELECT 1 FROM stock_periods WHERE period_code = @PeriodCode)
    BEGIN
        SELECT 'Error' AS Status, N'ไม่พบ Period นี้ในระบบ' AS Message;
        RETURN;
    END

    -- Validate status (OPEN or COUNTING allowed)
    DECLARE @CurrentStatus NVARCHAR(30);
    SELECT @CurrentStatus = period_status FROM stock_periods WHERE period_code = @PeriodCode;

    IF @CurrentStatus NOT IN ('OPEN', 'COUNTING')
    BEGIN
        SELECT 'Error' AS Status,
               N'ไม่สามารถลบ Period ได้ เนื่องจากสถานะ Period เป็น ' + @CurrentStatus AS Message;
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        -- If COUNTING: delete count lines then count headers first (cascading)
        IF @CurrentStatus = 'COUNTING'
        BEGIN
            DELETE pcl
            FROM physical_count_lines pcl
            INNER JOIN physical_count_headers pch ON pcl.count_id = pch.count_id
            WHERE pch.period_code = @PeriodCode;

            DELETE FROM physical_count_headers
            WHERE period_code = @PeriodCode;
        END

        -- Delete the period
        DELETE FROM stock_periods WHERE period_code = @PeriodCode;

        COMMIT TRANSACTION;
        SELECT 'Success' AS Status, N'ลบ Period เรียบร้อยแล้ว' AS Message;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH
END
GO
