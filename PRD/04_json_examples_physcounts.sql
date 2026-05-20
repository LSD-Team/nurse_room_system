-- ============================================================
-- JSON Examples for sp_PhysCount_02_SaveLines
-- ============================================================
-- SP นี้รับ JSON format เพื่ออัปเดต qty_counted และ note ของรายการที่นับ
-- 
-- Parameter: @JsonData NVARCHAR(MAX)
-- Expected JSON structure:
-- [
--   {"item_id": <int>, "qty_counted": <decimal>, "note": <string optional>},
--   {"item_id": <int>, "qty_counted": <decimal>, "note": <string optional>},
--   ...
-- ]
-- ============================================================

-- ============================================================
-- EXAMPLE 1: Simple - สองรายการ ไม่มี note
-- ============================================================
/*
DECLARE @JsonData NVARCHAR(MAX) = N'[
    {"item_id": 4, "qty_counted": 25},
    {"item_id": 5, "qty_counted": 18}
]';

EXEC sp_PhysCount_02_SaveLines
    @CountId = 1,
    @JsonData = @JsonData;
*/

-- ============================================================
-- EXAMPLE 2: With Notes - สองรายการพร้อม note ภาษาไทย
-- ============================================================
/*
DECLARE @JsonData NVARCHAR(MAX) = N'[
    {"item_id": 4, "qty_counted": 25, "note": "นับได้ 25 ชิ้น ตรงกับลำดับเดิม"},
    {"item_id": 5, "qty_counted": 18, "note": "นับได้ 18 ชิ้น หมดหนึ่งกล่องแล้ว"}
]';

EXEC sp_PhysCount_02_SaveLines
    @CountId = 1,
    @JsonData = @JsonData;
*/

-- ============================================================
-- EXAMPLE 3: Multiple Items - หลายรายการ
-- ============================================================
/*
DECLARE @JsonData NVARCHAR(MAX) = N'[
    {"item_id": 4, "qty_counted": 25, "note": "ตรวจสอบแล้ว"},
    {"item_id": 5, "qty_counted": 18},
    {"item_id": 6, "qty_counted": 42, "note": "สูญหายไป 3 ชิ้น"},
    {"item_id": 7, "qty_counted": 0, "note": "ของจำหน่ายหมดแล้ว"},
    {"item_id": 8, "qty_counted": 55, "note": "เพิ่มเติมมาไม่ทราบที่มา"}
]';

EXEC sp_PhysCount_02_SaveLines
    @CountId = 1,
    @JsonData = @JsonData;
*/

-- ============================================================
-- EXAMPLE 4: With Decimal Quantities - ปริมาณทศนิยม
-- ============================================================
/*
DECLARE @JsonData NVARCHAR(MAX) = N'[
    {"item_id": 4, "qty_counted": 25.5, "note": "นับได้ 25.5 หน่วย"},
    {"item_id": 5, "qty_counted": 18.75},
    {"item_id": 6, "qty_counted": 0.25, "note": "เหลือน้อยมาก"}
]';

EXEC sp_PhysCount_02_SaveLines
    @CountId = 1,
    @JsonData = @JsonData;
*/

-- ============================================================
-- EXAMPLE 5: With Special Characters in Note (Thai + English)
-- ============================================================
/*
DECLARE @JsonData NVARCHAR(MAX) = N'[
    {"item_id": 4, "qty_counted": 25, "note": "ตรวจสอบแล้ว OK - นับได้ 25 ชิ้น"},
    {"item_id": 5, "qty_counted": 18, "note": "Missing: 2 pcs, need to investigate"},
    {"item_id": 6, "qty_counted": 42, "note": "ของเสียบางส่วน ≈ 3 ชิ้น"},
    {"item_id": 7, "qty_counted": 0, "note": "Out of stock (หมด)"}
]';

EXEC sp_PhysCount_02_SaveLines
    @CountId = 1,
    @JsonData = @JsonData;
*/

-- ============================================================
-- EXAMPLE 6: Zero Quantities - รายการที่หมด
-- ============================================================
/*
DECLARE @JsonData NVARCHAR(MAX) = N'[
    {"item_id": 4, "qty_counted": 0, "note": "หมดแล้ว"},
    {"item_id": 5, "qty_counted": 0},
    {"item_id": 6, "qty_counted": 5, "note": "เหลือน้อย ต้องสั่งซื้อเพิ่มเติม"}
]';

EXEC sp_PhysCount_02_SaveLines
    @CountId = 1,
    @JsonData = @JsonData;
*/

