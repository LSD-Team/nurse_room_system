-- ----------------------------
-- procedure structure for sp_UpsertSupplier
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpsertSupplier]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_UpsertSupplier]
GO

CREATE PROCEDURE [dbo].[sp_UpsertSupplier]
    @SupplierId   NVARCHAR(20)  = NULL,
    @SupplierName NVARCHAR(200) = NULL,   -- ← เปลี่ยนเป็น optional
    @ContactName  NVARCHAR(100) = NULL,
    @Phone        NVARCHAR(20)  = NULL,
    @Email        NVARCHAR(100) = NULL,
    @Address      NVARCHAR(500) = NULL,
    @TaxId        NVARCHAR(20)  = NULL,
    @IsActive     NVARCHAR(5)   = NULL,   -- ← เปลี่ยนเป็น NVARCHAR รับ '' ได้
    @Note         NVARCHAR(200) = NULL,
    @CreatedBy    NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    ------------------------------------------------------------
    -- Normalize: แปลง '' → NULL ทุกตัว
    ------------------------------------------------------------
    SET @SupplierId   = NULLIF(LTRIM(RTRIM(@SupplierId)),   '');
    SET @SupplierName = NULLIF(LTRIM(RTRIM(@SupplierName)), '');
    SET @ContactName  = NULLIF(LTRIM(RTRIM(@ContactName)),  '');
    SET @Phone        = NULLIF(LTRIM(RTRIM(@Phone)),        '');
    SET @Email        = NULLIF(LTRIM(RTRIM(@Email)),        '');
    SET @Address      = NULLIF(LTRIM(RTRIM(@Address)),      '');
    SET @TaxId        = NULLIF(LTRIM(RTRIM(@TaxId)),        '');
    SET @IsActive     = NULLIF(LTRIM(RTRIM(@IsActive)),     '');
    SET @Note         = NULLIF(LTRIM(RTRIM(@Note)),         '');

    -- แปลง '-' → NULL
    SET @TaxId        = NULLIF(@TaxId, '-');

    -- แปลง @IsActive → BIT (NULL = ไม่เปลี่ยน)
    DECLARE @IsActiveBit BIT = CASE
        WHEN @IsActive = '1'     THEN 1
        WHEN @IsActive = '0'     THEN 0
        WHEN @IsActive = 'true'  THEN 1
        WHEN @IsActive = 'false' THEN 0
        ELSE NULL   -- ← NULL = ไม่เปลี่ยนค่าเดิม
    END;

    ------------------------------------------------------------
    -- MODE: UPDATE
    ------------------------------------------------------------
    IF @SupplierId IS NOT NULL
    BEGIN
        IF ISNUMERIC(@SupplierId) = 0
        BEGIN
            SELECT 'Error' AS Status,
                   'supplier_id ต้องเป็นตัวเลข' AS Message;
            RETURN;
        END;

        DECLARE @SupplierIdInt INT = CAST(@SupplierId AS INT);

        IF NOT EXISTS (
            SELECT 1 FROM suppliers
            WHERE supplier_id = @SupplierIdInt
        )
        BEGIN
            SELECT 'Error' AS Status,
                   'ไม่พบ supplier_id = ' + @SupplierId AS Message;
            RETURN;
        END;

        -- อัปเดตเฉพาะ field ที่ส่งมา ถ้าเป็น NULL → คงค่าเดิม
        UPDATE suppliers
        SET
            supplier_name = ISNULL(@SupplierName, supplier_name),
            contact_name  = ISNULL(@ContactName,  contact_name),
            phone         = ISNULL(@Phone,         phone),
            email         = ISNULL(@Email,         email),
            address       = ISNULL(@Address,       address),
            tax_id        = ISNULL(@TaxId,         tax_id),
            is_active     = ISNULL(@IsActiveBit,   is_active),  -- ← คงค่าเดิมถ้าไม่ส่งมา
            note          = ISNULL(@Note,          note)
        WHERE supplier_id = @SupplierIdInt;

        DECLARE @ExistingCode NVARCHAR(20);
        SELECT @ExistingCode = supplier_code
        FROM suppliers
        WHERE supplier_id = @SupplierIdInt;

        SELECT 'Success' AS Status,
               'อัปเดต supplier เรียบร้อย' AS Message;

        SELECT
            @SupplierIdInt AS supplier_id,
            @ExistingCode  AS supplier_code;
        RETURN;
    END;

    ------------------------------------------------------------
    -- MODE: INSERT
    -- SupplierName บังคับเฉพาะตอน INSERT
    ------------------------------------------------------------
    IF @SupplierName IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'กรุณาระบุ SupplierName' AS Message;
        RETURN;
    END;

    DECLARE
        @NewSupplierCode NVARCHAR(20),
        @RunNo           INT,
        @RunText         CHAR(3);

    SELECT
        @RunNo = ISNULL(MAX(CAST(RIGHT(supplier_code, 3) AS INT)), 0) + 1
    FROM suppliers
    WHERE supplier_code LIKE 'SUP[0-9][0-9][0-9]';

    SET @RunText         = RIGHT('000' + CAST(@RunNo AS VARCHAR(3)), 3);
    SET @NewSupplierCode = 'SUP' + @RunText;

    BEGIN TRY
        INSERT INTO suppliers (
            supplier_code, supplier_name,
            contact_name, phone, email,
            address, tax_id,
            is_active, note, created_by
        )
        VALUES (
            @NewSupplierCode, @SupplierName,
            @ContactName, @Phone, @Email,
            @Address, @TaxId,
            ISNULL(@IsActiveBit, 1),   -- ← INSERT default = 1
            @Note, @CreatedBy
        );

        DECLARE @NewId INT = SCOPE_IDENTITY();

        SELECT 'Success' AS Status,
               'เพิ่ม supplier เรียบร้อย' AS Message;

        SELECT
            @NewId           AS supplier_id,
            @NewSupplierCode AS supplier_code;
    END TRY
    BEGIN CATCH
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_GetSupplier
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetSupplier]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_GetSupplier]
GO

CREATE PROCEDURE [dbo].[sp_GetSupplier]
    @SupplierId   INT         = NULL,
    @SupplierCode VARCHAR(20) = NULL,
    @IsActive     BIT         = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- ✅ แก้ไข: ใช้ NULLIF เฉพาะ VARCHAR เท่านั้น
    SET @SupplierCode = NULLIF(LTRIM(RTRIM(@SupplierCode)), '');

    -- ✅ แก้ไข: @SupplierId เป็น INT → ถ้าส่งค่า 0 มาให้ถือเป็น NULL (ไม่ filter)
    IF @SupplierId = 0
        SET @SupplierId = NULL;

    SELECT
        supplier_id,
        supplier_code,
        supplier_name,
        contact_name,
        phone,
        email,
        address,
        tax_id,
        is_active,
        note,
        created_by,
        created_at
    FROM suppliers
    WHERE (@SupplierId   IS NULL OR supplier_id   = @SupplierId)
      AND (@SupplierCode IS NULL OR supplier_code = @SupplierCode)
      AND (@IsActive     IS NULL OR is_active     = @IsActive)
    ORDER BY supplier_code
    OPTION (RECOMPILE);  -- ✅ แก้ปัญหา Parameter Sniffing / Query Plan Cache

END;
GO


-- ----------------------------
-- procedure structure for sp_GRCancel
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GRCancel]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_GRCancel]
GO

CREATE PROCEDURE [dbo].[sp_GRCancel]
    @GrId        INT,
    @CancelledBy NVARCHAR(100),
    @Reason      NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Status VARCHAR(20);
    SELECT @Status = status FROM gr_headers WHERE gr_id = @GrId;

    IF @Status IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ gr_id = ' + CAST(@GrId AS VARCHAR) AS Message;
        RETURN;
    END;

    IF @Status <> 'DRAFT'
    BEGIN
        SELECT 'Error' AS Status,
               'ยกเลิกได้เฉพาะสถานะ DRAFT (ปัจจุบัน: ' + @Status + ')' AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE gr_headers
        SET
            status       = 'CANCELLED',
            cancelled_at = GETDATE(),
            cancelled_by = @CancelledBy,
            updated_by = @CancelledBy,  
            updated_at = GETDATE(),     
            note         = ISNULL(note, '')
                           + CASE WHEN @Reason IS NOT NULL
                                  THEN ' | ยกเลิกเนื่องจาก: ' + @Reason
                                  ELSE '' END
        WHERE gr_id = @GrId;

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'ยกเลิก GR gr_id = ' + CAST(@GrId AS VARCHAR) + ' เรียบร้อย' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_PO_03_SubmitPO
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_PO_03_SubmitPO]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_PO_03_SubmitPO]
GO

CREATE PROCEDURE [dbo].[sp_PO_03_SubmitPO]
    @PoId     NVARCHAR(20),
    @SubmitBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SET @PoId = NULLIF(LTRIM(RTRIM(@PoId)), '');

    IF @PoId IS NULL OR ISNUMERIC(@PoId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @PoId' AS Message;
        RETURN;
    END;

    DECLARE @PoIdInt INT = CAST(@PoId AS INT);
    DECLARE @Status VARCHAR(30), @PoNo VARCHAR(20);

    SELECT @Status = status, @PoNo = po_no
    FROM po_headers WHERE po_id = @PoIdInt;

    IF @Status IS NULL
    BEGIN
        SELECT 'Error' AS Status, 'ไม่พบ po_id = ' + @PoId AS Message;
        RETURN;
    END;

    IF @Status <> 'DRAFT'
    BEGIN
        SELECT 'Error' AS Status,
               'ส่งอนุมัติได้เฉพาะสถานะ DRAFT (ปัจจุบัน: '
               + @Status + ')' AS Message;
        RETURN;
    END;

    IF NOT EXISTS (SELECT 1 FROM po_lines WHERE po_id = @PoIdInt)
    BEGIN
        SELECT 'Error' AS Status, 'ไม่มีรายการสินค้าใน PO นี้' AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE po_headers
        SET status = 'PENDING_APPROVAL'
        WHERE po_id = @PoIdInt;

        DELETE FROM po_approvals WHERE po_id = @PoIdInt;

        INSERT INTO po_approvals (po_id, approval_level, approval_role, status)
        VALUES
            (@PoIdInt, 1, 'GROUP_LEAD',  'PENDING'),
            (@PoIdInt, 2, 'MANAGER',     'PENDING'),
            (@PoIdInt, 3, 'DEPARTMENT',  'PENDING');

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'ส่งอนุมัติ PO ' + @PoNo
               + ' เรียบร้อย (PENDING_APPROVAL)' AS Message;

        ------------------------------------------------------------
        -- Return ข้อมูลสำหรับ Application ส่ง Email
        -- ดึง Email ตรงจาก view_email ด้วย approver_id ของ GROUP_LEAD
        ------------------------------------------------------------
        SELECT
            ar.role_code        AS approve_role,
            ar.approver_id      AS employee_id,
            ve.eng_name,
            ve.email,
            '[รออนุมัติ] PO เลขที่ ' + @PoNo
                                AS subject,
            'มี PO เลขที่ '    + @PoNo
            + ' รอการอนุมัติจากท่าน'
            + CHAR(13) + CHAR(10)
            + 'ส่งโดย: '       + @SubmitBy
                                AS body
        FROM approval_roles ar
        JOIN view_email     ve ON ar.approver_id = ve.employee_id
        WHERE ar.role_code  = 'GROUP_LEAD'
          AND ar.is_active  = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_PO_04_ApprovePO
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_PO_04_ApprovePO]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_PO_04_ApprovePO]
GO

CREATE PROCEDURE [dbo].[sp_PO_04_ApprovePO]
    @PoId       NVARCHAR(20),
    @Action     NVARCHAR(10),
    @ActionedBy NVARCHAR(100),  -- รหัสพนักงาน
    @Remark     NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @PoId       = NULLIF(LTRIM(RTRIM(@PoId)),       '');
    SET @Action     = UPPER(NULLIF(LTRIM(RTRIM(@Action)), ''));
    SET @ActionedBy = NULLIF(LTRIM(RTRIM(@ActionedBy)), '');
    SET @Remark     = NULLIF(LTRIM(RTRIM(@Remark)),     '');

    ------------------------------------------------------------
    -- 1) ตรวจ parameter
    ------------------------------------------------------------
    IF @PoId IS NULL OR ISNUMERIC(@PoId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @PoId' AS Message;
        RETURN;
    END;

    IF @ActionedBy IS NULL
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @ActionedBy' AS Message;
        RETURN;
    END;

    IF @Action NOT IN ('APPROVE', 'REJECT')
    BEGIN
        SELECT 'Error' AS Status,
               'Action ที่รองรับ: APPROVE, REJECT' AS Message;
        RETURN;
    END;

    DECLARE @PoIdInt INT = CAST(@PoId AS INT);

    ------------------------------------------------------------
    -- 2) ดึงข้อมูล PO
    ------------------------------------------------------------
    DECLARE
        @CurrentStatus VARCHAR(30),
        @PoNo          VARCHAR(20),
        @CreatedBy     NVARCHAR(100);

    SELECT
        @CurrentStatus = status,
        @PoNo          = po_no,
        @CreatedBy     = created_by
    FROM po_headers
    WHERE po_id = @PoIdInt;

    IF @CurrentStatus IS NULL
    BEGIN
        SELECT 'Error' AS Status, 'ไม่พบ po_id = ' + @PoId AS Message;
        RETURN;
    END;

    IF @CurrentStatus NOT IN ('PENDING_APPROVAL', 'APPROVED_L1', 'APPROVED_L2')
    BEGIN
        SELECT 'Error' AS Status,
               'PO นี้ไม่ได้อยู่ระหว่างรออนุมัติ (สถานะ: '
               + @CurrentStatus + ')' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 3) ตรวจสิทธิ์ → ดึง Role ของ ActionedBy จาก approval_roles
    ------------------------------------------------------------
    DECLARE @Role NVARCHAR(50);

    SELECT @Role = role_code
    FROM approval_roles
    WHERE approver_id = @ActionedBy
      AND is_active   = 1;

    IF @Role IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'รหัสพนักงาน ' + @ActionedBy
               + ' ไม่มีสิทธิ์อนุมัติ PO' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 4) ตรวจว่า Role ตรงกับลำดับปัจจุบันของ PO
    ------------------------------------------------------------
    DECLARE @ExpectedRole NVARCHAR(50) = CASE @CurrentStatus
        WHEN 'PENDING_APPROVAL' THEN 'GROUP_LEAD'
        WHEN 'APPROVED_L1'      THEN 'MANAGER'
        WHEN 'APPROVED_L2'      THEN 'DEPARTMENT'
    END;

    IF @Role <> @ExpectedRole
    BEGIN
        SELECT 'Error' AS Status,
               'รหัสพนักงาน ' + @ActionedBy
               + ' เป็น ' + @Role
               + ' แต่ลำดับนี้ต้องให้ ' + @ExpectedRole
               + ' อนุมัติก่อน' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 5) ตรวจว่า approval row ยังเป็น PENDING อยู่
    ------------------------------------------------------------
    IF NOT EXISTS (
        SELECT 1 FROM po_approvals
        WHERE po_id        = @PoIdInt
          AND approval_role = @Role
          AND status        = 'PENDING'
    )
    BEGIN
        SELECT 'Error' AS Status,
               'approval ระดับ ' + @Role
               + ' ของ PO นี้ไม่ได้อยู่ในสถานะ PENDING' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 6) กำหนด Next Status
    ------------------------------------------------------------
    DECLARE @NextStatus VARCHAR(30) = CASE
        WHEN @Action = 'REJECT'       THEN 'DRAFT'
        WHEN @Role   = 'GROUP_LEAD'   THEN 'APPROVED_L1'
        WHEN @Role   = 'MANAGER'      THEN 'APPROVED_L2'
        WHEN @Role   = 'DEPARTMENT'   THEN 'ORDERED'
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        ------------------------------------------------------------
        -- 7) Update approval row
        ------------------------------------------------------------
        UPDATE po_approvals
        SET
            status      = @Action,
            actioned_by = @ActionedBy,
            actioned_at = GETDATE(),
            remark      = @Remark
        WHERE po_id        = @PoIdInt
          AND approval_role = @Role;

        ------------------------------------------------------------
        -- 8) Update PO status
        ------------------------------------------------------------
        UPDATE po_headers
        SET status = @NextStatus
        WHERE po_id = @PoIdInt;

        ------------------------------------------------------------
        -- 9) ถ้า REJECT → ยกเลิก approval ที่เหลือ
        ------------------------------------------------------------
        IF @Action = 'REJECT'
        BEGIN
            UPDATE po_approvals
            SET status = 'CANCELLED'
            WHERE po_id = @PoIdInt AND status = 'PENDING';
        END;

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               CASE @Action
                   WHEN 'APPROVE' THEN 'อนุมัติ PO ' + @PoNo
                                       + ' โดย ' + @ActionedBy
                                       + ' (' + @Role + ')'
                                       + ' → ' + @NextStatus
                   WHEN 'REJECT'  THEN 'ปฏิเสธ PO ' + @PoNo
                                       + ' โดย ' + @ActionedBy
                                       + ' (' + @Role + ')'
                                       + ' → กลับสู่ DRAFT'
               END AS Message;

        ------------------------------------------------------------
        -- 10) Return Email สำหรับ Application ส่งแจ้งเตือน
        ------------------------------------------------------------
        IF @Action = 'REJECT'
        BEGIN
            -- แจ้ง HR (ผู้สร้าง PO) ว่าถูก REJECT
            SELECT
                'HR'                AS notify_role,
                @CreatedBy          AS employee_id,
                ve.eng_name,
                ve.email,
                '[ปฏิเสธ] PO เลขที่ ' + @PoNo
                + ' ถูกปฏิเสธโดย ' + @Role
                                    AS subject,
                'PO เลขที่ '       + @PoNo
                + ' ถูกปฏิเสธโดย ' + @ActionedBy
                + ' (' + @Role + ')'
                + CHAR(13) + CHAR(10)
                + 'เหตุผล: '       + ISNULL(@Remark, 'ไม่ระบุ')
                + CHAR(13) + CHAR(10)
                + 'กรุณาแก้ไขและส่งอนุมัติใหม่อีกครั้ง'
                                    AS body
            FROM view_email ve
            WHERE ve.employee_id = @CreatedBy;
        END
        ELSE IF @Action = 'APPROVE' AND @NextStatus = 'ORDERED'
        BEGIN
            -- แจ้ง HR ว่า PO อนุมัติครบแล้ว
            SELECT
                'HR'                AS notify_role,
                @CreatedBy          AS employee_id,
                ve.eng_name,
                ve.email,
                '[อนุมัติแล้ว] PO เลขที่ ' + @PoNo
                + ' พร้อมสั่งซื้อ' AS subject,
                'PO เลขที่ '       + @PoNo
                + ' ได้รับการอนุมัติครบทุกระดับแล้ว'
                + CHAR(13) + CHAR(10)
                + 'สถานะ: ORDERED - พร้อมดำเนินการสั่งซื้อ'
                                    AS body
            FROM view_email ve
            WHERE ve.employee_id = @CreatedBy;
        END
        ELSE IF @Action = 'APPROVE'
        BEGIN
            -- แจ้งผู้อนุมัติระดับถัดไป
            DECLARE @NextRole NVARCHAR(50) = CASE @Role
                WHEN 'GROUP_LEAD' THEN 'MANAGER'
                WHEN 'MANAGER'    THEN 'DEPARTMENT'
            END;

            SELECT
                ar.role_code        AS notify_role,
                ar.approver_id      AS employee_id,
                ve.eng_name,
                ve.email,
                '[รออนุมัติ] PO เลขที่ ' + @PoNo
                                    AS subject,
                'มี PO เลขที่ '    + @PoNo
                + ' รอการอนุมัติจากท่าน'
                + CHAR(13) + CHAR(10)
                + 'ผ่านการอนุมัติจาก ' + @Role
                + ' โดย '           + @ActionedBy + ' แล้ว'
                + CHAR(13) + CHAR(10)
                + 'กรุณาเข้าสู่ระบบเพื่อตรวจสอบและอนุมัติ'
                                    AS body
            FROM approval_roles ar
            JOIN view_email     ve ON ar.approver_id = ve.employee_id
            WHERE ar.role_code  = @NextRole
              AND ar.is_active  = 1;
        END;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_POCancel
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_POCancel]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_POCancel]
GO

