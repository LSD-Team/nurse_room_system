# Guideline: Refer Tracking Module Pattern

> ไฟล์นี้สรุปแบบแผนการพัฒนาระบบ "บันทึกการ Refer และติดตามผล" ครบวงจร
> ใช้เป็น reference เมื่อต้องสร้างระบบ **tracking/follow-up** ลักษณะคล้ายกันในส่วนอื่น

---

## 1. โครงสร้างฐานข้อมูล (Database Schema Pattern)

ทุก tracking module จะมี **2 ตาราง** หลัก:

```
[header table]  — เก็บ "เคส" แต่ละครั้งที่เปิด (1 เคส = 1 เรื่อง)
[detail table]  — เก็บ "การติดตาม" แต่ละครั้งของเคสนั้น (1:N)
```

### ตัวอย่าง: refer_cases + refer_followups

```sql
-- ตาราง header
CREATE TABLE refer_cases (
  refer_case_id   INT IDENTITY(1,1) PRIMARY KEY,
  visit_id        INT NOT NULL,           -- FK → visits (เชื่อมกับ visit ที่เกิดเหตุ)
  refer_no        INT NOT NULL DEFAULT 1, -- ลำดับ refer ของ visit นั้น
  refer_type_id   INT,                    -- FK → lookup table
  refer_reason    NVARCHAR(500),
  status          NVARCHAR(20) NOT NULL DEFAULT 'OPEN',  -- OPEN | CLOSED | CANCELLED
  opened_at       DATETIME,
  closed_at       DATETIME,
  -- Audit fields (มีทุกตาราง)
  is_deleted      BIT NOT NULL DEFAULT 0,
  created_by      NVARCHAR(50),
  created_at      DATETIME DEFAULT GETDATE(),
  updated_by      NVARCHAR(50),
  updated_at      DATETIME DEFAULT GETDATE()
);

-- ตาราง detail
CREATE TABLE refer_followups (
  followup_id          INT IDENTITY(1,1) PRIMARY KEY,
  refer_case_id        INT NOT NULL,           -- FK → refer_cases
  followup_no          INT NOT NULL DEFAULT 1, -- ลำดับ followup ของ case นั้น
  followup_at          DATETIME,
  outcome              NVARCHAR(30) NOT NULL,  -- enum: ADMISSION | BACK_TO_COMPANY | BACK_TO_HOME | FOLLOWUP_ONLY
  followup_note        NVARCHAR(1000),         -- บังคับกรอก (validate ฝั่ง client)
  hospital_id          INT,                    -- FK → hospitals (optional)
  room_no              NVARCHAR(20),
  back_to_work_date    DATE,
  next_appointment_at  DATETIME,
  treatment_cost       DECIMAL(10,2),          -- ค่าใช้จ่ายในการรักษา (optional)
  -- Audit fields
  is_deleted      BIT NOT NULL DEFAULT 0,
  created_by      NVARCHAR(50),
  created_at      DATETIME DEFAULT GETDATE(),
  updated_by      NVARCHAR(50),
  updated_at      DATETIME DEFAULT GETDATE()
);
```

### กฎ Soft Delete
- ทุกตาราง tracking ใช้ **soft delete** (`is_deleted = 1`) ไม่ใช้ `DELETE`
- Query ทุกครั้งต้อง `WHERE is_deleted = 0`

---

## 2. Stored Procedures

ใช้ SP เฉพาะสำหรับ **Create** (เพราะต้องการ logic เช่น auto-number, auto-close case):

```sql
-- sp_Xxx_01_CreateCase: สร้าง case ใหม่, คำนวณ case_no อัตโนมัติ, return case_id
-- sp_Xxx_02_CreateFollowup: สร้าง followup, คำนวณ followup_no อัตโนมัติ,
--   auto-close case เมื่อ outcome IN ('BACK_TO_COMPANY', 'BACK_TO_HOME')
--   รับ optional param สำหรับข้อมูลเพิ่มเติม เช่น @TreatmentCost DECIMAL(10,2) = NULL
```

> ⚠️ เมื่อเพิ่มคอลัมน์ใหม่ในตาราง detail ต้องทำ 2 ขั้นตอน:
> 1. `ALTER TABLE xxx_followups ADD new_col TYPE NULL`
> 2. Re-run SP ด้วย parameter ใหม่

