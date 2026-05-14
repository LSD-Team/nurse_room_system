-- ============================================================
-- Physical Count & Snapshot Workflow - Database Setup Script
-- ============================================================
-- วันที่: 2026-05-14
-- อธิบาย: สร้างตาราง + Stored Procedures สำหรับระบบนับสต็อก
-- ============================================================

SET NOCOUNT ON;
GO

-- ============================================================
-- CREATE TABLE: physical_count_headers
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM sys.all_objects
    WHERE object_id = OBJECT_ID(N'[dbo].[physical_count_headers]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[physical_count_headers] (
        [count_id]        INT            IDENTITY(1,1) NOT NULL,
        [period_code]     VARCHAR(10)    COLLATE Thai_CI_AS NOT NULL,
        [count_status]    VARCHAR(20)    COLLATE Thai_CI_AS NOT NULL DEFAULT 'DRAFT',
        [note]            NVARCHAR(500)  COLLATE Thai_CI_AS NULL,
        [created_by]      NVARCHAR(100)  COLLATE Thai_CI_AS NOT NULL,
        [created_at]      DATETIME       DEFAULT GETDATE() NOT NULL,
        [submitted_by]    NVARCHAR(100)  COLLATE Thai_CI_AS NULL,
        [submitted_at]    DATETIME       NULL,
        [approved_by]     NVARCHAR(100)  COLLATE Thai_CI_AS NULL,
        [approved_at]     DATETIME       NULL,
        [rejected_reason] NVARCHAR(500)  COLLATE Thai_CI_AS NULL,

        CONSTRAINT PK_physical_count_headers PRIMARY KEY (count_id),
        CONSTRAINT FK_phys_count_period
            FOREIGN KEY (period_code) REFERENCES stock_periods(period_code)
    );
    PRINT 'Created table: physical_count_headers';
END
ELSE
    PRINT 'Table already exists: physical_count_headers';
GO

-- ============================================================
-- CREATE TABLE: physical_count_lines
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM sys.all_objects
    WHERE object_id = OBJECT_ID(N'[dbo].[physical_count_lines]') AND type = 'U'
)
BEGIN
    CREATE TABLE [dbo].[physical_count_lines] (
        [line_id]     INT            IDENTITY(1,1) NOT NULL,
        [count_id]    INT            NOT NULL,
        [item_id]     INT            NOT NULL,
        [qty_system]  DECIMAL(18,4)  NOT NULL,
        [qty_counted] DECIMAL(18,4)  NOT NULL DEFAULT 0,
        [diff_qty]    AS (qty_counted - qty_system) PERSISTED,
        [note]        NVARCHAR(500)  COLLATE Thai_CI_AS NULL,

        CONSTRAINT PK_physical_count_lines PRIMARY KEY (line_id),
        CONSTRAINT FK_phys_count_line_header
            FOREIGN KEY (count_id) REFERENCES physical_count_headers(count_id),
        CONSTRAINT UQ_phys_count_item UNIQUE (count_id, item_id)
    );
    PRINT 'Created table: physical_count_lines';
END
ELSE
    PRINT 'Table already exists: physical_count_lines';
GO

PRINT '✅ Database setup completed successfully!';
