# Special Drug Claim – Step 2 Handoff (สำหรับส่งต่องาน)

เอกสารนี้สรุปสิ่งที่ทำไปแล้วทั้งหมดของ **Special Drug Claim** ทั้งฝั่ง SQL / Backend / Frontend พร้อมจุดที่ยังเหลือ เพื่อให้ AI ตัวถัดไปทำงานต่อได้ทันทีโดยไม่ต้องรื้อใหม่

---

## 1) สรุปสถานะปัจจุบัน

**ทำเสร็จแล้ว**
1. SQL Stored Procedures
   - `PRD/sp_SC_01_Create.sql`
   - `PRD/sp_SC_02_Return.sql`
   - `PRD/sp_SC_03_Update.sql`
2. SQL test script end-to-end
   - `PRD/03_test_special_drug_claim_sps.sql`
3. Backend API (NestJS) ครบ create/list/detail/update/return
   - `GET /special-drug-claim`
   - `GET /special-drug-claim/:claimId`
   - `POST /special-drug-claim`
   - `PUT /special-drug-claim/:claimId`
   - `POST /special-drug-claim/return`
4. Frontend หน้าใช้งานจริง + route
   - route `special-medicine-request` เปลี่ยนจาก `Empty.vue` เป็น `SpecialDrugClaim.vue`
   - มี list / create dialog / detail dialog / return dialog
5. Build ที่ผ่านแล้ว
   - server build ผ่าน
   - client build ผ่าน (มี warning browserslist เก่า แต่ไม่ทำให้ build fail)

**ยังไม่เสร็จ/ควรทำต่อ**
1. UI สำหรับแก้ไข claim (`sp_SC_03_Update`) ฝั่ง frontend ยังไม่ได้ทำฟอร์มเฉพาะ
2. integration test จริงกับ DB production-like ยังควรไล่ซ้ำอีก 1 รอบหลัง deploy SP เวอร์ชันสุดท้าย

---

## 2) หลักการที่ยืนยันแล้ว (Business/Technical Decisions)

1. ใช้ movement type เดิมของระบบ: `WITHDRAW` / `RETURN`
2. ใช้ `ref_type = 'SPECIAL_DRUG_CLAIM'` และ `ref_id = claim_id`
3. ปรับแก้ claim ใช้แนวทาง **compensating movement** (immutable stock log)
4. lock-after-return = true  
   - ถ้า claim มี RETURN แล้ว ห้ามแก้ไขรายการยาใน `sp_SC_03_Update`
5. จำนวนยาเป็นจำนวนเต็ม (`INT`)
6. ฝั่ง return อ้างอิงด้วย `claim_item_id`

---

## 3) SQL ที่ทำแล้ว

### 3.1 `sp_SC_01_Create`
ไฟล์: `PRD/sp_SC_01_Create.sql`

หน้าที่:
1. รับ JSON รายการยา
2. validate ข้อมูล/ยอด
3. lock `stock_on_hand` ป้องกัน oversell
4. insert header + lines
5. insert `stock_movements` เป็น `WITHDRAW`
6. หัก `stock_on_hand`

หมายเหตุสำคัญ:
- สคริปต์ปัจจุบันในไฟล์นี้ใช้ `@VisitId` แบบ required  
- ฝั่ง backend ทำ compatibility check ไว้แล้ว (ดูข้อ 4.2) เพื่อรองรับกรณี SP/ตารางบาง environment ไม่มี visit

### 3.2 `sp_SC_02_Return`
ไฟล์: `PRD/sp_SC_02_Return.sql`

หน้าที่:
1. รับ `@ClaimItemId`, `@QtyReturnBase`
2. คำนวณ withdrawn/returned สะสมจาก `stock_movements`
3. กัน over-return
4. insert movement `RETURN`
5. เพิ่ม `stock_on_hand`

### 3.3 `sp_SC_03_Update`
ไฟล์: `PRD/sp_SC_03_Update.sql`

หน้าที่:
1. update header ได้ (`claim_datetime`, `reason`)
2. ถ้ามี adjustments จะคำนวณ delta ต่อ item
3. ถ้า delta > 0 ต้องเช็ค stock เพิ่ม
4. ลง movement ชดเชย:
   - delta > 0 => `WITHDRAW`
   - delta < 0 => `RETURN`
