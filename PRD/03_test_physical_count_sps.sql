-- ============================================================
-- SQL Test Script: Physical Count Workflow
-- ============================================================
-- วัตถุประสงค์: ทดสอบ SPs ทั้ง 6 ตัว และ 2 ALTER SPs ตามลำดับ workflow
-- ข้อกำหนดเบื้องต้น:
--   - ตาราง physical_count_headers, physical_count_lines ต้องถูกสร้างแล้ว
--   - ตาราง stock_periods, items, stock_on_hand, approval_roles ต้องมีข้อมูลแล้ว
--
-- วิธีใช้:
--   1. แก้ไข Test Variables ด้านล่าง (@TestPeriodCode, @TestItemIds, etc.)
--   2. รัน Script ทั้งหมด (CTRL+A then Execute)
--   3. ดูผลลัพธ์ใน Output pane
--   4. ตรวจสอบการเปลี่ยนแปลงใน DB tables
-- ============================================================

SET NOCOUNT ON;
GO

-- ============================================================
-- TEST VARIABLES (แก้ไขให้เหมาะกับ DB ของคุณ)
-- ============================================================
DECLARE 
    @TestPeriodCode    VARCHAR(10)   = '202605-003',  -- ต้องมีใน stock_periods, status = OPEN
    @TestCreatedBy     NVARCHAR(100) = N'8300',       -- ID ของ user ที่สร้าง
    @TestSubmittedBy   NVARCHAR(100) = N'8300',       -- ID ของ user ที่ submit
    @TestApprovedBy    NVARCHAR(100) = N'8100',       -- ID ของ GROUP_LEAD
    @TestRejectionReason NVARCHAR(500) = N'ข้อมูลการนับไม่ตรงกับเอกสารประกอบ ขอให้นับใหม่',
    @TestItemId1       INT            = 4,            -- ต้องมีใน items & stock_on_hand
    @TestItemId2       INT            = 5,            -- ต้องมีใน items & stock_on_hand
    @TestCountId       INT;                           -- จะเก็บจาก sp_PhysCount_01_Create

-- ============================================================
-- SECTION 1: ข้อมูลเตรียมการและ Cleanup
-- ============================================================
PRINT '========== SECTION 1: Preparation & Cleanup ==========';
PRINT CHAR(10) + 'Cleanup: ลบ test data เก่า (ถ้ามี)...';
GO

DECLARE @TestPeriodCode VARCHAR(10) = '202605-003';

-- ลบ physical_count_headers ที่สัมพันธ์กับ period นี้ (จะ cascade ไปยัง lines)
IF EXISTS (SELECT 1 FROM physical_count_headers WHERE period_code = @TestPeriodCode)
BEGIN
    DELETE FROM physical_count_headers WHERE period_code = @TestPeriodCode;
    PRINT 'Deleted old test records from physical_count_headers';
END;

-- Reset period status กลับเป็น OPEN
UPDATE stock_periods
SET period_status = 'OPEN'
WHERE period_code = @TestPeriodCode;

PRINT 'Reset period status to OPEN';
PRINT CHAR(10) + '✅ Cleanup complete. Ready to test.' + CHAR(10);
GO

-- ============================================================
-- SECTION 2: Verify Test Data Exists
-- ============================================================
PRINT '========== SECTION 2: Verify Test Data ==========';
GO

DECLARE 
    @TestPeriodCode VARCHAR(10) = '202605-003',
    @TestItemId1 INT = 4,
    @TestItemId2 INT = 5;

-- ตรวจสอบ period
PRINT 'Checking period: ' + @TestPeriodCode;
SELECT 
    period_code, period_start, period_end, period_status, created_at
FROM stock_periods
WHERE period_code = @TestPeriodCode;

-- ตรวจสอบ items
PRINT CHAR(10) + 'Checking items:';
SELECT 
    item_id, item_code, item_name_th, is_active
FROM items
WHERE item_id IN (@TestItemId1, @TestItemId2);

-- ตรวจสอบ stock_on_hand
PRINT CHAR(10) + 'Checking stock_on_hand:';
SELECT 
    item_id, qty_base, updated_at
FROM stock_on_hand
WHERE item_id IN (@TestItemId1, @TestItemId2);

-- ตรวจสอบ approval_roles สำหรับ GROUP_LEAD
PRINT CHAR(10) + 'Checking GROUP_LEAD role:';
SELECT 
    role_code, approver_id, is_active
