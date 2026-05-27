CREATE OR ALTER PROCEDURE [dbo].[sp_SC_01_Create]
    @VisitId        INT,
    @ClaimDatetime  DATETIME       = NULL,
    @Reason         NVARCHAR(500)  = NULL,
    @JsonItems      NVARCHAR(MAX), -- [{"item_id":1,"qty_base":10,"base_unit_id":7}, ...]
    @CreatedBy      NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @ClaimDatetime IS NULL SET @ClaimDatetime = GETDATE();
    SET @Reason = NULLIF(LTRIM(RTRIM(@Reason)), '');
    SET @CreatedBy = NULLIF(LTRIM(RTRIM(@CreatedBy)), '');

    IF @VisitId IS NULL OR @VisitId <= 0
    BEGIN
        SELECT 'Error' AS Status, N'กรุณาระบุ @VisitId ให้ถูกต้อง' AS Message;
        RETURN;
    END;

    IF @CreatedBy IS NULL
    BEGIN
        SELECT 'Error' AS Status, N'กรุณาระบุ @CreatedBy' AS Message;
        RETURN;
    END;

    IF ISJSON(@JsonItems) = 0
    BEGIN
        SELECT 'Error' AS Status, N'@JsonItems ไม่ใช่ JSON ที่ถูกต้อง' AS Message;
        RETURN;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.visits WHERE visit_id = @VisitId)
    BEGIN
        SELECT 'Error' AS Status, N'ไม่พบ Visit ตาม @VisitId' AS Message;
        RETURN;
    END;

    CREATE TABLE #InputItems
    (
        item_id      INT NOT NULL,
        qty_base     INT NOT NULL,
        base_unit_id INT NULL
    );

    INSERT INTO #InputItems (item_id, qty_base, base_unit_id)
    SELECT
        TRY_CONVERT(INT, JSON_VALUE(j.value, '$.item_id'))      AS item_id,
        TRY_CONVERT(INT, JSON_VALUE(j.value, '$.qty_base'))     AS qty_base,
        TRY_CONVERT(INT, JSON_VALUE(j.value, '$.base_unit_id')) AS base_unit_id
    FROM OPENJSON(@JsonItems) j
    WHERE ISJSON(j.value) = 1;

    IF NOT EXISTS (SELECT 1 FROM #InputItems)
    BEGIN
        SELECT 'Error' AS Status, N'ไม่มีรายการยาใน @JsonItems' AS Message;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM #InputItems
        WHERE item_id IS NULL OR qty_base IS NULL OR qty_base <= 0
    )
    BEGIN
        SELECT 'Error' AS Status, N'พบ item_id หรือ qty_base ไม่ถูกต้อง (qty_base ต้อง > 0)' AS Message;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM #InputItems i
        LEFT JOIN dbo.items it ON it.item_id = i.item_id
        WHERE it.item_id IS NULL
    )
    BEGIN
        SELECT 'Error' AS Status, N'พบ item_id ที่ไม่มีในระบบ' AS Message;
        RETURN;
    END;

    CREATE TABLE #AggItems
    (
        item_id      INT PRIMARY KEY,
        qty_base     INT NOT NULL,
        base_unit_id INT NULL
    );

    INSERT INTO #AggItems (item_id, qty_base, base_unit_id)
    SELECT
        i.item_id,
        SUM(i.qty_base) AS qty_base,
        MAX(i.base_unit_id) AS base_unit_id
    FROM #InputItems i
    GROUP BY i.item_id;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- lock stock rows for requested items to prevent concurrent oversell
        SELECT soh.item_id, soh.qty_base
        INTO #LockedStock
        FROM dbo.stock_on_hand soh WITH (UPDLOCK, HOLDLOCK)
        JOIN #AggItems ai ON ai.item_id = soh.item_id;

        IF EXISTS (
            SELECT 1
            FROM #AggItems ai
            LEFT JOIN #LockedStock ls ON ls.item_id = ai.item_id
            WHERE ls.item_id IS NULL
        )
        BEGIN
            THROW 51001, N'พบรายการยาที่ไม่มี stock_on_hand หรือยังไม่เคยตั้งยอด', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM #AggItems ai
            JOIN #LockedStock ls ON ls.item_id = ai.item_id
            WHERE ls.qty_base < ai.qty_base
        )
        BEGIN
            THROW 51002, N'สต็อกไม่เพียงพอสำหรับการเบิกยา', 1;
        END;

        INSERT INTO dbo.special_drug_claims
        (
            visit_id,
            claim_datetime,
            reason,
            created_by,
            created_at
        )
        VALUES
        (
            @VisitId,
            @ClaimDatetime,
            @Reason,
            @CreatedBy,
            GETDATE()
        );

        DECLARE @ClaimId BIGINT = SCOPE_IDENTITY();

        INSERT INTO dbo.special_drug_claim_items
        (
            claim_id,
            item_id,
            qty_issued_base,
            base_unit_id,
            created_at
        )
        SELECT
            @ClaimId,
            ai.item_id,
            ai.qty_base,
            COALESCE(ai.base_unit_id, it.usage_unit_id),
            GETDATE()
        FROM #AggItems ai
        JOIN dbo.items it ON it.item_id = ai.item_id;

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
        SELECT
            'WITHDRAW',
            ai.item_id,
            ai.qty_base,
            'SPECIAL_DRUG_CLAIM',
            CAST(@ClaimId AS VARCHAR(50)),
            @CreatedBy,
            @ClaimDatetime,
            @Reason
        FROM #AggItems ai;

        UPDATE soh
        SET
            soh.qty_base = soh.qty_base - ai.qty_base,
            soh.updated_at = GETDATE()
        FROM dbo.stock_on_hand soh
        JOIN #AggItems ai ON ai.item_id = soh.item_id;

        COMMIT TRANSACTION;

        SELECT
            'Success' AS Status,
            N'สร้างรายการเบิกยากรณีพิเศษสำเร็จ' AS Message,
            @ClaimId AS claim_id;

        SELECT
            sci.claim_item_id,
            sci.claim_id,
            sci.item_id,
            sci.qty_issued_base
        FROM dbo.special_drug_claim_items sci
        WHERE sci.claim_id = @ClaimId
        ORDER BY sci.claim_item_id;
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
