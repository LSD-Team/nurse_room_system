# Nurse Room System — สรุประบบและแผนพัฒนา Treatment Record

> สร้าง: 2026-05-20 | สถานะ: develop branch

---

## 1. ภาพรวมระบบปัจจุบัน

ระบบ Nurse Room System พัฒนาด้วย **Vue 3 + NestJS + MSSQL** รองรับกระบวนการทำงานห้องพยาบาลโรงงาน โดยแบ่งออกเป็นโมดูลหลักดังนี้:

| สถานะ | โมดูล |
|--------|-------|
| ✅ สมบูรณ์ | จัดซื้อ (PO) + รับสินค้า (GR) + ยืมยา (Borrow) |
| ✅ สมบูรณ์ | คลังสต็อก (Stock Status + Movement Records) |
| ✅ สมบูรณ์ | นับสต็อกประจำเดือน (Physical Count + Approval) |
| ✅ สมบูรณ์ | อนุมัติ (Approve Purchase, GROUP_LEAD Approval) |
| ✅ สมบูรณ์ | Auth (JWT + Passport, role-based guard) |
| ✅ สมบูรณ์ | Email Notification (9 templates) |
| 🔲 ยังไม่ได้ทำ | **บันทึกการรักษาพยาบาล (Treatment Record)** |
| 🔲 ยังไม่ได้ทำ | ข้อมูลพยาบาล + ทีม + สัญญา |
| 🔲 ยังไม่ได้ทำ | Master Data (Supplier, Treatment Types ฯลฯ) |
| 🔲 ยังไม่ได้ทำ | ข้อมูลสุขภาพประจำปี / ประกันสังคม |
| 🔲 ยังไม่ได้ทำ | รายงานทั้งหมด (20+ รายงาน) |

---

## 2. โมดูลที่สมบูรณ์แล้ว — กระบวนการทำงาน

### 2.1 จัดซื้อยา/เวชภัณฑ์ (Purchase Order)

**หน้า:** `/purchase-orders` → `PurchaseOrders.vue`
**Backend:** `PoModule` → SP: `sp_PO_02_GetPO`, `sp_PO_03_SubmitPO`, `sp_PO_04_ApprovePO`, `sp_POCancel`

```
[DRAFT] ──สร้าง PO──→ [PENDING_APPROVAL] ──อนุมัติ 3 ชั้น──→ [APPROVED]
                                                                     │
                    [CANCELLED] ←──ยกเลิก──────────────────────────┘
                                                                [CLOSED] ←── รับของครบ
```

**ขั้นตอน:**
1. สร้าง PO (เลือก Supplier + รายการยา + ราคา) → สถานะ `DRAFT`
2. Submit PO → สถานะ `PENDING_APPROVAL` → ส่ง email แจ้ง GROUP_LEAD
3. อนุมัติ 3 ชั้น: GROUP_LEAD → MANAGER → DEPARTMENT → `APPROVED` / ปฏิเสธ → `REJECTED`
4. รับสินค้า (GR) → สถานะ `CLOSED` เมื่อรับครบ
5. ยกเลิกได้ทุกสถานะยกเว้น `CLOSED`, `CANCELLED`

**Tables:** `po_headers`, `po_lines`, `po_approvals`

---

### 2.2 รับสินค้า (Goods Receipt)

**หน้า:** `/goods-receipt` → `GoodsReceiptNote.vue`
**Backend:** `GrModule` → SP: `sp_GRCancel`, `sp_GR_02_CreateGR`, `sp_GR_03_ConfirmGR`

```
[DRAFT] ──สร้าง GR จาก PO──→ [CONFIRMED] ──→ stock_on_hand เพิ่มขึ้น
        ←── ยกเลิก ──[CANCELLED]
```

**ขั้นตอน:**
1. เลือก PO ที่ยัง pending receive
2. สร้าง GR Header + Lines (ระบุจำนวนที่รับจริง)
3. Confirm GR → `sp_GR_03_ConfirmGR` → เพิ่ม stock_on_hand + บันทึก stock_movements (type=RECEIVE)

**Tables:** `gr_headers`, `gr_lines`

---

### 2.3 ยืมยา/เวชภัณฑ์ (Borrow)

**หน้า:** `/borrow-medicines` → `BorrowMedicines.vue`
**Backend:** `BorrowModule` → SP: `sp_BR_01_Create` ถึง `sp_BR_07_Cancel`

