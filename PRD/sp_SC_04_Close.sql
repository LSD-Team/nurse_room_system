CREATE OR ALTER PROCEDURE [dbo].[sp_SC_04_Close]
    @ClaimId    BIGINT,
    @ClosedBy   NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ClosedBy = NULLIF(LTRIM(RTRIM(@ClosedBy)), '');

    IF @ClaimId IS NULL OR @ClaimId <= 0
    BEGIN
        SELECT 'Error' AS Status, N'กรุณาระบุ @ClaimId ให้ถูกต้อง' AS Message;
        RETURN;
    END;

    IF @ClosedBy IS NULL
    BEGIN
        SELECT 'Error' AS Status, N'กรุณาระบุ @ClosedBy' AS Message;
        RETURN;
    END;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.special_drug_claims WHERE claim_id = @ClaimId)
        BEGIN
            THROW 54001, N'ไม่พบ claim ตามที่ระบุ', 1;
        END;

        UPDATE dbo.special_drug_claims
        SET 
            [status] = 'CLOSED',
            -- เราอาจจะเพิ่มคอลัมน์ closed_by, closed_at ในอนาคตถ้าต้องการ
            -- แต่เบื้องต้นใช้การอัปเดตสถานะก่อน
            reason = CONCAT(reason, CHAR(13), CHAR(10), N'[Closed by ', @ClosedBy, N' at ', CONVERT(NVARCHAR(20), GETDATE(), 120), N']')
        WHERE claim_id = @ClaimId;

        SELECT
            'Success' AS Status,
            N'ปิดรายการเบิกยาพิเศษเรียบร้อยแล้ว' AS Message,
            @ClaimId AS claim_id;

    END TRY
    BEGIN CATCH
        SELECT
            'Error' AS Status,
            ERROR_MESSAGE() AS Message,
            ERROR_NUMBER() AS ErrorNumber;
    END CATCH;
END;
GO
