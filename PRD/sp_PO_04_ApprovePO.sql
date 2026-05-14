ALTER PROCEDURE sp_PO_04_ApprovePO
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

    -- ✅ FIXED: เพิ่ม 'REWORK' ในการตรวจ
    IF @Action NOT IN ('APPROVE', 'REJECT', 'REWORK')
    BEGIN
        SELECT 'Error' AS Status,
               'Action ที่รองรับ: APPROVE, REJECT, REWORK' AS Message;
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

    -- ✅ UPDATED: อนุญาต REWORK จาก APPROVED_L1, APPROVED_L2 ด้วย
    IF @Action = 'REWORK'
    BEGIN
        IF @CurrentStatus NOT IN ('APPROVED_L1', 'APPROVED_L2', 'APPROVED_L3')
        BEGIN
            SELECT 'Error' AS Status,
                   'REWORK ได้เฉพาะ PO ที่อยู่ระหว่างการอนุมัติเท่านั้น (สถานะปัจจุบัน: '
                   + @CurrentStatus + ')' AS Message;
            RETURN;
        END;
    END
    ELSE
    BEGIN
        IF @CurrentStatus NOT IN ('PENDING_APPROVAL', 'APPROVED_L1', 'APPROVED_L2')
        BEGIN
            SELECT 'Error' AS Status,
                   'PO นี้ไม่ได้อยู่ระหว่างรออนุมัติ (สถานะ: '
                   + @CurrentStatus + ')' AS Message;
            RETURN;
        END;
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

    -- ✅ NEW: ตรวจ REWORK - ต้องมาจากระดับที่ถูกต้อง
    IF @Action = 'REWORK'
    BEGIN
        DECLARE @ReworkRole NVARCHAR(50) = CASE @CurrentStatus
            WHEN 'APPROVED_L1' THEN 'MANAGER'
            WHEN 'APPROVED_L2' THEN 'DEPARTMENT'
            WHEN 'APPROVED_L3' THEN 'DIRECTOR'
        END;

        IF @Role <> @ReworkRole
        BEGIN
            SELECT 'Error' AS Status,
                   'รหัสพนักงาน ' + @ActionedBy
                   + ' เป็น ' + @Role
                   + ' แต่ REWORK ต้องมาจาก ' + @ReworkRole
                   + ' เท่านั้น' AS Message;
            RETURN;
        END;
    END
    ELSE
    BEGIN
        -- ตรวจว่า Role ตรงกับลำดับปัจจุบันของ PO
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
    END;

    -- ✅ UPDATED: ตรวจ approval row - อนุญาต REWORK ด้วย
    DECLARE @ApprovalExists INT = 0;

    IF @Action = 'REWORK'
    BEGIN
        IF EXISTS (
            SELECT 1 FROM po_approvals
            WHERE po_id        = @PoIdInt
              AND approval_role = @Role
              AND status        = 'PENDING'
        )
        BEGIN
            SET @ApprovalExists = 1;
        END;
    END
    ELSE
    BEGIN
        IF EXISTS (
            SELECT 1 FROM po_approvals
            WHERE po_id        = @PoIdInt
              AND approval_role = @Role
              AND status        = 'PENDING'
        )
        BEGIN
            SET @ApprovalExists = 1;
        END;
    END;

    IF @ApprovalExists = 0
    BEGIN
        SELECT 'Error' AS Status,
               'approval ระดับ ' + @Role
               + ' ของ PO นี้ไม่ถูกต้องสำหรับการดำเนินการ' AS Message;
        RETURN;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- ✅ NEW SECTION: Handle REWORK - Reset to DRAFT
        IF @Action = 'REWORK'
        BEGIN
            -- Reset PO status เป็น DRAFT
            UPDATE po_headers
            SET status = 'DRAFT'
            WHERE po_id = @PoIdInt;

            -- Reset ทุก approval กลับเป็น PENDING
            UPDATE po_approvals
            SET
                status      = 'PENDING',
                actioned_by = NULL,
                actioned_at = NULL,
                remark      = NULL
            WHERE po_id = @PoIdInt;

            -- บันทึก REWORK action ในแถว current role
            UPDATE po_approvals
            SET
                actioned_by = @ActionedBy,
                actioned_at = GETDATE(),
                remark      = @Remark
            WHERE po_id        = @PoIdInt
              AND approval_role = @Role;
        END
        ELSE
        BEGIN
            -- ✅ ORIGINAL LOGIC: APPROVE / REJECT
            -- 6) กำหนด Next Status
            DECLARE @NextStatus VARCHAR(30) = CASE
                WHEN @Action = 'REJECT'       THEN 'CANCELLED'
                WHEN @Action = 'REWORK'       THEN 'DRAFT'
                WHEN @Role   = 'GROUP_LEAD'   THEN 'APPROVED_L1'
                WHEN @Role   = 'MANAGER'      THEN 'APPROVED_L2'
                WHEN @Role   = 'DEPARTMENT'   THEN 'ORDERED'
            END;

            -- 7) Update approval row
            UPDATE po_approvals
            SET
                status      = @Action,
                actioned_by = @ActionedBy,
                actioned_at = GETDATE(),
                remark      = @Remark
            WHERE po_id        = @PoIdInt
              AND approval_role = @Role;

            -- 8) Update PO status
            UPDATE po_headers
            SET status = @NextStatus
            WHERE po_id = @PoIdInt;

            -- 9) ถ้า REJECT → ยกเลิก approval ที่เหลือ
            IF @Action = 'REJECT'
            BEGIN
                UPDATE po_approvals
                SET status = 'CANCELLED'
                WHERE po_id = @PoIdInt AND status = 'PENDING';
            END;
        END;

        COMMIT TRANSACTION;

        -- ✅ UPDATED: Message section
        SELECT 'Success' AS Status,
               CASE @Action
                   WHEN 'APPROVE' THEN 'อนุมัติ PO ' + @PoNo
                                       + ' โดย ' + @ActionedBy
                                       + ' (' + @Role + ')'
                   WHEN 'REJECT'  THEN 'ปฏิเสธ PO ' + @PoNo
                                       + ' โดย ' + @ActionedBy
                                       + ' → กลับสู่ DRAFT'
                   WHEN 'REWORK'  THEN 'ส่งกลับแก้ไข PO ' + @PoNo
                                       + ' โดย ' + @ActionedBy
                                       + ' → กลับสู่ DRAFT'
               END AS Message;

        -- Email notification
        IF @Action = 'REJECT'
        BEGIN
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
        ELSE IF @Action = 'REWORK'
        BEGIN
            -- ✅ NEW: แจ้ง HR ว่า PO ถูกส่งกลับแก้ไข
            SELECT
                'HR'                AS notify_role,
                @CreatedBy          AS employee_id,
                ve.eng_name,
                ve.email,
                '[ส่งกลับแก้ไข] PO เลขที่ ' + @PoNo
                                    AS subject,
                'PO เลขที่ '       + @PoNo
                + ' ถูกส่งกลับแก้ไขโดย ' + @ActionedBy
                + ' (' + @Role + ')'
                + CHAR(13) + CHAR(10)
                + 'เหตุผล: '       + ISNULL(@Remark, 'ไม่ระบุ')
                + CHAR(13) + CHAR(10)
                + 'กรุณาแก้ไขและส่งอนุมัติใหม่อีกครั้ง'
                                    AS body
            FROM view_email ve
            WHERE ve.employee_id = @CreatedBy;
        END
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Error' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH;
END;