**Return pattern ของ SP:**
```sql
-- SP ต้อง SELECT กลับ ID ที่สร้างใหม่:
SELECT @NewId AS refer_case_id  -- ชื่อ column ตรงกับ primary key
```

**Client อ่าน response จาก SP:**
```typescript
const res = await ReferService.createCase({ ... });
const newId = Array.isArray(res) ? res[0]?.refer_case_id : res?.refer_case_id;
```

---

## 3. NestJS Module Pattern

**โครงสร้างไฟล์:**
```
server/src/apis/refer/
  refer.interface.ts   — Request body + Response shape interfaces
  refer.service.ts     — Business logic (query/SP calls)
  refer.controller.ts  — REST endpoints + Swagger decorators
  refer.module.ts      — Module registration
```

**การ register ใน app.module.ts:**
```typescript
imports: [..., ReferModule],
```

### refer.interface.ts Pattern
```typescript
// Request bodies (Create/Patch แยกกัน)
export interface ICreateXxxBody { required_field: type; optional_field?: type; }
export interface IPatchXxxBody  { all_fields_optional?: type; }

// Response shapes
export interface IXxxSummary { ... }
export interface IXxxDetail  { ... }
```

### refer.service.ts Pattern
```typescript
@Injectable()
export class ReferService {
  constructor(private readonly db: DatabaseService) {}
  private get DB() { return this.db.getDatabaseName(); }

  // GET list → query() ตรง
  async getList(id: number) {
    return this.db.query<any>(this.DB, `SELECT ... WHERE id = @id AND is_deleted = 0`, { id });
  }

  // POST create → executeStoredProcedure()
  async create(body: ICreateBody, createdBy: string) {
    return this.db.executeStoredProcedure(this.DB, 'sp_Xxx_01_Create', {
      FieldName: body.field_name,  // PascalCase param name
      CreatedBy: createdBy,
    });
  }

  // PATCH update → dynamic SET clauses (อัพเดตเฉพาะ field ที่ส่งมา)
  async patch(id: number, body: IPatchBody, updatedBy: string) {
    const setClauses = ['updated_by = @updatedBy', 'updated_at = GETDATE()'];
    const params: Record<string, any> = { id, updatedBy };
    if (body.field !== undefined) { setClauses.push('field = @field'); params.field = body.field; }
    return this.db.query<any>(this.DB, `UPDATE table SET ${setClauses.join(', ')} WHERE id = @id AND is_deleted = 0`, params);
  }

  // DELETE → soft delete
  async delete(id: number, deletedBy: string) {
    return this.db.query<any>(this.DB, `UPDATE table SET is_deleted = 1, updated_by = @deletedBy, updated_at = GETDATE() WHERE id = @id AND is_deleted = 0`, { id, deletedBy });
  }
}
```

### refer.controller.ts Pattern
```typescript
@ApiTags('refer')
@ApiBearerAuth()
@Controller('refer')
export class ReferController {
  constructor(private readonly referService: ReferService) {}
  private get currentUser() { return (global.jwtPayload as JwtPayloadData)?.UserID || 'UNKNOWN'; }

  @Get('by-patient/:patientId')
  async getByPatient(@Param('patientId') patientId: string) { ... }

  @Post('cases')
  async create(@Body() body: ICreateBody) {
    return this.referService.create(body, this.currentUser);  // ส่ง currentUser เสมอ
  }

  @Patch('cases/:id')
  @HttpCode(HttpStatus.OK)
  async patch(@Param('id') id: string, @Body() body: IPatchBody) {
    return this.referService.patch(Number(id), body, this.currentUser);
  }

  @Delete('cases/:id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return this.referService.delete(Number(id), this.currentUser);
  }
}
```

---

## 4. SQL Pattern สำหรับ "Implicit Cases"

> **Key concept:** เมื่อ visit มี flag บางอย่าง (เช่น `refer_flag=1`) ให้แสดง visit นั้นใน tracking tab ทันทีโดยไม่ต้องรอให้ user สร้าง case ก่อน ใช้ `UNION ALL` กับ `NOT EXISTS`