CREATE PROCEDURE [dbo].[sp_POCancel]
    @PoId        NVARCHAR(20),
    @CancelledBy NVARCHAR(100),
    @Reason      NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @PoId   = NULLIF(LTRIM(RTRIM(@PoId)),   '');
    SET @Reason = NULLIF(LTRIM(RTRIM(@Reason)), '');

    IF @PoId IS NULL OR ISNUMERIC(@PoId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @PoId' AS Message;
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
               'ไม่พบ po_id = ' + @PoId AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- ยกเลิกได้ทุก status ยกเว้น CLOSED และ CANCELLED
    ------------------------------------------------------------
    IF @Status IN ('CLOSED', 'CANCELLED')
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่สามารถยกเลิกได้: PO อยู่ในสถานะ ' + @Status AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE po_headers
        SET
            status = 'CANCELLED',
            note   = ISNULL(note, '')
                     + CASE WHEN @Reason IS NOT NULL
                            THEN ' | ยกเลิก: ' + @Reason
                            ELSE '' END,
            updated_by = @CancelledBy,   -- ✅
            updated_at = GETDATE()
        WHERE po_id = @PoIdInt;

        -- ยกเลิก approval ที่ยัง PENDING ด้วย
        UPDATE po_approvals
        SET status = 'CANCELLED'
        WHERE po_id  = @PoIdInt
          AND status = 'PENDING';
          
        UPDATE borrow_headers
        SET 
            status     = 'RECEIVED',
            po_id      = NULL,
            settled_at = NULL,
            settled_by = NULL
        WHERE po_id = @PoIdInt
          AND status = 'SETTLED';

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'ยกเลิก PO ' + @PoNo + ' เรียบร้อย' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_PO_02_GetPO
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_PO_02_GetPO]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_PO_02_GetPO]
GO

CREATE PROCEDURE [dbo].[sp_PO_02_GetPO]
    @PoId   NVARCHAR(20) = NULL,
    @PoNo   NVARCHAR(20) = NULL,
    @Status NVARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @PoId   = NULLIF(LTRIM(RTRIM(@PoId)),   '');
    SET @PoNo   = NULLIF(LTRIM(RTRIM(@PoNo)),   '');
    SET @Status = NULLIF(LTRIM(RTRIM(@Status)), '');

    ------------------------------------------------------------
    -- 1) Header + ข้อมูล creator จาก view_email
    ------------------------------------------------------------
    SELECT
        h.po_id,
        h.po_no,
        h.po_date,
        h.supplier_id,
        h.due_date,
        h.status,
        h.note,
        h.created_by,
        ve.eng_name     AS created_by_name,  -- ← จาก view_email
        ve.email        AS created_by_email, -- ← จาก view_email
        h.created_at
    FROM po_headers h
    LEFT JOIN view_email ve ON h.created_by = ve.employee_id
    WHERE (@PoId   IS NULL OR h.po_id  = CAST(@PoId AS INT))
      AND (@PoNo   IS NULL OR h.po_no  = @PoNo)
      AND (@Status IS NULL OR h.status = @Status)
    ORDER BY h.po_date DESC, h.po_id DESC;

    ------------------------------------------------------------
    -- 2) Lines + ข้อมูล item จาก view_items
    ------------------------------------------------------------
    IF @PoId IS NOT NULL OR @PoNo IS NOT NULL
    BEGIN
        SELECT
            l.po_line_id,
            l.po_id,
            l.item_id,
            vi.item_code,            -- ← จาก view_items
            vi.item_name_th,         -- ← จาก view_items
            vi.item_name_en,         -- ← จาก view_items
            vi.purchase_unit_code,   -- ← จาก view_items
            vi.purchase_unit_name_th,-- ← จาก view_items
            l.qty_order,
            l.qty_received,
            l.unit_price,
            l.total_price
        FROM po_lines l
        JOIN po_headers h  ON l.po_id   = h.po_id
        JOIN view_items vi ON l.item_id = vi.item_id
        WHERE (@PoId IS NULL OR h.po_id = CAST(@PoId AS INT))
          AND (@PoNo IS NULL OR h.po_no = @PoNo)
        ORDER BY l.po_line_id;

        ------------------------------------------------------------
        -- 3) Approval history + ข้อมูลผู้อนุมัติจาก view_email
        ------------------------------------------------------------
        SELECT
            a.approval_id,
            a.approval_level,
            a.approval_role,
            a.status,
            a.actioned_by,
            ve.eng_name   AS actioned_by_name,  -- ← จาก view_email
            ve.email      AS actioned_by_email, -- ← จาก view_email
            a.actioned_at,
            a.remark
        FROM po_approvals a
        JOIN po_headers h ON a.po_id = h.po_id
        LEFT JOIN view_email ve ON a.actioned_by = ve.employee_id
        WHERE (@PoId IS NULL OR h.po_id = CAST(@PoId AS INT))
          AND (@PoNo IS NULL OR h.po_no = @PoNo)
        ORDER BY a.approval_level;
    END;
END;
GO


-- ----------------------------
-- procedure structure for sp_Snapshot_03_GetSnapshotByPeriodCode
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_Snapshot_03_GetSnapshotByPeriodCode]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_Snapshot_03_GetSnapshotByPeriodCode]
GO

CREATE PROCEDURE [dbo].[sp_Snapshot_03_GetSnapshotByPeriodCode]
    @PeriodCode VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    SET @PeriodCode = NULLIF(LTRIM(RTRIM(@PeriodCode)), '');

    IF @PeriodCode IS NULL
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @PeriodCode' AS Message;
        RETURN;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.stock_periods
        WHERE period_code = @PeriodCode
    )
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ period_code = ' + @PeriodCode AS Message;
        RETURN;
    END;

    SELECT
        sp.period_code,
        sp.period_start,
        sp.period_end,
        sp.period_status,
        sps.snapshot_id,
        sps.item_id,
        i.item_code,
        i.item_name_th,
        i.item_name_en,
        sps.opening_qty,
        sps.receipts,
        sps.issues,
        sps.adjustments,
        sps.net_movement,
        sps.expected_closing,
        sps.actual_closing,
        sps.diff_qty,
        sps.created_at,
        sps.created_by
    FROM dbo.stock_periods sp
    LEFT JOIN dbo.stock_period_snapshot sps
        ON sps.period_code = sp.period_code
    LEFT JOIN dbo.items i
        ON i.item_id = sps.item_id
    WHERE sp.period_code = @PeriodCode
    ORDER BY sps.item_id, sps.snapshot_id;
END;
GO


-- ----------------------------
-- procedure structure for sp_POGetPendingReceive
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_POGetPendingReceive]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_POGetPendingReceive]
GO

CREATE PROCEDURE [dbo].[sp_POGetPendingReceive]
    @PoId NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    SET @PoId = NULLIF(LTRIM(RTRIM(@PoId)), '');

    IF @PoId IS NULL OR ISNUMERIC(@PoId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @PoId' AS Message;
        RETURN;
    END;

    DECLARE @PoIdInt INT = CAST(@PoId AS INT);

    -- Header
    SELECT
        h.po_id, h.po_no, h.po_date,
        h.supplier_id, h.due_date, h.status
    FROM po_headers h
    WHERE h.po_id = @PoIdInt;

    -- รายการทั้งหมดพร้อมสถานะการรับ
    SELECT
        pl.po_line_id,
        pl.item_id,
        vi.item_name_th,
        vi.purchase_unit_name_th,
        pl.qty_order,
        pl.qty_received,
        pl.qty_order - pl.qty_received AS qty_remaining,
        pl.unit_price,
        CASE
            WHEN pl.qty_received = 0              THEN 'ยังไม่ได้รับ'
            WHEN pl.qty_received < pl.qty_order   THEN 'รับบางส่วน'
            WHEN pl.qty_received = pl.qty_order   THEN 'รับครบแล้ว'
        END AS receive_status
    FROM po_lines pl
    JOIN view_items vi ON pl.item_id = vi.item_id
    WHERE pl.po_id = @PoIdInt
    ORDER BY pl.po_line_id;
END;
GO


-- ----------------------------
-- procedure structure for sp_PP_01_GetOrCreatePatientProfile
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_PP_01_GetOrCreatePatientProfile]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_PP_01_GetOrCreatePatientProfile]
GO

CREATE PROCEDURE [dbo].[sp_PP_01_GetOrCreatePatientProfile]
    @PatientType        NVARCHAR(20),
    @EmployeeId         NVARCHAR(50),
    @ExternalPersonId   INT,
    @CreatedBy          NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- ════════════════════════════════════════
    -- Normalize Input
    -- ═════════════════���══════════════════════
    SET @EmployeeId = NULLIF(LTRIM(RTRIM(@EmployeeId)), '');

    IF @ExternalPersonId = 0
    BEGIN
        SET @ExternalPersonId = NULL;
    END

    -- ════════════════════════════════════════
    -- Validate
    -- ════════════════════════════════════════
    IF @PatientType NOT IN ('EMP', 'EXT')
    BEGIN
        RAISERROR('PatientType must be EMP or EXT', 16, 1);
        RETURN;
    END

    IF @PatientType = 'EMP' AND @EmployeeId IS NULL
    BEGIN
        RAISERROR('EMPLOYEE type requires EmployeeId', 16, 1);
        RETURN;
    END

    IF @PatientType = 'EXT' AND @ExternalPersonId IS NULL
    BEGIN
        RAISERROR('EXTERNAL type requires ExternalPersonId', 16, 1);
        RETURN;
    END

    -- ════════════════════════════════════════
    -- หา patient_id ที่มีอยู่แล้ว
    -- ════════════════════════════════════════
    DECLARE @PatientId INT;

    IF @PatientType = 'EMP'
    BEGIN
        SELECT @PatientId = patient_id
        FROM dbo.patient_profiles
        WHERE employee_id = @EmployeeId;
    END
    ELSE
    BEGIN
        SELECT @PatientId = patient_id
        FROM dbo.patient_profiles
        WHERE external_person_id = @ExternalPersonId;
    END

    -- ════════════════════════════════════════
    -- ถ้ายังไม่มี → สร้างใหม่
    -- ════════════════════════════════════════
    IF @PatientId IS NULL
    BEGIN
        INSERT INTO dbo.patient_profiles (
            patient_type,
            employee_id,
            external_person_id,
            created_by
        )
        VALUES (
            @PatientType,
            CASE WHEN @PatientType = 'EMP' THEN @EmployeeId      ELSE NULL END,
            CASE WHEN @PatientType = 'EXT' THEN @ExternalPersonId ELSE NULL END,
            @CreatedBy
        );

        SET @PatientId = SCOPE_IDENTITY();

        SELECT
            @PatientId AS patient_id,
            'CREATED'  AS action;
    END
    ELSE
    BEGIN
        SELECT
            @PatientId AS patient_id,
            'EXISTS'   AS action;
    END

END;
GO


-- ----------------------------
-- procedure structure for sp_PP_02_UpsertPatientAllergy
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_PP_02_UpsertPatientAllergy]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_PP_02_UpsertPatientAllergy]
GO

CREATE PROCEDURE [dbo].[sp_PP_02_UpsertPatientAllergy]
    @AllergyId      INT,            -- null = สร้างใหม่, มีค่า = แก้ไข
    @PatientId      INT,
    @AllergyType    NVARCHAR(20),   -- 'DRUG' | 'FOOD' | 'SUBSTANCE' | 'OTHER'
    @AllergyName    NVARCHAR(200),
    @ItemId         INT,            -- optional: เชื่อม items table
    @Reaction       NVARCHAR(500),
    @Severity       NVARCHAR(20),   -- 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING'
    @Source         NVARCHAR(30),   -- 'SELF_REPORT' | 'MEDICAL_RECORD' | 'RELATIVE'
    @NotedAt        DATE = NULL,
    @NotedBy        NVARCHAR(100),
    @IsActive       BIT
AS
BEGIN
    SET NOCOUNT ON;

    -- Normalization
    IF @NotedAt IS NULL OR @NotedAt = '1900-01-01'
        SET @NotedAt = CONVERT(DATE, GETDATE());
    IF @AllergyId = 0 SET @AllergyId = NULL;

    -- ตรวจสอบสถานะว่าคนนี้ถูก soft-delete หรือไม่
    DECLARE @patient_type NVARCHAR(20), @employee_id INT, @external_person_id INT, @is_deleted BIT;

    SELECT
        @patient_type = patient_type,
        @employee_id = employee_id,
        @external_person_id = external_person_id
    FROM dbo.patient_profiles
    WHERE patient_id = @PatientId;

    SET @is_deleted = 0;

    IF @patient_type = 'EXTERNAL' AND @external_person_id IS NOT NULL
    BEGIN
        SELECT @is_deleted = is_deleted
        FROM dbo.external_people
        WHERE external_person_id = @external_person_id;
    END

    IF @is_deleted = 1
    BEGIN
        SELECT NULL AS allergy_id, 'SKIPPED_SOFT_DELETED' AS action, 
            N'ไม่สามารถบันทึก/แก้ไขของคนที่ถูกลบออกจากระบบ' AS warning_message;
        RETURN;
    END

    IF @AllergyId IS NULL
    BEGIN
        -- INSERT ใหม่
        INSERT INTO dbo.patient_allergies
            (patient_id, allergy_type, drug_name, item_id,
             reaction, severity, source, noted_at, noted_by, is_active)
        VALUES
            (@PatientId, @AllergyType, @AllergyName, @ItemId,
             @Reaction, @Severity, @Source, @NotedAt, @NotedBy, @IsActive);

        SELECT SCOPE_IDENTITY() AS allergy_id, 'CREATED' AS action, NULL AS warning_message;
    END
    ELSE
    BEGIN
        -- UPDATE
        UPDATE dbo.patient_allergies SET
            allergy_type = @AllergyType,
            drug_name    = @AllergyName,
            item_id      = @ItemId,
            reaction     = @Reaction,
            severity     = @Severity,
            source       = @Source,
            noted_at     = @NotedAt,
            noted_by     = @NotedBy,
            is_active    = @IsActive
        WHERE allergy_id = @AllergyId
          AND patient_id = @PatientId;

        SELECT @AllergyId AS allergy_id, 'UPDATED' AS action, NULL AS warning_message;
    END
END
GO


-- ----------------------------
-- procedure structure for sp_BR_01_Create
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_BR_01_Create]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_BR_01_Create]
GO

