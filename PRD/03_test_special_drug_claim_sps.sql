-- ============================================================
-- SQL Test Script: Special Drug Claim (sp_SC_01/02/03)
-- ============================================================
-- วัตถุประสงค์:
--   ทดสอบการทำงานของ
--   1) sp_SC_01_Create  (เบิกพิเศษ)
--   2) sp_SC_03_Update  (แก้ไขแบบ compensating movement)
--   3) sp_SC_02_Return  (คืนยา)
--
-- หมายเหตุ:
--   - script นี้ใช้ movement_type เดิมของระบบ: WITHDRAW / RETURN
--   - ref_type = SPECIAL_DRUG_CLAIM
--   - มีทั้งเคสสำเร็จ + expected error
-- ============================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE
    @TestUser NVARCHAR(100) = N'8300',
    @Now DATETIME = GETDATE(),
    @RunTag NVARCHAR(100),
    @UseVisitId BIT = 0,
    @VisitId INT = NULL,
    @ItemId INT,
    @BaseUnitId INT,
    @StockBefore INT,
    @StockAfterCreate INT,
    @StockAfterUpdate INT,
    @StockAfterReturn INT,
    @ClaimId BIGINT,
    @ClaimItemId BIGINT,
    @QtyInitial INT = 10,
    @QtyUpdated INT = 12,
    @QtyReturnOk INT = 4,
    @QtyReturnOver INT,
    @JsonItems NVARCHAR(MAX),
    @JsonAdjustments NVARCHAR(MAX),
    @ReasonCreate NVARCHAR(500),
    @ReasonUpdate NVARCHAR(500),
    @ReasonReturn NVARCHAR(500),
    @ReasonReturnOver NVARCHAR(500),
    @ReasonUpdateAfterReturn NVARCHAR(500);

SET @RunTag = N'SC_TEST_' + REPLACE(REPLACE(REPLACE(CONVERT(NVARCHAR(19), @Now, 120), N'-', N''), N':', N''), N' ', N'_');
SET @ReasonCreate = N'Test Create ' + @RunTag;
SET @ReasonUpdate = N'Test Update ' + @RunTag;
SET @ReasonReturn = N'Test Return ' + @RunTag;
SET @ReasonReturnOver = N'Test Return Over ' + @RunTag;
SET @ReasonUpdateAfterReturn = N'Test Update After Return ' + @RunTag;

PRINT '========== SECTION 1: Pre-check =========='; 

IF OBJECT_ID(N'dbo.special_drug_claims', N'U') IS NULL
BEGIN
    SELECT 'Error' AS Status, 'Table dbo.special_drug_claims not found' AS Message;
    RETURN;
END;

IF OBJECT_ID(N'dbo.special_drug_claim_items', N'U') IS NULL
BEGIN
    SELECT 'Error' AS Status, 'Table dbo.special_drug_claim_items not found' AS Message;
    RETURN;
END;

IF OBJECT_ID(N'dbo.sp_SC_01_Create', N'P') IS NULL
   OR OBJECT_ID(N'dbo.sp_SC_02_Return', N'P') IS NULL
   OR OBJECT_ID(N'dbo.sp_SC_03_Update', N'P') IS NULL
BEGIN
    SELECT 'Error' AS Status, 'Missing one or more SPs: sp_SC_01_Create/sp_SC_02_Return/sp_SC_03_Update' AS Message;
    RETURN;
END;

SELECT TOP (1)
    @ItemId = soh.item_id,
    @StockBefore = soh.qty_base,
    @BaseUnitId = i.usage_unit_id
FROM dbo.stock_on_hand soh
JOIN dbo.items i ON i.item_id = soh.item_id
WHERE i.is_active = 1
  AND soh.qty_base >= @QtyUpdated
ORDER BY soh.qty_base DESC, soh.item_id;

IF @ItemId IS NULL
BEGIN
    SELECT 'Error' AS Status, 'No item with sufficient stock for test' AS Message;
    RETURN;
END;

IF EXISTS (
    SELECT 1
    FROM sys.parameters p
    WHERE p.object_id = OBJECT_ID(N'dbo.sp_SC_01_Create')
      AND p.name = '@VisitId'
)
BEGIN
    SET @UseVisitId = 1;
