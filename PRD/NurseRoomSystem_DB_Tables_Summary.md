# Nurse Room System — สรุปตารางฐานข้อมูล (MSSQL) จาก Functional Spec

> อ้างอิง: `NurseRoomSystem_FunctionalSpec.md` (Last updated: 2026-02-26)  
> Tech: **MSSQL** + **Node.js Express TypeScript** + **PrimeVue v4**  
> Policy ที่ล็อกแล้วจากผู้ใช้:
> - ปริมาณสต็อกทั้งหมดเก็บเป็น **จำนวนเต็มเท่านั้น** (`qty_base` เป็น `int`)
> - `items.default_conversion_factor` เป็น **int เสมอ**
> - MVP: นโยบาย Reverse/Unpost **บังคับเฉพาะ** `stock_adjustment` (ส่วน `borrows` / `goods_receipts` ไม่ต้องทำ reverse policy ในรอบแรก)

---

## 1) ภาพรวมแนวคิดข้อมูล (Key Entities)

กลุ่มข้อมูลหลักที่ต้องมีในระบบ:
- Master: `units`, `items`, `suppliers`
- Price Versioning: `price_lists`, `price_list_lines`
- People (External only): `external_people`  
  > Employee (internal) ค้นผ่าน HR/ERP API แบบ real-time จึงไม่ต้องมีตาราง employee ในระบบ
- Clinical visit: `visits`, `visit_usages`, `visit_usage_edit_logs`
- Inventory: `stock_on_hand`, `stock_movements`
- Procurement / Borrow / Settlement: `borrows`, `borrow_lines`, `purchase_orders`, `purchase_order_lines`, `po_approvals` (+ optional `borrow_settlement_map`)
- Receiving: `goods_receipts`, `goods_receipt_lines`
- Period close: `inventory_period_closings`
- Stock adjustment (monthly cut): `stock_adjustments`, `stock_adjustment_lines` (��องรับ reversal)

---

## 2) Data Dictionary (สรุปตาราง)

> หมายเหตุ: รายการคอลัมน์เป็น “logical columns” เพื่อใช้ทำ DDL จริงต่อไป

### A) Master Data

| Table | Purpose | PK | FK หลัก | คอลัมน์สำคัญ (แนะนำ) | Rule/Note |
|---|---|---|---|---|---|
| `units` | หน่วยนับ | `unit_id` | - | `unit_code (unique)`, `unit_name_th`, `unit_name_en`, `is_active`, `created_at` | ใช้ทั้ง purchase/usage unit |
| `items` | ยา/เวชภัณฑ์ + หน่วยซื้อ/หน่วยใช้ + conversion | `item_id` | `purchase_unit_id -> units`, `usage_unit_id -> units` | `item_code (unique)`, `item_name`, `default_conversion_factor (int)`, `is_active`, `created_at` | Base unit = usage unit |
| `suppliers` | ผู้จัดจำหน่าย | `supplier_id` | - | `supplier_code (unique)`, `supplier_name`, `tax_id`, `address`, `phone`, `is_active` |  |

---

### B) Price Management (Versioning)

| Table | Purpose | PK | FK หลัก | คอลัมน์สำคัญ (แนะนำ) | Rule/Note |
|---|---|---|---|---|---|
| `price_lists` | หัวชุดราคาแบบมีสถานะ/เวอร์ชัน | `price_list_id` | - | `price_list_code`, `effective_from`, `status (DRAFT/ACTIVE/INACTIVE)`, `created_by`, `created_at`, `activated_by`, `activated_at` | มีประวัติชุดราคา |
| `price_list_lines` | ราคา item ในชุดราคานั้น | `price_list_line_id` | `price_list_id -> price_lists`, `item_id -> items` | `unit_price (decimal)`, `currency` | เอกสารต้อง snapshot ราคา |

---

### C) People (External Only)