CREATE PROCEDURE [dbo].[sp_BR_01_Create]
    @JsonLines  NVARCHAR(MAX),
    @SupplierId NVARCHAR(20),
    @Note       NVARCHAR(500) = NULL,
    @CreatedBy  NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- ✅ เพิ่ม JSON validation
    IF ISJSON(@JsonLines) = 0
    BEGIN
        SELECT 'Error' AS Status, 'JSON ไม่ถูกต้อง' AS Message;
        RETURN;
    END;

    SET @SupplierId = NULLIF(LTRIM(RTRIM(@SupplierId)), '');
    SET @Note       = NULLIF(LTRIM(RTRIM(@Note)),       '');

    IF @SupplierId IS NULL OR ISNUMERIC(@SupplierId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @SupplierId' AS Message;
        RETURN;
    END;

    DECLARE
        @SupplierIdInt INT  = CAST(@SupplierId AS INT),
        @BorrowDateDt  DATE = CAST(GETDATE() AS DATE);

    IF NOT EXISTS (
        SELECT 1 FROM suppliers
        WHERE supplier_id = @SupplierIdInt AND is_active = 1
    )
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ supplier_id = ' + @SupplierId
               + ' หรือ supplier ไม่ได้ใช้งาน' AS Message;
        RETURN;
    END;

    -- ✅ เปลี่ยนจาก fn_ParseStockJson เป็น OPENJSON
    CREATE TABLE #Lines (
        item_id INT,
        qty     DECIMAL(18,4)
    );

    INSERT INTO #Lines (item_id, qty)
    SELECT
        CAST(JSON_VALUE(j.value, '$.item_id') AS INT) AS item_id,
        CAST(JSON_VALUE(j.value, '$.qty') AS DECIMAL(18,4)) AS qty
    FROM OPENJSON(@JsonLines) AS j
    WHERE ISJSON(j.value) = 1
      AND JSON_VALUE(j.value, '$.item_id') IS NOT NULL
      AND ISNUMERIC(JSON_VALUE(j.value, '$.item_id')) = 1
      AND JSON_VALUE(j.value, '$.qty') IS NOT NULL
      AND ISNUMERIC(JSON_VALUE(j.value, '$.qty')) = 1;

    IF NOT EXISTS (SELECT 1 FROM #Lines)
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุรายการสินค้าใน JSON' AS Message;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1 FROM #Lines l
        LEFT JOIN items i ON l.item_id = i.item_id
        WHERE i.item_id IS NULL
    )
    BEGIN
        SELECT 'Error' AS Status, 'มี item_id ที่ไม่พบในระบบ' AS Message;
        RETURN;
    END;

    IF EXISTS (SELECT 1 FROM #Lines WHERE qty <= 0)
    BEGIN
        SELECT 'Error' AS Status, 'qty ต้องมากกว่า 0 ทุกรายการ' AS Message;
        RETURN;
    END;

    CREATE TABLE #LinesWithPrice (
        item_id    INT,
        qty_borrow DECIMAL(18,4),
        unit_price DECIMAL(18,4)
    );

    INSERT INTO #LinesWithPrice (item_id, qty_borrow, unit_price)
    SELECT
        l.item_id,
        l.qty,
        spl.unit_price
    FROM #Lines l
    LEFT JOIN supplier_price_list spl
           ON spl.item_id        = l.item_id
          AND spl.supplier_id    = @SupplierIdInt
          AND spl.is_active      = 1
          AND spl.effective_date <= @BorrowDateDt
          AND (spl.expire_date IS NULL
               OR spl.expire_date >= @BorrowDateDt);

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

    -- Generate BR No: BRYYYYmm-xxx
    DECLARE
        @YearMonth CHAR(6) = CONVERT(CHAR(6), @BorrowDateDt, 112),
        @RunNo     INT,
        @RunText   CHAR(3),
        @BorrowNo  VARCHAR(20);

    SELECT @RunNo = ISNULL(MAX(CAST(RIGHT(borrow_no, 3) AS INT)), 0) + 1
    FROM borrow_headers
    WHERE borrow_no LIKE 'BR' + CONVERT(CHAR(6), @BorrowDateDt, 112) + '%';

    SET @RunText  = RIGHT('000' + CAST(@RunNo AS VARCHAR(3)), 3);
    SET @BorrowNo = 'BR' + @YearMonth + '-' + @RunText;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO borrow_headers (
            borrow_no, borrow_date, supplier_id,
            status, note, created_by, created_at
        )
        VALUES (
            @BorrowNo, @BorrowDateDt, @SupplierIdInt,
            'DRAFT', @Note, @CreatedBy, GETDATE()
        );

        DECLARE @BorrowId INT = SCOPE_IDENTITY();

        INSERT INTO borrow_lines (borrow_id, item_id, qty_borrow, unit_price)
        SELECT @BorrowId, item_id, qty_borrow, unit_price
        FROM #LinesWithPrice;

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'สร้าง Borrow เลขที่ ' + @BorrowNo + ' (DRAFT) เรียบร้อย' AS Message;

        SELECT @BorrowId AS borrow_id, @BorrowNo AS borrow_no, 'DRAFT' AS status;

        SELECT
            l.item_id,
            vi.item_name_th,
            vi.purchase_unit_name_th,
            l.qty_borrow,
            l.unit_price,
            l.qty_borrow * l.unit_price AS total_price
        FROM #LinesWithPrice l
        JOIN view_items vi ON l.item_id = vi.item_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_BR_02_Update
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_BR_02_Update]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_BR_02_Update]
GO

CREATE PROCEDURE [dbo].[sp_BR_02_Update]
    @BorrowId  NVARCHAR(20),
    @JsonLines NVARCHAR(MAX) = NULL,
    @Note      NVARCHAR(500) = NULL,
    @UpdatedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SET @BorrowId = NULLIF(LTRIM(RTRIM(@BorrowId)), '');
    SET @Note     = NULLIF(LTRIM(RTRIM(@Note)),     '');

    IF @BorrowId IS NULL OR ISNUMERIC(@BorrowId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @BorrowId' AS Message;
        RETURN;
    END;

    DECLARE @BorrowIdInt INT = CAST(@BorrowId AS INT);

    DECLARE
        @Status        VARCHAR(30),
        @BorrowNo      VARCHAR(20),
        @SupplierIdInt INT,
        @BorrowDateDt  DATE;

    SELECT
        @Status        = status,
        @BorrowNo      = borrow_no,
        @SupplierIdInt = supplier_id,
        @BorrowDateDt  = borrow_date
    FROM borrow_headers
    WHERE borrow_id = @BorrowIdInt;

    IF @Status IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ borrow_id = ' + @BorrowId AS Message;
        RETURN;
    END;

    IF @Status <> ('DRAFT')
    BEGIN
        SELECT 'Error' AS Status,
               'แก้ไขได้เฉพาะสถานะ DRAFT (ปัจจุบัน: ' + @Status + ')' AS Message;
        RETURN;
    END;

    IF @JsonLines IS NOT NULL
    BEGIN
        -- ✅ เพิ่ม JSON validation
        IF ISJSON(@JsonLines) = 0
        BEGIN
            SELECT 'Error' AS Status, 'JSON ไม่ถูกต้อง' AS Message;
            RETURN;
        END;

        CREATE TABLE #Lines (item_id INT, qty DECIMAL(18,4));

        -- ✅ เปลี่ยนจาก fn_ParseStockJson เป็น OPENJSON
        INSERT INTO #Lines (item_id, qty)
        SELECT
            CAST(JSON_VALUE(j.value, '$.item_id') AS INT) AS item_id,
            CAST(JSON_VALUE(j.value, '$.qty') AS DECIMAL(18,4)) AS qty
        FROM OPENJSON(@JsonLines) AS j
        WHERE ISJSON(j.value) = 1
          AND JSON_VALUE(j.value, '$.item_id') IS NOT NULL
          AND ISNUMERIC(JSON_VALUE(j.value, '$.item_id')) = 1
          AND JSON_VALUE(j.value, '$.qty') IS NOT NULL
          AND ISNUMERIC(JSON_VALUE(j.value, '$.qty')) = 1;

        IF NOT EXISTS (SELECT 1 FROM #Lines)
        BEGIN
            SELECT 'Error' AS Status, 'ไม่พบรายการสินค้าใน @JsonLines' AS Message;
            RETURN;
        END;

        IF EXISTS (
            SELECT 1 FROM #Lines l
            LEFT JOIN items i ON l.item_id = i.item_id
            WHERE i.item_id IS NULL
        )
        BEGIN
            SELECT 'Error' AS Status, 'มี item_id ที่ไม่พบในระบบ' AS Message;
            RETURN;
        END;

        IF EXISTS (SELECT 1 FROM #Lines WHERE qty <= 0)
        BEGIN
            SELECT 'Error' AS Status, 'qty ต้องมากกว่า 0 ทุกรายการ' AS Message;
            RETURN;
        END;

        CREATE TABLE #LinesWithPrice (
            item_id    INT,
            qty_borrow DECIMAL(18,4),
            unit_price DECIMAL(18,4)
        );

        INSERT INTO #LinesWithPrice (item_id, qty_borrow, unit_price)
        SELECT
            l.item_id, l.qty, spl.unit_price
        FROM #Lines l
        LEFT JOIN supplier_price_list spl
               ON spl.item_id        = l.item_id
              AND spl.supplier_id    = @SupplierIdInt
              AND spl.is_active      = 1
              AND spl.effective_date <= @BorrowDateDt
              AND (spl.expire_date IS NULL
                   OR spl.expire_date >= @BorrowDateDt);

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
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE borrow_headers
        SET note = ISNULL(@Note, note),
            updated_by = @UpdatedBy,
            updated_at = GETDATE()
        WHERE borrow_id = @BorrowIdInt;

        IF @JsonLines IS NOT NULL
        BEGIN
            DELETE FROM borrow_lines WHERE borrow_id = @BorrowIdInt;

            INSERT INTO borrow_lines (borrow_id, item_id, qty_borrow, unit_price)
            SELECT @BorrowIdInt, item_id, qty_borrow, unit_price
            FROM #LinesWithPrice;
        END;

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'แก้ไข Borrow เลขที่ ' + @BorrowNo + ' เรียบร้อย' AS Message;

        SELECT
            bl.item_id,
            vi.item_name_th,
            vi.purchase_unit_name_th,
            bl.qty_borrow,
            bl.unit_price,
            bl.qty_borrow * bl.unit_price AS total_price
        FROM borrow_lines bl
        JOIN view_items   vi ON bl.item_id = vi.item_id
        WHERE bl.borrow_id = @BorrowIdInt;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_BR_03_Submit
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_BR_03_Submit]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_BR_03_Submit]
GO

CREATE PROCEDURE [dbo].[sp_BR_03_Submit]
    @BorrowId NVARCHAR(20),
    @SubmitBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SET @BorrowId = NULLIF(LTRIM(RTRIM(@BorrowId)), '');

    IF @BorrowId IS NULL OR ISNUMERIC(@BorrowId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @BorrowId' AS Message;
        RETURN;
    END;

    DECLARE @BorrowIdInt INT = CAST(@BorrowId AS INT);

    DECLARE @Status VARCHAR(30), @BorrowNo VARCHAR(20);

    SELECT @Status = status, @BorrowNo = borrow_no
    FROM borrow_headers WHERE borrow_id = @BorrowIdInt;

    IF @Status IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ borrow_id = ' + @BorrowId AS Message;
        RETURN;
    END;

    IF @Status <> 'DRAFT'
    BEGIN
        SELECT 'Error' AS Status,
               'ส่งอนุมัติได้เฉพาะสถานะ DRAFT (ปัจจุบัน: '
               + @Status + ')' AS Message;
        RETURN;
    END;

    IF NOT EXISTS (
        SELECT 1 FROM borrow_lines WHERE borrow_id = @BorrowIdInt
    )
    BEGIN
        SELECT 'Error' AS Status, 'ไม่มีรายการสินค้าใน Borrow นี้' AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE borrow_headers
        SET status = 'PENDING_APPROVAL'
        WHERE borrow_id = @BorrowIdInt;

        DELETE FROM borrow_approvals WHERE borrow_id = @BorrowIdInt;

        INSERT INTO borrow_approvals (
            borrow_id, approval_level, approval_role, status
        )
        VALUES
            (@BorrowIdInt, 1, 'GROUP_LEAD', 'PENDING'),
            (@BorrowIdInt, 2, 'MANAGER',    'PENDING'),
            (@BorrowIdInt, 3, 'DEPARTMENT', 'PENDING');

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'ส่งอนุมัติ Borrow ' + @BorrowNo
               + ' เรียบร้อย (PENDING_APPROVAL)' AS Message;

        -- Email → GROUP_LEAD
        SELECT
            ar.role_code    AS notify_role,
            ar.approver_id  AS employee_id,
            ve.eng_name,
            ve.email,
            '[รออนุมัติ] Borrow เลขที่ ' + @BorrowNo AS subject,
            'มี Borrow เลขที่ '  + @BorrowNo
            + ' รอการอนุมัติจากท่าน'
            + CHAR(13) + CHAR(10)
            + 'ส่งโดย: ' + @SubmitBy                AS body
        FROM approval_roles ar
        JOIN view_email     ve ON ar.approver_id = ve.employee_id
        WHERE ar.role_code  = 'GROUP_LEAD'
          AND ar.is_active  = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_BR_04_Approve
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_BR_04_Approve]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_BR_04_Approve]
GO

CREATE PROCEDURE [dbo].[sp_BR_04_Approve]
    @BorrowId   NVARCHAR(20),
    @Action     NVARCHAR(10),    -- APPROVE / REJECT / REWORK
    @ActionedBy NVARCHAR(100),
    @Remark     NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    ------------------------------------------------------------
    -- Normalize
    ------------------------------------------------------------
    SET @BorrowId   = NULLIF(LTRIM(RTRIM(@BorrowId)),   '');
    SET @Action     = UPPER(NULLIF(LTRIM(RTRIM(@Action)), ''));
    SET @ActionedBy = NULLIF(LTRIM(RTRIM(@ActionedBy)), '');
    SET @Remark     = NULLIF(LTRIM(RTRIM(@Remark)),     '');

    ------------------------------------------------------------
    -- 1) ตรวจ parameter
    ------------------------------------------------------------
    IF @BorrowId IS NULL OR ISNUMERIC(@BorrowId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @BorrowId' AS Message;
        RETURN;
    END;

    IF @ActionedBy IS NULL
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @ActionedBy' AS Message;
        RETURN;
    END;

    IF @Action NOT IN ('APPROVE', 'REJECT', 'REWORK')
    BEGIN
        SELECT 'Error' AS Status,
               'Action ที่รองรับ: APPROVE, REJECT, REWORK' AS Message;
        RETURN;
    END;

    -- REWORK และ REJECT ต้องระบุ Remark
    IF @Action IN ('REJECT', 'REWORK') AND @Remark IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'กรุณาระบุ @Remark สำหรับ ' + @Action AS Message;
        RETURN;
    END;

    DECLARE @BorrowIdInt INT = CAST(@BorrowId AS INT);

    ------------------------------------------------------------
    -- 2) ดึงข้อมูล Borrow
    ------------------------------------------------------------
    DECLARE
        @CurrentStatus VARCHAR(30),
        @BorrowNo      VARCHAR(20),
        @CreatedBy     NVARCHAR(100),
        @SupplierId    INT;

    SELECT
        @CurrentStatus = status,
        @BorrowNo      = borrow_no,
        @CreatedBy     = created_by,
        @SupplierId    = supplier_id
    FROM borrow_headers
    WHERE borrow_id = @BorrowIdInt;

    IF @CurrentStatus IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ borrow_id = ' + @BorrowId AS Message;
        RETURN;
    END;

    IF @CurrentStatus NOT IN ('PENDING_APPROVAL', 'APPROVED_L1', 'APPROVED_L2')
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่สามารถดำเนินการได้: Borrow อยู่ในสถานะ '
               + @CurrentStatus AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 3) ตรวจสิทธิ์จาก approval_roles
    ------------------------------------------------------------
    DECLARE @Role NVARCHAR(50);

    SELECT @Role = role_code
    FROM approval_roles
    WHERE approver_id = @ActionedBy
      AND is_active   = 1;

    IF @Role IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'รหัสพนักงาน ' + @ActionedBy
               + ' ไม่มีสิทธิ์อนุมัติ' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 4) ตรวจลำดับการอนุมัติ
    ------------------------------------------------------------
    DECLARE @ExpectedRole NVARCHAR(50) = CASE @CurrentStatus
        WHEN 'PENDING_APPROVAL' THEN 'GROUP_LEAD'
        WHEN 'APPROVED_L1'      THEN 'MANAGER'
        WHEN 'APPROVED_L2'      THEN 'DEPARTMENT'
    END;

    IF @Role <> @ExpectedRole
    BEGIN
        SELECT 'Error' AS Status,
               'รหัสพนักงาน ' + @ActionedBy
               + ' เป็น ' + @Role
               + ' แต่ลำดับนี้ต้องให้ ' + @ExpectedRole
               + ' ดำเนินการก่อน' AS Message;
        RETURN;
    END;

    IF NOT EXISTS (
        SELECT 1 FROM borrow_approvals
        WHERE borrow_id     = @BorrowIdInt
          AND approval_role = @Role
          AND status        = 'PENDING'
    )
    BEGIN
        SELECT 'Error' AS Status,
               'approval ระดับ ' + @Role
               + ' ของ Borrow นี้ไม่ได้อยู่ในสถานะ PENDING' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 5) กำหนด Next Status
    ------------------------------------------------------------
    DECLARE @NextStatus VARCHAR(30) = CASE
        WHEN @Action = 'REJECT'       THEN 'CANCELLED'
        WHEN @Action = 'REWORK'       THEN 'DRAFT'
        WHEN @Role   = 'GROUP_LEAD'   THEN 'APPROVED_L1'
        WHEN @Role   = 'MANAGER'      THEN 'APPROVED_L2'
        WHEN @Role   = 'DEPARTMENT'   THEN 'APPROVED'
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        ------------------------------------------------------------
        -- 6) Update approval row ปัจจุบัน
        ------------------------------------------------------------
        UPDATE borrow_approvals
        SET
            status      = @Action,
            actioned_by = @ActionedBy,
            actioned_at = GETDATE(),
            remark      = @Remark
        WHERE borrow_id     = @BorrowIdInt
          AND approval_role = @Role;

        ------------------------------------------------------------
        -- 7) Update Borrow status
        ------------------------------------------------------------
        UPDATE borrow_headers
        SET status = @NextStatus
        WHERE borrow_id = @BorrowIdInt;

        ------------------------------------------------------------
        -- 8) REJECT → ยกเลิก approval ที่เหลือทั้งหมด
        ------------------------------------------------------------
        IF @Action = 'REJECT'
        BEGIN
            UPDATE borrow_approvals
            SET status = 'CANCELLED'
            WHERE borrow_id = @BorrowIdInt
              AND status    = 'PENDING';
        END;

        ------------------------------------------------------------
        -- 9) REWORK → Reset approval ทุกระดับกลับเป็น PENDING
        --            เพื่อให้ส่งอนุมัติใหม่ตั้งแต่ต้น
        ------------------------------------------------------------
        IF @Action = 'REWORK'
        BEGIN
            UPDATE borrow_approvals
            SET
                status      = 'PENDING',
                actioned_by = NULL,
                actioned_at = NULL,
                remark      = NULL
            WHERE borrow_id = @BorrowIdInt;
        END;

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               CASE @Action
                   WHEN 'APPROVE' THEN 'อนุมัติ ' + @BorrowNo
                                       + ' โดย ' + @ActionedBy
                                       + ' (' + @Role + ')'
                                       + ' → ' + @NextStatus
                   WHEN 'REJECT'  THEN 'ยกเลิก ' + @BorrowNo
                                       + ' โดย ' + @ActionedBy
                                       + ' (' + @Role + ')'
                                       + ' → CANCELLED'
                   WHEN 'REWORK'  THEN 'ส่งกลับแก้ไข ' + @BorrowNo
                                       + ' โดย ' + @ActionedBy
                                       + ' (' + @Role + ')'
                                       + ' → DRAFT (Reset ทุกระดับ)'
               END AS Message;

        ------------------------------------------------------------
        -- 10) Return Email สำหรับ Application ส่งแจ้งเตือน
        ------------------------------------------------------------
        IF @Action = 'REJECT'
        BEGIN
            -- แจ้ง HR ว่าถูกยกเลิกถาวร
            SELECT
                'HR'             AS notify_role,
                @CreatedBy       AS employee_id,
                ve.eng_name,
                ve.email,
                '[ยกเลิก] Borrow ' + @BorrowNo
                + ' ถูกปฏิเสธโดย ' + @Role
                                 AS subject,
                'Borrow เลขที่ ' + @BorrowNo
                + ' ถูกปฏิเสธโดย ' + @ActionedBy
                + ' (' + @Role + ')'
                + CHAR(13) + CHAR(10)
                + 'เหตุผล: '    + @Remark
                + CHAR(13) + CHAR(10)
                + 'สถานะ: CANCELLED (ไม่สามารถดำเนินการต่อได้)'
                                 AS body
            FROM view_email ve
            WHERE ve.employee_id = @CreatedBy;
        END
        ELSE IF @Action = 'REWORK'
        BEGIN
            -- แจ้ง HR ให้กลับไปแก้ไข
            SELECT
                'HR'             AS notify_role,
                @CreatedBy       AS employee_id,
                ve.eng_name,
                ve.email,
                '[แก้ไข] Borrow ' + @BorrowNo
                + ' ส่งกลับให้แก้ไข'
                                 AS subject,
                'Borrow เลขที่ ' + @BorrowNo
                + ' ถูกส่งกลับให้แก้ไขโดย ' + @ActionedBy
                + ' (' + @Role + ')'
                + CHAR(13) + CHAR(10)
                + 'เหตุผล: '    + @Remark
                + CHAR(13) + CHAR(10)
                + 'กรุณาแก้ไขและส่งอนุมัติใหม่อีกครั้ง'
                                 AS body
            FROM view_email ve
            WHERE ve.employee_id = @CreatedBy;
        END
        ELSE IF @Action = 'APPROVE' AND @NextStatus = 'APPROVED'
        BEGIN
            -- แจ้ง HR ว่าอนุมัติครบแล้ว รอรับยา
            SELECT
                'HR'             AS notify_role,
                @CreatedBy       AS employee_id,
                ve.eng_name,
                ve.email,
                '[อนุมัติแล้ว] Borrow ' + @BorrowNo
                + ' พร้อมรับยา'  AS subject,
                'Borrow เลขที่ ' + @BorrowNo
                + ' ได้รับการอนุมัติครบทุกระดับแล้ว'
                + CHAR(13) + CHAR(10)
                + 'กรุณาดำเนินการรับยาจาก Supplier'
                                 AS body
            FROM view_email ve
            WHERE ve.employee_id = @CreatedBy;
        END
        ELSE IF @Action = 'APPROVE'
        BEGIN
            -- แจ้งผู้อนุมัติระดับถัดไป
            DECLARE @NextRole NVARCHAR(50) = CASE @Role
                WHEN 'GROUP_LEAD' THEN 'MANAGER'
                WHEN 'MANAGER'    THEN 'DEPARTMENT'
            END;

            SELECT
                ar.role_code         AS notify_role,
                ar.approver_id       AS employee_id,
                ve.eng_name,
                ve.email,
                '[รออนุมัติ] Borrow ' + @BorrowNo
                                     AS subject,
                'มี Borrow เลขที่ '  + @BorrowNo
                + ' รอการอนุมัติจากท่าน'
                + CHAR(13) + CHAR(10)
                + 'ผ่านการอนุมัติจาก ' + @Role
                + ' โดย ' + @ActionedBy + ' แล้ว'
                + CHAR(13) + CHAR(10)
                + 'กรุณาเข้าสู่ระบบเพื่อตรวจสอบและอนุมัติ'
                                     AS body
            FROM approval_roles ar
            JOIN view_email     ve ON ar.approver_id = ve.employee_id
            WHERE ar.role_code  = @NextRole
              AND ar.is_active  = 1;
        END;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_BR_05_Receive
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_BR_05_Receive]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_BR_05_Receive]
GO

