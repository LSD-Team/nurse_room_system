-- =====================================================
-- Email Logs Table - บันทึกการส่ง Email ทั้งหมด
-- =====================================================
-- ใช้คำสั่งนี้สำหรับการตั้งค่าเบื้องต้น

-- Drop table if exists (for fresh setup)
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[email_logs]') AND type IN ('U'))
    DROP TABLE [dbo].[email_logs]
GO

-- Create main table
CREATE TABLE [dbo].[email_logs] (
    [email_log_id] INT IDENTITY(1,1) NOT NULL,
    [document_type] NVARCHAR(50) COLLATE Thai_CI_AS NOT NULL,         -- 'PO', 'BORROW'
    [document_id] INT NOT NULL,                                         -- po_id or borrow_id
    [document_no] NVARCHAR(50) COLLATE Thai_CI_AS NOT NULL,            -- PO-2026-001, BR-2026-001
    [notify_type] NVARCHAR(50) COLLATE Thai_CI_AS NOT NULL,            -- 'APPROVAL_PO', 'REWORK_PO', 'COMPLETED_PO', etc.
    [recipient_emails] NVARCHAR(MAX) COLLATE Thai_CI_AS NOT NULL,      -- 'email1@company.com,email2@company.com' (comma-separated)
    [cc_emails] NVARCHAR(MAX) COLLATE Thai_CI_AS,                      -- Optional CC recipients
    [bcc_emails] NVARCHAR(MAX) COLLATE Thai_CI_AS,                     -- Optional BCC recipients
    [subject] NVARCHAR(500) COLLATE Thai_CI_AS NOT NULL,               -- Email subject
    [sent_status] NVARCHAR(20) COLLATE Thai_CI_AS DEFAULT 'PENDING' NOT NULL,  -- 'PENDING', 'SUCCESS', 'FAILED'
    [external_service_response] NVARCHAR(MAX) COLLATE Thai_CI_AS,      -- Full response from external email service
    [error_message] NVARCHAR(MAX) COLLATE Thai_CI_AS,                  -- Error message if failed
    [external_message_id] NVARCHAR(500) COLLATE Thai_CI_AS,            -- Message ID from external service
    [is_test_override] BIT DEFAULT 0 NOT NULL,                         -- 1 if using TEST_EMAIL_OVERRIDE, 0 if production
    [test_override_original_email] NVARCHAR(MAX) COLLATE Thai_CI_AS,   -- Original recipient emails before override
    [sent_by_employee_id] INT,                                          -- Employee ID who triggered the email
    [created_at] DATETIME DEFAULT CAST(DATEADD(HOUR, 7, GETUTCDATE()) AS DATETIME) NOT NULL,                  -- When email was sent (Thailand Time UTC+7)
    [external_sent_at] DATETIME,                                        -- When external service processed it
    [retry_count] INT DEFAULT 0 NOT NULL,                              -- Number of retry attempts
    [last_retry_at] DATETIME,                                           -- Last retry timestamp
    PRIMARY KEY CLUSTERED ([email_log_id] ASC),
)
GO

-- Create indexes for better query performance
CREATE INDEX [IDX_email_logs_document] ON [dbo].[email_logs] ([document_type], [document_id])
GO

CREATE INDEX [IDX_email_logs_created_at] ON [dbo].[email_logs] ([created_at])
GO

CREATE INDEX [IDX_email_logs_notify_type] ON [dbo].[email_logs] ([notify_type])
GO

CREATE INDEX [IDX_email_logs_status] ON [dbo].[email_logs] ([sent_status])
GO

-- Add constraint to ensure valid document types
ALTER TABLE [dbo].[email_logs]
ADD CONSTRAINT [CK_email_logs_document_type] CHECK ([document_type] IN ('PO', 'BORROW'))
GO

-- Add constraint to ensure valid notify types
ALTER TABLE [dbo].[email_logs]
ADD CONSTRAINT [CK_email_logs_notify_type] CHECK ([notify_type] IN (
    'APPROVAL_PO', 
    'APPROVAL_BORROW', 
    'PO_REWORK', 
    'BORROW_REWORK', 
    'PO_COMPLETED', 
    'BORROW_COMPLETED'
))
GO

-- Add constraint to ensure valid status
ALTER TABLE [dbo].[email_logs]
ADD CONSTRAINT [CK_email_logs_status] CHECK ([sent_status] IN ('PENDING', 'SUCCESS', 'FAILED'))
GO

PRINT 'Email logs table created successfully!'
GO

-- =====================================================
-- ตัวอย่าง Query สำหรับใช้งาน
-- =====================================================

-- View: ดูจำนวน email ที่ส่งสำเร็จ/ล้มเหลว
-- SELECT sent_status, COUNT(*) as count FROM [dbo].[email_logs] GROUP BY sent_status;

-- View: ดูประวัติส่ง email สำหรับเอกสาร PO ที่เฉพาะ
-- SELECT * FROM [dbo].[email_logs] WHERE document_type = 'PO' AND document_id = 1;

-- View: ดูลำดับเวลาการส่ง email
-- SELECT email_log_id, document_no, notify_type, sent_status, created_at FROM [dbo].[email_logs] ORDER BY created_at DESC;

-- View: ตรวจสอบ email ที่ไม่สำเร็จ
-- SELECT email_log_id, document_no, error_message, created_at FROM [dbo].[email_logs] WHERE sent_status = 'FAILED';

-- View: ดูว่าใช้ test override มั้ย
-- SELECT * FROM [dbo].[email_logs] WHERE is_test_override = 1 ORDER BY created_at DESC;
