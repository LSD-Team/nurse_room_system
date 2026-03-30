# สรุป Metadata โครงสร้างฐานข้อมูล (แปลงจาก Metadata.md)

ไฟล์นี้สรุปโครงสร้าง Metadata ของฐานข้อมูล เช่น Primary Key, Unique, Auto Increment, Index, Trigger, Check Constraint ให้อยู่ในรูปแบบ Markdown เพื่อให้อ่านง่ายและค้นหาได้สะดวก

---

## โครงสร้าง Metadata ที่สำคัญ

### 1. Auto Increment (DBCC CHECKIDENT)
- ใช้สำหรับรีเซ็ตค่า identity ของแต่ละตาราง เช่น
    - accident_severity_types, approval_roles, borrow_approvals, borrow_headers, borrow_lines, disease_groups, disease_sub_groups, external_people, gr_headers, gr_lines, hospitals, inventory_period_closings, item_type, item_unit_conversions, items, patient_allergies, patient_physical_info, patient_profiles, patient_social_security, patient_underlying_diseases, po_approvals, po_headers, po_lines, refer_types, stock_adjustment_lines

---

### 2. Primary Key
- กำหนดคีย์หลักของแต่ละตาราง เช่น
    - PK_accident_severity_types (severity_id)
    - PK_approval_roles (role_id)
    - PK_borrow_approvals (approval_id)
    - PK_borrow_headers (borrow_id)
    - PK_borrow_lines (borrow_line_id)
    - PK_disease_groups (group_id)
    - PK_disease_sub_groups (sub_group_id)
    - PK_external_people (external_person_id)
    - PK_gr_headers (gr_id)
    - PK_gr_lines (gr_line_id)
    - PK_hospitals (hospital_id)
    - PK_inventory_period_closings (period_id)
    - PK_item_type (item_type_id)
    - PK_item_unit_conversions (conversion_id)
    - PK_items (item_id)
    - PK_movement_types (movement_type_code)
    - PK_patient_physical_info (physical_id)
    - PK_patient_profiles (patient_id)
    - PK_po_approvals (approval_id)
    - PK_po_headers (po_id)
    - PK_po_lines (po_line_id)
    - PK_refer_types (refer_type_id)

---

### 3. Unique Constraint
- กำหนดคอลัมน์ที่ต้องไม่ซ้ำ เช่น
    - UQ_accident_severity_code (severity_code)
    - UQ_approval_roles (role_code)
    - UQ_borrow_headers (borrow_no)
    - UQ_disease_groups_code (group_code)
    - UQ_disease_sub_groups_code (sub_group_code)
    - UQ_gr_headers (gr_no)
    - UQ_hospitals_code (hospital_code)
    - UQ_inventory_period_closings_month_year (month, year)
    - UQ_item_unit_conversions_key (item_id, supplier_id, from_unit_id, to_unit_id)
    - UQ_items_item_code (item_code)
    - UQ_patient_profiles_employee (employee_id)
    - UQ_patient_profiles_external (external_person_id)
    - UQ_patient_social_security_patient (patient_id)
    - UQ_po_headers (po_no)
    - UQ_refer_types_code (refer_code)
    - UQ_stock_adjustment_lines_doc_item (adjustment_id, item_id)

---

### 4. Indexes
- สร้าง index เพื่อเพิ่มประสิทธิภาพการค้นหา เช่น
    - IX_item_unit_conversions_item_supplier (item_id, supplier_id)
    - IX_patient_physical_info_patient (patient_id, measured_at DESC)
    - IX_stock_adjustment_lines_adjustment_id (adjustment_id)
    - IX_stock_adjustment_lines_item_id (item_id)

---

### 5. Check Constraint
- กำหนดเงื่อนไขค่าที่รับได้ เช่น
    - CK_inventory_period_closings_month (month 1-12)
    - CK_inventory_period_closings_year (year 2000-2100)
    - CK_item_unit_conversions_factor_positive (conversion_factor > 0)
    - CK_patient_profiles (ตรวจสอบความสัมพันธ์ patient_type, employee_id, external_person_id)

---

### 6. Trigger
- ตัวอย่าง Trigger สำหรับอัปเดต update_at อัตโนมัติ
    - trg_item_type_set_updateat (บนตาราง item_type)

---

> หมายเหตุ: สามารถดู SQL statement เต็มได้ในไฟล์ Metadata.md เดิม