```sql
-- Explicit cases (มีใน tracking table แล้ว)
SELECT rc.case_id, rc.visit_id, rc.status, ...
FROM xxx_cases rc
JOIN visits v ON v.visit_id = rc.visit_id
WHERE v.patient_id = @patientId AND rc.is_deleted = 0

UNION ALL

-- Implicit cases (visit มี flag แต่ยังไม่มี case entry)
SELECT CAST(NULL AS INT) AS case_id,  -- NULL = ยังไม่มี case
       v.visit_id,
       'OPEN'            AS status,
       v.visit_datetime  AS opened_at,
       CAST(NULL AS DATETIME)      AS closed_at,
       CAST(NULL AS NVARCHAR(500)) AS reason,
       ...
FROM visits v
WHERE v.patient_id = @patientId
  AND v.some_flag = 1
  AND NOT EXISTS (
    SELECT 1 FROM xxx_cases rc2
    WHERE rc2.visit_id = v.visit_id AND rc2.is_deleted = 0
  )

ORDER BY opened_at DESC
```

> **สำคัญ:** ใน UNION `CAST(NULL AS <type>)` ต้องระบุ type ให้ตรงกับ column แรก มิฉะนั้น SQL Server จะ error

---

## 5. Client Interface Pattern

```typescript
// treatment.interfaces.ts (หรือ interface file ของ module นั้น)
export interface IXxxCase {
  case_id: number | null;  // null = implicit (ยังไม่มีใน DB)
  visit_id: number;
  case_no: number;
  type_id: number;
  type_name: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  opened_at: string;
  closed_at: string | null;
  reason: string | null;
  visit_datetime: string;
  // context fields จาก visit (เพื่อแสดงในการ์ด)
  symptoms: string | null;
  disease_group_name: string | null;
  disease_sub_group_name: string | null;
}

export interface IXxxFollowup {
  followup_id: number;
  case_id: number;
  followup_no: number;
  followup_at: string;
  outcome: 'OUTCOME_A' | 'OUTCOME_B' | 'FOLLOWUP_ONLY';
  followup_note: string | null;   // บังคับกรอก (validate ใน saveFollowup)
  next_appointment_at: string | null;
  treatment_cost: number | null;  // ค่าใช้จ่ายในการรักษา (optional, DECIMAL(10,2))
  // lookup fields
  hospital_id: number | null;
  hospital_name_th: string | null;
}
```

---

## 6. Client Service Pattern

```typescript
// services/xxx.service.ts
import { Api } from '@/services/api.service';
import type { IXxxCase, IXxxFollowup } from '@/interfaces/treatment.interfaces';

export class XxxService {
  static getCasesByPatient(patientId: string): Promise<IXxxCase[]> {
    return Api.get(`/xxx/by-patient/${patientId}`);
  }
  static createCase(body: { visit_id: number; type_id: number; ... }): Promise<any> {
    return Api.post('/xxx/cases', body);
  }
  static patchCase(caseId: number, body: { ... }): Promise<any> {
    return Api.patch(`/xxx/cases/${caseId}`, body);
  }
  static deleteCase(caseId: number): Promise<any> {
    return Api.delete(`/xxx/cases/${caseId}`);
  }
  static getFollowupsByCase(caseId: number): Promise<IXxxFollowup[]> {
    return Api.get(`/xxx/followups/${caseId}`);
  }
  static createFollowup(body: { case_id: number; outcome: string; followup_note: string; ... }): Promise<any> {
    return Api.post('/xxx/followups', body);
  }
  static patchFollowup(followupId: number, body: { ... }): Promise<any> {
    return Api.patch(`/xxx/followups/${followupId}`, body);
  }
  static deleteFollowup(followupId: number): Promise<any> {
    return Api.delete(`/xxx/followups/${followupId}`);
  }
}
```

---

## 7. Vue Component Pattern (TreatmentRecord.vue Tab 3)

