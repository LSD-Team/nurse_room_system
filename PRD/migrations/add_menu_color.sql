-- Migration: Add color column to menus and populate default colors

ALTER TABLE dbo.menus
ADD color NVARCHAR(50) NULL;

-- Set colors to match frontend defaults in AppMenuNurseRoom.vue
UPDATE dbo.menus SET color = 'text-red-300' WHERE code = 'TREATMENT_RECORD';

UPDATE dbo.menus SET color = 'text-cyan-300' WHERE code IN ('PURCHASE_BORROW_GROUP','PO_LIST','GOODS_RECEIPT','BORROW_MEDICINES');

UPDATE dbo.menus SET color = 'text-sky-300' WHERE code IN ('STOCK_GROUP','STOCK_STATUS','MOVEMENT_RECORDS');

UPDATE dbo.menus SET color = 'text-amber-400' WHERE code = 'STOCK_MONTHLY_RECORD';

UPDATE dbo.menus SET color = 'text-emerald-300' WHERE code IN ('NURSE_GROUP','NURSES_LIST','NURSE_TEAMS','NURSE_CONTRACTS');

UPDATE dbo.menus SET color = 'text-purple-300' WHERE code LIKE 'MASTER_DATA%';

UPDATE dbo.menus SET color = 'text-indigo-400' WHERE code = 'EMP_HOLIDAY_GROUP';

UPDATE dbo.menus SET color = 'text-lime-400' WHERE code = 'APPROVE_PURCHASE';

UPDATE dbo.menus SET color = 'text-teal-400' WHERE code = 'STOCK_COUNT_APPROVE_MENU';

UPDATE dbo.menus SET color = 'text-yellow-400' WHERE code = 'SPECIAL_MED_REQ';

UPDATE dbo.menus SET color = 'text-rose-400' WHERE code = 'REPORTS_GROUP';

-- For any remaining rows, leave color NULL or set a default
-- UPDATE dbo.menus SET color = 'text-gray-400' WHERE color IS NULL;

SELECT TOP 100 * FROM dbo.menus ORDER BY sort_order, id;
