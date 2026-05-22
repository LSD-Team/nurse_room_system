-- ============================================================
-- Migration: stock_count_apv bullet (ไม่ต้องรัน — handled in code)
-- Created: 2026-05-22
-- NOTE: bullet.service.ts now queries physical_count_headers directly
--       via Promise.all alongside view_bullet_list.
--       No SQL change needed for this feature.
-- ============================================================
-- (no-op: kept for documentation purposes only)


-- First, check the current view definition (for reference):
-- SELECT OBJECT_DEFINITION(OBJECT_ID('view_bullet_list'));

CREATE OR ALTER VIEW [dbo].[view_bullet_list]
AS
-- สั่งซื้อ: PO ที่ยังอยู่ในสถานะ DRAFT หรือ PENDING
SELECT 'po' AS [list], COUNT(*) AS [count]
FROM purchase_order_headers
WHERE po_status IN ('DRAFT', 'PENDING')

UNION ALL

-- รับเข้า: GR ที่ยังอยู่ในสถานะ DRAFT
SELECT 'rec' AS [list], COUNT(*) AS [count]
FROM goods_receipt_headers
WHERE gr_status = 'DRAFT'

UNION ALL

-- ยืม: borrow ที่ยังอยู่ในสถานะ PENDING
SELECT 'borrow' AS [list], COUNT(*) AS [count]
FROM borrow_headers
WHERE borrow_status = 'PENDING'

UNION ALL

-- อนุมัติการสั่งซื้อยา: PO ที่รอ GROUP_LEAD อนุมัติ
SELECT 'apv' AS [list], COUNT(*) AS [count]
FROM purchase_order_headers
WHERE po_status = 'PENDING_APPROVAL'

UNION ALL

-- รวม จัดซื้อ & ยืม (all)
SELECT 'all' AS [list], COUNT(*) AS [count]
FROM (
    SELECT po_id FROM purchase_order_headers WHERE po_status IN ('DRAFT', 'PENDING')
    UNION ALL
    SELECT gr_id  FROM goods_receipt_headers  WHERE gr_status = 'DRAFT'
    UNION ALL
    SELECT borrow_id FROM borrow_headers       WHERE borrow_status = 'PENDING'
) AS combined

UNION ALL

-- อนุมัติการนับ Stock: physical count ที่ส่งรออนุมัติ (SUBMITTED)
SELECT 'stock_count_apv' AS [list], COUNT(*) AS [count]
FROM physical_count_headers
WHERE count_status = 'SUBMITTED';
GO
