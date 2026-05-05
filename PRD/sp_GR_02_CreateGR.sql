ALTER PROCEDURE [dbo].[sp_GR_02_CreateGR]
    @PoId       NVARCHAR(20)  = NULL,
    @Note       NVARCHAR(500) = NULL,
    @CreatedBy  NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -------------------------------------------------------------------------
    -- SECTION: Normalize inputs
    -------------------------------------------------------------------------
    SET @PoId = NULLIF(LTRIM(RTRIM(@PoId)), '');
    SET @Note = NULLIF(LTRIM(RTRIM(@Note)), '');

    -------------------------------------------------------------------------
    -- SECTION: Basic validations
    -------------------------------------------------------------------------
    DECLARE @GrDateDt DATE = CAST(GETDATE() AS DATE);

    IF @PoId IS NULL OR ISNUMERIC(@PoId) = 0
    BEGIN
        SELECT 'Error' AS Status, N'กรุณาระบุ @PoId (ต้องเป็นตัวเลข)' AS Message;
        RETURN;
    END;

    DECLARE @PoIdInt INT = TRY_CAST(@PoId AS INT);

    IF @PoIdInt IS NULL
    BEGIN
        SELECT 'Error' AS Status, N'@PoId ไม่สามารถแปลงเป็นตัวเลขได้' AS Message;
        RETURN;
    END;

    -------------------------------------------------------------------------
    -- SECTION: Get PO header (supplier + status)
    -------------------------------------------------------------------------
    DECLARE
        @SupplierIdInt INT,
        @PoStatus      VARCHAR(30);

    SELECT
        @SupplierIdInt = supplier_id,
        @PoStatus      = status
    FROM po_headers
    WHERE po_id = @PoIdInt;

    IF @SupplierIdInt IS NULL
    BEGIN
        SELECT 'Error' AS Status, N'ไม่พบ po_id = ' + @PoId AS Message;
        RETURN;
    END;

    IF @PoStatus NOT IN ('ORDERED', 'PARTIAL')
    BEGIN
        SELECT 'Error' AS Status,
               N'ไม่สามารถรับของได้: PO อยู่ในสถานะ ' + CAST(@PoStatus AS NVARCHAR(30))
               + N' (ต้องเป็น ORDERED หรือ PARTIAL)' AS Message;
        RETURN;
    END;

    -------------------------------------------------------------------------
    -- SECTION: Pending lines (ORDER only) from PO
    -------------------------------------------------------------------------
    CREATE TABLE #PendingLines (
        item_id       INT           NOT NULL,
        qty_order     DECIMAL(18,4) NOT NULL,
        qty_received  DECIMAL(18,4) NOT NULL,
        qty_remaining DECIMAL(18,4) NOT NULL
    );

    INSERT INTO #PendingLines (item_id, qty_order, qty_received, qty_remaining)
    SELECT
        pl.item_id,
        pl.qty_order,
        pl.qty_received,
        (pl.qty_order - pl.qty_received) AS qty_remaining
    FROM po_lines pl
    WHERE pl.po_id = @PoIdInt
      AND pl.line_type = 'ORDER'
      AND pl.qty_received < pl.qty_order;

    IF NOT EXISTS (SELECT 1 FROM #PendingLines)
    BEGIN
        SELECT 'Error' AS Status, N'PO นี้ไม่มีรายการ ORDER ที่ค้างรับ' AS Message;
        RETURN;
    END;

    -------------------------------------------------------------------------
    -- SECTION: Build JsonLines internally from #PendingLines (same format as before)
    --   [{ "item_id": 1, "qty": 10.0000 }, ...]
    -------------------------------------------------------------------------
    DECLARE @JsonLines NVARCHAR(MAX);

    SELECT @JsonLines =
    (
        SELECT
            p.item_id,
            p.qty_remaining AS qty
        FROM #PendingLines p
        FOR JSON PATH
    );

    IF @JsonLines IS NULL OR @JsonLines = N'[]'
    BEGIN
        SELECT 'Error' AS Status, N'ไม่สามารถสร้างรายการสินค้า (JsonLines) จาก PO ได้' AS Message;
        RETURN;
    END;

    -- (Optional safety check)
    IF ISJSON(@JsonLines) = 0
    BEGIN
        SELECT 'Error' AS Status, N'JSON ที่สร้างภายในไม่ถูกต้อง (ผิดปกติ)' AS Message;
        RETURN;
    END;

    -------------------------------------------------------------------------
    -- SECTION: Parse JSON -> #Lines (reuse old logic)
    -------------------------------------------------------------------------
    CREATE TABLE #Lines (
        item_id INT           NOT NULL,
        qty     DECIMAL(18,4) NOT NULL
    );

    INSERT INTO #Lines (item_id, qty)
    SELECT
        CAST(JSON_VALUE(j.value, '$.item_id') AS INT),
        CAST(JSON_VALUE(j.value, '$.qty')     AS DECIMAL(18,4))
    FROM OPENJSON(@JsonLines) AS j
    WHERE ISJSON(j.value) = 1
      AND ISNUMERIC(JSON_VALUE(j.value, '$.item_id')) = 1
      AND ISNUMERIC(JSON_VALUE(j.value, '$.qty'))     = 1;

    IF NOT EXISTS (SELECT 1 FROM #Lines)
    BEGIN
        SELECT 'Error' AS Status, N'ไม่พบรายการสินค้าใน JsonLines ที่สร้างจาก PO' AS Message;
        RETURN;
    END;

    IF EXISTS (SELECT 1 FROM #Lines WHERE qty <= 0)
    BEGIN
        SELECT 'Error' AS Status, N'qty ต้องมากกว่า 0 ทุกรายการ' AS Message;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM #Lines l
        LEFT JOIN items i ON l.item_id = i.item_id
        WHERE i.item_id IS NULL
    )
    BEGIN
        SELECT 'Error' AS Status, N'มี item_id ที่ไม่พบในระบบ' AS Message;
        RETURN;
    END;

    -------------------------------------------------------------------------
    -- SECTION: Ensure JSON items are in pending list + not over remaining
    -------------------------------------------------------------------------
    IF EXISTS (
        SELECT 1 FROM #Lines l
        WHERE NOT EXISTS (SELECT 1 FROM #PendingLines p WHERE p.item_id = l.item_id)
    )
    BEGIN
        SELECT 'Error' AS Status,
               N'มี item_id ที่ไม่ได้อยู่ในรายการค้างรับ (ORDER): '
               + (
                   SELECT STUFF((
                       SELECT N', ' + CAST(l2.item_id AS NVARCHAR(50))
                       FROM #Lines l2
                       WHERE NOT EXISTS (SELECT 1 FROM #PendingLines p2 WHERE p2.item_id = l2.item_id)
                       FOR XML PATH(''), TYPE
                   ).value('.', 'nvarchar(max)'), 1, 2, N'')
               ) AS Message;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM #Lines l
        JOIN #PendingLines p ON l.item_id = p.item_id
        WHERE l.qty > p.qty_remaining
    )
    BEGIN
        SELECT 'Error' AS Status,
               N'มี item ที่รับเกินจำนวนค้าง: '
               + (
                   SELECT STUFF((
                       SELECT
                           N', item_id=' + CAST(l2.item_id AS NVARCHAR(50))
                           + N' (รับ='  + CAST(l2.qty AS NVARCHAR(50))
                           + N' ค้าง=' + CAST(p2.qty_remaining AS NVARCHAR(50)) + N')'
                       FROM #Lines l2
                       JOIN #PendingLines p2 ON l2.item_id = p2.item_id
                       WHERE l2.qty > p2.qty_remaining
                       FOR XML PATH(''), TYPE
                   ).value('.', 'nvarchar(max)'), 1, 2, N'')
               ) AS Message;
        RETURN;
    END;

    -------------------------------------------------------------------------
    -- SECTION: Lines with price + conversion_factor (+ unit_id) (pick best row)
    -------------------------------------------------------------------------
    CREATE TABLE #LinesWithPrice (
        item_id           INT           NOT NULL,
        qty               DECIMAL(18,4) NOT NULL,
        unit_price        DECIMAL(18,4) NULL,
        conversion_factor DECIMAL(18,4) NOT NULL,
        unit_id           INT           NULL,
        po_line_id        INT           NULL
    );

    INSERT INTO #LinesWithPrice (item_id, qty, unit_price, conversion_factor, unit_id, po_line_id)
    SELECT
        l.item_id,
        l.qty,
        pr.unit_price,
        ISNULL(pr.conversion_factor, 1) AS conversion_factor,
        pr.unit_id,
        pl.po_line_id
    FROM #Lines l
    LEFT JOIN po_lines pl
           ON pl.po_id = @PoIdInt
          AND pl.item_id = l.item_id
          AND pl.line_type = 'ORDER'
    OUTER APPLY (
        SELECT TOP (1)
            spl.unit_price,
            spl.conversion_factor,
            spl.unit_id
        FROM supplier_price_list spl
        WHERE spl.item_id        = l.item_id
          AND spl.supplier_id    = @SupplierIdInt
          AND spl.is_active      = 1
          AND spl.effective_date <= @GrDateDt
          AND (spl.expire_date IS NULL OR spl.expire_date >= @GrDateDt)
        ORDER BY spl.effective_date DESC, supplier_id DESC
    ) pr;

    IF EXISTS (SELECT 1 FROM #LinesWithPrice WHERE unit_price IS NULL)
    BEGIN
        SELECT 'Error' AS Status,
               N'ไม่พบราคาใน supplier_price_list สำหรับ item_id: '
               + (
                   SELECT STUFF((
                       SELECT N', ' + CAST(item_id AS NVARCHAR(50))
                       FROM #LinesWithPrice
                       WHERE unit_price IS NULL
                       FOR XML PATH(''), TYPE
                   ).value('.', 'nvarchar(max)'), 1, 2, N'')
               ) AS Message;
        RETURN;
    END;

    -------------------------------------------------------------------------
    -- SECTION: Create GR (transaction)
    -------------------------------------------------------------------------
    BEGIN TRY
        BEGIN TRANSACTION;

        ---------------------------------------------------------------------
        -- Generate GR No (safer for concurrency)
        ---------------------------------------------------------------------
        DECLARE
            @YearMonth CHAR(6) = CONVERT(CHAR(6), @GrDateDt, 112),
            @RunNo     INT,
            @RunText   CHAR(3),
            @GrNo      VARCHAR(20);

        SELECT @RunNo = ISNULL(MAX(CAST(RIGHT(gr_no, 3) AS INT)), 0) + 1
        FROM gr_headers WITH (UPDLOCK, HOLDLOCK)
        WHERE gr_no LIKE 'GR' + @YearMonth + '-%';

        SET @RunText = RIGHT('000' + CAST(@RunNo AS VARCHAR(3)), 3);
        SET @GrNo    = 'GR' + @YearMonth + '-' + @RunText;

        ---------------------------------------------------------------------
        -- Insert header
        ---------------------------------------------------------------------
        INSERT INTO gr_headers (
            gr_no, gr_date, supplier_id, po_id,
            status, note, created_by, created_at
        )
        VALUES (
            @GrNo, @GrDateDt, @SupplierIdInt, @PoIdInt,
            'DRAFT', @Note, @CreatedBy, GETDATE()
        );

        DECLARE @GrId INT = SCOPE_IDENTITY();

        ---------------------------------------------------------------------
        -- Insert lines
        ---------------------------------------------------------------------
        INSERT INTO gr_lines (gr_id, item_id, qty_receive, unit_price, po_line_id)
        SELECT @GrId, item_id, qty, unit_price, po_line_id
        FROM #LinesWithPrice;

        COMMIT TRANSACTION;

        ---------------------------------------------------------------------
        -- SECTION: Outputs (same style as before)
        ---------------------------------------------------------------------
        SELECT 'Success' AS Status,
               N'สร้าง GR เลขที่ ' + CAST(@GrNo AS NVARCHAR(30)) + N' (DRAFT) เรียบร้อย' AS Message;

        SELECT
            @GrId          AS gr_id,
            @GrNo          AS gr_no,
            @SupplierIdInt AS supplier_id,
            @GrDateDt      AS gr_date,
            @PoStatus      AS po_status_before,
            'DRAFT'        AS status;

        -- Detail lines with purchase unit from supplier_price_list (unit_id)
        SELECT
            l.item_id,
            i.item_name_th,
            pu.unit_name_th                           AS purchase_unit_name_th,
            pu.unit_code                              AS purchase_unit_code,
            l.qty                                     AS qty_receive,
            l.conversion_factor,
            p.qty_remaining                           AS qty_remaining_before,
            l.unit_price,
            l.qty * l.unit_price                      AS total_price,
            (l.qty * l.conversion_factor)             AS qty_base_to_stock
        FROM #LinesWithPrice l
        JOIN items i         ON l.item_id = i.item_id
        LEFT JOIN units pu   ON pu.unit_id = l.unit_id
        JOIN #PendingLines p ON l.item_id = p.item_id;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

        SELECT 'Error' AS Status,
               ERROR_MESSAGE() AS Message;
    END CATCH
END;