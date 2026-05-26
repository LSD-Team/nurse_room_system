# Special Drug Claim – Nurse Room Stock Design Specification

## 1. Purpose & Context
`special_drug_claim` คือกลไกสำหรับการเบิกยาในกรณีพิเศษภายใน Nurse Room  
ซึ่งเกิดจากข้อจำกัดเชิงเวลา (เช่น วันหยุด, นอกเวลาทำการ)  
โดย **ไม่มีขั้นตอนการ approve ในระบบ** และมีผลต่อ stock จริงทันที

ระบบนี้เป็นส่วนขยายของ Treatment Record  
แต่ถูกแยกออกมาเพื่อไม่ปะปนกับ Medical Record Logic

---

## 2. Core Concept
- Special Drug Claim เป็น **transaction ด้าน stock**
- ทุกการเบิกและคืนยา ต้องถูกบันทึกเป็น stock movement
- `stock_movements` เป็น immutable log (insert only)
- `stock_on_hand` คือผลรวมเชิงปัจจุบันของ movement ทั้งหมด

> ห้าม update หรือ delete movement เดิม  
> การคืนยา = movement ใหม่ (RETURN)

---

## 3. Business Rules (Key Assumptions)

### 3.1 Claim Rules
- 1 special_drug_claim ผูกกับ 1 treatment_id
- 1 claim สามารถมีหลายรายการยาได้
- ไม่มี approval workflow
- เมื่อ claim ถูกสร้าง → stock ถูกตัดทันที

### 3.2 Return Rules
- คืนยาได้ “บางส่วน”
- คืนยาได้ “หลายครั้ง”
- การคืนต้องอ้างอิง claim เดิมเสมอ
- จำนวนคืนรวม ห้ามเกินจำนวนที่เบิก

ตัวอย่าง:
- เบิก 10 เม็ด (วันเสาร์)
- คืน 5 เม็ด (วันจันทร์)
- stock_on_hand ต้อง +5

---

## 4. Database Design Overview

### 4.1 special_drug_claims
เก็บ header ของการเบิกยาพิเศษ

Fields:
- claim_id (PK)
- treatment_id (FK)
- claim_datetime
- remark / reason
- created_by
- created_at

---

### 4.2 special_drug_claim_items
เก็บรายการยาที่เบิก

Fields:
- claim_item_id (PK)
- claim_id (FK)
- drug_id
- quantity_issued
- base_unit
- created_at

---

### 4.3 stock_movements
ใช้เป็น audit log ของ stock ทั้งระบบ

Fields:
- movement_id (PK)
- drug_id
- movement_type  
  - ISSUE_SPECIAL
  - RETURN_SPECIAL
- ref_type = 'SPECIAL_DRUG_CLAIM'
- ref_id = claim_id
- quantity (+ / -)
- movement_datetime
- created_by

> ISSUE = quantity ติดลบ  
> RETURN = quantity เป็นบวก

---

### 4.4 stock_on_hand
เก็บ stock ปัจจุบันต่อยา (per location ถ้ามี)

Fields:
- drug_id (PK)
- on_hand_qty
- last_updated_at

---

## 5. Stored Procedure Responsibilities

### 5.1 sp_create_special_drug_claim
Responsibilities:
1. Validate stock availability
2. Insert special_drug_claims
3. Insert special_drug_claim_items
4. Insert stock_movements (ISSUE_SPECIAL)
5. Update stock_on_hand
6. Transactional (all or nothing)

---

### 5.2 sp_return_special_drug
Responsibilities:
1. Validate claim exists
2. Validate return quantity <= remaining issued qty
3. Insert stock_movements (RETURN_SPECIAL)
4. Update stock_on_hand
5. Do NOT update original claim record

---

## 6. Important Constraints
- ห้าม update quantity ใน claim เดิม
- ห้าม delete stock_movements
- ห้ามคืนยาเกินยอดคงเหลือของ claim
- ทุก stock change ต้องมี movement record เสมอ

---

## 7. Design Philosophy
- Medical Record ≠ Stock Accounting
- Stock correctness > UI convenience
- Traceability สำคัญกว่าความง่ายในการ query
- Future-proof สำหรับ audit และ reconciliation

---

## 8. Non-Goals
- ไม่มี approval workflow
- ไม่จัดการ billing / finance
- ไม่ handle inter-location transfer

---

## 9. Example Flow (Real Case)

1. Nurse creates special drug claim
   - Drug A : 10 units
2. System creates ISSUE_SPECIAL (-10)
3. stock_on_hand = stock_on_hand - 10

Later…

4. Nurse returns Drug A : 5 units
5. System creates RETURN_SPECIAL (+5)
6. stock_on_hand = stock_on_hand + 5

Remaining issued qty = 5
