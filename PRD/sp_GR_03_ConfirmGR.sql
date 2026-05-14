ALTER PROCEDURE [dbo].[sp_GR_03_ConfirmGR]
    @GrId        NVARCHAR(20),
    @ConfirmedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    ------------------------------------------------------------
    -- SECTION 0: Normalize & validate parameter
    ------------------------------------------------------------
    SET @GrId = NULLIF(LTRIM(RTRIM(@GrId)), '');

    IF @GrId IS NULL OR TRY_CONVERT(INT, @GrId) IS NULL
    BEGIN
        SELECT
            'Error' AS Status,
            N'กรุณาระบุ @GrId ให้ถูกต้อง' AS Message;
        RETURN;
    END;

    DECLARE @GrIdInt INT = TRY_CONVERT(INT, @GrId);

    ------------------------------------------------------------
    -- SECTION 1: Declare variables
    ------------------------------------------------------------
    DECLARE
        @Status        VARCHAR(20),
        @GrNo          VARCHAR(20),
        @GrDate        DATE,
        @SupplierIdInt INT,
        @PoIdInt       INT,
        @Now           DATETIME = GETDATE();

    ------------------------------------------------------------
    -- SECTION 2: Load GR header
    ------------------------------------------------------------
    SELECT
        @Status        = gh.status,
        @GrNo          = gh.gr_no,
        @GrDate        = gh.gr_date,
        @SupplierIdInt = gh.supplier_id,
        @PoIdInt       = gh.po_id
    FROM dbo.gr_headers gh
    WHERE gh.gr_id = @GrIdInt;

    IF @Status IS NULL
    BEGIN
        SELECT
            'Error' AS Status,
            N'ไม่พบ gr_id = ' + @GrId AS Message;
        RETURN;
    END;

    IF @Status <> 'DRAFT'
    BEGIN
        SELECT
            'Error' AS Status,
            N'ไม่สามารถ confirm ได้: GR อยู่ในสถานะ ' + @Status AS Message;
        RETURN;
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.gr_lines gl
        WHERE gl.gr_id = @GrIdInt
    )
    BEGIN
        SELECT
            'Error' AS Status,
            N'ไม่มีรายการใน GR นี้' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- SECTION 3: Validate GR lines linked to PO
    -- ถ้า GR header อ้างอิง PO ทุก line ต้องมี po_line_id
    ------------------------------------------------------------
    IF @PoIdInt IS NOT NULL
       AND EXISTS
       (
            SELECT 1
            FROM dbo.gr_lines gl
            WHERE gl.gr_id = @GrIdInt
              AND gl.po_line_id IS NULL
       )
    BEGIN
        SELECT
            'Error' AS Status,
            N'GR นี้อ้างอิง PO แต่มีบางรายการไม่ได้ผูก po_line_id ทำให้ไม่สามารถอัปเดตยอดรับ PO ได้ถูกต้อง' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- SECTION 3.1: Validate po_line_id belongs to same PO
    ------------------------------------------------------------
    IF @PoIdInt IS NOT NULL
       AND EXISTS
       (
            SELECT 1
            FROM dbo.gr_lines gl
            LEFT JOIN dbo.po_lines pl
                ON pl.po_line_id = gl.po_line_id
            WHERE gl.gr_id = @GrIdInt
              AND (
                    pl.po_line_id IS NULL
                    OR pl.po_id <> @PoIdInt
                  )
       )
    BEGIN
        SELECT
            'Error' AS Status,
            N'พบ GR line ที่ผูก po_line_id ไม่ถูกต้อง หรือ po_line_id ไม่ได้อยู่ใน PO เดียวกับ GR header' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- SECTION 4: Pre-compute GR lines with base qty
    ------------------------------------------------------------
    CREATE TABLE #GrLinesWithBase
    (
        gr_line_id          INT NULL,
        item_id             INT NOT NULL,
        qty_receive         DECIMAL(18,4) NOT NULL,
        conversion_factor   DECIMAL(18,4) NOT NULL,
        qty_base            INT NOT NULL,
        po_line_id          INT NULL,
        po_id               INT NULL,
        line_type           VARCHAR(20) NULL
    );

    INSERT INTO #GrLinesWithBase
    (
        gr_line_id,
        item_id,
        qty_receive,
        conversion_factor,
        qty_base,
        po_line_id,
        po_id,
        line_type
    )
    SELECT
        gl.gr_line_id,
        gl.item_id,
        gl.qty_receive,
        ISNULL(splx.conversion_factor, 1) AS conversion_factor,
        CAST(gl.qty_receive * ISNULL(splx.conversion_factor, 1) AS INT) AS qty_base,
        gl.po_line_id,
        pl.po_id,
        pl.line_type
    FROM dbo.gr_lines gl
    LEFT JOIN dbo.po_lines pl
        ON pl.po_line_id = gl.po_line_id
    OUTER APPLY
    (
        SELECT TOP (1)
            spl.conversion_factor
        FROM dbo.supplier_price_list spl
        WHERE spl.item_id = gl.item_id
          AND spl.supplier_id = @SupplierIdInt
          AND spl.is_active = 1
          AND spl.effective_date <= @GrDate
          AND (
                spl.expire_date IS NULL
                OR spl.expire_date >= @GrDate
              )
        ORDER BY
            spl.effective_date DESC
            -- ถ้ามี primary key เช่น supplier_price_id ให้เปิดใช้บรรทัดนี้
            -- , spl.supplier_price_id DESC
    ) splx
    WHERE gl.gr_id = @GrIdInt;

    ------------------------------------------------------------
    -- SECTION 5: Validate qty
    ------------------------------------------------------------
    IF EXISTS
    (
        SELECT 1
        FROM #GrLinesWithBase
        WHERE qty_receive <= 0
           OR qty_base <= 0
    )
    BEGIN
        SELECT
            'Error' AS Status,
            N'พบจำนวนรับหรือจำนวนแปลงหน่วยไม่ถูกต้อง กรุณาตรวจสอบ GR lines / conversion factor' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- SECTION 5.1: Validate receive qty not over PO order qty
    -- เช็กเฉพาะ ORDER เท่านั้น ไม่รวม BORROW
    ------------------------------------------------------------
    IF EXISTS
    (
        SELECT 1
        FROM
        (
            SELECT
                b.po_line_id,
                SUM(b.qty_receive) AS qty_receive_sum
            FROM #GrLinesWithBase b
            WHERE b.po_line_id IS NOT NULL
              AND LTRIM(RTRIM(ISNULL(b.line_type, ''))) = 'ORDER'
            GROUP BY
                b.po_line_id
        ) r
        JOIN dbo.po_lines pl
            ON pl.po_line_id = r.po_line_id
        WHERE LTRIM(RTRIM(ISNULL(pl.line_type, ''))) = 'ORDER'
          AND ISNULL(pl.qty_received, 0) + r.qty_receive_sum > ISNULL(pl.qty_order, 0)
    )
    BEGIN
        SELECT
            'Error' AS Status,
            N'จำนวนรับเกินจำนวนสั่งซื้อ กรุณาตรวจสอบ GR lines' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- SECTION 6: Begin transaction
    ------------------------------------------------------------
    BEGIN TRY
        BEGIN TRANSACTION;

        --------------------------------------------------------
        -- 6.1 Update GR header
        --------------------------------------------------------
        UPDATE dbo.gr_headers
        SET
            status       = 'CONFIRMED',
            confirmed_at = @Now,
            confirmed_by = @ConfirmedBy,
            updated_by   = @ConfirmedBy,
            updated_at   = @Now
        WHERE gr_id = @GrIdInt
          AND status = 'DRAFT';

        IF @@ROWCOUNT = 0
        BEGIN
            THROW 51001, N'ไม่สามารถ confirm ได้ เนื่องจาก GR ไม่ได้อยู่ในสถานะ DRAFT หรือถูก confirm ไปแล้ว', 1;
        END;

        --------------------------------------------------------
        -- 6.2 Insert stock_movements
        -- รวมยอดต่อ item ก่อน insert
        -- กัน duplicate ด้วย ref_type/ref_id/item_id
        --------------------------------------------------------
        INSERT INTO dbo.stock_movements
        (
            movement_type,
            item_id,
            qty_base,
            ref_type,
            ref_id,
            created_by,
            created_at
        )
        SELECT
            'RECEIVE' AS movement_type,
            b.item_id,
            SUM(b.qty_base) AS qty_base,
            'GR' AS ref_type,
            @GrNo AS ref_id,
            @ConfirmedBy AS created_by,
            @Now AS created_at
        FROM #GrLinesWithBase b
        WHERE NOT EXISTS
        (
            SELECT 1
            FROM dbo.stock_movements sm
            WHERE sm.movement_type = 'RECEIVE'
              AND sm.item_id = b.item_id
              AND sm.ref_type = 'GR'
              AND sm.ref_id = @GrNo
        )
        GROUP BY
            b.item_id;

        --------------------------------------------------------
        -- 6.3 Update stock_on_hand
        --------------------------------------------------------
        ;WITH StockAdd AS
        (
            SELECT
                item_id,
                SUM(qty_base) AS qty_sum
            FROM #GrLinesWithBase
            GROUP BY
                item_id
        )
        MERGE dbo.stock_on_hand AS target
        USING StockAdd AS source
            ON target.item_id = source.item_id
        WHEN MATCHED THEN
            UPDATE SET
                qty_base   = target.qty_base + source.qty_sum,
                updated_at = @Now
        WHEN NOT MATCHED THEN
            INSERT
            (
                item_id,
                qty_base,
                updated_at
            )
            VALUES
            (
                source.item_id,
                source.qty_sum,
                @Now
            );

        --------------------------------------------------------
        -- 6.4 Update po_lines.qty_received
        -- สำคัญ: อัปเดตเฉพาะ ORDER เท่านั้น ไม่รวม BORROW
        --------------------------------------------------------
        ;WITH ReceivedByPoLine AS
        (
            SELECT
                b.po_line_id,
                SUM(b.qty_receive) AS qty_receive_sum
            FROM #GrLinesWithBase b
            WHERE b.po_line_id IS NOT NULL
              AND LTRIM(RTRIM(ISNULL(b.line_type, ''))) = 'ORDER'
            GROUP BY
                b.po_line_id
        )
        UPDATE pl
        SET
            pl.qty_received = ISNULL(pl.qty_received, 0) + r.qty_receive_sum
        FROM dbo.po_lines pl
        JOIN ReceivedByPoLine r
            ON r.po_line_id = pl.po_line_id
        WHERE LTRIM(RTRIM(ISNULL(pl.line_type, ''))) = 'ORDER';