CREATE PROCEDURE [dbo].[sp_BR_05_Receive]
    @BorrowId   NVARCHAR(20),
    @ReceivedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SET @BorrowId = NULLIF(LTRIM(RTRIM(@BorrowId)), '');

    IF @BorrowId IS NULL OR ISNUMERIC(@BorrowId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @BorrowId' AS Message;
        RETURN;
    END;

    DECLARE @BorrowIdInt INT = CAST(@BorrowId AS INT);

    DECLARE
        @Status        VARCHAR(30),
        @BorrowNo      VARCHAR(20),
        @SupplierIdInt INT,           -- ← เพิ่ม
        @BorrowDateDt  DATE;          -- ← เพิ่ม

    SELECT
        @Status        = status,
        @BorrowNo      = borrow_no,
        @SupplierIdInt = supplier_id,  -- ← เพิ่ม
        @BorrowDateDt  = borrow_date   -- ← เพิ่ม
    FROM borrow_headers
    WHERE borrow_id = @BorrowIdInt;

    IF @Status IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ borrow_id = ' + @BorrowId AS Message;
        RETURN;
    END;

    IF @Status <> 'APPROVED'
    BEGIN
        SELECT 'Error' AS Status,
               'รับยาได้เฉพาะสถานะ APPROVED (ปัจจุบัน: '
               + @Status + ')' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- ✅ เพิ่ม: Pre-compute qty_base พร้อม conversion_factor
    --    เหมือนที่ sp_GR_03_ConfirmGR ทำ
    ------------------------------------------------------------
    CREATE TABLE #BorrowLinesWithBase (
        item_id           INT,
        qty_borrow        DECIMAL(18,4),   -- หน่วยซื้อ (purchase unit)
        conversion_factor DECIMAL(18,4),   -- จาก supplier_price_list
        qty_base          INT              -- หน่วยจ่าย = qty_borrow × factor
    );

    INSERT INTO #BorrowLinesWithBase (
        item_id, qty_borrow, conversion_factor, qty_base
    )
    SELECT
        bl.item_id,
        bl.qty_borrow,
        ISNULL(spl.conversion_factor, 1)                         AS conversion_factor,
        CAST(
            bl.qty_borrow * ISNULL(spl.conversion_factor, 1)
        AS INT)                                                   AS qty_base
    FROM borrow_lines bl
    -- ✅ JOIN supplier_price_list เพื่อดึง conversion_factor
    LEFT JOIN dbo.supplier_price_list spl
           ON spl.item_id        = bl.item_id
          AND spl.supplier_id    = @SupplierIdInt
          AND spl.is_active      = 1
          AND spl.effective_date <= @BorrowDateDt
          AND (spl.expire_date IS NULL OR spl.expire_date >= @BorrowDateDt)
    WHERE bl.borrow_id = @BorrowIdInt;

    BEGIN TRY
        BEGIN TRANSACTION;

        ------------------------------------------------------------
        -- ✅ แก้: ใช้ qty_base (หน่วยจ่าย) แทน qty_borrow
        ------------------------------------------------------------
        MERGE stock_on_hand AS target
        USING (
            SELECT item_id, qty_base      -- ← เปลี่ยนจาก qty_borrow
            FROM #BorrowLinesWithBase
        ) AS source ON target.item_id = source.item_id
        WHEN MATCHED THEN
            UPDATE SET
                qty_base   = target.qty_base + source.qty_base,  -- ← เปลี่ยน
                updated_at = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (item_id, qty_base, updated_at)
            VALUES (source.item_id, source.qty_base, GETDATE()); -- ← เปลี่ยน

        ------------------------------------------------------------
        -- ✅ แก้: บันทึก qty_base (หน่วยจ่าย) ใน stock_movements
        ------------------------------------------------------------
        INSERT INTO stock_movements (
            item_id, movement_type, qty_base,
            ref_id, ref_type, created_by, created_at
        )
        SELECT
            item_id,
            'RECEIVE',
            qty_base,       -- ← เปลี่ยนจาก qty_borrow
            @BorrowNo,
            'BORROW',
            @ReceivedBy,
            GETDATE()
        FROM #BorrowLinesWithBase;  -- ← เปลี่ยน source

        UPDATE borrow_headers
        SET status = 'RECEIVED'
        WHERE borrow_id = @BorrowIdInt;

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'รับยา Borrow เลขที่ ' + @BorrowNo
               + ' เข้า stock เรียบร้อย' AS Message;

        ------------------------------------------------------------
        -- ✅ แสดงผลพร้อม conversion_factor ให้ชัดเจน
        ------------------------------------------------------------
        SELECT
            b.item_id,
            vi.item_name_th,
            vi.purchase_unit_name_th,
            b.qty_borrow              AS qty_borrow_purchase_unit,   -- หน่วยซื้อ
            b.conversion_factor,
            b.qty_base                AS qty_added_to_stock,          -- หน่วยจ่าย
            s.qty_base                AS qty_on_hand_current          -- ยอดหลังรับ
        FROM #BorrowLinesWithBase b
        JOIN view_items     vi ON b.item_id  = vi.item_id
        JOIN stock_on_hand  s  ON b.item_id  = s.item_id;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_ExP_02_soft_delete_external_person
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ExP_02_soft_delete_external_person]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_ExP_02_soft_delete_external_person]
GO

CREATE PROCEDURE [dbo].[sp_ExP_02_soft_delete_external_person]
    @external_person_id INT
AS
BEGIN
    UPDATE [dbo].[external_people]
    SET
        [is_deleted] = CASE 
                           WHEN [is_deleted] = 1 THEN 0 
                           ELSE 1 
                       END,
        [deleted_at] = GETDATE()
    WHERE [external_person_id] = @external_person_id
END
GO


-- ----------------------------
-- procedure structure for sp_BR_06_GetPending
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_BR_06_GetPending]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_BR_06_GetPending]
GO

CREATE PROCEDURE [dbo].[sp_BR_06_GetPending]
    @SupplierId NVARCHAR(20) = NULL  -- NULL = ดูทุก Supplier
AS
BEGIN
    SET NOCOUNT ON;

    SET @SupplierId = NULLIF(LTRIM(RTRIM(@SupplierId)), '');

    DECLARE @SupplierIdInt INT = CASE
        WHEN @SupplierId IS NULL THEN NULL
        ELSE CAST(@SupplierId AS INT)
    END;

    -- สรุปแยก Supplier
    SELECT
        bh.supplier_id,
        s.supplier_name,
        COUNT(DISTINCT bh.borrow_id)           AS borrow_count,
        COUNT(bl.borrow_line_id)               AS item_count,
        SUM(bl.qty_borrow * bl.unit_price)     AS total_amount
    FROM borrow_headers bh
    JOIN borrow_lines   bl ON bh.borrow_id   = bl.borrow_id
    JOIN suppliers       s ON bh.supplier_id  = s.supplier_id
    WHERE bh.status = 'RECEIVED'
      AND (@SupplierIdInt IS NULL
           OR bh.supplier_id = @SupplierIdInt)
    GROUP BY bh.supplier_id, s.supplier_name
    ORDER BY bh.supplier_id;

    -- รายละเอียดแต่ละ BR
    SELECT
        bh.supplier_id,
        s.supplier_name,
        bh.borrow_id,
        bh.borrow_no,
        bh.borrow_date,
        bl.item_id,
        vi.item_name_th,
        vi.purchase_unit_name_th,
        bl.qty_borrow,
        bl.unit_price,
        bl.qty_borrow * bl.unit_price AS total_price
    FROM borrow_headers bh
    JOIN borrow_lines   bl ON bh.borrow_id   = bl.borrow_id
    JOIN suppliers       s ON bh.supplier_id  = s.supplier_id
    JOIN view_items     vi ON bl.item_id      = vi.item_id
    WHERE bh.status = 'RECEIVED'
      AND (@SupplierIdInt IS NULL
           OR bh.supplier_id = @SupplierIdInt)
    ORDER BY bh.supplier_id, bh.borrow_id, bl.item_id;
END;
GO


-- ----------------------------
-- procedure structure for sp_BR_07_Cancel
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_BR_07_Cancel]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_BR_07_Cancel]
GO

CREATE PROCEDURE [dbo].[sp_BR_07_Cancel]
    @BorrowId    NVARCHAR(20),
    @CancelledBy NVARCHAR(100),
    @Reason      NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @BorrowId    = NULLIF(LTRIM(RTRIM(@BorrowId)),    '');
    SET @CancelledBy = NULLIF(LTRIM(RTRIM(@CancelledBy)), '');
    SET @Reason      = NULLIF(LTRIM(RTRIM(@Reason)),      '');

    IF @BorrowId IS NULL OR ISNUMERIC(@BorrowId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @BorrowId' AS Message;
        RETURN;
    END;

    IF @CancelledBy IS NULL
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @CancelledBy' AS Message;
        RETURN;
    END;

    DECLARE @BorrowIdInt INT = CAST(@BorrowId AS INT);

    DECLARE @Status VARCHAR(30), @BorrowNo VARCHAR(20);

    SELECT @Status = status, @BorrowNo = borrow_no
    FROM borrow_headers WHERE borrow_id = @BorrowIdInt;

    -- ✅ ตรวจว่ามี borrow_id นี้อยู่จริงหรือไม่
    IF @Status IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ borrow_id = ' + @BorrowId AS Message;
        RETURN;
    END;

    -- ✅ แก้จากเดิมที่รับแค่ 'DRAFT'
    --    เพิ่มให้รับ 'PENDING_APPROVAL' ได้ด้วย (เหมือน sp_POCancel)
    --    สถานะที่ยกเลิกไม่ได้: APPROVED, APPROVED_L1, APPROVED_L2, RECEIVED, SETTLED, CANCELLED
    IF @Status NOT IN ('DRAFT', 'PENDING_APPROVAL')
    BEGIN
        SELECT 'Error' AS Status,
               'ยกเลิกได้เฉพาะสถานะ DRAFT หรือ PENDING_APPROVAL (ปัจจุบัน: '
               + @Status + ')' AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- ✅ Update borrow_headers → CANCELLED
        UPDATE borrow_headers
        SET
            status       = 'CANCELLED',
            cancelled_at = GETDATE(),
            cancelled_by = @CancelledBy,
            note         = ISNULL(note, '')
                           + CASE WHEN @Reason IS NOT NULL
                                  THEN ' | ยกเลิกเนื่องจาก: ' + @Reason
                                  ELSE '' END
        WHERE borrow_id = @BorrowIdInt;

        -- ✅ เพิ่มใหม่: ถ้าอยู่ใน PENDING_APPROVAL → cancel approval ที่ยัง PENDING ทั้งหมด
        --    (เหมือน sp_POCancel ที่ทำกับ po_approvals)
        IF @Status = 'PENDING_APPROVAL'
        BEGIN
            UPDATE borrow_approvals
            SET status = 'CANCELLED'
            WHERE borrow_id = @BorrowIdInt
              AND status    = 'PENDING';
        END;

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'ยกเลิก Borrow เลขที่ ' + @BorrowNo
               + ' (จากสถานะ ' + @Status + ') เรียบร้อย' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_ExP_01_upsert_external_person
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ExP_01_upsert_external_person]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_ExP_01_upsert_external_person]
GO

CREATE PROCEDURE [dbo].[sp_ExP_01_upsert_external_person]
    @external_person_id INT = NULL,
    @full_name NVARCHAR(200),
    @company NVARCHAR(200) = NULL,
    @national_id NVARCHAR(50) = NULL,
    @passport_no NVARCHAR(50) = NULL,
    @phone NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @external_person_id IS NULL OR @external_person_id = 0
    BEGIN
        -- INSERT (Create new)
        INSERT INTO [dbo].[external_people] (
            [full_name], [company], [national_id], [passport_no], [phone], [created_at], [is_deleted], [deleted_at]
        ) VALUES (
            @full_name, @company, @national_id, @passport_no, @phone, GETDATE(), 0, NULL
        );
        -- ส่งค่า id กลับ (optional)
        SELECT SCOPE_IDENTITY() AS new_external_person_id;
    END
    ELSE
    BEGIN
        -- UPDATE (Edit existing)
        UPDATE [dbo].[external_people]
        SET
            [full_name] = @full_name,
            [company] = @company,
            [national_id] = @national_id,
            [passport_no] = @passport_no,
            [phone] = @phone
        WHERE [external_person_id] = @external_person_id
          AND [is_deleted] = 0;
        -- ส่งค่า id กลับ (optional)
        SELECT @external_person_id AS updated_external_person_id;
    END
END
GO


-- ----------------------------
-- procedure structure for sp_AddStockMovementFromJson
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_AddStockMovementFromJson]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_AddStockMovementFromJson]
GO

CREATE PROCEDURE [dbo].[sp_AddStockMovementFromJson]
    @JsonData     NVARCHAR(MAX),
    @MovementType NVARCHAR(50),
    @RefType      NVARCHAR(50)  = NULL,
    @RefId        NVARCHAR(50)  = NULL,
    @CreatedBy    NVARCHAR(100),
    @MovementDate DATE          = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- ✅ เพิ่ม validation JSON ก่อน
    IF ISJSON(@JsonData) = 0
    BEGIN
        SELECT 'Error' AS Status, 'JSON ไม่ถูกต้อง' AS Message;
        RETURN;
    END;

    IF @MovementDate IS NULL SET @MovementDate = CAST(GETDATE() AS DATE);

    IF NOT EXISTS (
        SELECT 1 FROM movement_types
        WHERE movement_type_code = @MovementType
    )
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ movement_type = ' + @MovementType AS Message;
        RETURN;
    END;

    CREATE TABLE #Movements (
        item_id INT,
        qty     DECIMAL(18,4)
    );

    -- ✅ ปรับ validation ให้ครบ
    INSERT INTO #Movements (item_id, qty)
    SELECT
        CAST(JSON_VALUE(j.value, '$.item_id') AS INT) AS item_id,
        CAST(JSON_VALUE(j.value, '$.qty') AS DECIMAL(18,4)) AS qty
    FROM OPENJSON(@JsonData) AS j
    WHERE ISJSON(j.value) = 1                    -- เช็ก object แต่ละตัว
      AND JSON_VALUE(j.value, '$.item_id') IS NOT NULL
      AND ISNUMERIC(JSON_VALUE(j.value, '$.item_id')) = 1
      AND JSON_VALUE(j.value, '$.qty') IS NOT NULL
      AND ISNUMERIC(JSON_VALUE(j.value, '$.qty')) = 1
      AND CAST(JSON_VALUE(j.value, '$.qty') AS DECIMAL(18,4)) != 0;  -- qty ไม่เป็น 0

    IF NOT EXISTS (SELECT 1 FROM #Movements)
    BEGIN
        SELECT 'Error' AS Status, 'ไม่มีข้อมูลสินค้าที่ถูกต้องใน JSON' AS Message;
        RETURN;
    END;

    -- ตรวจ item_id ว่ามีในระบบ
    IF EXISTS (
        SELECT 1 FROM #Movements m
        LEFT JOIN items i ON m.item_id = i.item_id
        WHERE i.item_id IS NULL
    )
    BEGIN
        SELECT 'Error' AS Status, 'มี item_id ที่ไม่พบในระบบ' AS Message;
        RETURN;
    END;

    DECLARE @Direction INT;
    SELECT @Direction = direction FROM movement_types
    WHERE movement_type_code = @MovementType;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO stock_movements (
            movement_type, item_id, qty_base,
            ref_type, ref_id, created_by, created_at
        )
        SELECT
            @MovementType, item_id, qty,
            @RefType, @RefId, @CreatedBy, @MovementDate
        FROM #Movements;

        MERGE stock_on_hand AS target
        USING (
            SELECT item_id, SUM(qty) AS qty_sum
            FROM #Movements GROUP BY item_id
        ) AS source ON target.item_id = source.item_id
        WHEN MATCHED THEN
            UPDATE SET
                qty_base = target.qty_base + (source.qty_sum * @Direction),
                updated_at  = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (item_id, qty_base, updated_at)
            VALUES (source.item_id, source.qty_sum * @Direction, GETDATE());

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'บันทึก movement ' + CAST(@MovementType AS VARCHAR) + ' เรียบร้อย' AS Message,
               (SELECT COUNT(*) FROM #Movements) AS RowsAffected;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_SyncPhysicalStock
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_SyncPhysicalStock]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_SyncPhysicalStock]
GO