```
[DRAFT] ──Submit──→ [PENDING_APPROVAL] ──อนุมัติ 3 ชั้น──→ [APPROVED]
                                                                  │
                                              [REJECTED] ◄────────┤
                                                                   ↓
                                                            [RECEIVED] ──settle──→ [SETTLED]
```

**ขั้นตอน:**
1. สร้าง Borrow Request (Supplier + รายการยา)
2. Submit → อนุมัติ 3 ชั้น (เหมือน PO)
3. Receive → stock_on_hand เพิ่ม + บันทึก stock_movements (type=BORROW_RECEIVE)
4. Settle → เชื่อมกับ PO → สถานะ `SETTLED`

**Tables:** `borrow_headers`, `borrow_lines`, `borrow_approvals`

---

### 2.4 คลังสต็อก (Stock / Inventory)

**หน้า:** `/stock-status` → `StockStatus.vue` | `/movement-records` → `MovementRecords.vue`
**Backend:** `StockModule`

- **StockStatus:** แสดงสถานะ stock ทุก item (จาก `view_item_stock_summary`) — ไฮไลต์สีเมื่อต่ำกว่า MIN หรือเกิน MAX
- **MovementRecords:** ประวัติการเคลื่อนไหว stock ทุกประเภท (RECEIVE, BORROW_RECEIVE, ISSUE, ADJUSTMENT ฯลฯ)

**Tables:** `stock_on_hand`, `stock_movements`, `movement_types`

---

### 2.5 นับสต็อกประจำเดือน (Physical Count)

**หน้า:** `/stock-monthly-record` → `StockMonthlyRecord.vue`
**หน้าย่อย:** `/stock-count-detail/:id` → `StockCountDetail.vue`
**หน้าอนุมัติ:** `/stock-count-approval` → `StockCountApproval.vue`
**Backend:** `PhysicalCountModule` → SP: `sp_PhysCount_01` ถึง `sp_PhysCount_06`

```
[OPEN] ──สร้าง Period──→ [COUNTING / OPEN]
           │
           ├── Take Snapshot (sp_Snapshot_02) → บันทึก qty_system ณ ขณะนั้น
           │
[DRAFT] ──กรอก qty_counted──→ [DRAFT: กำลังนับ]
           │
           ├── Save (บันทึกร่าง)
           │
           └── Submit ──→ [SUBMITTED] ──→ email แจ้ง GROUP_LEAD
                                              │
                                   [PENDING_APPROVAL]
                                              │
                         GROUP_LEAD อนุมัติ ──┤── ปฏิเสธ
                                              ↓
                                         [APPROVED] → stock_on_hand += diff_qty
                                              │
                                    [SNAPSHOT_DONE / CLOSED]
```

**กฎสำคัญ:**
- `diff_qty = qty_counted - qty_system` (delta approach)
- ถ้า diff ≠ 0 **ต้องใส่ หมายเหตุ** ก่อน Submit
- GROUP_LEAD เห็นทุก period ที่รอ approval (status=SUBMITTED)
- สามารถดูรายละเอียดย้อนหลังได้แม้ Approved แล้ว (read-only)

**Tables:** `physical_count_headers`, `physical_count_lines`, `stock_periods`, `stock_period_snapshot`

---

### 2.6 อนุมัติการสั่งซื้อยา (Approve Purchase)

**หน้า:** `/approve-purchase` → `ApprovePurchase.vue`
**Backend:** `ApprovalModule`

- GROUP_LEAD / MANAGER / DEPARTMENT เห็น PO และ Borrow ที่รอตนเองอนุมัติ
- สามารถ Approve / Reject / Rework ได้
- แสดง line_type (ORDER / BORROW) ในตาราง
- ส่ง email แจ้งทุกขั้นตอน

---

### 2.7 Email Notification

**Backend:** `EmailModule` | `email.service.ts`
- Template engine รองรับ `{{variable}}` และ `{{#if variable}}...{{/if}}`
- `TEST_EMAIL_OVERRIDE` ใน `.env.development` → redirect ทุก email ไปที่ address เดียว
- 9 templates:
  - PO: `po-approval`, `po-approved`, `po-rejected`
  - Borrow: `borrow-approval`, `borrow-approved`, `borrow-rejected`
  - Physical Count: `approval-physical-count`, `approved-physical-count`, `rejected-physical-count`

---

## 3. Database Schema — ตารางที่เกี่ยวกับ Treatment Record

ตารางเหล่านี้มีในฐานข้อมูลแล้ว แต่ยังไม่มี API หรือ UI รองรับ:

