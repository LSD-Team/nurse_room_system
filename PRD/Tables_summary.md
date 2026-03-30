# สรุปโครงสร้าง Table (แปลงจาก Tables.md)

ไฟล์นี้สรุปโครงสร้างตารางหลักในระบบฐานข้อมูลให้อยู่ในรูปแบบ Markdown เพื่อให้อ่านง่ายและค้นหาได้สะดวก

---

## 1. accident_severity_types
- **หน้าที่:** ประเภทความรุนแรงของอุบัติเหตุ
- **คอลัมน์หลัก:** severity_id, severity_code, severity_name_th, severity_name_en, sort_order, is_active

---

## 2. approval_roles
- **หน้าที่:** บทบาทผู้อนุมัติในระบบ
- **คอลัมน์หลัก:** role_id, role_code, role_name, approver_id, is_active, created_by, created_at

---

## 3. borrow_approvals
- **หน้าที่:** การอนุมัติการยืมของแต่ละลำดับ
- **คอลัมน์หลัก:** approval_id, borrow_id, approval_level, approval_role, status, actioned_by, actioned_at, remark

---

## 4. borrow_headers
- **หน้าที่:** ข้อมูลหัวเอกสารการยืมของ
- **คอลัมน์หลัก:** borrow_id, borrow_no, borrow_date, supplier_id, status, note, po_id, settled_at, settled_by, created_by, created_at, cancelled_at, cancelled_by, updated_by, updated_at

---

## 5. borrow_lines
- **หน้าที่:** รายการสินค้าในเอกสารการยืมของ
- **คอลัมน์หลัก:** borrow_line_id, borrow_id, item_id, qty_borrow, unit_price, total_price, po_line_id

---

## 6. disease_groups
- **หน้าที่:** กลุ่มโรค
- **คอลัมน์หลัก:** group_id, group_code, group_name_th, group_name_en, is_active, created_at, updated_at, sort_order

---

## 7. disease_sub_groups
- **หน้าที่:** กลุ่มย่อยของโรค
- **คอลัมน์หลัก:** sub_group_id, group_id, sub_group_code, sub_group_name_th, sub_group_name_en, is_active, created_at, updated_at, sort_order

---

## 8. external_people
- **หน้าที่:** บุคคลภายนอกที่เกี่ยวข้องกับระบบ
- **คอลัมน์หลัก:** external_person_id, full_name, company, national_id, passport_no, phone, created_at, is_deleted, deleted_at

---

## 9. gr_headers
- **หน้าที่:** ข้อมูลหัวเอกสารรับของ (Goods Receipt)
- **คอลัมน์หลัก:** gr_id, gr_no, gr_date, supplier_id, po_id, status, note, confirmed_at, confirmed_by, cancelled_at, cancelled_by, created_by, created_at, updated_by, updated_at

---

> หมายเหตุ: สามารถดู SQL statement เต็มได้ในไฟล์ Tables.md เดิม
