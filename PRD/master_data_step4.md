# Master Data – Supplier Items & Price Management (Action in Suppliers)

## 1) Overview
เพิ่ม **Action** บนหน้า **Suppliers** เพื่อให้ผู้ใช้สามารถ “กำหนดยา/เวชภัณฑ์ และราคาที่ผู้ขายรายนั้นมี” ได้จากหน้ารายการผู้ขายโดยตรง

### What user wants (must-have)
- ในหน้า Suppliers เพิ่มปุ่ม/ไอคอน **Manage Supplier Items / Price List** ต่อ 1 แถวของ Supplier
- เมื่อคลิก จะเปิดหน้าจอ/Modal/Drawer แสดง **Items ทั้งหมด** พร้อมสถานะว่ามีอยู่ใน `dbo.supplier_price_list` ของ Supplier นั้นหรือไม่
- ถ้ามี record ใน `dbo.supplier_price_list` และ `is_active = 1` ให้ **ติ๊ก checkbox เป็น checked**
- ผู้ใช้สามารถ:
  - เช็คทีละรายการเพื่อเพิ่ม
  - เช็คทั้งหมด (Select all)
  - ตั้งค่า field ต่อ item ให้ครบ: `is_active`, `unit`, `unit_price`, `conversion_factor`
- `created_by` และ `updated_by` ต้องใช้ **id ของผู้ที่กำลัง login อยู่** (จากระบบหลัก)
- ต้องไม่ทำให้ระบบเดิมเสียหาย และ UX/UI ต้องสอดคล้องระบบหลัก

> ตารางที่เกี่ยวข้องหลักคือ <File>supplier_price_list.sql</File> (เชื่อมกับ suppliers/items/units ผ่าน FK) citeturn5search1

---

## 2) Database (Ground Truth)
ตาราง: `dbo.supplier_price_list` ตาม <File>supplier_price_list.sql</File> citeturn5search1

### Columns
- `price_id` int IDENTITY PK citeturn5search1
- `supplier_id` int NOT NULL (FK → `dbo.suppliers.supplier_id`) citeturn5search1
- `item_id` int NOT NULL (FK → `dbo.items.item_id`) citeturn5search1
- `unit_id` int NOT NULL (FK → `dbo.units.unit_id`) citeturn5search1
- `unit_price` decimal(18,2) NOT NULL citeturn5search1
- `effective_date` date NOT NULL citeturn5search1
- `expire_date` date NULL citeturn5search1
- `conversion_factor` decimal(18,2) DEFAULT 1 NOT NULL + CHECK > 0 citeturn5search1
- `is_active` bit DEFAULT 1 NOT NULL citeturn5search1
- `created_by` nvarchar(100) NOT NULL citeturn5search1
- `created_at` datetime DEFAULT sysdatetimeoffset() NOT NULL citeturn5search1
- `updated_by` nvarchar(100) NULL citeturn5search1
- `updated_at` datetime DEFAULT sysdatetimeoffset() NULL (มี trigger อัปเดตเวลาเมื่อมี UPDATE) citeturn5search1

### Constraints / Behavior
- Unique: (`supplier_id`, `item_id`, `unit_id`, `effective_date`) citeturn5search1
- Trigger: `trg_supplier_price_list_updated_at` ตั้ง `updated_at = GETDATE()` เมื่อ UPDATE (กัน loop) citeturn5search1
- FK: ไปยัง `suppliers`, `items`, `units` เป็น `NO ACTION` citeturn5search1

**Implication สำคัญ**
- ห้าม insert ซ้ำ key เดิม (supplier+item+unit+effective_date)
- ต้องมี `effective_date` ทุกครั้งที่สร้าง record ใหม่
- `conversion_factor` ต้อง > 0

---

## 3) UX/UI Specification (Consistent with current Suppliers screen)

### 3.1 Add new action button
ตำแหน่ง: คอลัมน์ **Actions** ของตาราง Suppliers (บรรทัดเดียวกับปุ่ม Edit/Delete)
- เพิ่มไอคอน: “💊/🏷️” หรือ icon ตาม design system (เช่น `list-check`, `price-tag`)
- Tooltip (TH/EN ได้ แต่สั้น):
  - TH: “จัดการรายการยา/ราคา”
  - EN: “Manage items & prices”

### 3.2 Open management UI
เมื่อคลิก action → เปิด **Drawer** (แนะนำ) หรือ **Modal (Full-width)**
- Title: `Supplier Price List` + แสดง Supplier Code/Name
- Subtitle: `Select items and set unit price` (เน้นใช้งานง่าย)

