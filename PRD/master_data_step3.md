# Master Data CRUD – Step 3 (Disease Group & Disease Type)

## 1) Project Overview
เมนูนี้คือ **กลุ่มโรคและประเภทของโรค** โดยภายในหน้าจอเดียวมี **2 Tabs**:
1) **Disease Groups** (กลุ่มโรค)
2) **Disease Types** (ประเภทโรค) – *ผูกกับ Disease Group ตามความสัมพันธ์ในตาราง*

**Key goals**
- ทำ CRUD แบบเดียวกับ Step 1–2 (Table + Modal, Soft Delete ด้วย `is_active`).
- **ไม่ทำให้ระบบเดิมเสียหาย** (ห้ามเปลี่ยนโครงสร้างตารางเดิม / ห้าม Hard Delete).
- UX/UI สอดคล้องระบบหลัก แต่ **หน้านี้เน้นการแสดงผลเป็นภาษาอังกฤษ (English-first UI)**.

**English-first UI rule (สำคัญ)**
- ทุก Label/Column/Placeholder ในหน้านี้ใช้ภาษาอังกฤษเป็นหลัก
- ถ้า field ภาษาอังกฤษเป็น `NULL` ให้ fallback ไปใช้ภาษาไทย (read-only display)
  - Display Name = `*_name_en` ถ้ามีค่า มิฉะนั้นใช้ `*_name_th`

---

## 2) Tech Stack & Environment
- Database: Microsoft SQL Server (Schema: `dbo`) citeturn4search1turn4search2
- Frontend: Web (Data Table + Modal Form) + Tabs component
- Backend: REST API (ยึด pattern เดียวกับ Step 1–2)
- AuthN/AuthZ: ใช้ของระบบหลัก (ห้ามสร้างใหม่)
- Delete Policy: Soft delete ด้วย `is_active` เท่านั้น citeturn4search1turn4search2

---

## 3) Screen & UX/UI Specification (English-first)

### 3.1 Navigation & Layout
- Menu: **Master Data → Disease Group & Disease Type** (ตามตำแหน่งเมนูในระบบหลัก)
- Screen Layout:
  - Header: “Disease Master Data”
  - Tabs:
    - Tab A: “Disease Groups”
    - Tab B: “Disease Types”
  - Shared toolbar (บนตาราง): Search, Filter (เฉพาะ Tab B), Add button

### 3.2 Common UI Components
- **Table**: minimal style, consistent with system main theme
- **Modal Form**: used for Add/Edit
- **Toast/Alert**:
  - Success: “Saved successfully”
  - Error: “Unable to save. Please check required fields.”
  - Warning: “This record is in use and cannot be deactivated.” (กรณีถูกอ้างอิง)
- **Confirm Dialog** ก่อน Deactivate

### 3.3 Accessibility / Clean UX
- Required fields แสดงด้วย “*”
- Disable ปุ่ม Save จนกว่า validation ผ่าน
- Inline validation ใต้ field (ภาษาอังกฤษ)

---

## 4) Database Schema (as-is) & Relationships

### 4.1 Table: `dbo.disease_groups`
คอลัมน์ตามไฟล์ <File>disease_groups.sql</File> citeturn4search1
- `group_id` int IDENTITY(1,1) PK citeturn4search1
- `group_code` nvarchar(20) UNIQUE, NOT NULL citeturn4search1
- `group_name_th` nvarchar(200) NOT NULL citeturn4search1
- `group_name_en` nvarchar(200) NULL citeturn4search1
- `sort_order` int DEFAULT 0, CHECK >= 0 citeturn4search1
- `is_active` bit DEFAULT 1 citeturn4search1
- `created_at` datetime2(0) DEFAULT sysdatetime() citeturn4search1
- `updated_at` datetime2(0) NULL citeturn4search1

มี index `IX_disease_groups_active_sort` ตามไฟล์ dump citeturn4search1