### 3.1 ตารางหลัก
| Table | หน้าที่ |
|-------|---------|
| `visits` | บันทึกการเข้ารักษา (1 visit = 1 ครั้ง) |
| `visit_usages` | รายการยา/อุปกรณ์ที่ใช้ในแต่ละ visit |
| `visit_usage_edit_logs` | log การแก้ไข visit_usages |
| `patient_profiles` | profile ผู้ป่วย (EMP หรือ EXT) |
| `patient_allergies` | ประวัติแพ้ยา/อาหาร |
| `patient_physical_info` | น้ำหนัก, ส่วนสูง, BMI |
| `patient_underlying_diseases` | โรคประจำตัว |
| `patient_social_security` | ประกันสังคม + โรงพยาบาลที่เลือก |
| `external_people` | บุคคลภายนอก (ไม่ใช่พนักงาน) |

### 3.2 ตาราง visits — โครงสร้างสำคัญ
```sql
visits (
  visit_id            -- PK
  visit_datetime      -- วันเวลาที่เข้า
  shift_code          -- กะงาน
  patient_type        -- 'EMP' | 'EXT'
  employee_id         -- รหัสพนักงาน (ถ้า EMP)
  external_person_id  -- id บุคคลภายนอก (ถ้า EXT)
  patient_id          -- FK → patient_profiles
  symptoms            -- อาการ (text)
  vitals_json         -- JSON: BP, pulse, temp, SpO2, RR, weight, height ฯลฯ
  group_id            -- FK → disease_groups
  disease_id          -- FK → disease_sub_groups
  treatment_type_id   -- FK → treatment_types (REST/DRESSING/SEND_HOME/DISPENSE/EYE_WASH)
  nursing_advice      -- คำแนะนำพยาบาล
  accident_in_work_flag  -- เกิดอุบัติเหตุในงานหรือไม่
  work_related_flag   -- โรคจากการทำงาน
  severity_id         -- FK → accident_severity_types
  refer_flag          -- ส่งต่อโรงพยาบาลหรือไม่
  refer_type_id       -- FK → refer_types
  created_by, created_at
)
```

### 3.3 ตาราง Lookup ที่พร้อมใช้
| Table | ข้อมูล |
|-------|--------|
| `treatment_types` | REST, DRESSING, SEND_HOME, DISPENSE, EYE_WASH |
| `refer_types` | EMERGENCY, REST_REFER, ACCIDENT_REFER, DRESSING_REFER |
| `accident_severity_types` | STOP_WORK, REST, WORK_NORMAL, REFER_HOSP |
| `disease_groups` | กลุ่มโรค |
| `disease_sub_groups` | กลุ่มย่อยโรค |
| `hospitals` | รายชื่อโรงพยาบาล (เชียงใหม่, ลำพูน, ลำปาง) |
| `items` / `view_items` | รายการยา/เวชภัณฑ์พร้อม stock |

### 3.4 Stored Procedures ที่มีอยู่แล้ว
| SP | หน้าที่ |
|----|---------|
| `sp_PP_01_GetOrCreatePatientProfile` | สร้าง/ดึง patient_profile (EMP/EXT) |
| `sp_PP_02_UpsertPatientAllergy` | เพิ่ม/แก้ไขข้อมูลแพ้ยา/อาหาร |

---

## 4. Routes ที่เปิดไว้แล้ว (ทุกอันยัง Empty.vue)

| Route | Name | ใช้สำหรับ |
|-------|------|----------|
| `/treatment-record` | treatmentRecord | **หน้าหลัก — บันทึก visit ใหม่** |
| `/treatment-history` | treatmentHistory | ประวัติการรักษาของผู้ป่วย |
| `/general-treatment-history` | generalTreatmentHistory | ประวัติรักษาทั่วไป |
| `/refer-history` | referHistory | ประวัติการ Refer |
| `/occupational-disease-history` | occupationalDiseaseHistory | ประวัติโรคจากการทำงาน |
| `/chronic-disease-history` | chronicDiseaseHistory | ประวัติโรคเรื้อรัง |
| `/hospital-treatment-history` | hospitalTreatmentHistory | ประวัติเจ็บป่วยจากโรงพยาบาล |
| `/work-accident-history` | workAccidentHistory | ประวัติอุบัติเหตุในงาน |
| `/employee-external-people` | employeeExternalPeople | จัดการบุคคลภายนอก |

---

## 5. แผนพัฒนา Treatment Record

### 5.1 กระบวนการทำงาน (User Flow)

