ALTER PROCEDURE [dbo].[sp_GR_02_CreateGR]
    @JsonLines  NVARCHAR(MAX),
    @Note       NVARCHAR(500) = NULL,
    @PoId       NVARCHAR(20)  = NULL,
    @CreatedBy  NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SET @PoId = NULLIF(LTRIM(RTRIM(@PoId)), '');
    SET @Note = NULLIF(LTRIM(RTRIM(@Note)), '');

    IF ISJSON(@JsonLines) = 0
    BEGIN
        SELECT 'Error' AS Status, 'JSON ไม่ถูกต้อง' AS Message;
        RETURN;
    END;

    DECLARE @GrDateDt DATE = CAST(GETDATE() AS DATE);

    IF @PoId IS NULL OR ISNUMERIC(@PoId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @PoId' AS Message;
        RETURN;
    END;

    DECLARE @PoIdInt INT = CAST(@PoId AS INT);

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
        SELECT 'Error' AS Status, '��ม่พบ po_id = ' + @PoId AS Message;
        RETURN;
    END;

    IF @PoStatus NOT IN ('ORDERED', 'PARTIAL')
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่สามารถรับของได้: PO อยู่ในสถานะ ' + @PoStatus
               + ' (ต้องเป็น ORDERED หรือ PARTIAL)' AS Message;
        RETURN;
    END;

    -- Pending lines
    CREATE TABLE #PendingLines (
        item_id       INT,
        qty_order     DECIMAL(18,4),
        qty_received  DECIMAL(18,4),
        qty_remaining DECIMAL(18,4)
    );

    INSERT INTO #PendingLines (item_id, qty_order, qty_received, qty_remaining)
    SELECT item_id, qty_order, qty_received, qty_order - qty_received
    FROM po_lines
    WHERE po_id = @PoIdInt AND qty_received < qty_order;

    IF NOT EXISTS (SELECT 1 FROM #PendingLines)
    BEGIN
        SELECT 'Error' AS Status, 'PO นี้รับของครบแล้ว ไม่มีรายการค้างรับ' AS Message;
        RETURN;
    END;

    -- Parse JSON
    CREATE TABLE #Lines (item_id INT, qty DECIMAL(18,4), po_line_id INT);

    INSERT INTO #Lines (item_id, qty, po_line_id)
    SELECT
        CAST(JSON_VALUE(j.value, '$.item_id') AS INT),
        CAST(JSON_VALUE(j.value, '$.qty')     AS DECIMAL(18,4)),
        CAST(JSON_VALUE(j.value, '$.po_line_id') AS INT)
    FROM OPENJSON(@JsonLines) AS j
    WHERE ISJSON(j.value) = 1
      AND ISNUMERIC(JSON_VALUE(j.value, '$.item_id')) = 1
      AND ISNUMERIC(JSON_VALUE(j.value, '$.qty'))     = 1
      AND ISNUMERIC(JSON_VALUE(j.value, '$.po_line_id')) = 1;

    IF NOT EXISTS (SELECT 1 FROM #Lines)
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุรายการสินค้าใน JSON' AS Message;
        RETURN;
    END;

    IF EXISTS (SELECT 1 FROM #Lines l LEFT JOIN items i ON l.item_id = i.item_id WHERE i.item_id IS NULL)
    BEGIN
        SELECT 'Error' AS Status, 'มี item_id ที่ไม่พบในระบบ' AS Message;
        RETURN;
    END;

    IF EXISTS (SELECT 1 FROM #Lines WHERE qty <= 0)
    BEGIN
        SELECT 'Error' AS Status, 'qty ต้องมากกว่า 0 ทุกรายการ' AS Message;
        RETURN;
    END;

    -- Check items are in pending list
    IF EXISTS (
        SELECT 1 FROM #Lines l
        WHERE NOT EXISTS (SELECT 1 FROM #PendingLines p WHERE p.item_id = l.item_id)
    )
    BEGIN
        SELECT 'Error' AS Status,
               'มี item_id ที่ไม่ได้อยู่ในรายการค้างรับ: '
               + (
                   SELECT STUFF((
                       SELECT ', ' + CAST(l.item_id AS VARCHAR)
                       FROM #Lines l
                       WHERE NOT EXISTS (SELECT 1 FROM #PendingLines p WHERE p.item_id = l.item_id)
                       FOR XML PATH('')
                   ), 1, 2, '')
               ) AS Message;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1 FROM #Lines l
        JOIN #PendingLines p ON l.item_id = p.item_id
        WHERE l.qty > p.qty_remaining
    )
    BEGIN
        SELECT 'Error' AS Status,
               'มี item ที่รับเกินจำนวนค้าง: '
               + (
                   SELECT STUFF((
                       SELECT ', item_id=' + CAST(l.item_id AS VARCHAR)
                           + ' (รับ='  + CAST(l.qty          AS VARCHAR)
                           + ' ค้าง=' + CAST(p.qty_remaining AS VARCHAR) + ')'
                       FROM #Lines l
                       JOIN #PendingLines p ON l.item_id = p.item_id
                       WHERE l.qty > p.qty_remaining
                       FOR XML PATH('')
                   ), 1, 2, '')
               ) AS Message;
        RETURN;
    END;

    -- Lines with price + conversion_factor
    CREATE TABLE #LinesWithPrice (
        item_id           INT,
        qty               DECIMAL(18,4),
        unit_price        DECIMAL(18,4),
        conversion_factor DECIMAL(18,4),
        po_line_id        INT
    );

    INSERT INTO #LinesWithPrice (item_id, qty, unit_price, conversion_factor, po_line_id)
    SELECT
        l.item_id,
        l.qty,
        spl.unit_price,
        ISNULL(spl.conversion_factor, 1),
        l.po_line_id
    FROM #Lines l
    LEFT JOIN supplier_price_list spl
           ON spl.item_id        = l.item_id
          AND spl.supplier_id    = @SupplierIdInt
          AND spl.is_active      = 1
          AND spl.effective_date <= @GrDateDt
          AND (spl.expire_date IS NULL OR spl.expire_date >= @GrDateDt);

    IF EXISTS (SELECT 1 FROM #LinesWithPrice WHERE unit_price IS NULL)
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบราคาใน supplier_price_list สำหรับ item_id: '
               + (
                   SELECT STUFF((
                       SELECT ', ' + CAST(item_id AS VARCHAR)
                       FROM #LinesWithPrice WHERE unit_price IS NULL
                       FOR XML PATH('')
                   ), 1, 2, '')
               ) AS Message;
        RETURN;
    END;

    -- Generate GR No
    DECLARE
        @YearMonth CHAR(6) = CONVERT(CHAR(6), @GrDateDt, 112),
        @RunNo     INT,
        @RunText   CHAR(3),
        @GrNo      VARCHAR(20);

    SELECT @RunNo = ISNULL(MAX(CAST(RIGHT(gr_no, 3) AS INT)), 0) + 1
    FROM gr_headers
    WHERE gr_no LIKE 'GR' + CONVERT(CHAR(6), @GrDateDt, 112) + '%';

    SET @RunText = RIGHT('000' + CAST(@RunNo AS VARCHAR(3)), 3);
    SET @GrNo    = 'GR' + @YearMonth + '-' + @RunText;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO gr_headers (
            gr_no, gr_date, supplier_id, po_id,
            status, note, created_by, created_at
        )
        VALUES (
            @GrNo, @GrDateDt, @SupplierIdInt, @PoIdInt,
            'DRAFT', @Note, @CreatedBy, GETDATE()
        );

        DECLARE @GrId INT = SCOPE_IDENTITY();

        INSERT INTO gr_lines (gr_id, item_id, qty_receive, unit_price, po_line_id)
        SELECT @GrId, item_id, qty, unit_price, po_line_id
        FROM #LinesWithPrice;

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'สร้าง GR เลขที่ ' + @GrNo + ' (DRAFT) เรียบร้อย' AS Message;

        SELECT
            @GrId          AS gr_id,
            @GrNo          AS gr_no,
            @SupplierIdInt AS supplier_id,
            @GrDateDt      AS gr_date,
            @PoStatus      AS po_status_before,
            'DRAFT'        AS status;

        -- *** FIXED: purchase unit now from supplier_price_list → units ***
        SELECT
            l.item_id,
            i.item_name_th,
            pu.unit_name_th                         AS purchase_unit_name_th,  -- FIXED
            pu.unit_code                            AS purchase_unit_code,      -- FIXED
            l.qty                                   AS qty_receive,
            l.conversion_factor,
            p.qty_remaining                         AS qty_remaining_before,
            l.unit_price,
            l.qty * l.unit_price                    AS total_price,
            CAST(l.qty * l.conversion_factor AS INT) AS qty_base_to_stock      -- bonus info
        FROM #LinesWithPrice l
        JOIN items i          ON l.item_id = i.item_id
        -- get purchase unit from supplier_price_list
        JOIN supplier_price_list spl2
                              ON spl2.item_id        = l.item_id
                             AND spl2.supplier_id    = @SupplierIdInt
                             AND spl2.is_active      = 1
                             AND spl2.effective_date <= @GrDateDt
                             AND (spl2.expire_date IS NULL OR spl2.expire_date >= @GrDateDt)
        JOIN units pu         ON pu.unit_id = spl2.unit_id
        JOIN #PendingLines p  ON l.item_id  = p.item_id;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END; 