### 4.2 Table: `dbo.disease_sub_groups`
คอลัมน์ตามไฟล์ <File>disease_sub_groups.sql</File> citeturn4search2
- `sub_group_id` int IDENTITY(1,1) PK (ตามชื่อคอลัมน์ แต่ไฟล์ไม่ได้ประกาศ PK ในส่วนที่เห็น) citeturn4search2
- `group_id` int NOT NULL (ความสัมพันธ์ไปยัง `disease_groups.group_id`) citeturn4search2
- `sub_group_code` nvarchar(20) NOT NULL citeturn4search2
- `sub_group_name_th` nvarchar(200) NOT NULL citeturn4search2
- `sub_group_name_en` nvarchar(200) NULL citeturn4search2
- `sort_order` int DEFAULT 0 citeturn4search2
- `is_active` bit DEFAULT 1 citeturn4search2
- `created_at` datetime DEFAULT getdate() citeturn4search2
- `updated_at` datetime NULL citeturn4search2

> หมายเหตุ: ใน dump ที่แนบมา **ไม่เห็นการประกาศ Unique/Index/FK** ของ `disease_sub_groups` ในส่วนที่เปิดดูได้ citeturn4search2
> ดังนั้นในงานพัฒนาให้ **ทำ validation ในระดับแอป** เพื่อกันข้อมูลซ้ำ/ผิดพลาด (ดูหัวข้อ Rules)

### 4.3 Relationship (Logical)
- 1 Disease Group (`disease_groups.group_id`) : Many Disease Types (`disease_sub_groups.group_id`) citeturn4search1turn4search2

---

## 5) Functional Requirements (by Tab)

### Tab A: Disease Groups (CRUD)

#### A1) List (Table)
Columns (English-first):
1. Code (`group_code`) citeturn4search1
2. Name (EN) → fallback TH (`group_name_en` or `group_name_th`) citeturn4search1
3. Thai Name (`group_name_th`) (optional column, default hidden or secondary) citeturn4search1
4. Sort (`sort_order`) citeturn4search1
5. Status (`is_active`) citeturn4search1
6. Actions: Edit / Deactivate

Default filter:
- show `is_active = 1` only (toggle “Show inactive”)

Default sort:
- `sort_order` ASC then `group_code` ASC citeturn4search1

#### A2) Create / Edit (Modal)
**Form order (ตามลำดับข้อมูลสำคัญ):**
1. Group Code* (`group_code`)
2. Group Name (English) (`group_name_en`)
3. Group Name (Thai)* (`group_name_th`)
4. Sort Order (`sort_order`)
5. Active (`is_active`) – (Edit only)

Validation (client + server):
- `group_code` required, max 20, **unique** citeturn4search1
- `group_name_th` required citeturn4search1
- `sort_order` integer >= 0 citeturn4search1

#### A3) Deactivate (Soft Delete)
- Action “Deactivate” → confirm dialog
- Update `is_active = 0` only (no hard delete) citeturn4search1

**Data protection rule (recommended):**
- ถ้า group นั้นมี disease types (sub groups) ที่ยัง active อยู่ ให้ block deactivation พร้อมข้อความ:
  - “This group has active disease types. Please deactivate them first.”

(การตรวจสอบทำที่แอป: `SELECT COUNT(*) FROM disease_sub_groups WHERE group_id = @id AND is_active = 1`) citeturn4search2

---

### Tab B: Disease Types (CRUD + Relationship)

#### B1) List (Table)
Columns (English-first):
1. Group (EN) → fallback TH (join `disease_groups`) citeturn4search1turn4search2
2. Type Code (`sub_group_code`) citeturn4search2
3. Type Name (EN) → fallback TH (`sub_group_name_en` or `sub_group_name_th`) citeturn4search2
4. Thai Name (`sub_group_name_th`) (optional column) citeturn4search2
5. Sort (`sort_order`) citeturn4search2
6. Status (`is_active`) citeturn4search2
7. Actions: Edit / Deactivate

Filters:
- Group filter (Dropdown) – default “All Groups”
  - dropdown source: active groups only (`disease_groups.is_active=1`) citeturn4search1
- Search by code or name (EN/TH)

Default sort:
- Group (sort_order, code) then type sort_order then type code

