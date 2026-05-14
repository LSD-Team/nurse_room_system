-- ----------------------------
-- View structure for view_borrowed_items
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_borrowed_items]') AND type IN ('V'))
	DROP VIEW [dbo].[view_borrowed_items]
GO

CREATE VIEW [dbo].[view_borrowed_items] AS SELECT
    bh.borrow_id,
    bh.borrow_no,
    bh.borrow_date,
    bh.status AS borrow_status,
    bh.supplier_id,
    s.supplier_code,
    s.supplier_name,
    bl.borrow_line_id,
    bl.item_id,
    i.item_code,
    i.item_name_th,
    i.item_name_en,
    vi.usage_unit_code,
    vi.usage_unit_name_th,
    vi.purchase_unit_code,
    vi.purchase_unit_name_th,
    bl.qty_borrow,
    bl.unit_price,
    bl.total_price,
    bl.po_line_id,
    bh.note,
    bh.created_by,
    bh.created_at,
    bh.updated_by,
    bh.updated_at
FROM dbo.borrow_headers bh
JOIN dbo.borrow_lines bl
    ON bl.borrow_id = bh.borrow_id
JOIN dbo.items i
    ON i.item_id = bl.item_id
LEFT JOIN dbo.suppliers s
    ON s.supplier_id = bh.supplier_id
LEFT JOIN dbo.view_items vi
    ON vi.item_id = bl.item_id;
GO


-- ----------------------------
-- View structure for view_check_all_item_on_hand
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_check_all_item_on_hand]') AND type IN ('V'))
	DROP VIEW [dbo].[view_check_all_item_on_hand]
GO

CREATE VIEW [dbo].[view_check_all_item_on_hand] AS SELECT
  v.item_id,
  v.item_code,
  v.item_name_en AS [Item Name],
  s.qty_base AS QTY,
  v.item_min AS [MIN],
  v.item_max AS [MAX] 
FROM
  view_items v
  JOIN stock_on_hand s ON s.item_id = v.item_id 
WHERE
  s.qty_base < ISNULL(v.item_min, 0) 
  OR s.qty_base > ISNULL(v.item_max, 2147483647);
GO


-- ----------------------------
-- View structure for view_disease_groups
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_disease_groups]') AND type IN ('V'))
	DROP VIEW [dbo].[view_disease_groups]
GO

CREATE VIEW [dbo].[view_disease_groups] AS SELECT
    g.group_id,
    g.group_code,
    g.group_name_th,
    g.group_name_en,
    g.is_active          AS group_is_active,

    s.sub_group_id,
    s.sub_group_code,
    s.sub_group_name_th,
    s.sub_group_name_en,
    s.is_active          AS sub_group_is_active
FROM dbo.disease_groups      g
JOIN dbo.disease_sub_groups  s ON s.group_id = g.group_id
WHERE g.is_active = 1
  AND s.is_active = 1;
GO


-- ----------------------------
-- View structure for view_email
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_email]') AND type IN ('V'))
	DROP VIEW [dbo].[view_email]
GO

CREATE VIEW [dbo].[view_email] AS SELECT
    e.email_address  AS email,
    e.update_by,
    e.update_at,
    e.email_owner    AS employee_id,
    v.thai_name,
    v.eng_name
FROM
    IT.[dbo].[email_address] AS e
    INNER JOIN view_employee_all AS v
        ON v.ID = e.email_owner;
GO


-- ----------------------------
-- View structure for view_employee_all
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_employee_all]') AND type IN ('V'))
	DROP VIEW [dbo].[view_employee_all]
GO