5. update `stock_on_hand` ตาม net delta
6. lock-after-return: ถ้ามี RETURN ใน claim นี้แล้ว throw error ห้ามแก้

---

## 4) Backend ที่ทำแล้ว

### 4.1 ไฟล์ที่เพิ่ม
อยู่ที่ `server/src/apis/special-drug-claim/`
1. `special-drug-claim.interface.ts`
2. `special-drug-claim.service.ts`
3. `special-drug-claim.controller.ts`
4. `special-drug-claim.module.ts`

และ register module แล้วใน:
- `server/src/app.module.ts` (มี `SpecialDrugClaimModule`)

### 4.2 จุดสำคัญใน service
ไฟล์: `server/src/apis/special-drug-claim/special-drug-claim.service.ts`

มี compatibility logic เพื่อให้รันได้ในหลาย schema:
1. `hasColumn(table, column)`  
   - เช็คว่า `special_drug_claims` มี `visit_id` ไหม
2. `spHasParameter(proc, param)`  
   - เช็คว่า `sp_SC_01_Create` มี `@VisitId` ไหม

ผลลัพธ์:
- `getClaims/getClaimById` จะ fallback `visit_id = null` ได้ถ้าคอลัมน์ไม่มี
- `createClaim` จะส่ง `VisitId` เฉพาะตอน SP รองรับพารามิเตอร์นี้

### 4.3 API Contract ปัจจุบัน

1. `GET /special-drug-claim`
   - return claim headers list

2. `GET /special-drug-claim/:claimId`
   - return
     - `header`
     - `items`
     - `movement_summary` (withdraw/return ต่อ item)

3. `POST /special-drug-claim`
   - body:
   ```json
   {
     "visit_id": 123,
     "claim_datetime": "2026-01-01T10:00:00",
     "reason": "optional",
     "items": [
       { "item_id": 1, "qty_base": 10, "base_unit_id": 7 }
     ]
   }
   ```

4. `PUT /special-drug-claim/:claimId`
   - body:
   ```json
   {
     "claim_datetime": "2026-01-01T10:00:00",
     "reason": "แก้เหตุผล",
     "adjustments": [
       { "claim_item_id": 1, "new_qty_issued_base": 12 }
     ]
   }
   ```

5. `POST /special-drug-claim/return`
   - body:
   ```json
   {
     "claim_item_id": 1,
     "qty_return_base": 4,
     "return_datetime": "2026-01-01T12:00:00",
     "reason": "คืนยา"
   }
   ```

---

## 5) Frontend ที่ทำแล้ว

### 5.1 ไฟล์ที่เพิ่ม
1. `client/src/interfaces/special-drug-claim.interfaces.ts`
2. `client/src/services/special-drug-claim.service.ts`
3. `client/src/views/pages/SpecialDrugClaim.vue`

### 5.2 ไฟล์ที่แก้
1. `client/src/router/index.ts`
   - route:
   - `path: 'special-medicine-request'`
   - `component: () => import('@/views/pages/SpecialDrugClaim.vue')`

### 5.3 ความสามารถในหน้า `SpecialDrugClaim.vue`
1. แสดงรายการ claim ทั้งหมด (DataTable + search)
2. สร้าง claim ใหม่
   - ดึง stock จาก `StockService.getStockStatus()`
   - เลือก item + qty
   - validate ฝั่งหน้า (qty > 0, ไม่เกิน stock ปัจจุบัน)
3. ดูรายละเอียด claim
   - แสดง header + items
   - แสดงคงเหลือคืนได้จาก `movement_summary`
4. คืนยาแบบรายบรรทัด (`claim_item_id`)

### 5.4 สิ่งที่ยังไม่ทำในหน้า
1. หน้าฟอร์ม/ปุ่มแก้ไข claim (เรียก `PUT /special-drug-claim/:claimId`) ยังไม่ถูกเปิดใช้งานใน UI

---

## 6) SQL Test Script ที่ทำแล้ว

ไฟล์: `PRD/03_test_special_drug_claim_sps.sql`

เนื้อหา:
1. pre-check table/SP
2. test create
3. test update (เพิ่ม qty)
4. test return
5. test expected errors:
   - over return
   - update after return