--------------------------------------------------------
-- 6.5 Recalculate PO status
-- แยก logic ไปไว้ที่ dbo.sp_PO_RecalculateStatus
-- ยังอยู่ใน transaction เดียวกัน
--------------------------------------------------------
IF @PoIdInt IS NOT NULL
BEGIN
    EXEC dbo.sp_PO_RecalculateStatus
        @PoId         = @PoIdInt,
        @ReturnResult = 0;
END;

        --------------------------------------------------------
        -- 6.6 Commit
        --------------------------------------------------------
        COMMIT TRANSACTION;

        --------------------------------------------------------
        -- SECTION 7: Success result
        --------------------------------------------------------
        SELECT
            'Success' AS Status,
            N'ยืนยัน GR เลขที่ ' + @GrNo + N' สำเร็จ: stock ถูกอัปเดต และสถานะ PO ถูกคำนวณโดยคิดเฉพาะ ORDER ไม่รวม BORROW' AS Message;

        --------------------------------------------------------
        -- SECTION 8: Result detail
        --------------------------------------------------------
        SELECT
            b.gr_line_id,
            b.item_id,
            b.qty_receive AS qty_receive_purchase_unit,
            b.conversion_factor,
            b.qty_base AS qty_added_to_stock_usage_unit,
            b.po_line_id,
            b.line_type,
            CASE
                WHEN LTRIM(RTRIM(ISNULL(b.line_type, ''))) = 'ORDER'
                    THEN 1
                ELSE 0
            END AS used_for_po_received,
            s.qty_base AS qty_on_hand_after
        FROM #GrLinesWithBase b
        JOIN dbo.stock_on_hand s
            ON s.item_id = b.item_id
        ORDER BY
            b.item_id,
            b.po_line_id,
            b.gr_line_id;

        --------------------------------------------------------
        -- SECTION 9: PO status summary
        --------------------------------------------------------
        IF @PoIdInt IS NOT NULL
        BEGIN
            SELECT
                ph.po_id,
                ph.po_no,
                ph.status AS po_status_after_confirm
            FROM dbo.po_headers ph
            WHERE ph.po_id = @PoIdInt;

            SELECT
                pl.po_line_id,
                pl.item_id,
                pl.line_type,
                pl.qty_order,
                pl.qty_received,
                ISNULL(pl.qty_order, 0) - ISNULL(pl.qty_received, 0) AS qty_remaining,
                CASE
                    WHEN LTRIM(RTRIM(ISNULL(pl.line_type, ''))) = 'ORDER'
                        THEN 1
                    ELSE 0
                END AS used_for_po_status,
                CASE
                    WHEN LTRIM(RTRIM(ISNULL(pl.line_type, ''))) <> 'ORDER'
                        THEN 'IGNORED'
                    WHEN ISNULL(pl.qty_received, 0) < ISNULL(pl.qty_order, 0)
                        THEN 'CAUSE_PARTIAL'
                    ELSE 'COMPLETE'
                END AS status_impact
            FROM dbo.po_lines pl
            WHERE pl.po_id = @PoIdInt
            ORDER BY
                pl.po_line_id;
        END;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SELECT
            'Error' AS Status,
            ERROR_MESSAGE() AS Message,
            ERROR_NUMBER() AS ErrorNumber,
            ERROR_LINE() AS ErrorLine,
            XACT_STATE() AS XactStateAfterCatch;
    END CATCH;
END;