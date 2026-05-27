-- Create view for Stock Monthly Report
-- Based on PRD\report-stock-monthly.md

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_report_stock_monthly')
    DROP VIEW vw_report_stock_monthly;
GO

CREATE VIEW vw_report_stock_monthly AS
SELECT
    s.snapshot_id,
    s.period_code,

    -- Item information
    i.item_id,
    i.item_code,
    i.item_name_th,
    i.item_name_en,

    -- Stock movement
    s.opening_qty,
    s.receipts,
    s.issues,
    s.adjustments,
    s.net_movement,

    -- Closing balance
    s.expected_closing,
    s.actual_closing,
    s.diff_qty,

    -- Report status
    CASE
        WHEN s.diff_qty = 0 THEN 'OK'
        ELSE 'MISMATCH'
    END AS status,

    s.created_at,
    s.created_by
FROM stock_period_snapshot s
INNER JOIN items i
    ON s.item_id = i.item_id
WHERE i.is_active = 1;
GO