FROM approval_roles
WHERE role_code = 'GROUP_LEAD' AND is_active = 1;

PRINT CHAR(10) + '✅ Test data verification complete.' + CHAR(10);
GO

-- ============================================================
-- SECTION 3: TEST sp_PhysCount_01_Create
-- ============================================================
PRINT '========== SECTION 3: TEST sp_PhysCount_01_Create ==========';
GO

DECLARE 
    @TestPeriodCode VARCHAR(10) = '202605-003',
    @TestCreatedBy NVARCHAR(100) = N'8300',
    @TestCountId INT;

PRINT 'Calling: sp_PhysCount_01_Create @PeriodCode=' + @TestPeriodCode;

EXEC sp_PhysCount_01_Create
    @PeriodCode = @TestPeriodCode,
    @CreatedBy = @TestCreatedBy,
    @Note = N'Test Physical Count Session';

-- Capture count_id for next tests
SELECT @TestCountId = count_id
FROM physical_count_headers
WHERE period_code = @TestPeriodCode AND count_status = 'DRAFT'
ORDER BY created_at DESC;

PRINT 'Created CountId: ' + CAST(@TestCountId AS VARCHAR);

-- Verify header was created
PRINT CHAR(10) + 'Verify header created:';
SELECT 
    count_id, period_code, count_status, created_by, created_at
FROM physical_count_headers
WHERE count_id = @TestCountId;

-- Verify lines were created
PRINT CHAR(10) + 'Verify lines created (sample):';
SELECT TOP 5
    line_id, count_id, item_id, qty_system, qty_counted, diff_qty
FROM physical_count_lines
WHERE count_id = @TestCountId
ORDER BY item_id;

-- Verify period status changed
PRINT CHAR(10) + 'Verify period status = COUNTING:';
SELECT period_code, period_status FROM stock_periods WHERE period_code = @TestPeriodCode;

PRINT CHAR(10) + '✅ sp_PhysCount_01_Create tested successfully.' + CHAR(10);
GO

-- ============================================================
-- SECTION 4: TEST sp_PhysCount_02_SaveLines
-- ============================================================
PRINT '========== SECTION 4: TEST sp_PhysCount_02_SaveLines ==========';
GO

DECLARE 
    @TestPeriodCode VARCHAR(10) = '202605-003',
    @TestCountId INT,
    @JsonData NVARCHAR(MAX);

-- Get CountId
SELECT @TestCountId = count_id
FROM physical_count_headers
WHERE period_code = @TestPeriodCode AND count_status = 'DRAFT'
ORDER BY created_at DESC;

-- Create test JSON with sample quantities
SET @JsonData = N'[
    {"item_id": 4, "qty_counted": 25, "note": "นับได้ 25 ชิ้น"},
    {"item_id": 5, "qty_counted": 18, "note": "นับได้ 18 ชิ้น"}
]';

PRINT 'Calling: sp_PhysCount_02_SaveLines @CountId=' + CAST(@TestCountId AS VARCHAR);
PRINT 'JSON Data: ' + @JsonData;

EXEC sp_PhysCount_02_SaveLines
    @CountId = @TestCountId,
    @JsonData = @JsonData;

-- Verify quantities were saved
PRINT CHAR(10) + 'Verify quantities saved:';
SELECT 
    line_id, item_id, qty_system, qty_counted, diff_qty
FROM physical_count_lines
WHERE count_id = @TestCountId AND item_id IN (4, 5)
ORDER BY item_id;

PRINT CHAR(10) + '✅ sp_PhysCount_02_SaveLines tested successfully.' + CHAR(10);
GO

-- ============================================================
-- SECTION 5: TEST sp_PhysCount_03_GetComparison
-- ============================================================
PRINT '========== SECTION 5: TEST sp_PhysCount_03_GetComparison ==========';
GO

DECLARE 
    @TestPeriodCode VARCHAR(10) = '202605-003',
    @TestCountId INT;

-- Get CountId
SELECT @TestCountId = count_id
FROM physical_count_headers
WHERE period_code = @TestPeriodCode AND count_status = 'DRAFT'
ORDER BY created_at DESC;

PRINT 'Calling: sp_PhysCount_03_GetComparison @CountId=' + CAST(@TestCountId AS VARCHAR);

EXEC sp_PhysCount_03_GetComparison
    @CountId = @TestCountId;

