# Nurse Room System — ตารางสรุปค���ามสัมพันธ์ (ERD แบบข้อความ) + FK (สำหรับทำ MSSQL)

> อ้างอิงจาก `NurseRoomSystem_FunctionalSpec.md` (Last updated: 2026-02-26) และสรุปตาราง `NurseRoomSystem_DB_Tables_Summary.md`  
> Policy ที่ยืนยันแล้ว:
> - ปริมาณทั้งหมดใน inventory/usage เก็บเป็น `int` (`qty_base`, `qty_purchase`, `*_factor` เป็น int)
> - `items.default_conversion_factor` เป็น int เสมอ
> - MVP reverse/unpost: บังคับเฉพาะ `stock_adjustments` (แต่ยังคงมี movement ledger ครบ)

---

## 0) Conventions (เพื่อให้ทำ FK/Constraint ได้ตรงกัน)
- ตารางที่เป็น “หัวเอกสาร” มักมี 1:N ไปตาราง “รายการ” ด้วยคีย์ `..._id`
- ทุก FK แนะนำให้สร้าง index ที่คอลัมน์ FK เสมอ (เพื่อ join/report)
- การลบ (ON DELETE) **แนะนำ RESTRICT/NO ACTION** สำหรับข้อมูลธุรกรรม เพื่อรักษา audit trail  
  (ถ้าจะลบจริงควรใช้ soft delete/สถานะ)

---

## 1) Master Data Relationships

### 1.1 `units`
- **ถูกอ้างอิงโดย**
  - `items.purchase_unit_id -> units.unit_id`
  - `items.usage_unit_id -> units.unit_id`

### 1.2 `items`
- **อ้างอิง**
  - `items.purchase_unit_id -> units.unit_id`
  - `items.usage_unit_id -> units.unit_id`
- **ถูกอ้างอิงโดย**
  - `price_list_lines.item_id -> items.item_id`
  - `visit_usages.item_id -> items.item_id`
  - `stock_on_hand.item_id -> items.item_id`
  - `stock_movements.item_id -> items.item_id`
  - `borrow_lines.item_id -> items.item_id`
  - `purchase_order_lines.item_id -> items.item_id`
  - `goods_receipt_lines.item_id -> items.item_id`
  - `stock_adjustment_lines.item_id -> items.item_id`

### 1.3 `suppliers`
- **ถูกอ้างอิงโดย**
  - `borrows.supplier_id -> suppliers.supplier_id`
  - `purchase_orders.supplier_id -> suppliers.supplier_id`
  - `goods_receipts.supplier_id -> suppliers.supplier_id`

---

## 2) Price Management (Versioning)

### 2.1 `price_lists`
- **ถูกอ้างอิงโดย**
  - `price_list_lines.price_list_id -> price_lists.price_list_id`

### 2.2 `price_list_lines`
- **อ้างอิง**
  - `price_list_lines.price_list_id -> price_lists.price_list_id`
  - `price_list_lines.item_id -> items.item_id`
- **ข้อเสนอแนะ constraint**
  - Unique: (`price_list_id`, `item_id`) เพื่อกันซ้ำ 1 item ต่อ 1 list

---

## 3) People (External)

### 3.1 `external_people`
- **ถูกอ้างอิงโดย**
  - `visits.external_person_id -> external_people.external_person_id` (nullable)

> Employee (internal) ใช้ HR/ERP API => `visits.employee_id` เป็น “รหัสอ้างอิงจากภายนอก” จึงไม่ทำ FK ใน DB ระบบนี้

---

## 4) Clinical Visit + Usage Audit

### 4.1 `visits`
- **อ้างอิง**
  - `visits.external_person_id -> external_people.external_person_id` (nullable)
- **ถูกอ้างอิงโดย**
  - `visit_usages.visit_id -> visits.visit_id`

### 4.2 `visit_usages`
- **อ้างอิง**
  - `visit_usages.visit_id -> visits.visit_id`
  - `visit_usages.item_id -> items.item_id`
- **ถูกอ้างอิงโดย**
  - `visit_usage_edit_logs.visit_usage_id -> visit_usages.visit_usage_id`

> ข้อเสนอแนะ (optional): Unique (`visit_id`, `item_id`) หากต้องการบังคับ 1 visit ต่อ 1 item มีได้ 1 แถว  
> (ถ้าต้องการให้ 1 visit ใส่ item เดิมได้หลายบรรทัด ก็ไม่ต้อง unique)

### 4.3 `visit_usage_edit_logs`
- **อ้างอิง**
  - `visit_usage_edit_logs.visit_usage_id -> visit_usages.visit_usage_id`

---

## 5) Inventory (On-hand + Ledger)

### 5.1 `stock_on_hand`
- **อ้างอิง**
  - `stock_on_hand.item_id -> items.item_id`
- **รูปแบบความสัมพันธ์**
  - 1 item : 1 stock_on_hand (PK = item_id)