END;

PRINT 'Test User: ' + ISNULL(@TestUser, '');
PRINT 'UseVisitId: ' + CAST(@UseVisitId AS NVARCHAR(1));
PRINT 'ItemId: ' + CAST(@ItemId AS NVARCHAR(30)) + ' | StockBefore: ' + CAST(@StockBefore AS NVARCHAR(30));
PRINT 'RunTag: ' + @RunTag;

PRINT '========== SECTION 2: Test sp_SC_01_Create =========='; 

SET @JsonItems =
    N'[{"item_id":' + CAST(@ItemId AS NVARCHAR(20)) +
    N',"qty_base":' + CAST(@QtyInitial AS NVARCHAR(20)) +
    N',"base_unit_id":' + COALESCE(CAST(@BaseUnitId AS NVARCHAR(20)), N'null') +
    N'}]';

IF @UseVisitId = 1
BEGIN
    SELECT TOP (1) @VisitId = v.visit_id
    FROM dbo.visits v
    ORDER BY v.visit_id DESC;

    IF @VisitId IS NULL
    BEGIN
        INSERT INTO dbo.visits
        (
            visit_datetime,
            patient_type,
            symptoms,
            created_by
        )
        VALUES
        (
            GETDATE(),
            N'EMPLOYEE',
            N'Auto-created by special claim test',
            @TestUser
        );
        SET @VisitId = SCOPE_IDENTITY();
    END;

    EXEC dbo.sp_SC_01_Create
        @VisitId = @VisitId,
        @ClaimDatetime = @Now,
        @Reason = @ReasonCreate,
        @JsonItems = @JsonItems,
        @CreatedBy = @TestUser;
END;
ELSE
BEGIN
    EXEC dbo.sp_SC_01_Create
        @ClaimDatetime = @Now,
        @Reason = @ReasonCreate,
        @JsonItems = @JsonItems,
        @CreatedBy = @TestUser;
END;

SELECT TOP (1) @ClaimId = sc.claim_id
FROM dbo.special_drug_claims sc
WHERE sc.created_by = @TestUser
  AND sc.reason = @ReasonCreate
ORDER BY sc.claim_id DESC;

IF @ClaimId IS NULL
BEGIN
    SELECT 'Error' AS Status, 'Create failed: claim_id not found' AS Message;
    RETURN;
END;

SELECT @ClaimItemId = sci.claim_item_id
FROM dbo.special_drug_claim_items sci
WHERE sci.claim_id = @ClaimId
  AND sci.item_id = @ItemId;

SELECT @StockAfterCreate = qty_base
FROM dbo.stock_on_hand
WHERE item_id = @ItemId;

SELECT
    'CHECK_CREATE' AS test_checkpoint,
    @ClaimId AS claim_id,
    @ClaimItemId AS claim_item_id,
    @StockBefore AS stock_before,
    @StockAfterCreate AS stock_after_create,
    (@StockBefore - @QtyInitial) AS expected_stock_after_create;

SELECT
    movement_id, movement_type, item_id, qty_base, ref_type, ref_id, created_by, created_at, reason
FROM dbo.stock_movements
WHERE ref_type = 'SPECIAL_DRUG_CLAIM'
  AND ref_id = CAST(@ClaimId AS VARCHAR(50))
ORDER BY movement_id;

PRINT '========== SECTION 3: Test sp_SC_03_Update (increase issued qty) =========='; 

SET @JsonAdjustments =
    N'[{"claim_item_id":' + CAST(@ClaimItemId AS NVARCHAR(30)) +
    N',"new_qty_issued_base":' + CAST(@QtyUpdated AS NVARCHAR(20)) + N'}]';

EXEC dbo.sp_SC_03_Update
    @ClaimId = @ClaimId,
    @ClaimDatetime = @Now,
    @Reason = @ReasonUpdate,
    @JsonAdjustments = @JsonAdjustments,
    @EditedBy = @TestUser;

SELECT @StockAfterUpdate = qty_base
FROM dbo.stock_on_hand
WHERE item_id = @ItemId;