| Table | Purpose | PK | FK หลัก | คอลัมน์สำคัญ (แนะนำ) | Rule/Note |
|---|---|---|---|---|---|
| `external_people` | บุคคลภายนอก (non-employee) | `external_person_id` | - | `full_name`, `company`, `national_id`, `passport_no`, `phone`, `created_at` | ใช้ค้นหา/ทำ visit |

---

### D) Clinical Visit + Usage Audit

| Table | Purpose | PK | FK หลัก | คอลัมน์สำคัญ (แนะนำ) | Rule/Note |
|---|---|---|---|---|---|
| `visits` | หัวบันทึกการรักษา | `visit_id` | `external_person_id -> external_people` (nullable) | `visit_datetime`, `shift_code`, `patient_type (EMPLOYEE/EXTERNAL)`, `employee_id`(nullable), `symptoms`, `disease_group_id?`, `disease_type_id?`, `treatment_type_id?`, `accident_in_work_flag`, `refer_type`, `vitals_json?`, `nursing_advice`, `created_by`, `created_at` | Employee resigned = view-only (logic ที่ service/UI) |
| `visit_usages` | รายการยา/เวชภัณฑ์ที่ใช้ใน visit | `visit_usage_id` | `visit_id -> visits`, `item_id -> items` | `qty_base (int)`, `created_by`, `created_at` | **qty integer only**; base=usage unit |
| `visit_usage_edit_logs` | log การแก้ไข usage | `log_id` | `visit_usage_id -> visit_usages` | `edited_by`, `edited_at`, `old_qty_base (int)`, `new_qty_base (int)`, `reason` | ต้องมี reason ทุกครั้ง |

**Delta rule (สำคัญ):**
- `delta = new_qty_base - old_qty_base`
  - `delta > 0` => เพิ่ม `OUT_VISIT` movement
  - `delta < 0` => ทำ movement ฝั่ง `IN` เพื่อชดเชย (ตาม convention ของระบบ)

---

### E) Inventory (On-hand + Ledger)

| Table | Purpose | PK | FK หลัก | คอลัมน์สำคัญ (แนะนำ) | Rule/Note |
|---|---|---|---|---|---|
| `stock_on_hand` | ยอดคงเหลือล่าสุดราย item | `item_id` | `item_id -> items` | `qty_base (int)`, `updated_at` | base unit เท่านั้น |
| `stock_movements` | สมุดเคลื่อนไหวสต็อก (ledger) | `movement_id` | `item_id -> items` | `movement_type (IN_GR/IN_BORROW/OUT_VISIT/ADJUST)`, `qty_base (int signed)`, `ref_type`, `ref_id`, `created_by`, `created_at`, `reason (nullable)` | ทุก impact ต้องสร้าง movement |

---

### F) Procurement / Borrow / Monthly Settlement (Monthly PO)

| Table | Purpose | PK | FK หลัก | คอลัมน์สำคัญ (แนะนำ) | Rule/Note |
|---|---|---|---|---|---|
| `borrows` | หัวเอกสารยืมจาก supplier | `borrow_id` | `supplier_id -> suppliers` | `borrow_date`, `status`, `created_by`, `created_at` | MVP ไม่เน้น POSTED/reverse policy |
| `borrow_lines` | รายการยืม + snapshot ราคา + conversion จริง | `borrow_line_id` | `borrow_id -> borrows`, `item_id -> items` | `qty_purchase (int)`, `actual_conversion_factor (int)`, `qty_base (int)`, `unit_price_snapshot (decimal)`, `is_settled`, `monthly_po_id (nullable)` | qty_base = qty_purchase * factor |
| `purchase_orders` | หัว PO (รวม monthly) | `po_id` | `supplier_id -> suppliers` | `po_type (NORMAL/MONTHLY)`, `po_month`, `po_year`, `status (DRAFT/SUBMITTED/APPROVED/REJECTED)`, `created_by`, `created_at`, `submitted_at` | Monthly PO ต้อง auto-split ตาม supplier |
| `purchase_order_lines` | รายการ PO (monthly ต้อง aggregate by item) | `po_line_id` | `po_id -> purchase_orders`, `item_id -> items` | `qty_base (int)`, `unit_price_snapshot (decimal)`, `line_total (decimal)` | แนะนำเก็บ qty_base เพื่อ consistent |
| `po_approvals` | ประวัติอนุมัติ L1/L2/L3 | `approval_id` | `po_id -> purchase_orders` | `level (1/2/3)`, `action (APPROVE/REJECT)`, `action_by`, `action_at`, `reason` | ต้อง audit ได้ |