### 5.2 `stock_movements`
- **อ้างอิง**
  - `stock_movements.item_id -> items.item_id`
- **Reference to documents (ไม่ใช่ FK จริงใน MSSQL)**
  - `stock_movements.ref_type` + `stock_movements.ref_id`
    - ใช้ชี้ไปยังเอกสารต้นทาง เช่น `VISIT`, `GR`, `BORROW`, `ADJUSTMENT`
    - เนื่องจากเป็น polymorphic reference จึงทำ FK ตรง ๆ ไม่ได้
  - แนะนำทำ index: (`ref_type`, `ref_id`) และ (`item_id`, `created_at`)

---

## 6) Procurement / Borrow / Monthly Settlement (Monthly PO)

### 6.1 `borrows`
- **อ้างอิง**
  - `borrows.supplier_id -> suppliers.supplier_id`
- **ถูกอ้างอิงโดย**
  - `borrow_lines.borrow_id -> borrows.borrow_id`

### 6.2 `borrow_lines`
- **อ้างอิง**
  - `borrow_lines.borrow_id -> borrows.borrow_id`
  - `borrow_lines.item_id -> items.item_id`
  - *(simple trace option)* `borrow_lines.monthly_po_id -> purchase_orders.po_id` (nullable)
- **เกี่ยวข้อง (business link)**
  - เมื่อถูก settle แล้ว ต้อง mark `is_settled = 1` และ link ไป Monthly PO (ด้วย `monthly_po_id` หรือ mapping table)

### 6.3 `purchase_orders`
- **อ้างอิง**
  - `purchase_orders.supplier_id -> suppliers.supplier_id`
- **ถูกอ้างอิงโดย**
  - `purchase_order_lines.po_id -> purchase_orders.po_id`
  - `po_approvals.po_id -> purchase_orders.po_id`
  - `goods_receipts.po_id -> purchase_orders.po_id` (nullable)
  - `borrow_lines.monthly_po_id -> purchase_orders.po_id` (nullable, ถ้าใช้วิธี simple)

### 6.4 `purchase_order_lines`
- **อ้างอิง**
  - `purchase_order_lines.po_id -> purchase_orders.po_id`
  - `purchase_order_lines.item_id -> items.item_id`
- **ข้อเสนอแนะ constraint (สำหรับ Monthly PO)**
  - ถ้า `po_type=MONTHLY` แนะนำ unique (`po_id`, `item_id`) เพราะต้อง aggregate 1 item ต่อ 1 line

### 6.5 `po_approvals`
- **อ้างอิง**
  - `po_approvals.po_id -> purchase_orders.po_id`
- **ข้อเสนอแนะ constraint**
  - Unique (`po_id`, `level`, `action_at`) หรือกำหนด policy ว่าระดับหนึ่งมีได้กี่ action record (เก็บ history vs เก็บล่าสุด)

### 6.6 `borrow_settlement_map` (Optional — strong traceability)
- **อ้างอิง**
  - `borrow_settlement_map.borrow_line_id -> borrow_lines.borrow_line_id`
  - `borrow_settlement_map.po_id -> purchase_orders.po_id`
  - `borrow_settlement_map.po_line_id -> purchase_order_lines.po_line_id`
- **ข้อเสนอแนะ constraint**
  - Unique (`borrow_line_id`) เพื่อให้ borrow line หนึ่งถูก settle ได้ครั้งเดียว (ตาม policy)

---

## 7) Receiving (Goods Receipt / GR)

### 7.1 `goods_receipts`
- **อ้างอิง**
  - `goods_receipts.supplier_id -> suppliers.supplier_id`
  - `goods_receipts.po_id -> purchase_orders.po_id` (nullable)
- **ถูกอ้างอิงโดย**
  - `goods_receipt_lines.gr_id -> goods_receipts.gr_id`

### 7.2 `goods_receipt_lines`
- **อ้างอิง**
  - `goods_receipt_lines.gr_id -> goods_receipts.gr_id`
  - `goods_receipt_lines.item_id -> items.item_id`

---

## 8) Period Close (Month Lock)

### 8.1 `inventory_period_closings`
- โดยทั่วไป **ไม่ต้องมี FK ไปตารางอื่น**
- ใช้ใน business rule เพื่อตรวจว่า `visits.visit_datetime` อยู่ในเดือน/ปีที่ปิดแล้วหรือไม่

> ข้อเสนอแนะ constraint:
> - Unique (`month`, `year`) เพื่อไม่ให้ปิดงวดซ้ำ

---

## 9) Stock Adjustment (Monthly Cut) + Reversal (MVP focus)

### 9.1 `stock_adjustments`
- **self reference (reversal link)**
  - `stock_adjustments.reversal_of_id -> stock_adjustments.adjustment_id` (nullable)
- **ถูกอ้างอิงโดย**
  - `stock_adjustment_lines.adjustment_id -> stock_adjustments.adjustment_id`

