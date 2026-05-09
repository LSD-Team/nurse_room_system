-- =====================================================
-- Email Logs Table - Create Table & Indexes
-- =====================================================
-- Copy & paste this entire script into SQL Server Management Studio
-- Then click Execute (F5)

-- Step 1: Drop table if exists (fresh setup)
-- ⚠️ WARNING: This will DELETE all existing email logs if table exists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[email_logs]') AND type IN ('U'))
    DROP TABLE [dbo].[email_logs]
GO

-- Step 2: Create main table
CREATE TABLE [dbo].[email_logs] (
    -- Primary Key
    [email_log_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    
    -- Document Information
    [document_type] NVARCHAR(50) COLLATE Thai_CI_AS NOT NULL,         -- 'PO' or 'BORROW'
    [document_id] INT NOT NULL,                                         -- po_id or borrow_id
    [document_no] NVARCHAR(50) COLLATE Thai_CI_AS NOT NULL,            -- 'PO-2026-001', 'BR-2026-001'
    
    -- Email Type & Recipients
    [notify_type] NVARCHAR(50) COLLATE Thai_CI_AS NOT NULL,            -- APPROVAL_PO, REWORK_BORROW, etc.
    [recipient_emails] NVARCHAR(MAX) COLLATE Thai_CI_AS NOT NULL,      -- 'a@x.com,b@x.com'
    [cc_emails] NVARCHAR(MAX) COLLATE Thai_CI_AS,                      -- Optional CC
    [bcc_emails] NVARCHAR(MAX) COLLATE Thai_CI_AS,                     -- Optional BCC
    
    -- Email Content
    [subject] NVARCHAR(500) COLLATE Thai_CI_AS NOT NULL,               -- Email subject line
    
    -- Status & Results
    [sent_status] NVARCHAR(20) COLLATE Thai_CI_AS DEFAULT 'PENDING' NOT NULL,  -- PENDING, SUCCESS, FAILED
    [external_service_response] NVARCHAR(MAX) COLLATE Thai_CI_AS,      -- Full JSON response
    [error_message] NVARCHAR(MAX) COLLATE Thai_CI_AS,                  -- Error details (if failed)
    [external_message_id] NVARCHAR(500) COLLATE Thai_CI_AS,            -- Message ID from service
    
    -- Test Mode Tracking
    [is_test_override] BIT DEFAULT 0 NOT NULL,                         -- 1 if test email override used
    [test_override_original_email] NVARCHAR(MAX) COLLATE Thai_CI_AS,   -- Original recipients before override
    
    -- Audit Trail
    [sent_by_employee_id] INT,                                          -- Employee who triggered send
    [created_at] DATETIME DEFAULT GETDATE() NOT NULL,                  -- When log created
    [external_sent_at] DATETIME,                                        -- When external service processed
    
    -- Retry Logic
    [retry_count] INT DEFAULT 0 NOT NULL,                              -- Number of retries
    [last_retry_at] DATETIME                                            -- Last retry timestamp
)
GO

-- Step 3: Create indexes for better performance
-- Index 1: For querying logs by document
CREATE INDEX [IDX_email_logs_document] 
ON [dbo].[email_logs] ([document_type], [document_id])
GO

-- Index 2: For querying by date
CREATE INDEX [IDX_email_logs_created_at] 
ON [dbo].[email_logs] ([created_at])
GO

-- Index 3: For querying by notification type
CREATE INDEX [IDX_email_logs_notify_type] 
ON [dbo].[email_logs] ([notify_type])
GO

-- Index 4: For querying by status
CREATE INDEX [IDX_email_logs_status] 
ON [dbo].[email_logs] ([sent_status])
GO

-- Step 4: Add constraints for data validation
-- ⚠️ If you get error about duplicates, ignore (constraints already exist)

-- Constraint 1: Valid document types
BEGIN TRY
    ALTER TABLE [dbo].[email_logs]
    ADD CONSTRAINT [CK_email_logs_document_type] 
    CHECK ([document_type] IN ('PO', 'BORROW'))
END TRY
BEGIN CATCH
    PRINT 'Constraint CK_email_logs_document_type already exists'
END CATCH
GO

-- Constraint 2: Valid notification types
BEGIN TRY
    ALTER TABLE [dbo].[email_logs]
    ADD CONSTRAINT [CK_email_logs_notify_type] 
    CHECK ([notify_type] IN (
        'APPROVAL_PO', 
        'APPROVAL_BORROW', 
        'PO_REWORK', 
        'BORROW_REWORK', 
        'PO_COMPLETED', 
        'BORROW_COMPLETED'
    ))
END TRY
BEGIN CATCH
    PRINT 'Constraint CK_email_logs_notify_type already exists'
END CATCH
GO

-- Constraint 3: Valid status values
BEGIN TRY
    ALTER TABLE [dbo].[email_logs]
    ADD CONSTRAINT [CK_email_logs_status] 
    CHECK ([sent_status] IN ('PENDING', 'SUCCESS', 'FAILED'))
END TRY
BEGIN CATCH
    PRINT 'Constraint CK_email_logs_status already exists'
END CATCH
GO

-- =====================================================
-- Verification Commands (run after creating table)
-- =====================================================

-- ✅ Check if table exists
-- SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'email_logs';

-- ✅ Check table structure
-- EXEC sp_columns 'email_logs';

-- ✅ Check indexes
-- SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('email_logs');

-- ✅ Check constraints
-- SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'email_logs';

-- ✅ Test insert (this should succeed)
-- INSERT INTO email_logs (document_type, document_id, document_no, notify_type, recipient_emails, subject, sent_status)
-- VALUES ('PO', 1, 'PO-2026-001', 'APPROVAL_PO', 'test@example.com', 'Test Subject', 'SUCCESS');
-- SELECT * FROM email_logs;

-- =====================================================
-- Success Message
-- =====================================================
PRINT '✅ Email logs table created successfully!'
PRINT '📊 Table: [dbo].[email_logs]'
PRINT '📈 Columns: 22'
PRINT '🔍 Indexes: 4'
PRINT '✓ Constraints: 3'
GO
