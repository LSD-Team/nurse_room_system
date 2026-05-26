# Master Data CRUD – Step 2

## 1. Project Overview
เอกสารนี้เป็นพิมพ์เขียวสำหรับพัฒนาเมนู **Master Data – Step 2** ตามกรอบสีแดงในเมนูหลัก ประกอบด้วย:
- สถานพยาบาล (Hospitals)
- รายการยา / เวชภัณฑ์ (Items)
- หน่วยนับ (Units)

เป้าหมายเหมือน Step 1 คือสร้าง CRUD ที่:
- ไม่กระทบระบบเดิม
- UX/UI สอดคล้องระบบหลัก
- ใช้งานง่าย สะอาดตา
- มี Validation, แจ้งเตือน, และ Data Protection

เอกสารนี้ออกแบบให้ **AI CLI หรือ Developer อ่านแล้วพัฒนาได้ทันที**

---

## 2. Tech Stack & Environment
- Backend: REST API (รองรับ Microsoft SQL Server)
- Database: SQL Server (dbo Schema)
- Frontend: Web (Data Table + Modal Form)
- Authentication: ใช้ระบบหลัก
- Delete Policy: Soft Delete (is_active)

---

## 3. Core Features (ใช้ร่วมกันทุกเมนู)
- [ ] แสดงข้อมูลแบบ Table
- [ ] Search ตาม Code / Name
- [ ] Sort ตาม Code หรือ Name
- [ ] Add / Edit ผ่าน Modal
- [ ] Disable (is_active = 0)
- [ ] Confirm Dialog ก่อนปิดการใช้งาน
- [ ] Toast / Alert เมื่อทำรายการสำเร็จหรือผิดพลาด
- [ ] Validate ข้อมูลซ้ำ (Unique)

UX/UI:
- ใช้ Component เดียวกับ Step 1
- โทนสีเดียวกับระบบหลัก
- ไม่ Full Screen Modal

---

## 4. Database Schema & CRUD Detail

### 4.1 สถานพยาบาล (hospitals)
ตาราง: dbo.hospitals

**Fields:**
- hospital_id (PK)
- hospital_code (nvarchar(20), Unique, Required)
- hospital_name_th (nvarchar(200), Required)
- hospital_name_en (nvarchar(200))
- hospital_type (nvarchar(50))
- address (nvarchar(500))
- phone (nvarchar(50))
- is_active (bit, Default 1)
- created_at (datetime)

**UI Form Order:**
1. hospital_code
2. hospital_name_th
3. hospital_name_en
4. hospital_type
5. phone
6. address

**Rules:**
- hospital_code ห้ามซ้ำ
- hospital_name_th ห้ามว่าง

---

### 4.2 รายการยา / เวชภัณฑ์ (items)
ตาราง: dbo.items

**Fields:**
- item_id (PK)
- item_code (nvarchar(50), Unique, Required)
- item_name_th (nvarchar(200), Required)
- item_name_en (nvarchar(200), Required)
- item_type_id (FK → item_type)
- usage_unit_id (FK → units)
- item_min (int)
- item_max (int)
- item_min_po (numeric)
- item_max_po (numeric)
- is_active (bit)
- created_at (datetime)
- update_at (datetime)

**UI Form Order:**
1. item_code
2. item_name_th
3. item_name_en
4. item_type_id (Dropdown)
5. usage_unit_id (Dropdown)
6. item_min
7. item_max
8. item_min_po
9. item_max_po

**Rules:**
- item_code ห้ามซ้ำ
- item_min <= item_max
- item_min_po <= item_max_po
- usage_unit_id ต้อง is_active = 1

---

### 4.3 หน่วยนับ (units)
ตาราง: dbo.units

**Fields:**
- unit_id (PK)
- unit_code (nvarchar(50), Unique, Required)
- unit_name_th (nvarchar(200))
- unit_name_en (nvarchar(200))
- is_active (bit)
- created_at (datetime)

**UI Form Order:**
1. unit_code
2. unit_name_th
3. unit_name_en

**Rules:**
- unit_code ห้ามซ้ำ
- ไม่อนุญาตปิด is_active หากถูกใช้งานใน items

---

## 5. Coding Standards & Constraints

**DO:**
- ใช้ Transaction ใน Create / Update
- Validate FK ก่อน Save
- Reuse Component จาก Step 1
- Log Error ทุกกรณี

**DON'T:**
- ห้าม Hard Delete
- ห้ามแก้โครงสร้างตาราง
- ห้ามกระทบข้อมูลเดิม

---

## 6. Definition of Done (Step 2)
- CRUD ครบทั้ง 3 เมนู
- Dropdown FK ทำงานถูกต้อง
- Validation ครบตาม Rules
- UX/UI สอดคล้อง Step 1
- ไม่มี Side Effect กับระบบเดิม
- การบันทึก created_by และ update_by จะใช้ id ของผู้ที่กำลัง login 
---

> ไฟล์นี้คือ master_data_step2.md
> ใช้เป็น Blueprint สำหรับ AI CLI / Developer