-- ============================================================
-- EXAMPLE 7: Large Quantities
-- ============================================================
/*
DECLARE @JsonData NVARCHAR(MAX) = N'[
    {"item_id": 4, "qty_counted": 1000, "note": "ยาสามัญประจำตัวสำรอง"},
    {"item_id": 5, "qty_counted": 500},
    {"item_id": 6, "qty_counted": 2500, "note": "ยานอกบ้านสำรอง"}
]';

EXEC sp_PhysCount_02_SaveLines
    @CountId = 1,
    @JsonData = @JsonData;
*/

-- ============================================================
-- EXAMPLE 8: Update Single Item (แก้ไขเพียง 1 รายการ)
-- ============================================================
/*
DECLARE @JsonData NVARCHAR(MAX) = N'[
    {"item_id": 4, "qty_counted": 30, "note": "ตรวจนับใหม่แล้ว ได้ 30 ชิ้น"}
]';

EXEC sp_PhysCount_02_SaveLines
    @CountId = 1,
    @JsonData = @JsonData;
*/

-- ============================================================
-- EXAMPLE 9: Update with Changed Notes
-- ============================================================
/*
DECLARE @JsonData NVARCHAR(MAX) = N'[
    {"item_id": 4, "qty_counted": 25, "note": "ข้อมูลได้รับการยืนยันแล้ว"},
    {"item_id": 5, "qty_counted": 18, "note": "ตรวจสอบหมดแล้ว ถูกต้อง"}
]';

EXEC sp_PhysCount_02_SaveLines
    @CountId = 1,
    @JsonData = @JsonData;
*/

-- ============================================================
-- EXAMPLE 10: Real Scenario - ข้อมูลจากการนับจริง
-- ============================================================
/*
DECLARE @JsonData NVARCHAR(MAX) = N'[
    {"item_id": 4, "qty_counted": 23, "note": "ขาด 2 ชิ้น จากระบบที่บันทึก 25"},
    {"item_id": 5, "qty_counted": 19, "note": "เกิน 1 ชิ้น จากระบบที่บันทึก 18"},
    {"item_id": 6, "qty_counted": 40, "note": "ขาด 5 ชิ้น จากการคาดการณ์"},
    {"item_id": 7, "qty_counted": 0, "note": "หมดแล้ว ต้องสั่งซื้อเร็ว"},
    {"item_id": 8, "qty_counted": 60, "note": "เกิน 10 ชิ้น ไม่ทราบที่มา ต้องตรวจสอบ"}
]';

EXEC sp_PhysCount_02_SaveLines
    @CountId = 1,
    @JsonData = @JsonData;
*/

-- ============================================================
-- HELPER: ดูว่า JSON มีรูปแบบถูกต้องหรือไม่
-- ============================================================
/*
-- ทดสอบ JSON syntax
DECLARE @JsonData NVARCHAR(MAX) = N'[
    {"item_id": 4, "qty_counted": 25, "note": "ตัวอย่าง"}
]';

-- Validate JSON
IF ISJSON(@JsonData) = 1
    PRINT '✓ JSON syntax is valid';
ELSE
    PRINT '✗ JSON syntax is INVALID';

-- Preview parsed JSON
SELECT *
FROM OPENJSON(@JsonData) WITH (
    item_id     INT              '$.item_id',
    qty_counted DECIMAL(18,4)    '$.qty_counted',
    note        NVARCHAR(500)    '$.note'
);
*/

-- ============================================================
-- KEY POINTS:
-- ============================================================
-- 1. item_id ต้องตรงกับ items ที่มีอยู่ในระบบ
-- 2. qty_counted เป็นจำนวนที่นับได้จริงตัวเลขไม่มีเครื่องหมาย
-- 3. note เป็นข้อมูลเสริมไม่จำเป็น (optional) สามารถ null ได้
-- 4. รองรับ decimal เช่น 25.5, 18.75
-- 5. รองรับภาษาไทยในคำเหลือบ้าน (ต้อง NVARCHAR)
-- 6. Array สามารถมีรายการได้กี่รายการก็ได้ แต่ต้องมีอย่างน้อย 1 รายการ
-- 7. SP จะอัปเดตเฉพาะรายการที่ส่งมา ไม่ส่งมารายการไหนจะยังคงเดิม (incremental update)