CREATE VIEW [dbo].[view_employee_all] AS SELECT
    EmpCode as ID,
    CardCode as cardcode,
    CAST(LEFT(tb_emp_data.OrgCode3, 4) AS INT) as SECCD,
    tb_emp_data.OrgEDesc3 as section_name,
    CAST(LEFT(tb_emp_data.OrgCode4, 4) AS INT) as GRPCD,
    tb_emp_data.OrgEDesc4 as group_name,
    tb_emp_data.prefixthai + '' + tb_emp_data.PersonFNameThai + ' ' + tb_emp_data.PersonLNameThai as thai_name,
    tb_emp_data.prefixeng + '' +
        UPPER(LEFT(tb_emp_data.PersonFNameEng, 1)) + LOWER(SUBSTRING(tb_emp_data.PersonFNameEng, 2, LEN(tb_emp_data.PersonFNameEng))) + ' ' +
        UPPER(LEFT(tb_emp_data.PersonLNameEng, 1)) + LOWER(SUBSTRING(tb_emp_data.PersonLNameEng, 2, LEN(tb_emp_data.PersonLNameEng))) as eng_name,
    it_email.email_address as email,
    tb_emp_data.PostNameEng as position_name,
    LEFT(PositionCode, 1) as JobPositionCode,
    pldesceng as position_level,
    costcentercode as ExeOfficeCode,
    CASE 
        WHEN costcentereng = 'PRESIDENT' THEN 'President'
        ELSE costcentereng
    END as ExeOfficeDesc,
    Workstatus,
    GETDATE() as update_at
FROM
    [HRM-ODBC-DB].dbo.uservw_employeedata as tb_emp_data
    LEFT JOIN IT.dbo.email_address as it_email ON it_email.email_owner = tb_emp_data.EmpCode
WHERE
    tb_emp_data.Compcode = '00001' or EmpCode like 'N%'
GO


-- ----------------------------
-- View structure for view_item_stock_summary
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_item_stock_summary]') AND type IN ('V'))
	DROP VIEW [dbo].[view_item_stock_summary]
GO

CREATE VIEW [dbo].[view_item_stock_summary] AS SELECT
    vi.item_id,
    vi.item_code,
    vi.item_name_th,
    vi.item_name_en,
    vi.purchase_unit_id,
    vi.purchase_unit_code,
    vi.purchase_unit_name_th,
    vi.purchase_unit_name_en,
    vi.usage_unit_id,
    vi.usage_unit_code,
    vi.usage_unit_name_th,
    vi.usage_unit_name_en,
    vi.default_conversion_factor,
    vi.item_min,
    vi.item_max,
    ISNULL(vi.qty_base, 0) AS qty_on_hand,
    vi.status_of_min,
    CASE
        WHEN ISNULL(vi.qty_base, 0) < ISNULL(vi.item_min, 0) THEN 1
        WHEN ISNULL(vi.qty_base, 0) > ISNULL(vi.item_max, 2147483647) THEN 1
        ELSE 0
    END AS is_out_of_range,
    CASE
        WHEN ISNULL(vi.qty_base, 0) < ISNULL(vi.item_min, 0) THEN 'LOW'
        WHEN ISNULL(vi.qty_base, 0) > ISNULL(vi.item_max, 2147483647) THEN 'HIGH'
        ELSE 'NORMAL'
    END AS stock_status,
    vi.item_type_name,
    vi.is_active,
    vi.created_at,
    vi.update_at
FROM dbo.view_items vi;
GO


-- ----------------------------
-- View structure for view_items
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_items]') AND type IN ('V'))
	DROP VIEW [dbo].[view_items]
GO

CREATE VIEW [dbo].[view_items] AS WITH ranked_price AS (
    SELECT
        spl.item_id,
        spl.unit_id         AS purchase_unit_id,
        spl.conversion_factor,
        spl.unit_price,
        spl.supplier_id,
        ROW_NUMBER() OVER (
            PARTITION BY spl.item_id
            ORDER BY spl.is_active DESC, spl.effective_date DESC, spl.unit_price ASC
        ) AS rn
    FROM dbo.supplier_price_list spl
    WHERE spl.is_active = 1
  AND (spl.expire_date IS NULL OR spl.expire_date >= CAST(GETDATE() AS DATE))
)
SELECT
    i.item_id,
    i.item_code,
    i.item_name_en,
    i.item_name_th,
    -- purchase unit (from supplier_price_list)
    rp.purchase_unit_id,
    pu.unit_code            AS purchase_unit_code,
    pu.unit_name_th         AS purchase_unit_name_th,
    pu.unit_name_en         AS purchase_unit_name_en,
    -- usage unit (from items)
    i.usage_unit_id,
    uu.unit_code            AS usage_unit_code,
    uu.unit_name_th         AS usage_unit_name_th,
    uu.unit_name_en         AS usage_unit_name_en,
    -- conversion factor (purchase → usage)
    ISNULL(rp.conversion_factor, 1) AS default_conversion_factor,
    i.item_min,
    i.item_max,
    sh.qty_base,
    CASE
        WHEN sh.qty_base < i.item_min THEN 1
        ELSE 0
    END                     AS status_of_min,
    it.item_type_name,
    i.is_active,
    i.created_at,
    i.update_at