SELECT
    'CHECK_UPDATE' AS test_checkpoint,
    @StockAfterCreate AS stock_before_update,
    @StockAfterUpdate AS stock_after_update,
    (@StockAfterCreate - (@QtyUpdated - @QtyInitial)) AS expected_stock_after_update;

SELECT
    movement_id, movement_type, item_id, qty_base, ref_type, ref_id, created_by, created_at, reason
FROM dbo.stock_movements
WHERE ref_type = 'SPECIAL_DRUG_CLAIM'
  AND ref_id = CAST(@ClaimId AS VARCHAR(50))
ORDER BY movement_id;

PRINT '========== SECTION 4: Test sp_SC_02_Return (valid return) =========='; 

EXEC dbo.sp_SC_02_Return
    @ClaimItemId = @ClaimItemId,
    @QtyReturnBase = @QtyReturnOk,
    @ReturnDatetime = @Now,
    @Reason = @ReasonReturn,
    @CreatedBy = @TestUser;

SELECT @StockAfterReturn = qty_base
FROM dbo.stock_on_hand
WHERE item_id = @ItemId;

SELECT
    'CHECK_RETURN' AS test_checkpoint,
    @StockAfterUpdate AS stock_before_return,
    @StockAfterReturn AS stock_after_return,
    (@StockAfterUpdate + @QtyReturnOk) AS expected_stock_after_return;

SELECT
    movement_id, movement_type, item_id, qty_base, ref_type, ref_id, created_by, created_at, reason
FROM dbo.stock_movements
WHERE ref_type = 'SPECIAL_DRUG_CLAIM'
  AND ref_id = CAST(@ClaimId AS VARCHAR(50))
ORDER BY movement_id;

PRINT '========== SECTION 5: Expected error tests =========='; 

-- 5.1 over-return (ต้อง error)
SET @QtyReturnOver = (@QtyUpdated - @QtyReturnOk) + 1; -- มากกว่ายอดคงเหลือ

PRINT 'Expect error: return over remaining qty = ' + CAST(@QtyReturnOver AS NVARCHAR(30));
EXEC dbo.sp_SC_02_Return
    @ClaimItemId = @ClaimItemId,
    @QtyReturnBase = @QtyReturnOver,
    @ReturnDatetime = @Now,
    @Reason = @ReasonReturnOver,
    @CreatedBy = @TestUser;

-- 5.2 update after return (ต้อง error ตาม lock_after_return=true)
PRINT 'Expect error: update claim after RETURN exists';
EXEC dbo.sp_SC_03_Update
    @ClaimId = @ClaimId,
    @ClaimDatetime = @Now,
    @Reason = @ReasonUpdateAfterReturn,
    @JsonAdjustments = @JsonAdjustments,
    @EditedBy = @TestUser;

PRINT '========== SECTION 6: Final summary =========='; 

IF COL_LENGTH('dbo.special_drug_claims', 'visit_id') IS NOT NULL
BEGIN
    SELECT
        sc.claim_id,
        sc.visit_id,
        sc.claim_datetime,
        sc.reason,
        sc.created_by,
        sc.created_at
    FROM dbo.special_drug_claims sc
    WHERE sc.claim_id = @ClaimId;
END
ELSE
BEGIN
    SELECT
        sc.claim_id,
        sc.claim_datetime,
        sc.reason,
        sc.created_by,
        sc.created_at
    FROM dbo.special_drug_claims sc
    WHERE sc.claim_id = @ClaimId;
END;

SELECT
    sci.claim_item_id,
    sci.claim_id,
    sci.item_id,
    sci.qty_issued_base,
    sci.base_unit_id,
    sci.created_at
FROM dbo.special_drug_claim_items sci
WHERE sci.claim_id = @ClaimId
ORDER BY sci.claim_item_id;

SELECT
    sm.movement_type,
    sm.item_id,
    SUM(sm.qty_base) AS qty_sum
FROM dbo.stock_movements sm
WHERE sm.ref_type = 'SPECIAL_DRUG_CLAIM'
  AND sm.ref_id = CAST(@ClaimId AS VARCHAR(50))
GROUP BY sm.movement_type, sm.item_id
ORDER BY sm.item_id, sm.movement_type;

PRINT '✅ Test script completed.';