### 3.3 Items list table (inside modal/drawer)
แสดง “Items ทั้งหมด” และสถานะที่ match ใน `supplier_price_list`

**Top toolbar (สำคัญ)**
- Search: by item code/name
- Filter:
  - Show: All / Selected / Active only
- Bulk actions:
  - [ ] Select all (ตาม filter ที่มองเห็น)
  - Bulk set: Unit, Effective date (optional), Conversion factor (optional)
  - Save / Cancel

**Columns (suggested)**
1) Checkbox (selected)
2) Item Code
3) Item Name
4) Unit (dropdown from `dbo.units`)
5) Unit Price (numeric input, 2 decimals)
6) Conversion Factor (numeric, default 1)
7) Effective Date (date picker)
8) Expire Date (date picker, optional)
9) Active (toggle) *(หรือใช้ checkbox เป็นตัว active ก็ได้ แต่ต้อง map ชัดเจน)*

**Checkbox behavior (ตาม requirement)**
- ถ้า item นี้มี record ใน `supplier_price_list` ของ supplier และ `is_active = 1` → checkbox = checked citeturn5search1
- ถ้าไม่มี หรือมีแต่ `is_active = 0` → checkbox = unchecked

**English-first / Clean UI (optional แต่แนะนำตามทิศทางระบบ)**
- ในส่วนนี้ใช้ภาษาอังกฤษเป็นหลักเช่นเดียวกับ Step 3 เพื่อให้เป็น pattern เดียว

---

## 4) Data Loading Logic (What to show when open)
ต้องแสดง Items ทั้งหมด และ join ข้อมูลราคาของ supplier (ถ้ามี)

### 4.1 Recommended query strategy (server-side)
ส่งกลับเป็น list ของ “Item rows” โดยแต่ละแถวมี:
- item_id, item_code, item_name
- price mapping (ถ้ามี): price_id, unit_id, unit_price, conversion_factor, effective_date, expire_date, is_active

**เลือก record ไหนมาแสดงต่อ item?**
เนื่องจาก table สามารถมีหลาย effective_date ต่อ item ได้ (และ unique key มี effective_date) citeturn5search1
แนะนำให้เลือก “current active record ล่าสุด” ต่อ item เช่น:
- `is_active = 1`
- order by `effective_date desc` เอา TOP 1

> ถ้าธุรกิจต้องรองรับหลาย unit ต่อ item ใน supplier เดียว อาจต้องเปลี่ยน UI เป็นแสดงหลายแถวต่อ item (แต่ requirement ตอนนี้ระบุการเลือก item เป็นหลัก)

### 4.2 Units dropdown
ดึงจาก `dbo.units` เฉพาะ `is_active = 1` (เพื่อกันการเลือกหน่วยที่ถูก deactivate)

---

## 5) Save Logic (Bulk Upsert + Deactivate)
การบันทึกต้องรองรับ:
- เพิ่ม item ใหม่ให้ supplier
- แก้ไขราคา/หน่วย/แฟคเตอร์ของ item ที่เลือกไว้
- ยกเลิก/ปิดการใช้งาน item ที่เคย active โดยการ uncheck

### 5.1 Rules for each selected row
เมื่อ checkbox = checked (ต้องมีข้อมูลครบ):
- Required:
  - `unit_id`
  - `unit_price` (> 0)
  - `conversion_factor` (> 0) (สอดคล้อง CHECK constraint) citeturn5search1
  - `effective_date` (NOT NULL) citeturn5search1

#### Upsert strategy (safe with Unique constraint)
Unique key = supplier_id + item_id + unit_id + effective_date citeturn5search1
- ถ้ามี record key เดิมอยู่แล้ว → `UPDATE` record นั้น
  - update: `unit_price`, `conversion_factor`, `expire_date`, `is_active=1`, `updated_by = <login_user_id>`
  - `updated_at` จะถูก trigger set ให้อัตโนมัติ citeturn5search1
- ถ้าไม่พบ key เดิม → `INSERT`
  - set: `supplier_id`, `item_id`, `unit_id`, `unit_price`, `effective_date`, `expire_date`, `conversion_factor`, `is_active=1`
  - `created_by = <login_user_id>`

### 5.2 Rules for unchecked row (previously active)
เมื่อ checkbox = unchecked แต่เดิมมี record active แสดงว่า user ต้องการ “เอาออกจาก supplier”
- ทำเป็น Soft remove:
  - `UPDATE supplier_price_list SET is_active=0, updated_by=<login_user_id> WHERE price_id = ...`
  - ห้าม DELETE (เพราะต้องไม่กระทบระบบเดิม)

