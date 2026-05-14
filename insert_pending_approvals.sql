-- Insert pending approvals for testing
USE [NURSE_ROOM]
GO

-- Check if PO 2026051-001 exists, if not create it
-- First check if po_headers has this PO

-- Insert test pending approval for PO 1 (GROUP_LEAD - user 0027 needs to approve)
DELETE FROM po_approvals WHERE po_id = 1 AND approval_level = 1;
INSERT INTO [dbo].[po_approvals] 
  ([po_id], [approval_level], [approval_role], [status])
VALUES 
  (1, 1, 'GROUP_LEAD', 'PENDING');

-- Insert test pending approval for Borrow (if exists)
-- UNION ALL in getPendingApprovals also checks borrow_approvals
-- Make sure borrow_headers has test data first

PRINT 'Pending approvals inserted for testing'
GO

-- Verify
SELECT 'po_approvals' as table_name, po_id, approval_role, status 
FROM po_approvals WHERE status = 'PENDING'
UNION ALL
SELECT 'borrow_approvals' as table_name, borrow_id, approval_role, status 
FROM borrow_approvals WHERE status = 'PENDING'
GO