CREATE PROCEDURE [dbo].[sp_SyncPhysicalStock]
    @JsonData NVARCHAR(MAX),    -- ยอดนับจริง [{"item_id": 4, "qty": 18}]
    @RefId VARCHAR(50) = '0',
    @CreatedBy NVARCHAR(100),
    @Reason NVARCHAR(255) = 'Physical Stock Adjustment'
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
            -- 1. ใช้ OPENJSON แทน fn_ParseStockJson
        SELECT 
          CAST(JSON_VALUE(j.value, '$.item_id') AS INT)  AS item_id,
          CAST(JSON_VALUE(j.value, '$.qty')     AS INT)  AS physical_qty
          INTO #PhysicalCount 
          FROM OPENJSON(@JsonData) AS j
          WHERE ISJSON(j.value) = 1
            AND JSON_VALUE(j.value, '$.item_id') IS NOT NULL
            AND ISNUMERIC(JSON_VALUE(j.value, '$.item_id')) = 1
            AND JSON_VALUE(j.value, '$.qty') IS NOT NULL
            AND ISNUMERIC(JSON_VALUE(j.value, '$.qty')) = 1;
        BEGIN TRANSACTION;
        -- 2. คำนวณผลรวมประวัติปัจจุบันจาก stock_movements
        SELECT 
            p.item_id,
            p.physical_qty,
            ISNULL(sm.current_sum, 0) AS current_movement_sum,
            (p.physical_qty - ISNULL(sm.current_sum, 0)) AS diff_to_adjust
        INTO #Adjustments
        FROM #PhysicalCount p
        LEFT JOIN (
            SELECT 
                item_id, 
                SUM(CASE 
                    WHEN movement_type IN ('ADJUST_IN', 'RECEIVE', 'RETURN', 'INITIAL_LOAD') THEN qty_base 
                    WHEN movement_type IN ('ADJUST_OUT', 'USAGE', 'ISSUE', 'WITHDRAW') THEN -qty_base 
                    ELSE qty_base 
                END) AS current_sum
            FROM stock_movements
            GROUP BY item_id
        ) sm ON p.item_id = sm.item_id;

        -- 3. สร้างรายการปรับปรุงใน stock_movements
        INSERT INTO stock_movements (
            item_id, 
            qty_base, 
            movement_type, 
            ref_type, 
            ref_id,
            created_by, 
            created_at, 
            reason
        )
        SELECT 
            item_id, 
            ABS(diff_to_adjust),
            CASE WHEN diff_to_adjust > 0 THEN 'ADJUST_IN' ELSE 'ADJUST_OUT' END,
            'PHYSICAL_COUNT',
            @RefId,
            @CreatedBy,
            GETDATE(),
            @Reason + ' (Movement Sum: ' + CAST(current_movement_sum AS VARCHAR) + ', Actual: ' + CAST(physical_qty AS VARCHAR) + ')'
        FROM #Adjustments
        WHERE diff_to_adjust <> 0;

        -- 4. อัปเดตยอดใน stock_on_hand ให้เท่ากับที่นับได้จริง
        MERGE stock_on_hand AS target
        USING #PhysicalCount AS source
        ON (target.item_id = source.item_id)
        WHEN MATCHED THEN
            UPDATE SET 
                target.qty_base = source.physical_qty,
                target.updated_at = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (item_id, qty_base, updated_at)
            VALUES (source.item_id, source.physical_qty, GETDATE());

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status, 'Stock synchronized using OPENJSON.' AS Message;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

        DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@Err, 16, 1);
    END CATCH
END;
GO


-- ----------------------------
-- procedure structure for sp_RebuildStockMovementsFromOnHand
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_RebuildStockMovementsFromOnHand]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_RebuildStockMovementsFromOnHand]
GO

CREATE PROCEDURE [dbo].[sp_RebuildStockMovementsFromOnHand]
    @Mode NVARCHAR(10) = 'show',      -- 'show' = แสดงข้อมูลที่จะทำ, 'do' = ลบ & สร้างใหม่จริง
    @CreatedBy NVARCHAR(100) = NULL,  -- ผู้สร้างข้อมูล INITIAL_LOAD
    @RefType NVARCHAR(30) = 'INITIAL_LOAD',
    @RefId   VARCHAR(50) = 'INITIAL_LOAD'
AS
BEGIN
    SET NOCOUNT ON;

    -------------------------------------------------------------------
    -- 1) ตรวจสอบ movement_type ว่ามี INITIAL_LOAD ใน movement_types หรือยัง
    -------------------------------------------------------------------
    IF NOT EXISTS (
        SELECT 1
        FROM movement_types
        WHERE movement_type_code = 'INITIAL_LOAD'
    )
    BEGIN
        SELECT 
            'Error' AS Status,
            'ไม่พบ movement_type_code = ''INITIAL_LOAD'' ในตาราง movement_types. กรุณาเพิ่มข้อมูลก่อน.' AS Message;
        RETURN;
    END;

    -------------------------------------------------------------------
    -- 2) เตรียมข้อมูลจาก stock_on_hand ที่จะใช้สร้าง stock_movements
    -------------------------------------------------------------------
    ;WITH SourceData AS (
        SELECT 
            soh.item_id,
            soh.qty_base,
            soh.updated_at
        FROM stock_on_hand soh
    )
    -- ในอนาคต ถ้าต้องการ join กับตาราง items เพื่อแสดงชื่อยา ก็สามารถ join ที่นี่ได้
    SELECT 
        sd.item_id,
        sd.qty_base        AS qty_base,
        'INITIAL_LOAD'     AS movement_type,
        @RefType           AS ref_type,
        @RefId             AS ref_id,
        ISNULL(@CreatedBy, 'system') AS created_by,
        sd.updated_at      AS created_at,
        CAST(NULL AS NVARCHAR(500)) AS reason
    INTO #InitialLoadPreview
    FROM SourceData sd;

    -------------------------------------------------------------------
    -- 3) ถ้า @Mode = 'show' → แสดงข้อมูลที่จะสร้างใน stock_movements แล้วจบ
    -------------------------------------------------------------------
    IF LOWER(@Mode) = 'show'
    BEGIN
        SELECT 
            item_id,
            qty_base,
            movement_type,
            ref_type,
            ref_id,
            created_by,
            created_at,
            reason
        FROM #InitialLoadPreview
        ORDER BY item_id;

        SELECT 'Preview' AS Status,
               'โหมด SHOW: แสดงข้อมูลที่จะถูกใส่ใน stock_movements หากรันโหมด DO' AS Message;
        RETURN;
    END;

    -------------------------------------------------------------------
    -- 4) ถ้า @Mode = 'do' → ลบข้อมูลเก่า + รีเซ็ต identity + ใส่ INITIAL_LOAD ใหม่
    -------------------------------------------------------------------
    IF LOWER(@Mode) = 'do'
    BEGIN
        BEGIN TRY
            BEGIN TRANSACTION;
              DELETE FROM stock_movements;
            -- 4.2 รีเซ็ต identity ให้ movement_id เริ่มจาก 1 ใหม่
            -- 4.3 ใส่ข้อมูล INITIAL_LOAD จาก stock_on_hand ลง stock_movements
            INSERT INTO stock_movements (
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
                movement_type,
                item_id,
                qty_base,
                ref_type,
                ref_id,
                created_by,
                created_at,
                reason
            FROM #InitialLoadPreview;
            COMMIT TRANSACTION;
 -- หมายเหตุ: DBCC CHECKIDENT ใช้ได้เฉพาะถ้า stock_movements ถูกสร้างเป็น table จริง (ไม่ใช่ temp)
            DBCC CHECKIDENT ('stock_movements', RESEED, 0);
            SELECT 
                'Success' AS Status,
                'โหมด DO: ลบ stock_movements เดิมทั้งหมดและสร้าง INITIAL_LOAD จำนวน ' 
                + CAST(@@ROWCOUNT AS VARCHAR(20)) + ' แถวเรียบร้อยแล้ว' AS Message;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

            DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
            SELECT 'Error' AS Status, @ErrMsg AS Message;
        END CATCH;

        RETURN;
    END;

    -------------------------------------------------------------------
    -- 5) กรณี @Mode อื่นที่ไม่ใช่ 'show' หรือ 'do'
    -------------------------------------------------------------------
    SELECT 
        'Error' AS Status,
        'ค่าของ @Mode ไม่ถูกต้อง กรุณาใช้ ''show'' หรือ ''do'' เท่านั้น' AS Message;
END;
GO


-- ----------------------------
-- procedure structure for sp_RebuildStockOnHandFromMovements
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_RebuildStockOnHandFromMovements]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_RebuildStockOnHandFromMovements]
GO

CREATE PROCEDURE [dbo].[sp_RebuildStockOnHandFromMovements]
    @Mode NVARCHAR(10) = 'show'   -- 'show' = ดูก่อน, 'do' = เขียนจริง (ลบ & สร้างใหม่)
AS
BEGIN
    SET NOCOUNT ON;

    -----------------------------------------------------------
    -- 1) ตรวจสอบว่ามี movement_types ครบข้อมูลหรือไม่
    -----------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM movement_types)
    BEGIN
        SELECT 
            'Error' AS Status,
            'ไม่พบข้อมูลในตาราง movement_types กรุณาเพิ่ม movement_types ก่อน' AS Message;
        RETURN;
    END;

    -----------------------------------------------------------
    -- 2) คำนวณยอดคงเหลือตาม movement ทั้งหมด
    --    on_hand_calc = SUM(m.qty_base * mt.direction)
    -----------------------------------------------------------
    ;WITH MovementAgg AS (
        SELECT
            m.item_id,
            SUM(m.qty_base * mt.direction) AS qty_base
        FROM stock_movements m
        JOIN movement_types mt
            ON m.movement_type = mt.movement_type_code
        WHERE mt.affect_on_hand = 1      -- เฉพาะ movement ที่กระทบยอดคงเหลือ
        GROUP BY m.item_id
    )
    SELECT
        ma.item_id,
        ma.qty_base,
        GETDATE() AS updated_at
    INTO #OnHandPreview
    FROM MovementAgg ma;

    -----------------------------------------------------------
    -- 3) โหมด 'show' → แสดงผลลัพธ์ที่จะใช้สร้าง stock_on_hand
    -----------------------------------------------------------
    IF LOWER(@Mode) = 'show'
    BEGIN
        SELECT
            item_id,
            qty_base,
            updated_at
        FROM #OnHandPreview
        ORDER BY item_id;

        SELECT
            'Preview' AS Status,
            'โหมด SHOW: แสดงข้อมูลที่จะถูกใส่ใน stock_on_hand หากรันโหมด DO' AS Message;
        RETURN;
    END;

    -----------------------------------------------------------
    -- 4) โหมด 'do' → ลบ stock_on_hand เดิม และสร้างใหม่จาก movements
    -----------------------------------------------------------
    IF LOWER(@Mode) = 'do'
    BEGIN
        BEGIN TRY
            BEGIN TRANSACTION;

            -- 4.1 ลบข้อมูลทั้งหมดใน stock_on_hand
            DELETE FROM stock_on_hand;

            -- 4.2 ใส่ข้อมูลใหม่จาก #OnHandPreview
            INSERT INTO stock_on_hand (
                item_id,
                qty_base,
                updated_at
            )
            SELECT
                item_id,
                qty_base,
                updated_at
            FROM #OnHandPreview;

            COMMIT TRANSACTION;

            SELECT
                'Success' AS Status,
                'โหมด DO: ลบ stock_on_hand เดิมทั้งหมดและสร้างใหม่จาก stock_movements จำนวน '
                + CAST(@@ROWCOUNT AS VARCHAR(20)) + ' แถวเรียบร้อยแล้ว' AS Message;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
            SELECT 'Error' AS Status, @ErrMsg AS Message;
        END CATCH;

        RETURN;
    END;

    -----------------------------------------------------------
    -- 5) ถ้า @Mode ไม่ใช่ 'show' หรือ 'do'
    -----------------------------------------------------------
    SELECT 
        'Error' AS Status,
        'ค่าของ @Mode ไม่ถูกต้อง กรุณาใช้ ''show'' หรือ ''do'' เท่านั้น' AS Message;
END;
GO


-- ----------------------------
-- procedure structure for sp_Snapshot_02_CreatePeriodStockSnapshot
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_Snapshot_02_CreatePeriodStockSnapshot]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_Snapshot_02_CreatePeriodStockSnapshot]
GO

CREATE PROCEDURE [dbo].[sp_Snapshot_02_CreatePeriodStockSnapshot]
    @PeriodCode VARCHAR(20),
    @Mode       NVARCHAR(10)  = 'show',
    @CreatedBy  NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE
        @PeriodStart    DATE,
        @PeriodEnd      DATE,
        @PeriodStatus   VARCHAR(20),
        @LastPeriodCode VARCHAR(20);

    SELECT
        @PeriodStart  = period_start,
        @PeriodEnd    = period_end,
        @PeriodStatus = period_status
    FROM stock_periods
    WHERE period_code = @PeriodCode;

    IF @PeriodStart IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ period_code = ' + @PeriodCode AS Message;
        RETURN;
    END;

    SELECT TOP (1)
        @LastPeriodCode = period_code
    FROM stock_periods
    ORDER BY period_end DESC, period_code DESC;

    IF LOWER(@Mode) = 'do'
    BEGIN
        IF @PeriodStatus = 'SNAPSHOT_DONE' AND @PeriodCode <> @LastPeriodCode
        BEGIN
            SELECT 'Error' AS Status,
                   'period นี้เคย snapshot แล้ว และไม่ใช่ period สุดท้าย' AS Message;
            RETURN;
        END;

        IF @PeriodStatus NOT IN ('OPEN', 'SNAPSHOT_DONE')
        BEGIN
            SELECT 'Error' AS Status,
                   'period อยู่ในสถานะ ' + ISNULL(@PeriodStatus, '(null)')
                   + ' ไม่อนุญาตให้ทำ snapshot' AS Message;
            RETURN;
        END;
    END;

    ;WITH MovementsBefore AS (
        SELECT m.item_id, m.movement_type, m.qty_base, mt.direction
        FROM stock_movements m
        JOIN movement_types mt ON m.movement_type = mt.movement_type_code
        WHERE mt.affect_on_hand = 1
          AND m.created_at < @PeriodStart
    ),
    MovementsInPeriod AS (
        SELECT m.item_id, m.movement_type, m.qty_base, mt.direction
        FROM stock_movements m
        JOIN movement_types mt ON m.movement_type = mt.movement_type_code
        WHERE mt.affect_on_hand = 1
          AND m.created_at >= @PeriodStart
          AND m.created_at < DATEADD(DAY, 1, @PeriodEnd)
    ),
    MovementsUntilEnd AS (
        SELECT m.item_id, m.movement_type, m.qty_base, mt.direction
        FROM stock_movements m
        JOIN movement_types mt ON m.movement_type = mt.movement_type_code
        WHERE mt.affect_on_hand = 1
          AND m.created_at < DATEADD(DAY, 1, @PeriodEnd)
    ),
    OpeningAgg AS (
        SELECT item_id, SUM(qty_base * direction) AS opening_qty
        FROM MovementsBefore GROUP BY item_id
    ),
    PeriodAgg AS (
        SELECT
            item_id,
            SUM(CASE WHEN movement_type IN ('RECEIVE','RETURN')
                     THEN qty_base ELSE 0 END) AS receipts,
            SUM(CASE WHEN movement_type IN ('USAGE','ISSUE','WITHDRAW')
                     THEN qty_base ELSE 0 END) AS issues,
            SUM(CASE WHEN movement_type IN ('ADJUST_IN','ADJUST_OUT')
                     THEN qty_base * direction ELSE 0 END) AS adjustments,
            SUM(qty_base * direction) AS net_movement
        FROM MovementsInPeriod GROUP BY item_id
    ),
    ClosingAgg AS (
        SELECT item_id, SUM(qty_base * direction) AS actual_closing
        FROM MovementsUntilEnd GROUP BY item_id
    ),
    AllItems AS (SELECT item_id FROM items),
    Combined AS (
        SELECT
            ai.item_id,
            ISNULL(o.opening_qty,    0) AS opening_qty,
            ISNULL(p.receipts,       0) AS receipts,
            ISNULL(p.issues,         0) AS issues,
            ISNULL(p.adjustments,    0) AS adjustments,
            ISNULL(p.net_movement,   0) AS net_movement,
            ISNULL(c.actual_closing, 0) AS actual_closing
        FROM AllItems ai
        LEFT JOIN OpeningAgg o ON ai.item_id = o.item_id
        LEFT JOIN PeriodAgg  p ON ai.item_id = p.item_id
        LEFT JOIN ClosingAgg c ON ai.item_id = c.item_id
    )
    SELECT
        item_id, opening_qty, receipts, issues, adjustments, net_movement,
        opening_qty + net_movement AS expected_closing,
        actual_closing,
        actual_closing - (opening_qty + net_movement) AS diff_qty
    INTO #SnapshotPreview
    FROM Combined;

    IF LOWER(@Mode) = 'show'
    BEGIN
        SELECT
            @PeriodCode  AS period_code,
            @PeriodStart AS period_start,
            @PeriodEnd   AS period_end,
            item_id, opening_qty, receipts, issues, adjustments,
            net_movement, expected_closing, actual_closing, diff_qty
        FROM #SnapshotPreview
        ORDER BY item_id;

        SELECT 'Preview' AS Status,
               'โหมด SHOW: period_code = ' + @PeriodCode AS Message;
        RETURN;
    END;

    IF LOWER(@Mode) = 'do'
    BEGIN
        BEGIN TRY
            BEGIN TRANSACTION;

            IF @PeriodStatus = 'SNAPSHOT_DONE'
            BEGIN
                DELETE FROM stock_period_snapshot
                WHERE period_code = @PeriodCode;
            END;

            INSERT INTO stock_period_snapshot (
                period_code, item_id, opening_qty, receipts, issues,
                adjustments, net_movement, expected_closing,
                actual_closing, diff_qty, created_at, created_by
            )
            SELECT
                @PeriodCode, item_id, opening_qty, receipts, issues,
                adjustments, net_movement, expected_closing,
                actual_closing, diff_qty, GETDATE(), @CreatedBy
            FROM #SnapshotPreview;

            UPDATE stock_periods
            SET period_status = 'SNAPSHOT_DONE'
            WHERE period_code = @PeriodCode;

            COMMIT TRANSACTION;

            SELECT 'Success' AS Status,
                   'สร้าง snapshot เรียบร้อย: ' + @PeriodCode AS Message;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
        END CATCH;
    END;