> หมายเหตุ: requirement ระบุว่า “ถ้ามีตรงกันและสถานะเป็น is_active มีแสดง checkbox” ซึ่งตีความว่าการ uncheck คือทำให้ is_active=0 ของ mapping นั้น citeturn5search1

### 5.3 Transaction & Concurrency
- Save แบบ bulk ต้องทำใน Transaction เดียว
- หากมี conflict จาก unique constraint (409) ต้องแจ้งเตือนผู้ใช้ว่า:
  - “Duplicate effective date for this item/unit. Please change effective date.” citeturn5search1

---

## 6) API Contract (Suggested)
> ปรับ prefix ให้ตรงกับระบบเดิม (ชื่อ path เป็นตัวอย่างเพื่อให้ AI CLI ทำงานได้ทันที)

### 6.1 Load screen
`GET /api/suppliers/{supplier_id}/price-list/items`
Response (shape example):
```json
{
  "supplier_id": 1,
  "items": [
    {
      "item_id": 10,
      "item_code": "MED001",
      "item_name": "Paracetamol",
      "selected": true,
      "price": {
        "price_id": 100,
        "unit_id": 2,
        "unit_price": 12.50,
        "conversion_factor": 1.00,
        "effective_date": "2026-05-01",
        "expire_date": null,
        "is_active": true
      }
    }
  ],
  "units": [
    {"unit_id": 1, "unit_code": "BOX", "unit_name": "Box"}
  ]
}
```

### 6.2 Save (bulk upsert)
`POST /api/suppliers/{supplier_id}/price-list/bulk`
Payload example:
```json
{
  "rows": [
    {
      "item_id": 10,
      "selected": true,
      "unit_id": 2,
      "unit_price": 12.50,
      "conversion_factor": 1.00,
      "effective_date": "2026-05-01",
      "expire_date": null
    },
    {
      "item_id": 11,
      "selected": false,
      "price_id": 101
    }
  ]
}
```

**Server responsibilities**
- อ่าน `login_user_id` จาก auth context ของระบบหลัก
- map ไปที่ `created_by`/`updated_by` ตามการ INSERT/UPDATE citeturn5search1

---

## 7) Validation & Alerts

### Client-side (ก่อนกด Save)
- ถ้า selected=true แต่ข้อมูลไม่ครบ → block save และ highlight field
- Numeric:
  - unit_price > 0
  - conversion_factor > 0 (ตรงกับ CHECK constraint) citeturn5search1
- effective_date required
- expire_date (ถ้ามี) ต้อง >= effective_date (rule เพิ่มเพื่อ UX; ไม่ได้บังคับใน DB)

### Server-side
- validate FK existence: supplier_id, item_id, unit_id (FK เป็น NO ACTION) citeturn5search1
- handle duplicate unique key → return 409

### Toast messages
- Success: “Price list updated successfully.”
- Error (validation): “Please fill required fields for selected items.”
- Error (conflict): “Duplicate price key (item/unit/effective date).”

---

## 8) Definition of Done
- [ ] หน้า Suppliers มี action ใหม่ “Manage items & prices” ต่อ supplier
- [ ] เปิด modal/drawer แล้วแสดง items ทั้งหมด + checkbox checked ตาม `supplier_price_list.is_active=1` citeturn5search1
- [ ] สามารถ Select/Unselect ทีละรายการ และ Select all ได้
- [ ] สามารถกำหนด `unit`, `unit_price`, `conversion_factor`, `effective_date`, `expire_date` ต่อ item
- [ ] Save แบบ bulk ทำงานด้วย Transaction และเคารพ Unique constraint citeturn5search1
- [ ] INSERT ใส่ `created_by = login_user_id`, UPDATE ใส่ `updated_by = login_user_id` citeturn5search1
- [ ] ไม่ใช้ hard delete

---

## 9) Notes / Risks
- เนื่องจาก schema รองรับหลาย effective_date ต่อ item+unit citeturn5search1
  - UI ที่แสดง “รายการเดียวต่อ item” ต้องนิยามว่าเลือก record ล่าสุด (TOP 1 effective_date desc)
  - หากต้องการประวัติราคา (price history) ให้แยกเป็นหน้าหรือ expandable row ในอนาคต

---

> File purpose: เพิ่มสเปค feature “Supplier Price List Management” ให้ AI CLI / Developer ทำได้ทันที โดยไม่กระทบระบบเดิม