### State ที่ต้องมี
```typescript
// Cases
const xxxCases      = ref<IXxxCase[]>([]);
const xxxLoading    = ref(false);
const xxxFilter     = ref<'ALL' | 'OPEN' | 'CLOSED'>('OPEN');  // default: 'OPEN'
const xxxFilterOpts = [
  { label: 'ทั้งหมด', value: 'ALL' },
  { label: 'เปิด',    value: 'OPEN' },
  { label: 'ปิด',     value: 'CLOSED' },
];
// Filter ตามประเภท (dynamic จาก cases ที่มีจริงของคนไข้คนนี้)
const xxxTypeFilter = ref<number | null>(null);
const xxxTypeFilterOpts = computed(() => {
  const seen = new Set<number>();
  const opts: { label: string; value: number }[] = [];
  for (const rc of xxxCases.value) {
    if (!seen.has(rc.type_id)) {
      seen.add(rc.type_id);
      opts.push({ label: rc.type_name, value: rc.type_id });
    }
  }
  return opts;
});
const filteredXxxCases = computed(() => {
  let list = xxxCases.value;
  if (xxxFilter.value === 'OPEN')   list = list.filter(c => c.status === 'OPEN');
  else if (xxxFilter.value === 'CLOSED') list = list.filter(c => c.status === 'CLOSED' || c.status === 'CANCELLED');
  if (xxxTypeFilter.value !== null) list = list.filter(c => c.type_id === xxxTypeFilter.value);
  return list;
});

// Followups (lazy load per case)
const expandedCaseId     = ref<number | null>(null);
const followupsByCaseId  = ref<Record<number, IXxxFollowup[]>>({});
const followupsLoadingId = ref<number | null>(null);

// Case dialog
const showCaseDialog = ref(false);
const caseEditId     = ref<number | null>(null);
const caseSaving     = ref(false);
const caseForm       = ref({ visit_id: null, type_id: null, reason: '', opened_at: '' });

// Followup dialog
const showFollowupDialog = ref(false);
const followupEditId     = ref<number | null>(null);
const followupForCaseId  = ref<number | null>(null);
const followupSaving     = ref(false);
const followupForm       = ref({
  followup_at: '', outcome: 'FOLLOWUP_ONLY', followup_note: '',
  treatment_cost: null as number | null,  // ค่าใช้จ่าย (optional)
  // ...other fields
});
```

### Functions ที่ต้องมี

```typescript
// 1. โหลด cases ทั้งหมด (reset type filter ทุกครั้งเมื่อเปลี่ยนคนไข้)
async function loadXxxCases() {
  if (!patientProfile.value) return;
  xxxLoading.value = true;
  xxxTypeFilter.value = null;  // reset type filter เมื่อโหลดใหม่
  try { xxxCases.value = await XxxService.getCasesByPatient(String(patientProfile.value.patient_id)); }
  catch (err) { console.error(err); }
  finally { xxxLoading.value = false; }
}

// 2. Expand case → lazy load followups
async function toggleFollowups(caseId: number | null) {
  if (caseId === null) return;  // implicit cases ยังไม่มี followup
  if (expandedCaseId.value === caseId) { expandedCaseId.value = null; return; }
  expandedCaseId.value = caseId;
  if (!followupsByCaseId.value[caseId]) {
    followupsLoadingId.value = caseId;
    try { followupsByCaseId.value[caseId] = await XxxService.getFollowupsByCase(caseId); }
    catch (err) { console.error(err); }
    finally { followupsLoadingId.value = null; }
  }
}

// 3. Implicit case → auto-create then open followup dialog
async function beginTrackingCase(rc: IXxxCase) {
  caseSaving.value = true;
  try {
    const res = await XxxService.createCase({ visit_id: rc.visit_id, type_id: rc.type_id, opened_at: rc.opened_at });
    const newId = Array.isArray(res) ? res[0]?.case_id : res?.case_id;
    await loadXxxCases();
    if (newId) { expandedCaseId.value = newId; openFollowupDialog(newId); }
  } catch (err: any) {
    Swal.fire({ icon: 'error', title: 'ไม่สามารถเริ่มติดตาม', text: err?.response?.data?.message || err?.message });
  } finally { caseSaving.value = false; }
}

// 4. บันทึก followup (validation: followup_note บังคับ)
async function saveFollowup() {
  if (!followupForm.value.followup_at) {
    Swal.fire({ icon: 'warning', title: 'กรุณาระบุวันที่ติดตาม', timer: 1500, showConfirmButton: false }); return;
  }
  if (!followupForm.value.followup_note?.trim()) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอกบันทึกการติดตาม', text: 'ต้องระบุรายละเอียดทุกครั้ง', timer: 2000, showConfirmButton: false }); return;
  }
  // ... save logic, reload followups + cases (cases may auto-close)
  await loadXxxCases();  // ⚠️ reload หลัง save followup เสมอ (case อาจ auto-close)
}
```

### Template Structure