```
พยาบาลเปิดหน้า "บันทึกการรักษาพยาบาล"
           │
           ▼
  [ค้นหาผู้ป่วย]
  ├── ค้นหาพนักงาน (employee_id / ชื่อ) → LSD_SYSTEM_CENTER
  └── บุคคลภายนอก (กรอก ชื่อ-นามสกุล, บริษัท ฯลฯ)
           │
           ▼
  [แสดงข้อมูลผู้ป่วย] ← ดึงจาก patient_profiles
  ├── ⚠️ แจ้งเตือนประวัติแพ้ยา (patient_allergies)
  ├── โรคประจำตัว (patient_underlying_diseases)
  └── ข้อมูลล่าสุด: น้ำหนัก, BMI (patient_physical_info)
           │
           ▼
  [กรอกข้อมูล Visit]
  ├── วันเวลา + กะงาน
  ├── อาการ / chief complaint
  ├── Vital Signs (BP, Pulse, Temp, SpO2, RR, น้ำหนัก)
  ├── กลุ่มโรค + ประเภทโรค
  ├── ประเภทการรักษา (REST/DRESSING/SEND_HOME/DISPENSE/EYE_WASH)
  ├── [ถ้า refer_flag = true] ประเภท Refer + โรงพยาบาล
  ├── [ถ้า accident_flag = true] ความรุนแรง + โรคจากงาน
  ├── ยา/อุปกรณ์ที่ใช้ (visit_usages)
  └── คำแนะนำพยาบาล
           │
           ▼
  [บันทึก] → sp_TR_01_CreateVisit
  ├── INSERT visits
  ├── INSERT visit_usages (ถ้ามียา)
  └── sp_AddStockMovementFromJson → ลด stock_on_hand (type=DISPENSE)
           │
           ▼
  [แสดงผลสำเร็จ] → ลิงก์ไปหน้า print / ดูรายละเอียด
```

### 5.2 Stored Procedures ที่ต้องสร้าง

| SP | หน้าที่ | Input |
|----|---------|-------|
| `sp_TR_01_CreateVisit` | บันทึก visit + usages + ลด stock | visit_json, usages_json, @CreatedBy |
| `sp_TR_02_GetVisitList` | ดึงรายการ visits (filter: วันที่, patient, status) | @PatientId, @DateFrom, @DateTo, @EmployeeId |
| `sp_TR_03_GetVisitById` | ดึงรายละเอียด 1 visit | @VisitId |
| `sp_TR_04_UpdateVisitUsage` | แก้ไขจำนวนยา (บันทึก log) | @VisitUsageId, @NewQty, @EditedBy, @Reason |

### 5.3 NestJS Module ที่ต้องสร้าง

```
server/src/apis/treatment/
  treatment.interface.ts   — IVisit, IVisitUsage, IPatientProfile, IPatientSummary
  treatment.service.ts     — createVisit(), getVisits(), getVisitById(), updateUsage()
  treatment.controller.ts  — POST /visits, GET /visits, GET /visits/:id
  treatment.module.ts      — register
```

**เพิ่มใน `app.module.ts`:**
```typescript
import { TreatmentModule } from '@/src/apis/treatment/treatment.module';
```

### 5.4 Vue Pages ที่ต้องสร้าง

| ไฟล์ | Route | ความสำคัญ |
|------|-------|----------|
| `TreatmentRecord.vue` | `/treatment-record` | 🔴 หลัก — form บันทึก visit ใหม่ |
| `TreatmentHistory.vue` | `/treatment-history` | 🟡 ดูประวัติของผู้ป่วยรายคน |
| `PatientProfile.vue` | (dialog/drawer ใน TreatmentRecord) | 🔴 แสดงแพ้ยา + โรคประจำตัว |

### 5.5 Client Service

```
client/src/services/treatment.service.ts
— createVisit(data)
— getVisits(params)
— getVisitById(visitId)
— getPatientProfile(type, id)
— searchEmployee(query)      ← ใช้ employees API ที่มีอยู่
— getItems(search?)          ← ใช้ stock API ที่มีอยู่
— getLookups()               ← treatment_types, refer_types, disease_groups, hospitals
```

### 5.6 ลำดับการพัฒนาแนะนำ

**Phase 1 — Database**
- [ ] สร้าง SP: `sp_TR_01_CreateVisit` (insert visits + visit_usages + stock deduction)
- [ ] สร้าง SP: `sp_TR_02_GetVisitList`
- [ ] สร้าง SP: `sp_TR_03_GetVisitById`
- [ ] สร้าง SP: `sp_TR_04_UpdateVisitUsage`
- [ ] ทดสอบ SP ใน SSMS

