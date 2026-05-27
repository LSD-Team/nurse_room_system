CREATE OR ALTER PROCEDURE [dbo].[sp_SC_03_Update]
    @ClaimId            BIGINT,
    @ClaimDatetime      DATETIME       = NULL,
    @Reason             NVARCHAR(500)  = NULL,
    @JsonAdjustments    NVARCHAR(MAX)  = NULL, -- [{"claim_item_id":1,"new_qty_issued_base":12}, ...]
    @EditedBy           NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @Reason = NULLIF(LTRIM(RTRIM(@Reason)), '');
    SET @EditedBy = NULLIF(LTRIM(RTRIM(@EditedBy)), '');

    IF @ClaimId IS NULL OR @ClaimId <= 0
    BEGIN
        SELECT 'Error' AS Status, N'กรุณาระบุ @ClaimId ให้ถูกต้อง' AS Message;
        RETURN;
    END;

    IF @EditedBy IS NULL
    BEGIN
        SELECT 'Error' AS Status, N'กรุณาระบุ @EditedBy' AS Message;
        RETURN;
    END;

    IF @JsonAdjustments IS NOT NULL AND ISJSON(@JsonAdjustments) = 0
    BEGIN
        SELECT 'Error' AS Status, N'@JsonAdjustments ไม่ใช่ JSON ที่ถูกต้อง' AS Message;
        RETURN;
    END;

    BEGIN TRY
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.special_drug_claims sc WITH (UPDLOCK, HOLDLOCK)
            WHERE sc.claim_id = @ClaimId
        )
        BEGIN
            THROW 53001, N'ไม่พบ claim ตามที่ระบุ', 1;
        END;

        -- Check if claim is closed
        IF EXISTS (
            SELECT 1 
            FROM dbo.special_drug_claims 
            WHERE claim_id = @ClaimId AND [status] = 'CLOSED'
        )
        BEGIN
            THROW 53008, N'รายการเบิกยาพิเศษนี้ถูกปิด (CLOSED) แล้ว ไม่สามารถแก้ไขข้อมูลได้', 1;
        END;

        -- lock-after-return = true:
        -- ถ้า claim นี้มี RETURN แล้ว จะไม่อนุญาตให้แก้ไขรายการยาอีก
        IF EXISTS (
            SELECT 1
            FROM dbo.stock_movements sm WITH (UPDLOCK, HOLDLOCK)
            WHERE sm.ref_type = 'SPECIAL_DRUG_CLAIM'
              AND sm.ref_id = CAST(@ClaimId AS VARCHAR(50))
              AND sm.movement_type = 'RETURN'
        )
        BEGIN
            THROW 53002, N'Claim นี้มีการคืนยาแล้ว ไม่อนุญาตให้แก้ไขรายการยา', 1;
        END;

        -- update header fields only (if provided)
        UPDATE dbo.special_drug_claims
        SET
            claim_datetime = COALESCE(@ClaimDatetime, claim_datetime),
            reason = COALESCE(@Reason, reason)
        WHERE claim_id = @ClaimId;

        IF @JsonAdjustments IS NULL
        BEGIN
            COMMIT TRANSACTION;
            SELECT
                'Success' AS Status,
                N'อัปเดตข้อมูลหัวเอกสารสำเร็จ' AS Message,
                @ClaimId AS claim_id;
            RETURN;
        END;

        CREATE TABLE #Adjustments
        (
            claim_item_id        BIGINT NOT NULL PRIMARY KEY,
            new_qty_issued_base  INT NOT NULL
        );

        INSERT INTO #Adjustments (claim_item_id, new_qty_issued_base)
        SELECT
            TRY_CONVERT(BIGINT, JSON_VALUE(j.value, '$.claim_item_id'))       AS claim_item_id,
            TRY_CONVERT(INT, JSON_VALUE(j.value, '$.new_qty_issued_base'))    AS new_qty_issued_base
        FROM OPENJSON(@JsonAdjustments) j
        WHERE ISJSON(j.value) = 1;

        IF NOT EXISTS (SELECT 1 FROM #Adjustments)
        BEGIN
            THROW 53003, N'ไม่มีรายการปรับแก้ใน @JsonAdjustments', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM #Adjustments
            WHERE claim_item_id IS NULL OR new_qty_issued_base IS NULL OR new_qty_issued_base <= 0
        )
        BEGIN
            THROW 53004, N'ข้อมูล claim_item_id/new_qty_issued_base ไม่ถูกต้อง', 1;
        END;

        CREATE TABLE #TargetItems
        (
            claim_item_id  BIGINT NOT NULL PRIMARY KEY,
            item_id        INT NOT NULL,
            current_issued INT NOT NULL,
            new_issued     INT NOT NULL,
            delta_qty      INT NOT NULL
        );

        INSERT INTO #TargetItems (claim_item_id, item_id, current_issued, new_issued, delta_qty)
        SELECT
            sci.claim_item_id,
            sci.item_id,
            ISNULL(SUM(CASE
                WHEN sm.movement_type = 'WITHDRAW' THEN sm.qty_base
                WHEN sm.movement_type = 'RETURN' THEN -sm.qty_base
                ELSE 0
            END), 0) AS current_issued,
            a.new_qty_issued_base AS new_issued,
            a.new_qty_issued_base - ISNULL(SUM(CASE
                WHEN sm.movement_type = 'WITHDRAW' THEN sm.qty_base
                WHEN sm.movement_type = 'RETURN' THEN -sm.qty_base
                ELSE 0
            END), 0) AS delta_qty
        FROM #Adjustments a
        JOIN dbo.special_drug_claim_items sci WITH (UPDLOCK, HOLDLOCK)
            ON sci.claim_item_id = a.claim_item_id
           AND sci.claim_id = @ClaimId
        LEFT JOIN dbo.stock_movements sm WITH (UPDLOCK, HOLDLOCK)
            ON sm.ref_type = 'SPECIAL_DRUG_CLAIM'
           AND sm.ref_id = CAST(@ClaimId AS VARCHAR(50))
           AND sm.item_id = sci.item_id
           AND sm.movement_type IN ('WITHDRAW', 'RETURN')
        GROUP BY
            sci.claim_item_id,
            sci.item_id,
            a.new_qty_issued_base;

        IF (SELECT COUNT(*) FROM #TargetItems) <> (SELECT COUNT(*) FROM #Adjustments)
        BEGIN
            THROW 53005, N'พบ claim_item_id ที่ไม่อยู่ใน claim นี้', 1;
        END;

        -- lock stock rows needed for positive deltas
        SELECT soh.item_id, soh.qty_base
        INTO #LockedStock
        FROM dbo.stock_on_hand soh WITH (UPDLOCK, HOLDLOCK)
        JOIN #TargetItems t ON t.item_id = soh.item_id
        WHERE t.delta_qty > 0;

        IF EXISTS (
            SELECT 1
            FROM #TargetItems t
            WHERE t.delta_qty > 0
              AND NOT EXISTS (SELECT 1 FROM #LockedStock ls WHERE ls.item_id = t.item_id)
        )
        BEGIN
            THROW 53006, N'พบรายการที่ต้องเบิกเพิ่มแต่ไม่มี stock_on_hand', 1;
        END;

        IF EXISTS (
            SELECT 1
            FROM #TargetItems t
            JOIN #LockedStock ls ON ls.item_id = t.item_id
            WHERE t.delta_qty > 0
              AND ls.qty_base < t.delta_qty
        )
        BEGIN
            THROW 53007, N'สต็อกไม่เพียงพอสำหรับการแก้ไข claim (เพิ่มจำนวนเบิก)', 1;
        END;

        -- insert compensating movements only (immutable log)
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
            CASE WHEN t.delta_qty > 0 THEN 'WITHDRAW' ELSE 'RETURN' END AS movement_type,
            t.item_id,
            ABS(t.delta_qty) AS qty_base,
            'SPECIAL_DRUG_CLAIM' AS ref_type,
            CAST(@ClaimId AS VARCHAR(50)) AS ref_id,
            @EditedBy AS created_by,
            GETDATE() AS created_at,
            CONCAT(N'Claim edit by ', @EditedBy, N': ', COALESCE(@Reason, N'ปรับจำนวนยา'))
        FROM #TargetItems t
        WHERE t.delta_qty <> 0;

        -- apply stock_on_hand delta (sum by item)
        ;WITH DeltaByItem AS
        (
            SELECT
                item_id,
                SUM(delta_qty) AS net_delta
            FROM #TargetItems
            GROUP BY item_id
        )
        UPDATE soh
        SET
            soh.qty_base = soh.qty_base - dbi.net_delta,
            soh.updated_at = GETDATE()
        FROM dbo.stock_on_hand soh
        JOIN DeltaByItem dbi ON dbi.item_id = soh.item_id;

        COMMIT TRANSACTION;

        SELECT
            'Success' AS Status,
            N'แก้ไข claim สำเร็จ (ลง movement ชดเชยเรียบร้อย)' AS Message,
            @ClaimId AS claim_id;

        SELECT
            t.claim_item_id,
            t.item_id,
            t.current_issued,
            t.new_issued,
            t.delta_qty
        FROM #TargetItems t
        ORDER BY t.claim_item_id;
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
