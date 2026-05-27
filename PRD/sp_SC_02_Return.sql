CREATE OR ALTER PROCEDURE [dbo].[sp_SC_02_Return]
    @ClaimItemId     BIGINT,
    @QtyReturnBase   INT,
    @ReturnDatetime  DATETIME       = NULL,
    @Reason          NVARCHAR(500)  = NULL,
    @CreatedBy       NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @ReturnDatetime IS NULL SET @ReturnDatetime = GETDATE();
    SET @Reason = NULLIF(LTRIM(RTRIM(@Reason)), '');
    SET @CreatedBy = NULLIF(LTRIM(RTRIM(@CreatedBy)), '');

    IF @ClaimItemId IS NULL OR @ClaimItemId <= 0
    BEGIN
        SELECT 'Error' AS Status, N'กรุณาระบุ @ClaimItemId ให้ถูกต้อง' AS Message;
        RETURN;
    END;

    IF @QtyReturnBase IS NULL OR @QtyReturnBase <= 0
    BEGIN
        SELECT 'Error' AS Status, N'กรุณาระบุ @QtyReturnBase มากกว่า 0' AS Message;
        RETURN;
    END;

    IF @CreatedBy IS NULL
    BEGIN
        SELECT 'Error' AS Status, N'กรุณาระบุ @CreatedBy' AS Message;
        RETURN;
    END;

    DECLARE
        @ClaimId BIGINT,
        @ItemId INT,
        @RefId VARCHAR(50),
        @TotalWithdraw INT,
        @TotalReturn INT,
        @Remaining INT;

    BEGIN TRY
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN TRANSACTION;

        SELECT
            @ClaimId = sci.claim_id,
            @ItemId = sci.item_id
        FROM dbo.special_drug_claim_items sci WITH (UPDLOCK, HOLDLOCK)
        WHERE sci.claim_item_id = @ClaimItemId;

        IF @ClaimId IS NULL
        BEGIN
            THROW 52001, N'ไม่พบ claim_item ตามที่ระบุ', 1;
        END;

        -- Check if claim is closed
        IF EXISTS (
            SELECT 1 
            FROM dbo.special_drug_claims 
            WHERE claim_id = @ClaimId AND [status] = 'CLOSED'
        )
        BEGIN
            THROW 52004, N'รายการเบิกยาพิเศษนี้ถูกปิด (CLOSED) แล้ว ไม่สามารถคืนยาได้', 1;
        END;

        SET @RefId = CAST(@ClaimId AS VARCHAR(50));

        SELECT
            @TotalWithdraw = ISNULL(SUM(CASE WHEN sm.movement_type = 'WITHDRAW' THEN sm.qty_base ELSE 0 END), 0),
            @TotalReturn   = ISNULL(SUM(CASE WHEN sm.movement_type = 'RETURN' THEN sm.qty_base ELSE 0 END), 0)
        FROM dbo.stock_movements sm WITH (UPDLOCK, HOLDLOCK)
        WHERE sm.ref_type = 'SPECIAL_DRUG_CLAIM'
          AND sm.ref_id = @RefId
          AND sm.item_id = @ItemId
          AND sm.movement_type IN ('WITHDRAW', 'RETURN');

        SET @Remaining = @TotalWithdraw - @TotalReturn;

        IF @Remaining <= 0
        BEGIN
            THROW 52002, N'รายการนี้ไม่มียอดคงเหลือให้คืนแล้ว', 1;
        END;

        IF @QtyReturnBase > @Remaining
        BEGIN
            THROW 52003, N'จำนวนคืนเกินยอดคงเหลือของรายการเบิก', 1;
        END;

        INSERT INTO dbo.stock_movements
        (
            movement_type,
            item_id,
            qty_base,
            ref_type,
            ref_id,
            created_by,
            created_at,
            reason
        )
        VALUES
        (
            'RETURN',
            @ItemId,
            @QtyReturnBase,
            'SPECIAL_DRUG_CLAIM',
            @RefId,
            @CreatedBy,
            @ReturnDatetime,
            @Reason
        );

        MERGE dbo.stock_on_hand AS target
        USING (SELECT @ItemId AS item_id, @QtyReturnBase AS qty_add) AS source
            ON target.item_id = source.item_id
        WHEN MATCHED THEN
            UPDATE SET
                qty_base = target.qty_base + source.qty_add,
                updated_at = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (item_id, qty_base, updated_at)
            VALUES (source.item_id, source.qty_add, GETDATE());

        COMMIT TRANSACTION;

        SELECT
            'Success' AS Status,
            N'คืนยาสำเร็จ' AS Message,
            @ClaimId AS claim_id,
            @ClaimItemId AS claim_item_id,
            @ItemId AS item_id,
            @QtyReturnBase AS qty_returned_base,
            (@Remaining - @QtyReturnBase) AS qty_remaining_base;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

        SELECT
            'Error' AS Status,
            ERROR_MESSAGE() AS Message,
            ERROR_NUMBER() AS ErrorNumber,
            ERROR_LINE() AS ErrorLine;
    END CATCH;
END;
GO
