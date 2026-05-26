# Master Data CRUD – Step 1

## 1. Project Overview
เอกสารฉบับนี้เป็นพิมพ์เขียว (Blueprint) สำหรับพัฒนาเมนู **Master Data** เฉพาะส่วนที่ถูกกรอบสีแดงในระบบหลัก ประกอบด้วย:
- ผู้จัดจำหน่าย (Suppliers)
- ประเภทการรักษา (Treatment Types)
- ประเภทการ Refer (Refer Types)

เป้าหมายคือสร้าง CRUD (Create, Read, Update, Delete แบบ Soft Delete) โดย:
- **ไม่กระทบระบบเดิม**
- UX/UI สอดคล้องกับระบบหลัก
- ใช้งานง่าย สะอาดตา
- มี Validation, แจ้งเตือน, และป้องกันข้อมูลผิดพลาด

เอกสารนี้ถูกออกแบบให้ **AI CLI / Developer อ่านแล้วลงมือทำได้ทันที**

---

## 2. Tech Stack & Environment
- Backend: REST API (ไม่จำกัดภาษา แต่ต้องรองรับ SQL Server)
- Database: Microsoft SQL Server (Schema: dbo)
- Frontend: Web-based (Table + Modal Form)
- Authentication: ใช้ของระบบหลัก (ห้ามสร้างใหม่)
- Deletion Policy: **Soft Delete ด้วย is_active เท่านั้น**

---

## 3. Core Features (Checklist)

### ✅ Common CRUD Behavior (ใช้ร่วมกันทุกเมนู)
- [ ] แสดงรายการข้อมูลแบบ Table
- [ ] ค้นหา (Search) จาก Code / Name
- [ ] เรียงลำดับตาม sort_order (ถ้ามี)
- [ ] เพิ่มข้อมูล (Modal Form)
- [ ] แก้ไขข้อมูล (Modal Form เดิม)
- [ ] ปิดการใช้งาน (Set is_active = 0)
- [ ] ไม่อนุญาตให้ลบจริง (Hard Delete)
- [ ] แจ้งเตือนเมื่อบันทึกสำเร็จ / ผิดพลาด
- [ ] Validate ข้อมูลซ้ำ (Unique Code)

UX/UI Guideline:
- ใช้โทนสีเดียวกับระบบหลัก
- Table เรียบ ไม่มีเส้นเยอะ
- Modal ขนาดพอดี ไม่เต็มจอ
- ปุ่มหลัก: Save (Primary), Cancel (Secondary)

---

## 4. Database Schema & CRUD Detail

### 4.1 ผู้จัดจำหน่าย (suppliers)
อ้างอิงตาราง: dbo.suppliers

**Fields:**
- supplier_id (PK, Auto)
- supplier_code (varchar(20), Unique, Required)
- supplier_name (nvarchar(200), Required)
- contact_name (nvarchar(100))
- phone (varchar(20))
- email (nvarchar(100))
- address (nvarchar(500))
- tax_id (varchar(20))
- note (nvarchar(200))
- is_active (bit, Default 1)
- created_by (nvarchar(100))
- created_at (datetime)

**UI Form Order:**
1. supplier_code
2. supplier_name
3. contact_name
4. phone
5. email
6. address
7. tax_id
8. note

**Rules:**
- supplier_code ห้ามซ้ำ
- supplier_name ห้ามว่าง
- ปุ่ม Delete = เปลี่ยน is_active = 0

---

### 4.2 ประเภทการรักษา (treatment_types)
อ้างอิงตาราง: dbo.treatment_types

**Fields:**
- treatment_type_id (PK)
- treatment_code (nvarchar(20), Unique, Required)
- treatment_name_th (nvarchar(100), Required)
- treatment_name_en (nvarchar(100))
- sort_order (int, Default 0)
- is_active (bit, Default 1)

**UI Form Order:**
1. treatment_code
2. treatment_name_th
3. treatment_name_en
4. sort_order

**Rules:**
- treatment_code ห้ามซ้ำ
- sort_order เป็นตัวเลข >= 0

---

### 4.3 ประเภทการ Refer (refer_types)
อ้างอิงตาราง: dbo.refer_types

**Fields:**
- refer_type_id (PK)
- refer_code (nvarchar(20), Unique, Required)
- refer_name_th (nvarchar(100), Required)
- refer_name_en (nvarchar(100))
- sort_order (int, Default 0)
- is_active (bit, Default 1)

**UI Form Order:**
1. refer_code
2. refer_name_th
3. refer_name_en
4. sort_order

**Rules:**
- refer_code ห้ามซ้ำ
- ใช้ logic เดียวกับ treatment_types

---

## 5. Coding Standards & Constraints

**DO:**
- ใช้ Transaction ทุกครั้งที่ Create / Update
- Validate ซ้ำก่อน Insert
- แยก Controller / Service / Repository
- Log Error ทุกกรณีที่ล้มเหลว

**DON'T:**
- ห้าม DROP / ALTER ตารางเดิม
- ห้าม Hard Delete
- ห้ามเปลี่ยนชื่อ Column

---

## 6. Definition of Done (Step 1)
- CRUD ครบทั้ง 3 เมนู
- ใช้ Table + Modal
- is_active ทำงานถูกต้อง
- UX/UI สอดคล้องระบบหลัก
- ไม่มีผลกระทบกับเมนูอื่น
- การบันทึก created_by จะใช้ id ของผู้ที่กำลัง login 

---

> ไฟล์นี้คือ master_data_step1.md
> ใช้เป็นคำสั่งให้ AI CLI หรือ Developer สร้างระบบได้ทันที