```html
<!-- Tab header bar -->
<div class="flex items-center justify-between gap-2 mb-3 flex-wrap">
  <span class="font-semibold text-sm">
    รายการ ({{ filteredXxxCases.length }}<template v-if="xxxFilter !== 'ALL'"> / {{ xxxCases.length }}</template> รายการ)
  </span>
  <div class="flex items-center gap-2">
    <SelectButton v-model="xxxFilter" :options="xxxFilterOpts" optionLabel="label" optionValue="value" size="small" />
    <Button icon="pi pi-plus" label="เพิ่ม" size="small" @click="openCaseDialog()" />
  </div>
</div>

<!-- Case card -->
<div v-for="rc in filteredXxxCases" :key="rc.case_id ?? 'visit-' + rc.visit_id"
     class="border border-gray-200 rounded-lg overflow-hidden">

  <!-- Case header row (click to expand) -->
  <div class="flex items-center gap-2 px-3 py-2.5 bg-gray-50 transition-colors"
       :class="rc.case_id !== null ? 'cursor-pointer hover:bg-gray-100' : ''"
       @click="toggleFollowups(rc.case_id)">
    <i :class="rc.case_id !== null && expandedCaseId === rc.case_id ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
    <span>#{{ rc.case_no || '-' }}</span>
    <Tag :value="rc.type_name" severity="warn" />
    <!-- Explicit case: show status tag -->
    <Tag v-if="rc.case_id !== null" :value="rc.status === 'OPEN' ? 'เปิด' : 'ปิด'"
         :severity="rc.status === 'OPEN' ? 'success' : 'secondary'" />
    <!-- Implicit case: show "รอติดตาม" -->
    <Tag v-else value="รอติดตาม" severity="secondary" />
    <span class="ml-auto text-xs text-gray-500">{{ formatDate(rc.opened_at) }}</span>
    <!-- Edit/Delete ซ่อนสำหรับ implicit cases -->
    <template v-if="rc.case_id !== null">
      <Button icon="pi pi-pencil" text rounded size="small" @click.stop="openCaseDialog(rc)" />
      <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click.stop="confirmDeleteCase(rc)" />
    </template>
  </div>

  <!-- Context info row (symptoms/disease — แสดงถ้ามีข้อมูล) -->
  <div v-if="rc.symptoms || rc.disease_group_name"
       class="flex flex-wrap items-center gap-x-4 px-3 py-1.5 bg-white border-t border-gray-100 text-xs text-gray-500">
    <span v-if="rc.disease_group_name"><i class="pi pi-tags mr-1" />{{ rc.disease_group_name }}</span>
    <span v-if="rc.symptoms" class="min-w-0"><i class="pi pi-comment mr-1" /><span class="line-clamp-1">{{ rc.symptoms }}</span></span>
  </div>

  <!-- Follow-up panel (explicit cases เท่านั้น) -->
  <div v-if="rc.case_id !== null && expandedCaseId === rc.case_id" class="px-3 py-2">
    <!-- PrimeVue Timeline -->
    <Timeline :value="followupsByCaseId[rc.case_id!]">
      <template #marker="{ item: fp }">
        <span class="flex w-7 h-7 rounded-full text-white text-xs items-center justify-center font-bold"
              :class="fp.outcome === 'BACK_TO_COMPANY' ? 'bg-green-500' : fp.outcome === 'ADMISSION' ? 'bg-red-500' : fp.outcome === 'BACK_TO_HOME' ? 'bg-orange-400' : 'bg-blue-400'">
          {{ fp.followup_no }}
        </span>
      </template>
      <template #content="{ item: fp }">
        <div class="pb-4"> ... followup content ... </div>
      </template>
    </Timeline>
    <!-- Add followup button (OPEN cases only) -->
    <div v-if="rc.status === 'OPEN'" class="flex justify-end mt-2">
      <Button icon="pi pi-plus" label="บันทึกการติดตาม" size="small" outlined @click="openFollowupDialog(rc.case_id!)" />
    </div>
  </div>

  <!-- CTA panel (implicit cases) -->
  <div v-else-if="rc.case_id === null"
       class="flex items-center justify-between px-3 py-2 bg-blue-50 border-t border-blue-100">
    <span class="text-xs text-blue-700">Visit นี้มีการส่งต่อ — กดเพื่อเริ่มบันทึกการติดตาม</span>
    <Button icon="pi pi-play" label="เริ่มติดตาม" size="small" severity="info" outlined
            :loading="caseSaving" @click="beginTrackingCase(rc)" />
  </div>

</div>
```

---

## 8. Checklist เมื่อสร้าง Tracking Module ใหม่