#### B2) Create / Edit (Modal)
**Form order:**
1. Disease Group* (`group_id`) – Dropdown (required)
2. Type Code* (`sub_group_code`)
3. Type Name (English) (`sub_group_name_en`)
4. Type Name (Thai)* (`sub_group_name_th`)
5. Sort Order (`sort_order`)
6. Active (`is_active`) – (Edit only)

Dropdown behavior:
- Show label as: `group_code` + “ - ” + (EN fallback TH)
- Allow search inside dropdown (type-ahead)

Validation:
- `group_id` required and must exist in `disease_groups` citeturn4search1turn4search2
- `sub_group_code` required, max 20
- `sub_group_name_th` required
- `sort_order` integer >= 0 (enforce at app-level; DB check not shown in dump) citeturn4search2

Uniqueness (app-level):
- Recommended: `sub_group_code` unique (global) หรือ unique ภายใต้ group (group_id + sub_group_code)
  - เนื่องจาก dump ที่เห็นไม่ระบุ constraint ให้บังคับที่ API (ก่อน insert/update) citeturn4search2

#### B3) Deactivate (Soft Delete)
- Update `is_active = 0` only citeturn4search2

---

## 6) API Contract (Suggested)
> ตั้งชื่อให้สอดคล้องกับ Step 1–2 (ถ้ามี prefix เดิม ให้ใช้ prefix เดิม)

### Disease Groups
- `GET /api/master-data/disease-groups?active=true&search=`
- `POST /api/master-data/disease-groups`
- `PUT /api/master-data/disease-groups/{group_id}`
- `PATCH /api/master-data/disease-groups/{group_id}/deactivate`

### Disease Types
- `GET /api/master-data/disease-types?group_id=&active=true&search=`
- `POST /api/master-data/disease-types`
- `PUT /api/master-data/disease-types/{sub_group_id}`
- `PATCH /api/master-data/disease-types/{sub_group_id}/deactivate`

**Response/Errors (standardized):**
- 200 OK / 201 Created
- 400 Validation error (field-level messages)
- 409 Conflict (duplicate code)
- 500 Internal error

---

## 7) Coding Standards & Constraints

### DO
- ใช้ Transaction ใน Create/Update (โดยเฉพาะ Disease Types ที่มีการตรวจ group_id) citeturn4search1turn4search2
- Validate ซ้ำ (code) ก่อน insert/update
- บังคับ `updated_at` เมื่อ update (ถ้ามีการใช้งานในระบบหลัก)
- Reuse component / styling จาก Step 1–2
- Log ทุก error ที่เกิดจาก DB/API

### DON'T
- ห้าม Hard delete (ห้าม DELETE FROM)
- ห้าม DROP/ALTER ตารางเดิม
- ห้ามเปลี่ยนชื่อคอลัมน์
- ห้ามเปลี่ยนค่า collation
- การบันทึก created_by และ update_by จะใช้ id ของผู้ที่กำลัง login 
---

## 8) Definition of Done (Step 3)
- [ ] หน้าจอมี 2 tabs: Disease Groups และ Disease Types
- [ ] Disease Groups CRUD ได้ครบ (Add/Edit/Deactivate)
- [ ] Disease Types CRUD ได้ครบ และบังคับเลือก Group (Relationship)
- [ ] English-first UI: label/column/validation เป็นภาษาอังกฤษ และมี fallback TH เมื่อ EN ว่าง
- [ ] Search/Filter ทำงานได้
- [ ] Soft delete ด้วย `is_active` เท่านั้น
- [ ] ไม่กระทบเมนู/ตารางเดิม

---

## 9) Test Scenarios (Quick)
- Create group with duplicate `group_code` → ต้องได้ 409 conflict + message citeturn4search1
- Create type without selecting group → client validation error
- Deactivate group that has active types → block + warning (recommended)
- Display: when `*_name_en` is NULL → fallback to Thai in table

---

> File name: **master_data_step3.md**
> Purpose: Blueprint ให้ AI CLI/Developer ทำงานได้ทันทีและไม่หลุด requirement
