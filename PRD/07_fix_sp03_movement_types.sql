-- ============================================================
-- Migration: Fix sp_PhysCount_03_GetComparison movement types
-- Created: 2026-05-22
-- Problem: received_qty and issued_qty showed 0 because the SP
--          was filtering for wrong movement_type values.
--
-- Actual movement_type values in stock_movements:
--   RECEIVE         = received from PO/GR            → รับเข้า
--   INITIAL_LOAD    = initial stock loaded            → รับเข้า
--   DISPENSE_RETURN = items returned from patient     → รับเข้า (คืนยา)
--   DISPENSE        = dispensed to patient/treatment  → ใช้ออก
--   ADJUST_OUT      = manual stock adjustment down    → ใช้ออก
--
-- Fix: update subquery filters to use the correct types
-- ============================================================

CREATE OR ALTER PROCEDURE [dbo].[sp_PhysCount_03_GetComparison]
    @CountId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- ─── Result set 1: ข้อมูล header ─────────────────────────────
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

    -- ─── Result set 2: รายการเปรียบเทียบ ─────────────────────────
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
        -- Snapshot ปิดจากเดือนก่อนหน้า
        ISNULL(sps_prev.actual_closing, 0) AS snapshot_prev_qty,
        -- รับเข้าช่วง period: RECEIVE + INITIAL_LOAD + DISPENSE_RETURN (คืนยา)
        ISNULL((
            SELECT SUM(sm.qty_base)
            FROM stock_movements sm
            WHERE sm.item_id = pcl.item_id
              AND sm.movement_type IN ('RECEIVE', 'INITIAL_LOAD', 'DISPENSE_RETURN')
              AND CAST(sm.created_at AS DATE) >= sp.period_start
              AND CAST(sm.created_at AS DATE) <= sp.period_end
        ), 0) AS received_qty,
        -- ใช้ออกช่วง period: DISPENSE + ADJUST_OUT
        ISNULL((
            SELECT SUM(sm.qty_base)
            FROM stock_movements sm
            WHERE sm.item_id = pcl.item_id
              AND sm.movement_type IN ('DISPENSE', 'ADJUST_OUT')
              AND CAST(sm.created_at AS DATE) >= sp.period_start
              AND CAST(sm.created_at AS DATE) <= sp.period_end
        ), 0) AS issued_qty
    FROM physical_count_lines pcl
    INNER JOIN items i              ON pcl.item_id = i.item_id
    LEFT  JOIN units u              ON i.usage_unit_id = u.unit_id
    INNER JOIN physical_count_headers pch ON pcl.count_id = pch.count_id
    INNER JOIN stock_periods sp     ON pch.period_code = sp.period_code
    -- หา period ก่อนหน้าที่ใกล้ที่สุด
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