**Optional (Traceability แบบแน่น):**
| Table | Purpose | PK | FK หลัก |
|---|---|---|---|
| `borrow_settlement_map` | map borrow_line -> po/po_line | `id` | `borrow_line_id`, `po_id`, `po_line_id` |

---

### G) Receiving (Goods Receipt / GR)

| Table | Purpose | PK | FK หลัก | คอลัมน์สำคัญ (แนะนำ) | Rule/Note |
|---|---|---|---|---|---|
| `goods_receipts` | หัวเอกสารรับเข้า | `gr_id` | `supplier_id -> suppliers`, `po_id -> purchase_orders`(nullable) | `gr_date`, `status`, `created_by`, `created_at` | Receiving ทำให้เกิด `IN_GR` movement |
| `goods_receipt_lines` | รายการรับเข้า + override conversion | `gr_line_id` | `gr_id -> goods_receipts`, `item_id -> items` | `qty_purchase (int)`, `actual_conversion_factor (int)`, `qty_base (int)`, `conversion_change_reason` | ถ้า factor != default ต้องมี reason |

---

### H) Period Close (Month Lock)

| Table | Purpose | PK | คอลัมน์สำคัญ (แนะนำ) | Rule/Note |
|---|---|---|---|---|
| `inventory_period_closings` | ปิดงวดรายเดือนเพื่อ lock | `period_id` | `month`, `year`, `status (CLOSED)`, `closed_by`, `closed_at` | เดือนปิดแล้ว Nurse แก้ usage ไม่ได้ (Admin Nurse/HR แก้ได้แต่ต้องมี reason+audit) |

---

### I) Stock Adjustment (Monthly Cut) + Reversal (MVP focus)

| Table | Purpose | PK | FK หลัก | คอลัมน��สำคัญ (แนะนำ) | Rule/Note |
|---|---|---|---|---|---|
| `stock_adjustments` | หัวเอกสารปรับยอดรายเดือน | `adjustment_id` | - | `adjustment_month`, `adjustment_year`, `status (DRAFT/POSTED/REVERSED)`, `reason`, `created_by`, `created_at`, `posted_by`, `posted_at`, `reversal_of_id (nullable)` | POST แล้วห้ามแก้; ยกเลิกด้วย reversal doc |
| `stock_adjustment_lines` | รายการปรับยอดราย item | `line_id` | `adjustment_id -> stock_adjustments`, `item_id -> items` | `system_qty_base (int)`, `counted_qty_base (int)`, `diff_qty_base (int)`, `line_reason (nullable)` | POST: สร้าง `ADJUST` movements + set stock_on_hand = counted |

**Format B การแสดงผล (ในรายงาน/PDF):**
- `whole = FLOOR(qty_base / default_conversion_factor)`
- `remainder = qty_base % default_conversion_factor`
- แสดง: `{whole} {purchase_unit} {remainder} {usage_unit}`

---

## 3) หมายเหตุเชิงสถาปัตยกรรม (ย่อ)

- ระบบ inventory ใช้แนวคิด **ledger (`stock_movements`) + current balance (`stock_on_hand`)**
- ทุกธุรกรรมที่มีผลต่อสต็อกต้อง “สร้าง movement” เพื่อ audit และทำ report ได้
- เรื่อง employee/resigned/permission เป็น logic ชั้น service + UI (ไม่จำเป็นต้องมีตาราง employee)

---