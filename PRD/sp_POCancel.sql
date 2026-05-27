ALTER PROCEDURE sp_POCancel
    @PoId        NVARCHAR(20),
    @CancelledBy NVARCHAR(100),
    @Reason      NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @PoId   = NULLIF(LTRIM(RTRIM(@PoId)), '');
    SET @Reason = NULLIF(LTRIM(RTRIM(@Reason)), '');

    IF @PoId IS NULL OR TRY_CAST(@PoId AS INT) IS NULL
    BEGIN
        SELECT 'Error' AS Status, N'กรุณาระบุ @PoId ที่ถูกต้อง' AS Message;
        RETURN;
    END;

    DECLARE @PoIdInt INT = CAST(@PoId AS INT);

    DECLARE
        @Status VARCHAR(30),
        @PoNo   VARCHAR(20);

    SELECT
        @Status = status,
        @PoNo   = po_no
    FROM po_headers
    WHERE po_id = @PoIdInt;

    IF @Status IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               N'ไม่พบ po_id = ' + @PoId AS Message;
        RETURN;
    END;

    IF @Status IN ('CLOSED', 'CANCELLED')
    BEGIN
        SELECT 'Error' AS Status,
               N'ไม่สามารถยกเลิกได้: PO อยู่ในสถานะ ' + @Status AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        -------------------------------------------------
        -- 1. Cancel PO
        -------------------------------------------------
        UPDATE po_headers
        SET
            status      = 'CANCELLED',
            note        = ISNULL(note, '')
                          + CASE WHEN @Reason IS NOT NULL
                                 THEN N' | ยกเลิก: ' + @Reason
                                 ELSE '' END,
            updated_by  = @CancelledBy,
            updated_at  = GETDATE()
        WHERE po_id = @PoIdInt;

        -------------------------------------------------
        -- 2. Cancel approvals
        -------------------------------------------------
        UPDATE po_approvals
        SET status = 'CANCELLED'
        WHERE po_id = @PoIdInt
          AND status = 'PENDING';

        -------------------------------------------------
        -- 3. คืนสถานะ Borrow ที่ผูกกับ PO นี้
        -------------------------------------------------
        DECLARE @BorrowIds TABLE (borrow_id INT);

        INSERT INTO @BorrowIds (borrow_id)
        SELECT borrow_id
        FROM borrow_headers
        WHERE po_id = @PoIdInt;

        UPDATE borrow_headers
        SET
            status     = 'RECEIVED',
            po_id      = NULL,
            settled_at = NULL,
            settled_by = NULL
        WHERE borrow_id IN (SELECT borrow_id FROM @BorrowIds);

        -------------------------------------------------
        -- 4. Clear po_line_id เฉพาะ line ของ PO นี้
        -------------------------------------------------
        UPDATE bl
        SET bl.po_line_id = NULL
        FROM borrow_lines bl
        JOIN po_lines pl
            ON bl.po_line_id = pl.po_line_id
        WHERE pl.po_id = @PoIdInt
          AND bl.borrow_id IN (SELECT borrow_id FROM @BorrowIds);

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               N'ยกเลิก PO ' + @PoNo
               + N' เรียบร้อย และคืนสถานะ Borrow ที่เกี่ยวข้องแล้ว' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;