**Phase 2 — Backend API**
- [ ] สร้าง `treatment.interface.ts`
- [ ] สร้าง `treatment.service.ts` (เรียก SP ทั้ง 4 ตัว)
- [ ] สร้าง `treatment.controller.ts` (POST /visits, GET /visits, GET /visits/:id, PUT /visits/:id/usages/:usageId)
- [ ] สร้าง `treatment.module.ts` + register ใน `app.module.ts`
- [ ] เพิ่ม GET endpoint สำหรับ lookups (treatment_types, refer_types, disease_groups, hospitals)
- [ ] build ผ่าน

**Phase 3 — Frontend**
- [ ] สร้าง `treatment.service.ts` (client)
- [ ] สร้าง `TreatmentRecord.vue`
  - Step 1: ค้นหาผู้ป่วย (autocomplete employee + manual EXT)
  - Step 2: แสดง patient summary (แพ้ยา, โรคประจำตัว) — ⚠️ warning dialog
  - Step 3: form visit (อาการ, vital signs, disease, treatment type)
  - Step 4: รายการยา/อุปกรณ์ที่ใช้ (DataTable editable)
  - Step 5: nursing advice + บันทึก
- [ ] สร้าง `TreatmentHistory.vue` (ตาราง + filter + click ดูรายละเอียด)
- [ ] update route `/treatment-record` ใน `router/index.ts`
- [ ] build ผ่าน

---

## 6. ข้อพิจารณาพิเศษ

### 6.1 Stock Deduction
เมื่อบันทึก visit และมียาที่ใช้ → ต้องลด `stock_on_hand` ทันที (ไม่มี approval)
ใช้ `sp_AddStockMovementFromJson` เดิม (movement_type = `DISPENSE`) ใน `sp_TR_01_CreateVisit`

```sql
-- ตัวอย่างใน sp_TR_01_CreateVisit
EXEC sp_AddStockMovementFromJson
    @JsonData = @usages_json,
    @MovementType = 'DISPENSE',
    @RefType = 'VISIT',
    @RefId = @new_visit_id,
    @CreatedBy = @CreatedBy,
    @MovementDate = @visit_datetime
```

### 6.2 vitals_json
เก็บ vital signs เป็น JSON เพื่อ flexibility (ไม่ต้อง alter table เมื่อเพิ่ม vital ใหม่)
```json
{
  "bp_systolic": 120,
  "bp_diastolic": 80,
  "pulse": 72,
  "temp_c": 36.5,
  "spo2": 98,
  "rr": 18,
  "weight_kg": 65.0,
  "height_cm": 170.0
}
```

### 6.3 Patient Profile Auto-Create
ใช้ `sp_PP_01_GetOrCreatePatientProfile` ที่มีอยู่แล้ว → ระบบจะสร้าง patient_profile ถ้ายังไม่มี

### 6.4 แพ้ยา Warning
ก่อนบันทึก visit_usages → ตรวจ `patient_allergies` ว่ายาที่จะจ่ายตรงกับ `item_id` ที่แพ้หรือไม่
แสดง ConfirmDialog แจ้งเตือนพยาบาลก่อน (ไม่บล็อก แต่ต้อง confirm)

### 6.5 Re-use Components ที่มีอยู่แล้ว
- Employee search → ดึงจาก `EmployeesModule` (API `/employees`)
- Items search → ดึงจาก `StockModule` (API `/items`)
- Format utilities → `utils/format.utils.ts` (Thai locale)
- API service → `Api.get/post/put` (centralized Axios)

---

## 7. สรุปไฟล์ที่ต้องสร้าง/แก้ไข

### ต้องสร้างใหม่
```
PRD/
  06_create_treatment_sps.sql         (SP definitions)
  07_test_treatment_sps.sql           (test script)

server/src/apis/treatment/
  treatment.interface.ts
  treatment.service.ts
  treatment.controller.ts
  treatment.module.ts

client/src/services/
  treatment.service.ts
client/src/interfaces/
  treatment.interfaces.ts
client/src/views/pages/
  TreatmentRecord.vue
  TreatmentHistory.vue
```

### ต้องแก้ไข
```
server/src/app.module.ts              (import TreatmentModule)
client/src/router/index.ts            (เปลี่ยน Empty.vue → TreatmentRecord.vue, TreatmentHistory.vue)
```

---

*เอกสารนี้ใช้เป็น reference สำหรับการพัฒนา Treatment Record feature*
*เมื่อเริ่มพัฒนาให้สร้าง branch: `feature/treatment_record`*