จุดที่เคยแก้เพราะ parser บางเครื่อง:
1. เลี่ยง syntax ที่บาง environment error (`DATEADD(MINUTE/mi)` ใน script test)
2. ใช้ alias `test_checkpoint` แทนคำที่ชน parser
3. script รองรับทั้งกรณี SP มี/ไม่มี `@VisitId`

---

## 7) Known Risks / จุดที่ AI ตัวถัดไปต้องระวัง

1. **Schema mismatch ระหว่าง environment**
   - บาง DB อาจไม่มี `visit_id` ใน `special_drug_claims`
   - บาง SP อาจมี/ไม่มี `@VisitId`
   - backend รองรับไว้แล้ว แต่ถ้าแก้ SP ใหม่ต้องรักษาความเข้ากันได้

2. **movement_type ต้องเป็น WITHDRAW/RETURN**
   - ห้ามเผลอเปลี่ยนเป็น type ใหม่ใน logic ปัจจุบัน

3. **return cap และ lock-after-return เป็น business rule สำคัญ**
   - ห้ามทำ UI/logic ที่ bypass rule นี้

4. **immutable movement log**
   - ห้ามแก้ย้อนหลัง movement เก่า ให้ใช้ compensating movement เท่านั้น

---

## 8) งานแนะนำให้ทำต่อทันที (ลำดับทำงาน)

1. ทำ UI edit claim ใน `SpecialDrugClaim.vue`
   - ปุ่ม edit ที่ claim detail
   - ฟอร์มปรับ `new_qty_issued_base` ต่อ `claim_item_id`
   - เรียก `SpecialDrugClaimService.updateClaim(...)`
   - แสดงผล delta หลังแก้ไข

2. เพิ่ม UX guard ฝั่งหน้า
   - ถ้า item คงเหลือคืนได้ = 0 ให้ disable ปุ่มคืนยา (ตอนนี้มีแล้ว)
   - เพิ่มข้อความชัดเจนกรณีถูก lock-after-return

3. ทดสอบจริงครบ flow
   - create -> update -> return -> verify stock/movements
   - update หลัง return ต้อง error ตาม design

4. ถ้าต้องรองรับ DB ที่ไม่มี visit ถาวร
   - พิจารณาแก้ `sp_SC_01_Create` ให้ `@VisitId` เป็น optional version เดียวกับ backend compatibility

---

## 9) คำสั่งที่ควรรันเมื่อทำงานต่อ

### Server
```bash
cd server
pnpm build
pnpm dev
```

### Client
```bash
cd client
pnpm build
pnpm dev
```

---

## 10) File Map (รวบยอด)

**SQL / PRD**
1. `PRD/sp_SC_01_Create.sql`
2. `PRD/sp_SC_02_Return.sql`
3. `PRD/sp_SC_03_Update.sql`
4. `PRD/03_test_special_drug_claim_sps.sql`
5. `PRD/special_drug_claim_step2.md` (ไฟล์นี้)

**Backend**
1. `server/src/apis/special-drug-claim/special-drug-claim.interface.ts`
2. `server/src/apis/special-drug-claim/special-drug-claim.service.ts`
3. `server/src/apis/special-drug-claim/special-drug-claim.controller.ts`
4. `server/src/apis/special-drug-claim/special-drug-claim.module.ts`
5. `server/src/app.module.ts` (register module)

**Frontend**
1. `client/src/interfaces/special-drug-claim.interfaces.ts`
2. `client/src/services/special-drug-claim.service.ts`
3. `client/src/views/pages/SpecialDrugClaim.vue`
4. `client/src/router/index.ts` (route `special-medicine-request`)

---

## 11) TL;DR สำหรับ AI ตัวถัดไป

1. Backend + Frontend flow หลักใช้งานได้แล้ว (list/create/detail/return)
2. เหลือหลัก ๆ คือ **UI edit claim** ให้เรียก `sp_SC_03_Update` ผ่าน API `PUT /special-drug-claim/:claimId`
3. อย่าทำลาย rule สำคัญ:
   - WITHDRAW/RETURN only
   - immutable stock movement
   - lock-after-return
   - return ห้ามเกินยอดคงเหลือ
