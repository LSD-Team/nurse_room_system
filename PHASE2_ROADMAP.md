# 📋 Implementation Roadmap - ขั้นตอนต่อไป

## ✅ Phase 1: Database Setup - สำเร็จแล้ว

- [x] สร้างตาราง physical_count_headers
- [x] สร้างตาราง physical_count_lines  
- [x] แก้ไข sp_SyncPhysicalStock (เพิ่ม @ReturnResult param)
- [x] แก้ไข sp_Snapshot_02_CreatePeriodStockSnapshot (เพิ่ม @ReturnResult param, รับ PENDING_APPROVAL)
- [x] สร้าง sp_PhysCount_01_Create ถึง sp_PhysCount_06_Reject (6 SPs)
- [x] สร้าง test scripts

**ไฟล์ที่สร้าง:**
- `01_create_physical_count_tables.sql`
- `02_create_physical_count_procedures.sql`
- `02b_alter_existing_procedures.sql`
- `03_test_physical_count_sps.sql`
- `04_json_examples_physcounts.sql`

---

## 🔄 Phase 2: Backend API (NestJS) - ขั้นตอนต่อไป ⬅️ YOU ARE HERE

### 2.1 สร้าง Interfaces (DTOs) - `physical-count.interface.ts`

**สิ่งที่ต้องทำ:**
- [ ] `IPhysicalCountCreate` - DTO สำหรับ sp_PhysCount_01_Create
- [ ] `IPhysicalCountSaveLines` - DTO สำหรับ sp_PhysCount_02_SaveLines
- [ ] `IPhysicalCountGetComparison` - Response จาก sp_PhysCount_03_GetComparison
- [ ] `IPhysicalCountSubmit` - DTO สำหรับ sp_PhysCount_04_Submit
- [ ] `IPhysicalCountApprove` - DTO สำหรับ sp_PhysCount_05_Approve
- [ ] `IPhysicalCountReject` - DTO สำหรับ sp_PhysCount_06_Reject

**ตำแหน่ง:** `server/src/apis/physical-count/physical-count.interface.ts`

### 2.2 สร้าง Service - `physical-count.service.ts`

**6 Methods:**
1. `createPhysicalCount(periodCode, createdBy, note)` → เรียก sp_PhysCount_01_Create
2. `saveCountLines(countId, jsonData)` → เรียก sp_PhysCount_02_SaveLines
3. `getComparison(countId)` → เรียก sp_PhysCount_03_GetComparison
4. `submitCount(countId, submittedBy)` → เรียก sp_PhysCount_04_Submit
5. `approveCount(countId, approvedBy)` → เรียก sp_PhysCount_05_Approve
6. `rejectCount(countId, rejectedBy, reason)` → เรียก sp_PhysCount_06_Reject

**ตำแหน่ง:** `server/src/apis/physical-count/physical-count.service.ts`

### 2.3 สร้าง Controller - `physical-count.controller.ts`

**6 Endpoints:**
- `POST /api/physical-count/create` → createPhysicalCount
- `POST /api/physical-count/:countId/save-lines` → saveCountLines
- `GET /api/physical-count/:countId/comparison` → getComparison
- `POST /api/physical-count/:countId/submit` → submitCount
- `POST /api/physical-count/:countId/approve` → approveCount
- `POST /api/physical-count/:countId/reject` → rejectCount

**ตำแหน่ง:** `server/src/apis/physical-count/physical-count.controller.ts`

### 2.4 สร้าง Module - `physical-count.module.ts`

**ตำแหน่ง:** `server/src/apis/physical-count/physical-count.module.ts`

### 2.5 ลงทะเบียน Module ใน App Module

**แก้ไข:** `server/src/app.module.ts`
- Import `PhysicalCountModule`
- เพิ่มในอาร์เรย์ `imports`

### 2.6 เพิ่ม Email Notifications

**สร้าง 3 Notification Types:**
- `APPROVAL_PHYSICAL_COUNT` - ส่งให้ GROUP_LEAD เมื่อ submit
- `PHYSICAL_COUNT_APPROVED` - ส่งให้ submitter เมื่ออนุมัติ
- `PHYSICAL_COUNT_REJECTED` - ส่งให้ submitter เมื่อปฏิเสธ

**ตำแหน่ง:**
- Email enums/config: `server/src/email/email.config.ts`
- Email templates: `server/src/email/templates/physical-count/*.hbs`
- Email service integration: `server/src/apis/physical-count/physical-count.service.ts`

### 2.7 ทดสอบ Build

```bash
cd server
pnpm build
```

**ต้องไม่มี Error** ✅

---

## 🎨 Phase 3: Frontend (Vue 3) - หลังจาก Phase 2 สำเร็จ

- [ ] สร้าง `client/src/services/physical-count.service.ts`
- [ ] สร้าง `client/src/interfaces/physical-count.interfaces.ts`
- [ ] สร้าง `client/src/views/pages/PhysicalCount.vue` (page หลัก)
- [ ] เพิ่ม route ใน `client/src/router/index.ts`
- [ ] แทนที่ `Empty.vue` ที่ path `stock-adjustment` ด้วย `PhysicalCount.vue`
- [ ] ทดสอบ `pnpm build` (client)

---

## 🧪 Phase 4: Integration Testing - หลังจาก Phase 3 สำเร็จ

- [ ] ทดสอบ 6-step flow จริง
- [ ] ทดสอบ rejection + recount flow
- [ ] ทดสอบ stock movements
- [ ] ทดสอบ email notifications
- [ ] ทดสอบ snapshot data

---

## 📚 Phase 5: Documentation & Deployment

- [ ] Migration scripts
- [ ] User guide
- [ ] Deploy ไป production

---

## 📌 Next Action:

**ต้องทำ Phase 2 ให้สำเร็จ** เริ่มจาก:

1. ✍️ สร้าง DTOs ใน `physical-count.interface.ts`
2. 🔧 สร้าง Service methods (เรียก SPs)
3. 🌐 สร้าง REST endpoints (Controller)
4. 🧩 สร้าง Module & ลงทะเบียน
5. 💌 เพิ่ม Email notifications
6. ✅ ทดสอบ build

---

**ต้องการให้ฉันเริ่มที่ไหน?**