### Phase 0 — Database (ทำใน SSMS)
- [ ] สร้าง `xxx_cases` table (header: case_id, visit_id, xxx_no, type_id, status, opened_at, closed_at, is_deleted, audit fields)
- [ ] สร้าง `xxx_followups` table (detail: followup_id, case_id, followup_no, outcome, followup_note, **treatment_cost**, is_deleted, audit fields)
- [ ] สร้าง `sp_Xxx_01_CreateCase` (auto-number case_no, return new case_id)
- [ ] สร้าง `sp_Xxx_02_CreateFollowup` (auto-number followup_no, auto-close case เมื่อ terminal outcome, รับ `@TreatmentCost DECIMAL(10,2) = NULL`)
- [ ] สร้าง views ถ้าจำเป็น
- [ ] ⚠️ เมื่อเพิ่มคอลัมน์ใหม่ภายหลัง: `ALTER TABLE` ก่อน แล้วค่อย re-run SP

### Phase 1 — Server (NestJS)
- [ ] `refer.interface.ts` — ICreate/IPatch bodies + IResponse shapes
- [ ] `refer.service.ts` — getByPatient (UNION implicit), getCasesByVisit, create/patch/delete case/followup
- [ ] `refer.controller.ts` — REST endpoints + Swagger `@Api*` decorators + `currentUser`
- [ ] `refer.module.ts` — Module class + register ใน `app.module.ts`
- [ ] `pnpm build` ผ่าน

### Phase 2 — Client (Vue)
- [ ] `treatment.interfaces.ts` — `IXxxCase` (case_id: number | null), `IXxxFollowup` (รวม `treatment_cost: number | null`)
- [ ] `services/xxx.service.ts` — 8 static methods (getCasesByPatient, createCase, patchCase, deleteCase, getFollowupsByCase, createFollowup, patchFollowup, deleteFollowup) พร้อม `treatment_cost?: number`
- [ ] `TreatmentRecord.vue` — State block (xxxCases, xxxFilter, **xxxTypeFilter**, **xxxTypeFilterOpts**, filteredXxxCases, expandedCaseId, followupsByCaseId, dialogs)
- [ ] Functions: loadXxxCases (**reset xxxTypeFilter**), toggleFollowups, beginTrackingCase, openCaseDialog, saveCase, confirmDeleteCase, openFollowupDialog, saveFollowup, confirmDeleteFollowup
- [ ] Tab template: header (type Select dropdown + status SelectButton + เพิ่ม button), case cards (implicit CTA), Timeline followups (**แสดง treatment_cost**), dialogs (**InputNumber สำหรับ treatment_cost**)
- [ ] Clear state ใน `resetForm()` และ `loadPatientProfile()`
- [ ] Watch(activeTab) lazy-load ที่ tab index ที่ถูกต้อง
- [ ] `pnpm build` ผ่าน

---

## 9. Business Rules ที่สำคัญ

| Rule | รายละเอียด |
|------|-----------|
| `followup_note` บังคับ | validate ใน `saveFollowup()` ก่อน call API ทุกครั้ง |
| Auto-close case | SP `CreateFollowup` จะ set `status='CLOSED'` เมื่อ outcome เป็น `BACK_TO_COMPANY` หรือ `BACK_TO_HOME` → ต้อง `loadXxxCases()` หลัง save followup เสมอ |
| Implicit case | `case_id === null` → ซ่อน Edit/Delete/Expand, แสดง "เริ่มติดตาม" button แทน |
| `beginTrackingCase` | auto-create case entry แล้ว open followup dialog ทันที → อย่าให้ user เปิดโดยไม่บันทึก |
| Filter default | ตั้ง default ที่ `'OPEN'` เพื่อให้เห็นเฉพาะเคสที่ยังค้างอยู่ |
| Type filter | `xxxTypeFilter` computed จาก unique type_id ของ cases คนไข้คนนี้ (dynamic) — reset เป็น null เมื่อ `loadXxxCases()` |
| `treatment_cost` | Optional field (`DECIMAL(10,2) NULL`) — ไม่บังคับ แสดงในการ์ด Timeline เฉพาะเมื่อ `!= null` |
| เพิ่มคอลัมน์ใหม่ใน followup | ต้อง ALTER TABLE → re-run SP → เพิ่มใน server interface + service → เพิ่มใน client interface + service → เพิ่มใน form state + dialog |
| Context fields | JOIN `symptoms`, `disease_group_name`, `disease_sub_group_name` จาก visits ใน getByPatient เพื่อให้รู้ว่า Refer ครั้งนี้มาจากอาการไหน |
| Key ใน v-for | ใช้ `:key="rc.case_id ?? 'visit-' + rc.visit_id"` ป้องกัน duplicate null key |
| PATCH แบบ dynamic | ส่งเฉพาะ field ที่เปลี่ยน ไม่ส่งทั้ง object → service build dynamic SET clauses |
| currentUser | ทุก write operation ส่ง `this.currentUser` (UserID จาก JWT) เป็น createdBy/updatedBy |