FROM dbo.items AS i
INNER JOIN dbo.item_type AS it
    ON i.item_type_id = it.item_type_id
LEFT JOIN ranked_price AS rp
    ON rp.item_id = i.item_id AND rp.rn = 1
LEFT JOIN dbo.units AS pu
    ON pu.unit_id = rp.purchase_unit_id
LEFT JOIN dbo.units AS uu
    ON uu.unit_id = i.usage_unit_id
LEFT JOIN dbo.stock_on_hand AS sh
    ON sh.item_id = i.item_id
WHERE i.is_active = 1;
GO


-- ----------------------------
-- View structure for view_on_hand_out_of_range
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_on_hand_out_of_range]') AND type IN ('V'))
	DROP VIEW [dbo].[view_on_hand_out_of_range]
GO

CREATE VIEW [dbo].[view_on_hand_out_of_range] AS SELECT
  v.item_id,
  v.item_code,
  v.item_name_en AS [Item Name],
  s.qty_base AS QTY,
  v.item_min AS [MIN],
  v.item_max AS [MAX] 
FROM
  view_items v
  JOIN stock_on_hand s ON s.item_id = v.item_id 
WHERE
  s.qty_base < ISNULL(v.item_min, 0) 
  AND s.qty_base < item_min 
--   OR s.qty_base > ISNULL(v.item_max, 2147483647);
GO


-- ----------------------------
-- View structure for view_patient_allergy_drug_detail
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_patient_allergy_drug_detail]') AND type IN ('V'))
	DROP VIEW [dbo].[view_patient_allergy_drug_detail]
GO

CREATE VIEW [dbo].[view_patient_allergy_drug_detail] AS SELECT
    pa.allergy_id,
    p.patient_id,
    p.patient_type,                      -- 'EMPLOYEE' / 'EXTERNAL'
    CASE 
        WHEN p.patient_type = 'EMP'  AND p.employee_id IS NOT NULL
            THEN emp.thai_name    -- ดึงชื่อภาษาไทย (หรือ eng_name ถ้าต้องการ)
        WHEN p.patient_type = 'EXT'  AND p.external_person_id IS NOT NULL
            THEN ext.full_name
        ELSE '[Unknown]'
    END AS patient_name,
    -- เอา id เพื่อ debug ด้วย
    ISNULL(p.employee_id, '')           AS employee_id,
    ISNULL(p.external_person_id, 0)     AS external_person_id,

    pa.allergy_type,
    pa.drug_name         AS allergy_name,
    pa.item_id,
    it.item_name_th      AS item_name,
    pa.reaction,
    pa.severity,
    pa.source,
    pa.noted_at,
    pa.noted_by,
    pa.is_active
FROM dbo.patient_allergies            pa
JOIN dbo.patient_profiles             p   ON pa.patient_id = p.patient_id
LEFT JOIN view_employee_all           emp ON p.employee_id = emp.id
LEFT JOIN dbo.external_people         ext ON p.external_person_id = ext.external_person_id
LEFT JOIN dbo.items                   it  ON pa.item_id = it.item_id
WHERE pa.allergy_type = 'DRUG'
  AND pa.is_active = 1
-- WHERE pa.is_active = 1   -- ถ้าต้องการแสดงเฉพาะรายการที่ยังไม่ถูกซ่อน
GO


-- ----------------------------
-- View structure for view_patient_allergy_food_detail
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_patient_allergy_food_detail]') AND type IN ('V'))
	DROP VIEW [dbo].[view_patient_allergy_food_detail]
GO