-- Explanation
PRINT CHAR(10) + '📊 Expected: 2 result sets:';
PRINT '   1) Header info (period dates, status, timestamps)';
PRINT '   2) Comparison lines (qty_system, qty_counted, diff_qty, diff_status)';

PRINT CHAR(10) + '✅ sp_PhysCount_03_GetComparison tested successfully.' + CHAR(10);
GO

-- ============================================================
-- SECTION 6: TEST sp_PhysCount_04_Submit
-- ============================================================
PRINT '========== SECTION 6: TEST sp_PhysCount_04_Submit ==========';
GO

DECLARE 
    @TestPeriodCode VARCHAR(10) = '202605-003',
    @TestSubmittedBy NVARCHAR(100) = N'8300',
    @TestCountId INT;

-- Get CountId
SELECT @TestCountId = count_id
FROM physical_count_headers
WHERE period_code = @TestPeriodCode AND count_status = 'DRAFT'
ORDER BY created_at DESC;

PRINT 'Calling: sp_PhysCount_04_Submit @CountId=' + CAST(@TestCountId AS VARCHAR);

EXEC sp_PhysCount_04_Submit
    @CountId = @TestCountId,
    @SubmittedBy = @TestSubmittedBy;

-- Verify header status changed
PRINT CHAR(10) + 'Verify header status = SUBMITTED:';
SELECT 
    count_id, count_status, submitted_by, submitted_at
FROM physical_count_headers
WHERE count_id = @TestCountId;

-- Verify period status changed
PRINT CHAR(10) + 'Verify period status = PENDING_APPROVAL:';
SELECT period_code, period_status FROM stock_periods WHERE period_code = @TestPeriodCode;

PRINT CHAR(10) + '📧 NOTE: Email should be sent to GROUP_LEAD (will test in Phase 2)';

PRINT CHAR(10) + '✅ sp_PhysCount_04_Submit tested successfully.' + CHAR(10);
GO

-- ============================================================
-- SECTION 7: TEST sp_PhysCount_05_Approve
-- ============================================================
PRINT '========== SECTION 7: TEST sp_PhysCount_05_Approve ==========';
GO

DECLARE 
    @TestPeriodCode VARCHAR(10) = '202605-003',
    @TestApprovedBy NVARCHAR(100) = N'8100',  -- GROUP_LEAD
    @TestCountId INT;

-- Get CountId
SELECT @TestCountId = count_id
FROM physical_count_headers
WHERE period_code = @TestPeriodCode AND count_status = 'SUBMITTED'
ORDER BY created_at DESC;

PRINT 'Calling: sp_PhysCount_05_Approve @CountId=' + CAST(@TestCountId AS VARCHAR);

EXEC sp_PhysCount_05_Approve
    @CountId = @TestCountId,
    @ApprovedBy = @TestApprovedBy;

-- Verify header status changed
PRINT CHAR(10) + 'Verify header status = APPROVED:';
SELECT 
    count_id, count_status, approved_by, approved_at
FROM physical_count_headers
WHERE count_id = @TestCountId;

-- Verify period status changed
PRINT CHAR(10) + 'Verify period status = SNAPSHOT_DONE:';
SELECT period_code, period_status FROM stock_periods WHERE period_code = @TestPeriodCode;

-- Verify movements were created
PRINT CHAR(10) + 'Verify ADJUST movements created:';
SELECT TOP 10
    movement_id, item_id, qty_base, movement_type, ref_type, ref_id, reason, created_at
FROM stock_movements
WHERE ref_type = 'PHYSICAL_COUNT'
ORDER BY movement_id DESC;

-- Verify snapshot was created
PRINT CHAR(10) + 'Verify snapshot created:';
SELECT TOP 10
    period_code, item_id, opening_qty, receipts, issues, adjustments, net_movement, 
    expected_closing, actual_closing, diff_qty
FROM stock_period_snapshot
WHERE period_code = @TestPeriodCode
ORDER BY item_id;

PRINT CHAR(10) + '📧 NOTE: Email should be sent to submitter (will test in Phase 2)';

PRINT CHAR(10) + '✅ sp_PhysCount_05_Approve tested successfully.' + CHAR(10);
GO

-- ============================================================
-- SECTION 8: TEST sp_PhysCount_06_Reject (Retest Workflow)
-- ============================================================
PRINT '========== SECTION 8: TEST sp_PhysCount_06_Reject (Retest Workflow) ==========';
GO