END;
GO


-- ----------------------------
-- function structure for fn_ValidateStockPeriod
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[fn_ValidateStockPeriod]') AND type IN ('FN', 'FS', 'FT', 'IF', 'TF'))
	DROP FUNCTION[dbo].[fn_ValidateStockPeriod]
GO

CREATE FUNCTION [dbo].[fn_ValidateStockPeriod]
(
    @PeriodCode VARCHAR(10)
)
RETURNS BIT
AS
BEGIN
    DECLARE 
        @PeriodStart DATE,
        @PeriodEnd   DATE,
        @IsValid     BIT = 1;

    ------------------------------------------------------------
    -- 1) ดึงช่วงงวด
    ------------------------------------------------------------
    SELECT 
        @PeriodStart = period_start,
        @PeriodEnd   = period_end
    FROM stock_periods
    WHERE period_code = @PeriodCode;

    IF @PeriodStart IS NULL
        RETURN 0;

    ------------------------------------------------------------
    -- 2) start <= end ?
    ------------------------------------------------------------
    IF @PeriodStart > @PeriodEnd
        RETURN 0;

    ------------------------------------------------------------
    -- 3) ห้ามซ้อนทับกับ period อื่น
    ------------------------------------------------------------
    IF EXISTS (
        SELECT 1
        FROM stock_periods p
        WHERE p.period_code <> @PeriodCode
          AND p.period_start <= @PeriodEnd
          AND @PeriodStart <= p.period_end
    )
        RETURN 0;

    ------------------------------------------------------------
    -- 4) ความต่อเนื่องของงวด (optional rule ที่คุณต้องการตอนนี้)
    --    - หา period ก่อนหน้า (ตามวันที่ period_end มากที่สุดที่น้อยกว่า period_start ของงวดนี้)
    --    - หา period ถัดไป (ตามวันที่ period_start น้อยที่สุดที่มากกว่า period_end ของงวดนี้)
    --    แล้วตรวจว่า:
    --    - ถ้ามี period ก่อนหน้า → period_start ของงวดนี้ ต้อง = previous.period_end + 1 วัน
    --    - ถ้ามี period ถัดไป   → period_end ของงวดนี้   ต้อง = next.period_start - 1 วัน
    ------------------------------------------------------------

    DECLARE 
        @PrevEnd DATE,
        @NextStart DATE;

    -- period ก่อนหน้า
    SELECT TOP (1)
        @PrevEnd = p.period_end
    FROM stock_periods p
    WHERE p.period_code <> @PeriodCode
      AND p.period_end < @PeriodStart
    ORDER BY p.period_end DESC;

    -- period ถัดไป
    SELECT TOP (1)
        @NextStart = p.period_start
    FROM stock_periods p
    WHERE p.period_code <> @PeriodCode
      AND p.period_start > @PeriodEnd
    ORDER BY p.period_start ASC;

    -- ถ้ามี period ก่อนหน้า → ต้องต่อเนื่อง
    IF @PrevEnd IS NOT NULL
       AND DATEADD(DAY, 1, @PrevEnd) <> @PeriodStart
        RETURN 0;

    -- ถ้ามี period ถัดไป → ต้องต่อเนื่อง
    IF @NextStart IS NOT NULL
       AND DATEADD(DAY, -1, @NextStart) <> @PeriodEnd
        RETURN 0;

    RETURN @IsValid;
END;
GO


-- ----------------------------
-- procedure structure for sp_Snapshot_01_CreateStockPeriod
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_Snapshot_01_CreateStockPeriod]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_Snapshot_01_CreateStockPeriod]
GO

CREATE PROCEDURE [dbo].[sp_Snapshot_01_CreateStockPeriod]
    @PeriodEnd DATE,
    @CreatedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE
        @PeriodCode      VARCHAR(20),
        @PeriodStart     DATE,
        @PrevEnd         DATE,
        @YearMonth       CHAR(6),
        @YearText        CHAR(4),
        @NextRunningNo   INT,
        @NextRunningText CHAR(3);

    SET @YearMonth = CONVERT(CHAR(6), @PeriodEnd, 112);
    SET @YearText  = LEFT(@YearMonth, 4);

    SELECT
        @NextRunningNo = ISNULL(MAX(CAST(RIGHT(period_code, 3) AS INT)), 0) + 1
    FROM stock_periods
    WHERE LEFT(period_code, 4) = @YearText
      AND period_code LIKE '[0-9][0-9][0-9][0-9][0-9][0-9]-%';

    SET @NextRunningText = RIGHT('000' + CAST(@NextRunningNo AS VARCHAR(3)), 3);
    SET @PeriodCode = @YearMonth + '-' + @NextRunningText;

    SELECT TOP (1)
        @PrevEnd = period_end
    FROM stock_periods
    WHERE period_end < @PeriodEnd
    ORDER BY period_end DESC;

    SET @PeriodStart = CASE
        WHEN @PrevEnd IS NOT NULL THEN DATEADD(DAY, 1, @PrevEnd)
        ELSE @PeriodEnd
    END;

    IF @PeriodStart > @PeriodEnd
    BEGIN
        SELECT 'Error' AS Status,
               'period_start (' + CONVERT(VARCHAR(10), @PeriodStart, 120)
               + ') > period_end ('
               + CONVERT(VARCHAR(10), @PeriodEnd, 120) + ')' AS Message;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1 FROM stock_periods
        WHERE period_start <= @PeriodEnd
          AND @PeriodStart <= period_end
    )
    BEGIN
        SELECT 'Error' AS Status,
               'ช่วงงวดใหม่ซ้อนทับกับช่วงงวดเดิม' AS Message;
        RETURN;
    END;

    BEGIN TRY
        INSERT INTO stock_periods (
            period_code, period_start, period_end,
            created_at, created_by
        )
        VALUES (
            @PeriodCode, @PeriodStart, @PeriodEnd,
            GETDATE(), @CreatedBy
        );

        SELECT 'Success' AS Status,
               'สร้าง period: ' + @PeriodCode AS Message;

        SELECT
            @PeriodCode  AS period_code,
            @PeriodStart AS period_start,
            @PeriodEnd   AS period_end;
    END TRY
    BEGIN CATCH
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_GR_03_ConfirmGR
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GR_03_ConfirmGR]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_GR_03_ConfirmGR]
GO

CREATE PROCEDURE [dbo].[sp_GR_03_ConfirmGR]
    @GrId        NVARCHAR(20),
    @ConfirmedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- Normalize
    SET @GrId = NULLIF(LTRIM(RTRIM(@GrId)), '');

    IF @GrId IS NULL OR ISNUMERIC(@GrId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาร��บุ @GrId' AS Message;
        RETURN;
    END;

    DECLARE @GrIdInt INT = CAST(@GrId AS INT);

    DECLARE
        @Status        VARCHAR(20),
        @GrNo          VARCHAR(20),
        @GrDate        DATE,
        @SupplierIdInt INT;

    SELECT
        @Status        = status,
        @GrNo          = gr_no,
        @GrDate        = gr_date,
        @SupplierIdInt = supplier_id
    FROM gr_headers
    WHERE gr_id = @GrIdInt;

    IF @Status IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ gr_id = ' + @GrId AS Message;
        RETURN;
    END;

    IF @Status <> 'DRAFT'
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่สามารถ confirm ได้: GR อยู่ในสถานะ ' + @Status AS Message;
        RETURN;
    END;

    IF NOT EXISTS (SELECT 1 FROM gr_lines WHERE gr_id = @GrIdInt)
    BEGIN
        SELECT 'Error' AS Status, 'ไม่มีรายการใน GR นี้' AS Message;
        RETURN;
    END;

    -- ----------------------------------------------------------
    -- Pre-compute base qty for each line
    --   qty_base = qty_receive (purchase unit) × conversion_factor
    --              (how many usage units per purchase unit)
    -- ----------------------------------------------------------
    CREATE TABLE #GrLinesWithBase (
        item_id           INT,
        qty_receive       DECIMAL(18,4),   -- in purchase units
        conversion_factor DECIMAL(18,4),
        qty_base          INT,             -- in usage (stock) units  ← KEY
        po_line_id        INT
    );

    INSERT INTO #GrLinesWithBase (
        item_id, qty_receive, conversion_factor, qty_base, po_line_id
    )
    SELECT
        gl.item_id,
        gl.qty_receive,
        ISNULL(spl.conversion_factor, 1)                            AS conversion_factor,
        CAST(
            gl.qty_receive * ISNULL(spl.conversion_factor, 1)
        AS INT)                                                     AS qty_base,
        gl.po_line_id
    FROM gr_lines gl
    -- join to the ACTIVE price for this supplier on the GR date
    LEFT JOIN dbo.supplier_price_list spl
           ON spl.item_id        = gl.item_id
          AND spl.supplier_id    = @SupplierIdInt
          AND spl.is_active      = 1
          AND spl.effective_date <= @GrDate
          AND (spl.expire_date IS NULL OR spl.expire_date >= @GrDate)
    WHERE gl.gr_id = @GrIdInt;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1) Update GR status → CONFIRMED
        UPDATE gr_headers
        SET
            status       = 'CONFIRMED',
            confirmed_at = GETDATE(),
            confirmed_by = @ConfirmedBy,
            updated_by   = @ConfirmedBy,
            updated_at   = GETDATE()
        WHERE gr_id = @GrIdInt;

        -- 2) stock_movements  (qty_base = usage units)
        INSERT INTO stock_movements (
            movement_type, item_id, qty_base,
            ref_type, ref_id, created_by, created_at
        )
        SELECT
            'RECEIVE',
            item_id,
            qty_base,          -- ← converted value
            'GR',
            @GrNo,
            @ConfirmedBy,
            GETDATE()
        FROM #GrLinesWithBase;

        -- 3) stock_on_hand  (qty_base = usage units)
        MERGE dbo.stock_on_hand AS target
        USING (
            SELECT item_id, SUM(qty_base) AS qty_sum
            FROM #GrLinesWithBase
            GROUP BY item_id
        ) AS source
            ON target.item_id = source.item_id
        WHEN MATCHED THEN
            UPDATE SET
                qty_base   = target.qty_base + source.qty_sum,
                updated_at = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (item_id, qty_base, updated_at)
            VALUES (source.item_id, source.qty_sum, GETDATE());

        -- 4) Update po_lines.qty_received
        UPDATE pl
        SET pl.qty_received = pl.qty_received + b.qty_receive
        FROM po_lines pl
        JOIN #GrLinesWithBase b ON pl.po_line_id = b.po_line_id
        WHERE b.po_line_id IS NOT NULL;

        -- 5) Update PO status → PARTIAL or CLOSED
        UPDATE ph
        SET ph.status = CASE
            WHEN NOT EXISTS (
                SELECT 1 FROM po_lines pl2
                WHERE pl2.po_id        = ph.po_id
                  AND pl2.qty_received < pl2.qty_order
            ) THEN 'CLOSED'
            ELSE 'PARTIAL'
        END
        FROM po_headers ph
        JOIN gr_headers gh ON ph.po_id = gh.po_id
        WHERE gh.gr_id   = @GrIdInt
          AND gh.po_id IS NOT NULL;

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'ยืนยัน GR เลขที่ ' + @GrNo
               + ' stock ถูกอัปเดตแล้ว (แปลงหน่วยซื้อ → หน่วยจ่ายแล้ว)' AS Message;

        -- Result: show both purchase qty and stock (base) qty
        SELECT
            b.item_id,
            b.qty_receive                         AS qty_receive_purchase_unit,
            b.conversion_factor,
            b.qty_base                            AS qty_added_to_stock_usage_unit,
            s.qty_base                            AS qty_on_hand_after
        FROM #GrLinesWithBase b
        JOIN dbo.stock_on_hand s ON b.item_id = s.item_id;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_GR_02_CreateGR
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GR_02_CreateGR]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_GR_02_CreateGR]
GO

CREATE PROCEDURE [dbo].[sp_GR_02_CreateGR]
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
    CREATE TABLE #Lines (item_id INT, qty DECIMAL(18,4));

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
        pl.po_line_id
    FROM #Lines l
    LEFT JOIN supplier_price_list spl
           ON spl.item_id        = l.item_id
          AND spl.supplier_id    = @SupplierIdInt
          AND spl.is_active      = 1
          AND spl.effective_date <= @GrDateDt
          AND (spl.expire_date IS NULL OR spl.expire_date >= @GrDateDt)
    LEFT JOIN po_lines pl
           ON pl.po_id   = @PoIdInt
          AND pl.item_id = l.item_id;

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
GO


-- ----------------------------
-- procedure structure for sp_GRUpdate
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GRUpdate]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_GRUpdate]
GO

CREATE PROCEDURE [dbo].[sp_GRUpdate]
    @GrId      NVARCHAR(20),
    @JsonLines NVARCHAR(MAX),
    @Note      NVARCHAR(500) = NULL,
    @UpdatedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SET @GrId = NULLIF(LTRIM(RTRIM(@GrId)), '');
    SET @Note = NULLIF(LTRIM(RTRIM(@Note)), '');

    IF ISJSON(@JsonLines) = 0
    BEGIN
        SELECT 'Error' AS Status, 'JSON ไม่ถูกต้อง' AS Message;
        RETURN;
    END;

    IF @GrId IS NULL OR ISNUMERIC(@GrId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @GrId' AS Message;
        RETURN;
    END;

    DECLARE @GrIdInt INT = CAST(@GrId AS INT);

    DECLARE
        @Status        VARCHAR(20),
        @GrDateDt      DATE,
        @SupplierIdInt INT,
        @PoIdInt       INT,
        @GrNo          VARCHAR(20);

    SELECT
        @Status        = status,
        @GrDateDt      = gr_date,
        @SupplierIdInt = supplier_id,
        @PoIdInt       = po_id,
        @GrNo          = gr_no
    FROM gr_headers
    WHERE gr_id = @GrIdInt;

    IF @Status IS NULL
    BEGIN
        SELECT 'Error' AS Status, 'ไม่พบ gr_id = ' + @GrId AS Message;
        RETURN;
    END;

    IF @Status <> 'DRAFT'
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่สามารถแก้ไขได้: GR อยู่ในสถานะ ' + @Status AS Message;
        RETURN;
    END;

    -- Parse JSON
    CREATE TABLE #Lines (item_id INT, qty DECIMAL(18,4));

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

    -- Check pending (if linked to PO)
    IF @PoIdInt IS NOT NULL
    BEGIN
        CREATE TABLE #PendingLines (
            item_id       INT,
            qty_order     DECIMAL(18,4),
            qty_received  DECIMAL(18,4),
            qty_remaining DECIMAL(18,4)
        );

        ;WITH ReceivedQty AS (
            SELECT
                pl.po_line_id,
                pl.item_id,
                pl.qty_order,
                ISNULL(SUM(
                    CASE WHEN gh.status IN ('CONFIRMED','DRAFT')
                              AND gh.gr_id <> @GrIdInt
                         THEN gl.qty_receive ELSE 0 END
                ), 0) AS qty_received
            FROM po_lines pl
            LEFT JOIN gr_lines   gl ON gl.po_line_id = pl.po_line_id
            LEFT JOIN gr_headers gh ON gl.gr_id = gh.gr_id
            WHERE pl.po_id = @PoIdInt
            GROUP BY pl.po_line_id, pl.item_id, pl.qty_order
        )
        INSERT INTO #PendingLines (item_id, qty_order, qty_received, qty_remaining)
        SELECT item_id, qty_order, qty_received, qty_order - qty_received
        FROM ReceivedQty;

        IF EXISTS (
            SELECT 1 FROM #Lines l
            WHERE NOT EXISTS (SELECT 1 FROM #PendingLines p WHERE p.item_id = l.item_id)
        )
        BEGIN
            SELECT 'Error' AS Status,
                   'มี item_id ที่ไม่ได้อยู่ใน PO นี้: '
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
        pl.po_line_id
    FROM #Lines l
    LEFT JOIN supplier_price_list spl
           ON spl.item_id        = l.item_id
          AND spl.supplier_id    = @SupplierIdInt
          AND spl.is_active      = 1
          AND spl.effective_date <= @GrDateDt
          AND (spl.expire_date IS NULL OR spl.expire_date >= @GrDateDt)
    LEFT JOIN po_lines pl
           ON pl.po_id   = @PoIdInt
          AND pl.item_id = l.item_id;

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

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE gr_headers
        SET note       = ISNULL(@Note, note),
            updated_by = @UpdatedBy,
            updated_at = GETDATE()
        WHERE gr_id = @GrIdInt;

        DELETE FROM gr_lines WHERE gr_id = @GrIdInt;

        INSERT INTO gr_lines (gr_id, item_id, qty_receive, unit_price, po_line_id)
        SELECT @GrIdInt, item_id, qty, unit_price, po_line_id
        FROM #LinesWithPrice;

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'แก้ไข GR เลขที่ ' + @GrNo + ' เรียบร้อย' AS Message;

        SELECT
            @GrIdInt       AS gr_id,
            @GrNo          AS gr_no,
            @SupplierIdInt AS supplier_id,
            @GrDateDt      AS gr_date,
            @PoIdInt       AS po_id,
            @Status        AS status;

        -- *** FIXED: purchase unit from supplier_price_list → units ***
        SELECT
            l.item_id,
            i.item_name_th,
            pu.unit_name_th                          AS purchase_unit_name_th,  -- FIXED
            pu.unit_code                             AS purchase_unit_code,      -- FIXED
            l.qty                                    AS qty_receive,
            l.conversion_factor,
            l.unit_price,
            l.qty * l.unit_price                     AS total_price,
            CAST(l.qty * l.conversion_factor AS INT) AS qty_base_to_stock
        FROM #LinesWithPrice l
        JOIN items i ON l.item_id = i.item_id
        JOIN supplier_price_list spl2
                     ON spl2.item_id        = l.item_id
                    AND spl2.supplier_id    = @SupplierIdInt
                    AND spl2.is_active      = 1
                    AND spl2.effective_date <= @GrDateDt
                    AND (spl2.expire_date IS NULL OR spl2.expire_date >= @GrDateDt)
        JOIN units pu ON pu.unit_id = spl2.unit_id;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_GR_01_GetGR
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GR_01_GetGR]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_GR_01_GetGR]
GO