---

## 10. Files ที่เกี่ยวข้อง (Refer Module)

| File | หน้าที่ |
|------|---------|
| `server/src/apis/refer/refer.interface.ts` | Server-side request/response types |
| `server/src/apis/refer/refer.service.ts` | SQL queries + SP calls |
| `server/src/apis/refer/refer.controller.ts` | REST endpoints |
| `server/src/apis/refer/refer.module.ts` | NestJS module |
| `client/src/services/refer.service.ts` | Client API wrapper (8 methods) |
| `client/src/interfaces/treatment.interfaces.ts` | `IReferCase`, `IReferFollowup` |
| `client/src/views/pages/TreatmentRecord.vue` | Tab 3 UI (state + functions + template) |
| `PRD/refer_rec_en.md` | PRD + SP scripts + implementation checklist |

---

## 11. Changelog

### 2026-05-23 — Patch: treatment_cost + Type Filter + UX

#### ✅ เพิ่มฟิลด์ค่าใช้จ่ายในการรักษา (`treatment_cost`)

**DB (ต้องรันใน SSMS):**
```sql
ALTER TABLE refer_followups ADD treatment_cost DECIMAL(10,2) NULL;
GO
-- จากนั้น re-run sp_Refer_02_CreateFollowup (Section 13 ของ refer_rec_en.md)
```

**Server:**
- `refer.interface.ts`: เพิ่ม `treatment_cost?: number` ใน `ICreateFollowupBody`, `IPatchFollowupBody`, `IReferFollowupTimeline`
- `refer.service.ts`: เพิ่ม `rf.treatment_cost` ใน SELECT, `TreatmentCost` ใน SP params, dynamic SET ใน PATCH

**Client:**
- `treatment.interfaces.ts`: เพิ่ม `treatment_cost: number | null` ใน `IReferFollowup`
- `refer.service.ts`: เพิ่ม `treatment_cost?: number` ใน createFollowup/patchFollowup body types
- `TreatmentRecord.vue`:
  - followupForm state: เพิ่ม `treatment_cost: null as number | null`
  - openFollowupDialog: set `treatment_cost` ทั้ง edit mode และ new mode
  - saveFollowup: pass `treatment_cost`
  - Dialog: `<InputNumber>` วางก่อน textarea บันทึกการติดตาม
  - Timeline: แสดง `💰 ค่าใช้จ่าย: X บาท` เฉพาะเมื่อ `!= null`

---

#### ✅ เพิ่ม Filter ตามประเภทการ Refer

- `referTypeFilter = ref<number | null>(null)` (default: null = ทุกประเภท)
- `referTypeFilterOptions` computed จาก unique `refer_type_id` ของ cases คนไข้คนนี้ (dynamic)
- `filteredReferCases` กรอง 2 ชั้น: สถานะ + ประเภท Refer
- UI: `<Select>` dropdown "ทุกประเภท Refer" พร้อม `showClear` อยู่ซ้ายของ SelectButton สถานะ
- Reset `referTypeFilter = null` ทุกครั้งที่ `loadReferCases()` (เปลี่ยนคนไข้)

---

#### ✅ UX / Layout Tweaks

| สิ่งที่เปลี่ยน | รายละเอียด |
|---|---|
| สลับลำดับ form fields | "ค่าใช้จ่าย" อยู่ก่อน "บันทึกการติดตาม" ใน dialog |
| ซ่อนเมนู Dashboard | comment out ใน `AppMenuNurseRoom.vue` |
| หน้าเริ่มต้น | route `''` redirect → `treatmentRecord` |
| เมนูปิดเริ่มต้น | `staticMenuDesktopInactive: true` ใน `layout.ts` |
