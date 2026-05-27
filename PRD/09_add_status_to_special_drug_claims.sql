-- --------------------------------------------------
-- Add status column to special_drug_claims
-- --------------------------------------------------

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[special_drug_claims]') 
      AND name = 'status'
)
BEGIN
    ALTER TABLE [dbo].[special_drug_claims] 
    ADD [status] NVARCHAR(20) DEFAULT 'OPEN' NOT NULL;
END
GO

-- Update existing records to 'OPEN' if they were NULL (though we set NOT NULL DEFAULT)
UPDATE [dbo].[special_drug_claims]
SET [status] = 'OPEN'
WHERE [status] IS NULL;
GO