CREATE PROCEDURE [dbo].[sp_GR_01_GetGR]
    @GrId NVARCHAR(20) = NULL,
    @GrNo VARCHAR(20)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @GrId = NULLIF(LTRIM(RTRIM(@GrId)), '');
    SET @GrNo = NULLIF(LTRIM(RTRIM(@GrNo)), '');

    IF @GrId IS NULL AND @GrNo IS NULL
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @GrId หรือ @GrNo' AS Message;
        RETURN;
    END;

    DECLARE @GrIdInt INT = CASE
        WHEN @GrId IS NOT NULL THEN CAST(@GrId AS INT)
        ELSE NULL
    END;

    -- 1) Header
    SELECT
        h.gr_id,
        h.gr_no,
        h.gr_date,
        h.supplier_id,
        s.supplier_name,
        h.po_id,
        h.status,
        h.note,
        h.created_by,
        ve.eng_name   AS created_by_name,
        ve.email      AS created_by_email,
        h.confirmed_by,
        h.confirmed_at,
        h.created_at
    FROM gr_headers h
    LEFT JOIN suppliers   s  ON h.supplier_id = s.supplier_id
    LEFT JOIN view_email  ve ON h.created_by  = ve.employee_id
    WHERE (@GrIdInt IS NOT NULL AND h.gr_id = @GrIdInt)
       OR (@GrNo    IS NOT NULL AND h.gr_no = @GrNo);

    -- 2) Lines
    --    *** FIXED: purchase_unit_code/name_th from
    --               supplier_price_list → units (per supplier on GR date) ***
    SELECT
        l.gr_line_id,
        l.gr_id,
        l.item_id,
        i.item_code,
        i.item_name_th,
        i.item_name_en,
        -- purchase unit: what was on the supplier price list
        pu.unit_code                             AS purchase_unit_code,      -- FIXED
        pu.unit_name_th                          AS purchase_unit_name_th,   -- FIXED
        uu.unit_code                             AS usage_unit_code,
        uu.unit_name_th                          AS usage_unit_name_th,
        l.qty_receive,
        ISNULL(spl.conversion_factor, 1)         AS conversion_factor,
        CAST(l.qty_receive
             * ISNULL(spl.conversion_factor, 1)
             AS INT)                             AS qty_base_in_stock,
        l.unit_price,
        l.total_price,
        l.po_line_id
    FROM gr_lines    l
    JOIN gr_headers  h   ON l.gr_id        = h.gr_id
    JOIN items       i   ON l.item_id      = i.item_id
    JOIN units       uu  ON uu.unit_id     = i.usage_unit_id
    -- get the purchase unit for this specific supplier + date
    LEFT JOIN supplier_price_list spl
                         ON spl.item_id        = l.item_id
                        AND spl.supplier_id    = h.supplier_id
                        AND spl.is_active      = 1
                        AND spl.effective_date <= h.gr_date
                        AND (spl.expire_date IS NULL OR spl.expire_date >= h.gr_date)
    LEFT JOIN units  pu  ON pu.unit_id = spl.unit_id
    WHERE (@GrIdInt IS NOT NULL AND h.gr_id = @GrIdInt)
       OR (@GrNo    IS NOT NULL AND h.gr_no = @GrNo);
END;
GO


-- ----------------------------
-- procedure structure for sp_PO_01_CreatePO
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_PO_01_CreatePO]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_PO_01_CreatePO]
GO

CREATE PROCEDURE [dbo].[sp_PO_01_CreatePO]
    @SupplierId NVARCHAR(20),
    @PoDate     NVARCHAR(20),
    @DueDate    NVARCHAR(20)  = NULL,
    @JsonLines  NVARCHAR(MAX),
    @BorrowIds  NVARCHAR(MAX) = NULL,
    @Note       NVARCHAR(500) = NULL,
    @CreatedBy  NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SET @SupplierId = NULLIF(LTRIM(RTRIM(@SupplierId)), '');
    SET @PoDate     = NULLIF(LTRIM(RTRIM(@PoDate)),     '');
    SET @DueDate    = NULLIF(LTRIM(RTRIM(@DueDate)),    '');
    SET @Note       = NULLIF(LTRIM(RTRIM(@Note)),       '');
    SET @BorrowIds  = NULLIF(LTRIM(RTRIM(@BorrowIds)),  '');

    IF ISJSON(@JsonLines) = 0
    BEGIN
        SELECT 'Error' AS Status, 'JsonLines ไม่ถูกต้อง' AS Message;
        RETURN;
    END;

    IF @SupplierId IS NULL OR ISNUMERIC(@SupplierId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @SupplierId' AS Message;
        RETURN;
    END;

    IF @PoDate IS NULL
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @PoDate' AS Message;
        RETURN;
    END;

    DECLARE
        @SupplierIdInt INT  = CAST(@SupplierId AS INT),
        @PoDateDt      DATE = CAST(@PoDate AS DATE),
        @DueDateDt     DATE = CASE WHEN @DueDate IS NULL THEN NULL
                                   ELSE CAST(@DueDate AS DATE) END;

    IF NOT EXISTS (
        SELECT 1 FROM suppliers
        WHERE supplier_id = @SupplierIdInt AND is_active = 1
    )
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ supplier_id = ' + @SupplierId + ' หรือ supplier ไม่ได้ใช้งาน' AS Message;
        RETURN;
    END;

    IF @DueDateDt IS NOT NULL AND @DueDateDt < @PoDateDt
    BEGIN
        SELECT 'Error' AS Status, 'due_date ต้องไม่น้อยกว่า po_date' AS Message;
        RETURN;
    END;

    -- BorrowIds: ต้องเป็น JSON array ถ้าส่งมา
    CREATE TABLE #BorrowIds (borrow_id INT);

    IF @BorrowIds IS NOT NULL
    BEGIN
        IF ISJSON(@BorrowIds) = 0 OR LEFT(LTRIM(@BorrowIds), 1) <> '[' OR RIGHT(RTRIM(@BorrowIds), 1) <> ']'
        BEGIN
            SELECT 'Error' AS Status,
                   '@BorrowIds ต้องเป็น JSON array เช่น [1,2,3] เท่านั้น' AS Message;
            RETURN;
        END;

        INSERT INTO #BorrowIds (borrow_id)
        SELECT TRY_CAST(value AS INT)
        FROM OPENJSON(@BorrowIds)
        WHERE TRY_CAST(value AS INT) IS NOT NULL;

        IF NOT EXISTS (SELECT 1 FROM #BorrowIds)
        BEGIN
            SELECT 'Error' AS Status,
                   '@BorrowIds ไม่มีค่า borrow_id ที่ถูกต้อง' AS Message;
            RETURN;
        END;

        IF EXISTS (
            SELECT 1
            FROM #BorrowIds bi
            LEFT JOIN borrow_headers bh ON bi.borrow_id = bh.borrow_id
            WHERE bh.borrow_id IS NULL OR bh.status <> 'RECEIVED'
        )
        BEGIN
            SELECT 'Error' AS Status,
                   'มี borrow_id ที่ไม่พบหรือไม่ได้อยู่ในสถานะ RECEIVED: '
                   + (
                       SELECT STUFF((
                           SELECT ', ' + CAST(bi.borrow_id AS VARCHAR)
                           FROM #BorrowIds bi
                           LEFT JOIN borrow_headers bh ON bi.borrow_id = bh.borrow_id
                           WHERE bh.borrow_id IS NULL OR bh.status <> 'RECEIVED'
                           FOR XML PATH('')
                       ), 1, 2, '')
                   ) AS Message;
            RETURN;
        END;

        IF EXISTS (
            SELECT 1
            FROM #BorrowIds bi
            JOIN borrow_headers bh ON bi.borrow_id = bh.borrow_id
            WHERE bh.supplier_id <> @SupplierIdInt
        )
        BEGIN
            SELECT 'Error' AS Status,
                   'มี borrow_id ที่ supplier ไม่ตรง: '
                   + (
                       SELECT STUFF((
                           SELECT ', ' + bh.borrow_no
                           FROM #BorrowIds bi
                           JOIN borrow_headers bh ON bi.borrow_id = bh.borrow_id
                           WHERE bh.supplier_id <> @SupplierIdInt
                           FOR XML PATH('')
                       ), 1, 2, '')
                   ) AS Message;
            RETURN;
        END;

        IF EXISTS (
            SELECT 1
            FROM #BorrowIds bi
            JOIN borrow_headers bh ON bi.borrow_id = bh.borrow_id
            WHERE bh.status = 'SETTLED'
        )
        BEGIN
            SELECT 'Error' AS Status,
                   'มี borrow_id ที่ถูก Settle แล้ว: '
                   + (
                       SELECT STUFF((
                           SELECT ', ' + bh.borrow_no
                           FROM #BorrowIds bi
                           JOIN borrow_headers bh ON bi.borrow_id = bh.borrow_id
                           WHERE bh.status = 'SETTLED'
                           FOR XML PATH('')
                       ), 1, 2, '')
                   ) AS Message;
            RETURN;
        END;
    END;

    -- Parse JsonLines
    CREATE TABLE #Lines (item_id INT, qty_order DECIMAL(18,4));

    INSERT INTO #Lines (item_id, qty_order)
    SELECT
        TRY_CAST(JSON_VALUE(value, '$.item_id') AS INT),
        TRY_CAST(JSON_VALUE(value, '$.qty')     AS DECIMAL(18,4))
    FROM OPENJSON(@JsonLines)
    WHERE ISJSON(value) = 1
      AND TRY_CAST(JSON_VALUE(value, '$.item_id') AS INT)           IS NOT NULL
      AND TRY_CAST(JSON_VALUE(value, '$.qty')     AS DECIMAL(18,4)) IS NOT NULL
      AND TRY_CAST(JSON_VALUE(value, '$.qty')     AS DECIMAL(18,4)) > 0;

    IF NOT EXISTS (SELECT 1 FROM #Lines)
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุรายการสินค้าใน JSON' AS Message;
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM #Lines l
        LEFT JOIN items i ON l.item_id = i.item_id
        WHERE i.item_id IS NULL
    )
    BEGIN
        SELECT 'Error' AS Status, 'มี item_id ที่ไม่พบในระบบ' AS Message;
        RETURN;
    END;

    IF EXISTS (SELECT 1 FROM #Lines WHERE qty_order <= 0)
    BEGIN
        SELECT 'Error' AS Status, 'qty ต้องมากกว่า 0 ทุกรายการ' AS Message;
        RETURN;
    END;

    -- Lines with price + conversion_factor
    CREATE TABLE #LinesWithPrice (
        item_id           INT,
        qty_order         DECIMAL(18,4),
        unit_price        DECIMAL(18,4),
        conversion_factor DECIMAL(18,4),
        line_type         VARCHAR(10),
        borrow_id         INT,
        borrow_line_id    INT
    );

    INSERT INTO #LinesWithPrice (
        item_id, qty_order, unit_price, conversion_factor,
        line_type, borrow_id, borrow_line_id
    )
    SELECT
        l.item_id,
        l.qty_order,
        spl.unit_price,
        ISNULL(spl.conversion_factor, 1),
        'ORDER',
        NULL,
        NULL
    FROM #Lines l
    LEFT JOIN supplier_price_list spl
           ON spl.item_id        = l.item_id
          AND spl.supplier_id    = @SupplierIdInt
          AND spl.is_active      = 1
          AND spl.effective_date <= @PoDateDt
          AND (spl.expire_date IS NULL OR spl.expire_date >= @PoDateDt);

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

    IF EXISTS (SELECT 1 FROM #BorrowIds)
    BEGIN
        INSERT INTO #LinesWithPrice (
            item_id, qty_order, unit_price, conversion_factor,
            line_type, borrow_id, borrow_line_id
        )
        SELECT
            bl.item_id,
            bl.qty_borrow,
            bl.unit_price,
            ISNULL(spl2.conversion_factor, 1),
            'BORROW',
            bl.borrow_id,
            bl.borrow_line_id
        FROM borrow_lines bl
        JOIN #BorrowIds bi ON bl.borrow_id = bi.borrow_id
        LEFT JOIN supplier_price_list spl2
               ON spl2.item_id        = bl.item_id
              AND spl2.supplier_id    = @SupplierIdInt
              AND spl2.is_active      = 1
              AND spl2.effective_date <= @PoDateDt
              AND (spl2.expire_date IS NULL OR spl2.expire_date >= @PoDateDt);
    END;

    -- Generate PO No
    DECLARE
        @YearMonth CHAR(6) = CONVERT(CHAR(6), @PoDateDt, 112),
        @RunNo     INT,
        @RunText   CHAR(3),
        @PoNo      VARCHAR(20);

    SELECT @RunNo = ISNULL(MAX(CAST(RIGHT(po_no, 3) AS INT)), 0) + 1
    FROM po_headers
    WHERE po_no LIKE 'PO' + CONVERT(CHAR(6), @PoDateDt, 112) + '%';

    SET @RunText = RIGHT('000' + CAST(@RunNo AS VARCHAR(3)), 3);
    SET @PoNo    = 'PO' + @YearMonth + '-' + @RunText;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO po_headers (
            po_no, po_date, supplier_id, due_date,
            status, note, created_by, created_at
        )
        VALUES (
            @PoNo, @PoDateDt, @SupplierIdInt, @DueDateDt,
            'DRAFT', @Note, @CreatedBy, GETDATE()
        );

        DECLARE @PoId INT = SCOPE_IDENTITY();

        INSERT INTO po_lines (
            po_id, item_id, qty_order, unit_price,
            line_type, borrow_line_id
        )
        SELECT @PoId, item_id, qty_order, unit_price,
               line_type, borrow_line_id
        FROM #LinesWithPrice;

        IF EXISTS (SELECT 1 FROM #BorrowIds)
        BEGIN
            UPDATE bh
            SET status     = 'SETTLED',
                po_id      = @PoId,
                settled_at = GETDATE(),
                settled_by = @CreatedBy
            FROM borrow_headers bh
            JOIN #BorrowIds bi ON bh.borrow_id = bi.borrow_id;

            UPDATE bl
            SET po_line_id = pl.po_line_id
            FROM borrow_lines bl
            JOIN po_lines pl
              ON pl.po_id = @PoId
             AND pl.borrow_line_id = bl.borrow_line_id;
        END;

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'สร้าง PO ' + @PoNo + ' (DRAFT) เรียบร้อย' AS Message;

        SELECT @PoId AS po_id, @PoNo AS po_no, 'DRAFT' AS status;

        SELECT
            lp.item_id,
            i.item_name_th,
            pu.unit_name_th AS purchase_unit_name_th,
            pu.unit_code    AS purchase_unit_code,
            uu.unit_name_th AS usage_unit_name_th,
            lp.qty_order,
            lp.conversion_factor,
            lp.unit_price,
            lp.qty_order * lp.unit_price AS total_price,
            lp.line_type,
            bh.borrow_no
        FROM #LinesWithPrice lp
        JOIN items i ON lp.item_id = i.item_id
        JOIN units uu ON uu.unit_id = i.usage_unit_id
        JOIN supplier_price_list spl3
          ON spl3.item_id        = lp.item_id
         AND spl3.supplier_id    = @SupplierIdInt
         AND spl3.is_active      = 1
         AND spl3.effective_date <= @PoDateDt
         AND (spl3.expire_date IS NULL OR spl3.expire_date >= @PoDateDt)
        JOIN units pu ON pu.unit_id = spl3.unit_id
        LEFT JOIN borrow_headers bh ON lp.borrow_id = bh.borrow_id
        ORDER BY lp.line_type DESC, lp.item_id;

        SELECT
            SUM(CASE WHEN line_type = 'ORDER'  THEN qty_order * unit_price ELSE 0 END) AS total_order,
            SUM(CASE WHEN line_type = 'BORROW' THEN qty_order * unit_price ELSE 0 END) AS total_borrow,
            SUM(qty_order * unit_price) AS grand_total
        FROM #LinesWithPrice;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_POUpdate
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_POUpdate]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_POUpdate]
GO