> ข้อเสนอแนะ constraint:
> - Unique (`adjustment_month`, `adjustment_year`, `status`?) ตาม policy ว่า 1 เดือนมี posted ได้กี่เอกสาร  
>   (ส่วนใหญ่ 1 เดือนควรมี 1 posted; ถ้าต้องรองรับหลายครั้งอาจไม่ unique)

### 9.2 `stock_adjustment_lines`
- **อ้างอิง**
  - `stock_adjustment_lines.adjustment_id -> stock_adjustments.adjustment_id`
  - `stock_adjustment_lines.item_id -> items.item_id`
- **ข้อเสนอแนะ**
  - Unique (`adjustment_id`, `item_id`) เพื่อกันบรรทัดซ้ำ

---

## 10) Relationship Summary (แบบสั้นเพื่อทำ ERD)

### 10.1 1:N (Header -> Lines)
- `price_lists (1) -> (N) price_list_lines`
- `visits (1) -> (N) visit_usages`
- `visit_usages (1) -> (N) visit_usage_edit_logs`
- `borrows (1) -> (N) borrow_lines`
- `purchase_orders (1) -> (N) purchase_order_lines`
- `purchase_orders (1) -> (N) po_approvals`
- `goods_receipts (1) -> (N) goods_receipt_lines`
- `stock_adjustments (1) -> (N) stock_adjustment_lines`

### 10.2 1:1 (Master -> Balance)
- `items (1) -> (1) stock_on_hand`

### 10.3 N:1 (Many -> One)
- `items (N) -> (1) units` (purchase_unit_id)
- `items (N) -> (1) units` (usage_unit_id)
- `borrows (N) -> (1) suppliers`
- `purchase_orders (N) -> (1) suppliers`
- `goods_receipts (N) -> (1) suppliers`
- `visits (N) -> (1) external_people` (nullable)

### 10.4 Polymorphic reference (ไม่ทำ FK ตรง)
- `stock_movements.ref_type + ref_id -> (VISIT/GR/BORROW/ADJUSTMENT/...)`

---

## 11) FK Checklist (ทำเป็นงาน DDL ได้ทันที)

> รายการ FK ที่ “ควรมี” ใน MSSQL (ตาม logical model)

### Units / Items
- `items.purchase_unit_id -> units.unit_id`
- `items.usage_unit_id -> units.unit_id`

### Prices
- `price_list_lines.price_list_id -> price_lists.price_list_id`
- `price_list_lines.item_id -> items.item_id`

### External people / Visits
- `visits.external_person_id -> external_people.external_person_id`

### Visit usage / Logs
- `visit_usages.visit_id -> visits.visit_id`
- `visit_usages.item_id -> items.item_id`
- `visit_usage_edit_logs.visit_usage_id -> visit_usages.visit_usage_id`

### Inventory
- `stock_on_hand.item_id -> items.item_id`
- `stock_movements.item_id -> items.item_id`

### Suppliers / Borrow / PO
- `borrows.supplier_id -> suppliers.supplier_id`
- `borrow_lines.borrow_id -> borrows.borrow_id`
- `borrow_lines.item_id -> items.item_id`
- *(ถ้าใช้ simple settlement link)* `borrow_lines.monthly_po_id -> purchase_orders.po_id`

- `purchase_orders.supplier_id -> suppliers.supplier_id`
- `purchase_order_lines.po_id -> purchase_orders.po_id`
- `purchase_order_lines.item_id -> items.item_id`
- `po_approvals.po_id -> purchase_orders.po_id`

### Receiving
- `goods_receipts.supplier_id -> suppliers.supplier_id`
- `goods_receipts.po_id -> purchase_orders.po_id` (nullable)
- `goods_receipt_lines.gr_id -> goods_receipts.gr_id`
- `goods_receipt_lines.item_id -> items.item_id`

### Adjustments + Reversal
- `stock_adjustments.reversal_of_id -> stock_adjustments.adjustment_id` (nullable)
- `stock_adjustment_lines.adjustment_id -> stock_adjustments.adjustment_id`
- `stock_adjustment_lines.item_id -> items.item_id`

### Optional mapping
- `borrow_settlement_map.borrow_line_id -> borrow_lines.borrow_line_id`
- `borrow_settlement_map.po_id -> purchase_orders.po_id`
- `borrow_settlement_map.po_line_id -> purchase_order_lines.po_line_id`

---

## 12) หมายเหตุที่มีผลต่อ ERD แต่ไม่ใช่ FK
- `visits.employee_id` อ้างอิงไป HR/ERP API (ไม่ทำ FK)
- RBAC/Users ยังไม่ถูกระบุเป็น entity ใน spec (created_by/edited_by เป็น identifier จากระบบ auth ภายนอกได้)
- การผูก `stock_movements` ไปเอกสารใช้ `ref_type/ref_id` (polymorphic) จึงไม่ทำ FK ได้ตรง ๆ ใน MSSQL

---