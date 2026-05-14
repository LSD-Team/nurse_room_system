ALTER   PROCEDURE dbo.sp_PO_RecalculateStatus
    @PoId         INT,
    @ReturnResult BIT = 0   -- 0 = ไม่คืน result set (สำหรับเรียกจาก SP อื่น), 1 = คืน (สำหรับ debug โดยตรง)
AS
BEGIN
    SET NOCOUNT ON;

    ------------------------------------------------------------
    -- SECTION 0: Validate parameter
    ------------------------------------------------------------
    IF @PoId IS NULL
    BEGIN
        THROW 52001, N'กรุณาระบุ @PoId', 1;
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.po_headers ph
        WHERE ph.po_id = @PoId
    )
    BEGIN
        THROW 52002, N'ไม่พบ PO ตาม @PoId ที่ระบุ', 1;
    END;

    ------------------------------------------------------------
    -- SECTION 1: Recalculate PO status
    -- สำคัญ:
    -- - คิดเฉพาะ line_type = ORDER
    -- - ไม่รวม BORROW
    -- - ถ้าไม่มี ORDER line เลย ให้ CLOSED ตาม logic เดิม
    ------------------------------------------------------------
    ;WITH PoOrderAgg AS
    (
        SELECT
            pl.po_id,
            COUNT(*) AS order_line_cnt,
            SUM
            (
                CASE
                    WHEN ISNULL(pl.qty_received, 0) < ISNULL(pl.qty_order, 0)
                        THEN 1
                    ELSE 0
                END
            ) AS open_order_line_cnt
        FROM dbo.po_lines pl
        WHERE pl.po_id = @PoId
          AND LTRIM(RTRIM(ISNULL(pl.line_type, ''))) = 'ORDER'
        GROUP BY
            pl.po_id
    )
    UPDATE ph
    SET ph.status =
        CASE
            WHEN ISNULL(a.order_line_cnt, 0) = 0
                THEN 'CLOSED'
            WHEN ISNULL(a.open_order_line_cnt, 0) > 0
                THEN 'PARTIAL'
            ELSE 'CLOSED'
        END
    FROM dbo.po_headers ph
    LEFT JOIN PoOrderAgg a
        ON a.po_id = ph.po_id
    WHERE ph.po_id = @PoId;

    ------------------------------------------------------------
    -- SECTION 2: Return result for debug / caller
    ------------------------------------------------------------
    IF @ReturnResult = 1
    BEGIN
        SELECT
            ph.po_id,
            ph.po_no,
            ph.status AS po_status_after_recalculate
        FROM dbo.po_headers ph
        WHERE ph.po_id = @PoId;
    END;
END;