CREATE VIEW [dbo].[view_patient_allergy_food_detail] AS SELECT
    pa.allergy_id,
    p.patient_id,
    p.patient_type,                      -- 'EMPLOYEE' / 'EXTERNAL'
    CASE 
        WHEN p.patient_type = 'EMP'  AND p.employee_id IS NOT NULL
            THEN emp.thai_name    -- ดึงชื่อภาษาไทย (หรือ eng_name ถ้าต้องการ)
        WHEN p.patient_type = 'EXT'  AND p.external_person_id IS NOT NULL
            THEN ext.full_name
        ELSE '[Unknown]'
    END AS patient_name,
    -- เอา id เพื่อ debug ด้วย
    ISNULL(p.employee_id, '')           AS employee_id,
    ISNULL(p.external_person_id, 0)     AS external_person_id,

    pa.allergy_type,
    pa.drug_name         AS allergy_name,
    pa.item_id,
    it.item_name_th      AS item_name,
    pa.reaction,
    pa.severity,
    pa.source,
    pa.noted_at,
    pa.noted_by,
    pa.is_active
FROM dbo.patient_allergies            pa
JOIN dbo.patient_profiles             p   ON pa.patient_id = p.patient_id
LEFT JOIN view_employee_all           emp ON p.employee_id = emp.id
LEFT JOIN dbo.external_people         ext ON p.external_person_id = ext.external_person_id
LEFT JOIN dbo.items                   it  ON pa.item_id = it.item_id
WHERE pa.allergy_type = 'FOOD'
  AND pa.is_active = 1
-- WHERE pa.is_active = 1   -- ถ้าต้องการแสดงเฉพาะรายการที่ยังไม่ถูกซ่อน
GO


-- ----------------------------
-- View structure for view_supplier_item_prices_current
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[view_supplier_item_prices_current]') AND type IN ('V'))
	DROP VIEW [dbo].[view_supplier_item_prices_current]
GO

CREATE VIEW [dbo].[view_supplier_item_prices_current] AS SELECT
    spl.supplier_id,
    s.supplier_code,
    s.supplier_name,
    spl.item_id,
    i.item_code,
    i.item_name_th,
    i.item_name_en,
    spl.unit_id,
    u.unit_code,
    u.unit_name_th,
    u.unit_name_en,
    spl.unit_price,
    spl.conversion_factor,
    spl.effective_date,
    spl.expire_date
FROM dbo.supplier_price_list spl
JOIN dbo.suppliers s
    ON s.supplier_id = spl.supplier_id
JOIN dbo.items i
    ON i.item_id = spl.item_id
JOIN dbo.units u
    ON u.unit_id = spl.unit_id
WHERE spl.is_active = 1
  AND spl.effective_date <= CAST(GETDATE() AS DATE)
  AND (spl.expire_date IS NULL OR spl.expire_date >= CAST(GETDATE() AS DATE));
GO

#view_gr_headers_full#
SELECT
  h.gr_id,
  h.gr_no,
  h.gr_date,
  h.supplier_id,
  s.supplier_name,   -- สมมติว่า suppliers มีคอลัมน์นี้
  h.po_id,
  p.po_no,           -- สมมติว่า po_headers มีคอลัมน์นี้
  h.status,
  h.note,
  h.confirmed_at,
  h.confirmed_by,
  h.cancelled_at,
  h.cancelled_by,
  h.created_by,
  h.created_at,
  h.updated_by,
  h.updated_at
FROM
  dbo.gr_headers h
  LEFT JOIN dbo.suppliers s    ON h.supplier_id = s.supplier_id
  LEFT JOIN dbo.po_headers p   ON h.po_id = p.po_id

#view_gr_lines_full#
SELECT
  l.gr_line_id,
  l.gr_id,
  h.gr_no,
  h.gr_date,
  l.item_id,
  i.item_code,
  i.item_name_en,
  i.item_name_th,
  l.qty_receive,
  l.unit_price,
  l.total_price,
  l.po_line_id,
  p.po_id,
  ph.po_no      -- po_no อยู่ใน po_headers
FROM
  dbo.gr_lines l
  LEFT JOIN dbo.gr_headers h   ON l.gr_id = h.gr_id
  LEFT JOIN dbo.items i        ON l.item_id = i.item_id
  LEFT JOIN dbo.po_lines p     ON l.po_line_id = p.po_line_id
  LEFT JOIN dbo.po_headers ph  ON p.po_id = ph.po_id