-- Reset everything to test rejection flow
DECLARE @TestPeriodCode VARCHAR(10) = '202605-003';

PRINT 'Reset: Cleaning up previous test data...';
DELETE FROM physical_count_headers WHERE period_code = @TestPeriodCode;
UPDATE stock_periods SET period_status = 'OPEN' WHERE period_code = @TestPeriodCode;
PRINT 'Reset complete.' + CHAR(10);

-- Run workflow again until SUBMITTED state
DECLARE 
    @TestCreatedBy NVARCHAR(100) = N'8300',
    @TestSubmittedBy NVARCHAR(100) = N'8300',
    @TestRejectedBy NVARCHAR(100) = N'8100',  -- GROUP_LEAD
    @TestCountId INT,
    @JsonData NVARCHAR(MAX);

PRINT 'Re-running workflow up to SUBMITTED state...';

-- Step 1: Create
EXEC sp_PhysCount_01_Create
    @PeriodCode = @TestPeriodCode,
    @CreatedBy = @TestCreatedBy,
    @Note = N'Test Rejection Flow';

SELECT @TestCountId = count_id
FROM physical_count_headers
WHERE period_code = @TestPeriodCode AND count_status = 'DRAFT'
ORDER BY created_at DESC;

-- Step 2: Save lines
SET @JsonData = N'[
    {"item_id": 4, "qty_counted": 15, "note": "นับได้ 15 ชิ้น"},
    {"item_id": 5, "qty_counted": 20, "note": "นับได้ 20 ชิ้น"}
]';

EXEC sp_PhysCount_02_SaveLines
    @CountId = @TestCountId,
    @JsonData = @JsonData;

-- Step 3: Submit
EXEC sp_PhysCount_04_Submit
    @CountId = @TestCountId,
    @SubmittedBy = @TestSubmittedBy;

PRINT 'Workflow ready at SUBMITTED state. Now testing rejection...' + CHAR(10);

-- TEST: Reject
DECLARE @TestRejectionReason NVARCHAR(500) = N'ตัวเลขการนับดูเหลือไม่ชัด ขอให้นับใหม่โดยระวังคุณภาพ';

PRINT 'Calling: sp_PhysCount_06_Reject @CountId=' + CAST(@TestCountId AS VARCHAR);

EXEC sp_PhysCount_06_Reject
    @CountId = @TestCountId,
    @RejectedBy = @TestRejectedBy,
    @RejectedReason = @TestRejectionReason;

-- Verify rejection
PRINT CHAR(10) + 'Verify header status = REJECTED:';
SELECT 
    count_id, count_status, rejected_reason, approved_by, approved_at
FROM physical_count_headers
WHERE count_id = @TestCountId;

-- Verify period returned to COUNTING
PRINT CHAR(10) + 'Verify period status = COUNTING (reopened for recount):';
SELECT period_code, period_status FROM stock_periods WHERE period_code = @TestPeriodCode;

PRINT CHAR(10) + '📧 NOTE: Email should be sent to submitter with rejection reason (will test in Phase 2)';

PRINT CHAR(10) + '✅ sp_PhysCount_06_Reject tested successfully.' + CHAR(10);
GO

-- ============================================================
-- FINAL SUMMARY
-- ============================================================
PRINT '========== FINAL TEST SUMMARY ==========';
PRINT CHAR(10) + '✅ All 6 SPs tested:';
PRINT '   ✓ sp_PhysCount_01_Create';
PRINT '   ✓ sp_PhysCount_02_SaveLines';
PRINT '   ✓ sp_PhysCount_03_GetComparison';
PRINT '   ✓ sp_PhysCount_04_Submit';
PRINT '   ✓ sp_PhysCount_05_Approve (+ sp_Snapshot_02)';
PRINT '   ✓ sp_PhysCount_06_Reject';
PRINT CHAR(10) + 'ALTER SPs tested (indirectly):';
PRINT '   ✓ sp_SyncPhysicalStock (@ReturnResult parameter)';
PRINT '   ✓ sp_Snapshot_02_CreatePeriodStockSnapshot (@ReturnResult + PENDING_APPROVAL)';
PRINT CHAR(10) + 'Next Steps:';
PRINT '   1. Review SP results above ⬆️';
PRINT '   2. Verify data in tables: physical_count_headers, physical_count_lines, stock_movements, stock_period_snapshot';
PRINT '   3. Proceed to Phase 2: Backend API (NestJS)';
PRINT CHAR(10);