CREATE PROCEDURE [dbo].[sp_POUpdate]
    @PoId      NVARCHAR(20),
    @DueDate   NVARCHAR(20)  = NULL,
    @JsonLines NVARCHAR(MAX) = NULL,
    @Note      NVARCHAR(500) = NULL,
    @UpdatedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SET @PoId    = NULLIF(LTRIM(RTRIM(@PoId)),    '');
    SET @DueDate = NULLIF(LTRIM(RTRIM(@DueDate)), '');
    SET @Note    = NULLIF(LTRIM(RTRIM(@Note)),    '');

    IF @JsonLines IS NOT NULL AND ISJSON(@JsonLines) = 0
    BEGIN
        SELECT 'Error' AS Status, 'JsonLines ไม่ถูกต้อง' AS Message;
        RETURN;
    END;

    IF @PoId IS NULL OR ISNUMERIC(@PoId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @PoId' AS Message;
        RETURN;
    END;

    DECLARE @PoIdInt INT = CAST(@PoId AS INT);

    DECLARE
        @Status        VARCHAR(30),
        @PoDate        DATE,
        @PoNo          VARCHAR(20),
        @SupplierIdInt INT;

    SELECT
        @Status        = status,
        @PoDate        = po_date,
        @PoNo          = po_no,
        @SupplierIdInt = supplier_id
    FROM po_headers
    WHERE po_id = @PoIdInt;

    IF @Status IS NULL
    BEGIN
        SELECT 'Error' AS Status, 'ไม่พบ po_id = ' + @PoId AS Message;
        RETURN;
    END;

    IF @Status <> 'DRAFT'
    BEGIN
        SELECT 'Error' AS Status,
               'แก้ไขได้เฉพาะสถานะ DRAFT (ปัจจุบัน: ' + @Status + ')' AS Message;
        RETURN;
    END;

    DECLARE @DueDateDt DATE = CASE
        WHEN @DueDate IS NULL THEN NULL
        ELSE CAST(@DueDate AS DATE)
    END;

    IF @DueDateDt IS NOT NULL AND @DueDateDt < @PoDate
    BEGIN
        SELECT 'Error' AS Status, 'due_date ต้องไม่น้อยกว่า po_date' AS Message;
        RETURN;
    END;

    IF @JsonLines IS NOT NULL
    BEGIN
        CREATE TABLE #Lines (item_id INT, qty_order DECIMAL(18,4));

        INSERT INTO #Lines (item_id, qty_order)
        SELECT
            CAST(JSON_VALUE(j.value, '$.item_id') AS INT),
            CAST(JSON_VALUE(j.value, '$.qty')     AS DECIMAL(18,4))
        FROM OPENJSON(@JsonLines) AS j
        WHERE ISJSON(j.value) = 1
          AND ISNUMERIC(JSON_VALUE(j.value, '$.item_id')) = 1
          AND ISNUMERIC(JSON_VALUE(j.value, '$.qty'))     = 1;

        IF NOT EXISTS (SELECT 1 FROM #Lines)
        BEGIN
            SELECT 'Error' AS Status, 'ไม่พบรายการสินค้าใน @JsonLines' AS Message;
            RETURN;
        END;

        IF EXISTS (SELECT 1 FROM #Lines l LEFT JOIN items i ON l.item_id = i.item_id WHERE i.item_id IS NULL)
        BEGIN
            SELECT 'Error' AS Status, 'มี item_id ที่ไม่พบในระบบ' AS Message;
            RETURN;
        END;

        IF EXISTS (SELECT 1 FROM #Lines WHERE qty_order <= 0)
        BEGIN
            SELECT 'Error' AS Status, 'qty ต้องมากกว่า 0 ทุกรายการ' AS Message;
            RETURN;
        END;

        CREATE TABLE #LinesWithPrice (
            item_id           INT,
            qty_order         DECIMAL(18,4),
            unit_price        DECIMAL(18,4),
            conversion_factor DECIMAL(18,4)
        );

        INSERT INTO #LinesWithPrice (item_id, qty_order, unit_price, conversion_factor)
        SELECT
            l.item_id,
            l.qty_order,
            spl.unit_price,
            ISNULL(spl.conversion_factor, 1)
        FROM #Lines l
        LEFT JOIN supplier_price_list spl
               ON spl.item_id        = l.item_id
              AND spl.supplier_id    = @SupplierIdInt
              AND spl.is_active      = 1
              AND spl.effective_date <= @PoDate
              AND (spl.expire_date IS NULL OR spl.expire_date >= @PoDate);

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
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE po_headers
        SET
            due_date   = ISNULL(@DueDateDt, due_date),
            note       = ISNULL(@Note, note),
            updated_by = @UpdatedBy,
            updated_at = GETDATE()
        WHERE po_id = @PoIdInt;

        IF @JsonLines IS NOT NULL
        BEGIN
            DELETE FROM po_lines
            WHERE po_id    = @PoIdInt
              AND line_type = 'ORDER';

            INSERT INTO po_lines (po_id, item_id, qty_order, unit_price)
            SELECT @PoIdInt, item_id, qty_order, unit_price
            FROM #LinesWithPrice;
        END;

        COMMIT TRANSACTION;

        SELECT 'Success' AS Status,
               'แก้ไข PO เลขที่ ' + @PoNo + ' เรียบร้อย' AS Message;

        -- Header
        SELECT
            h.po_id,
            h.po_no,
            h.po_date,
            h.supplier_id,
            h.due_date,
            h.status,
            h.note
        FROM po_headers h
        WHERE h.po_id = @PoIdInt;

        -- Lines  *** FIXED: purchase_unit_name_th/en from supplier_price_list → units ***
        IF @JsonLines IS NOT NULL
        BEGIN
            SELECT
                l.po_line_id,
                l.item_id,
                i.item_name_th,
                i.item_name_en,
                pu.unit_name_th                            AS purchase_unit_name_th,  -- FIXED
                pu.unit_name_en                            AS purchase_unit_name_en,  -- FIXED
                pu.unit_code                               AS purchase_unit_code,      -- FIXED
                uu.unit_name_th                            AS usage_unit_name_th,
                uu.unit_code                               AS usage_unit_code,
                l.qty_order,
                lp.conversion_factor,
                l.unit_price,
                l.qty_order * l.unit_price                 AS total_price
            FROM po_lines l
            JOIN items i    ON l.item_id  = i.item_id
            JOIN units uu   ON uu.unit_id = i.usage_unit_id
            -- purchase unit per supplier
            JOIN supplier_price_list spl4
                            ON spl4.item_id        = l.item_id
                           AND spl4.supplier_id    = @SupplierIdInt
                           AND spl4.is_active      = 1
                           AND spl4.effective_date <= @PoDate
                           AND (spl4.expire_date IS NULL OR spl4.expire_date >= @PoDate)
            JOIN units pu   ON pu.unit_id = spl4.unit_id
            -- pick conversion factor from our temp table
            JOIN #LinesWithPrice lp ON lp.item_id = l.item_id
            WHERE l.po_id = @PoIdInt
            ORDER BY l.po_line_id;
        END;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_UpsertSupplierPrice
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpsertSupplierPrice]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_UpsertSupplierPrice]
GO

CREATE PROCEDURE [dbo].[sp_UpsertSupplierPrice]
    @SupplierId    NVARCHAR(20),
    @ItemId        NVARCHAR(20),
    @UnitId        NVARCHAR(20),          -- ← เพิ่มใหม่: ระบุหน่วยซื้อเอง
    @UnitPrice     DECIMAL(18,4),
    @EffectiveDate NVARCHAR(20),
    @ExpireDate    NVARCHAR(20) = NULL,
    @ConversionFactor DECIMAL(18,4) = 1,  -- ← เพิ่มใหม่: conversion factor (default = 1)
    @CreatedBy     NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    ------------------------------------------------------------
    -- Normalize: แปลง '' → NULL
    ------------------------------------------------------------
    SET @SupplierId    = NULLIF(LTRIM(RTRIM(@SupplierId)),    '');
    SET @ItemId        = NULLIF(LTRIM(RTRIM(@ItemId)),        '');
    SET @UnitId        = NULLIF(LTRIM(RTRIM(@UnitId)),        '');
    SET @EffectiveDate = NULLIF(LTRIM(RTRIM(@EffectiveDate)), '');
    SET @ExpireDate    = NULLIF(LTRIM(RTRIM(@ExpireDate)),    '');

    ------------------------------------------------------------
    -- 1) ตรวจ parameter
    ------------------------------------------------------------
    IF @SupplierId IS NULL OR ISNUMERIC(@SupplierId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @SupplierId ให้ถูกต้อง' AS Message;
        RETURN;
    END;

    IF @ItemId IS NULL OR ISNUMERIC(@ItemId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @ItemId ให้ถูกต้อง' AS Message;
        RETURN;
    END;

    IF @UnitId IS NULL OR ISNUMERIC(@UnitId) = 0
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @UnitId ให้ถูกต้อง' AS Message;
        RETURN;
    END;

    IF @EffectiveDate IS NULL
    BEGIN
        SELECT 'Error' AS Status, 'กรุณาระบุ @EffectiveDate' AS Message;
        RETURN;
    END;

    IF @ConversionFactor IS NULL OR @ConversionFactor <= 0
    BEGIN
        SELECT 'Error' AS Status, 'conversion_factor ต้องมากกว่า 0' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- แปลงเป็น type จริง
    ------------------------------------------------------------
    DECLARE
        @SupplierIdInt   INT  = CAST(@SupplierId    AS INT),
        @ItemIdInt       INT  = CAST(@ItemId        AS INT),
        @UnitIdInt       INT  = CAST(@UnitId        AS INT),
        @EffectiveDateDt DATE = CAST(@EffectiveDate AS DATE),
        @ExpireDateDt    DATE = CASE
                                    WHEN @ExpireDate IS NULL THEN NULL
                                    ELSE CAST(@ExpireDate AS DATE)
                                END;

    ------------------------------------------------------------
    -- 2) ตรวจ supplier
    ------------------------------------------------------------
    IF NOT EXISTS (
        SELECT 1 FROM suppliers
        WHERE supplier_id = @SupplierIdInt
    )
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ supplier_id = ' + @SupplierId AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 3) ตรวจ item และดึง usage_unit_id
    --    (items ไม่มี purchase_unit_id → ใช้ @UnitId ที่ส่งมาแทน)
    ------------------------------------------------------------
    DECLARE @UsageUnitId INT;

    SELECT @UsageUnitId = usage_unit_id
    FROM items
    WHERE item_id = @ItemIdInt;

    IF @UsageUnitId IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ item_id = ' + @ItemId AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 4) ตรวจ unit ที่ส่งมา ว่ามีอยู่และยังใช้งานอยู่
    ------------------------------------------------------------
    IF NOT EXISTS (
        SELECT 1 FROM units
        WHERE unit_id = @UnitIdInt AND is_active = 1
    )
    BEGIN
        SELECT 'Error' AS Status,
               'ไม่พบ unit_id = ' + @UnitId
               + ' หรือหน่วยนี้ไม่ได้ใช้งาน' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 5) ตรวจราคา
    ------------------------------------------------------------
    IF @UnitPrice <= 0
    BEGIN
        SELECT 'Error' AS Status, 'ราคาต้องมากกว่า 0' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 6) ตรวจ date
    ------------------------------------------------------------
    IF @ExpireDateDt IS NOT NULL AND @EffectiveDateDt >= @ExpireDateDt
    BEGIN
        SELECT 'Error' AS Status,
               'effective_date ต้องน้อยกว่า expire_date' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 7) ถ้า effective_date ซ้ำ (supplier + item + unit + date)
    --    → UPDATE ราคาและ conversion_factor เดิม
    ------------------------------------------------------------
    IF EXISTS (
        SELECT 1 FROM supplier_price_list
        WHERE supplier_id    = @SupplierIdInt
          AND item_id        = @ItemIdInt
          AND unit_id        = @UnitIdInt
          AND effective_date = @EffectiveDateDt
          AND is_active      = 1
    )
    BEGIN
        BEGIN TRY
            UPDATE supplier_price_list
            SET
                unit_price        = @UnitPrice,
                expire_date       = @ExpireDateDt,
                conversion_factor = @ConversionFactor,
                updated_by        = @CreatedBy,
                updated_at        = GETDATE()
            WHERE supplier_id    = @SupplierIdInt
              AND item_id        = @ItemIdInt
              AND unit_id        = @UnitIdInt
              AND effective_date = @EffectiveDateDt;

            SELECT 'Success' AS Status, 'อัปเดตราคาเรียบร้อย' AS Message;

            SELECT
                @SupplierIdInt   AS supplier_id,
                @ItemIdInt       AS item_id,
                @UnitIdInt       AS unit_id,
                @UsageUnitId     AS usage_unit_id,
                @UnitPrice       AS unit_price,
                @ConversionFactor AS conversion_factor,
                @EffectiveDateDt AS effective_date,
                @ExpireDateDt    AS expire_date;
        END TRY
        BEGIN CATCH
            SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
        END CATCH;
        RETURN;
    END;

    ------------------------------------------------------------
    -- 8) ปิดราคาเก่า (เฉพาะ unit เดียวกัน)
    --    set expire_date = effective_date - 1 วัน, is_active = 0
    ------------------------------------------------------------
    UPDATE supplier_price_list
    SET
        expire_date = DATEADD(DAY, -1, @EffectiveDateDt),
        is_active   = 0,
        updated_by  = @CreatedBy,
        updated_at  = GETDATE()
    WHERE supplier_id = @SupplierIdInt
      AND item_id     = @ItemIdInt
      AND unit_id     = @UnitIdInt
      AND is_active   = 1
      AND (expire_date IS NULL OR expire_date >= @EffectiveDateDt);

    ------------------------------------------------------------
    -- 9) Insert ราคาใหม่
    ------------------------------------------------------------
    BEGIN TRY
        INSERT INTO supplier_price_list (
            supplier_id, item_id, unit_id,
            unit_price, effective_date, expire_date,
            conversion_factor,
            is_active, created_by, created_at
        )
        VALUES (
            @SupplierIdInt, @ItemIdInt, @UnitIdInt,
            @UnitPrice, @EffectiveDateDt, @ExpireDateDt,
            @ConversionFactor,
            1, @CreatedBy, GETDATE()
        );

        SELECT 'Success' AS Status, 'เพิ่มราคาใหม่เรียบร้อย' AS Message;

        SELECT
            @SupplierIdInt   AS supplier_id,
            @ItemIdInt       AS item_id,
            @UnitIdInt       AS unit_id,
            @UsageUnitId     AS usage_unit_id,
            @UnitPrice       AS unit_price,
            @ConversionFactor AS conversion_factor,
            @EffectiveDateDt AS effective_date,
            @ExpireDateDt    AS expire_date;
    END TRY
    BEGIN CATCH
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;
GO


-- ----------------------------
-- procedure structure for sp_GetSupplierPrice
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetSupplierPrice]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[sp_GetSupplierPrice]
GO

CREATE PROCEDURE [dbo].[sp_GetSupplierPrice]
    @SupplierId NVARCHAR(20) = NULL,   -- ← เปลี่ยนเป็น NVARCHAR
    @ItemId     NVARCHAR(20) = NULL,   -- ← เปลี่ยนเป็น NVARCHAR
    @Mode       NVARCHAR(10) = 'current'
AS
BEGIN
    SET NOCOUNT ON;

    -- ✅ Normalize: แปลง '' → NULL เหมือน SP อื่นในระบบ
    SET @SupplierId = NULLIF(LTRIM(RTRIM(@SupplierId)), '');
    SET @ItemId     = NULLIF(LTRIM(RTRIM(@ItemId)),     '');
    SET @Mode       = NULLIF(LTRIM(RTRIM(@Mode)),       '');

    -- แปลงเป็น INT จริงหลัง Normalize
    DECLARE 
        @SupplierIdInt INT = TRY_CAST(@SupplierId AS INT),
        @ItemIdInt     INT = TRY_CAST(@ItemId     AS INT);

    ------------------------------------------------------------
    -- ตรวจ Mode = 'current' และ 'history'
    ------------------------------------------------------------
    IF LOWER(@Mode) IN ('current', 'history') AND @SupplierIdInt IS NULL
    BEGIN
        SELECT 'Error' AS Status,
               'Mode ' + @Mode + ' ต้องระบุ @SupplierId' AS Message;
        RETURN;
    END;

    ------------------------------------------------------------
    -- Mode = 'current'
    ------------------------------------------------------------
    IF LOWER(@Mode) = 'current'
    BEGIN
        SELECT
            spl.price_id,
            spl.supplier_id,
            spl.item_id,
            spl.unit_id,
            u.unit_code,
            u.unit_name_th,
            spl.unit_price,
            spl.effective_date,
            spl.expire_date,
            spl.created_by,
            spl.created_at
        FROM supplier_price_list spl
        JOIN units u ON spl.unit_id = u.unit_id
        WHERE spl.is_active       = 1
          AND spl.supplier_id     = @SupplierIdInt
          AND spl.effective_date <= CAST(GETDATE() AS DATE)
          AND (spl.expire_date IS NULL OR spl.expire_date >= CAST(GETDATE() AS DATE))
          AND (@ItemIdInt IS NULL OR spl.item_id = @ItemIdInt)  -- ✅ ใช้ INT ที่ Normalize แล้ว
        ORDER BY spl.item_id;
        RETURN;
    END;

    ------------------------------------------------------------
    -- Mode = 'history'
    ------------------------------------------------------------
    IF LOWER(@Mode) = 'history'
    BEGIN
        SELECT
            spl.price_id,
            spl.supplier_id,
            spl.item_id,
            spl.unit_id,
            u.unit_code,
            u.unit_name_th,
            spl.unit_price,
            spl.effective_date,
            spl.expire_date,
            spl.is_active,
            spl.created_by,
            spl.created_at
        FROM supplier_price_list spl
        JOIN units u ON spl.unit_id = u.unit_id
        WHERE spl.supplier_id = @SupplierIdInt
          AND (@ItemIdInt IS NULL OR spl.item_id = @ItemIdInt)  -- ✅
        ORDER BY spl.item_id,
                 spl.effective_date DESC;
        RETURN;
    END;

    ------------------------------------------------------------
    -- Mode = 'compare'
    ------------------------------------------------------------
    IF LOWER(@Mode) = 'compare'
    BEGIN
        SELECT
            spl.item_id,
            spl.unit_id,
            u.unit_code,
            u.unit_name_th,
            spl.supplier_id,
            spl.unit_price,
            spl.effective_date,
            RANK() OVER (
                PARTITION BY spl.item_id, spl.unit_id
                ORDER BY spl.unit_price ASC
            ) AS price_rank
        FROM supplier_price_list spl
        JOIN units u ON spl.unit_id = u.unit_id
        WHERE spl.is_active       = 1
          AND spl.effective_date <= CAST(GETDATE() AS DATE)
          AND (spl.expire_date IS NULL
               OR spl.expire_date >= CAST(GETDATE() AS DATE))
          AND (@SupplierIdInt IS NULL OR spl.supplier_id = @SupplierIdInt)  -- ✅
          AND (@ItemIdInt     IS NULL OR spl.item_id     = @ItemIdInt)      -- ✅
        ORDER BY spl.item_id, price_rank;
        RETURN;
    END;

    SELECT 'Error' AS Status,
           'Mode ที่รองรับ: current, history, compare' AS Message;
END;
GO

