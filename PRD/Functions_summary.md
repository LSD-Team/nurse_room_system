# ฟังก์ชัน (Stored Procedures)

ไฟล์นี้แปลงจาก Functions.md (SQL) ให้อยู่ในรูปแบบ Markdown เพื่อให้อ่านง่ายและค้นหาได้สะดวก

---

## รายการ Stored Procedures

### 1. sp_UpsertSupplier
- **คำอธิบาย:** เพิ่มหรืออัปเดตข้อมูล Supplier
- **Parameter:**
    - @SupplierId, @SupplierName, @ContactName, @Phone, @Email, @Address, @TaxId, @IsActive, @Note, @CreatedBy
- **Logic:**
    - ถ้ามี @SupplierId จะเป็นโหมด UPDATE (อัปเดตเฉพาะ field ที่ส่งมา)
    - ถ้าไม่มี @SupplierId จะเป็นโหมด INSERT (สร้างใหม่, SupplierName บังคับ)
    - Normalize ค่าที่รับเข้ามา (แปลง '' เป็น NULL)
    - แปลงค่า @IsActive เป็น BIT
    - ตรวจสอบความถูกต้องของข้อมูลก่อนดำเนินการ

---

### 2. sp_GetSupplier
- **คำอธิบาย:** ดึงข้อมูล Supplier ตามเงื่อนไข
- **Parameter:**
    - @SupplierId, @SupplierCode, @IsActive
- **Logic:**
    - สามารถค้นหาด้วย id, code หรือสถานะ
    - ใช้ NULLIF และ ISNULL เพื่อจัดการค่า parameter

---

### 3. sp_GRCancel
- **คำอธิบาย:** ยกเลิก GR (Goods Receipt)
- **Parameter:**
    - @GrId, @CancelledBy, @Reason
- **Logic:**
    - ตรวจสอบสถานะ GR ต้องเป็น DRAFT เท่านั้น
    - อัปเดตสถานะเป็น CANCELLED และบันทึกเหตุผล

---

### 4. sp_PO_03_SubmitPO
- **คำอธิบาย:** ส่ง PO (Purchase Order) เพื่อขออนุมัติ
- **Parameter:**
    - @PoId, @SubmitBy
- **Logic:**
    - ตรวจสอบ PO ต้องเป็น DRAFT และมีรายการสินค้า
    - อัปเดตสถานะเป็น PENDING_APPROVAL
    - สร้างรายการ approval ตามลำดับ

---

### 5. sp_PO_04_ApprovePO
- **คำอธิบาย:** อนุมัติ/ปฏิเสธ PO ตามลำดับ
- **Parameter:**
    - @PoId, @Action, @ActionedBy, @Remark
- **Logic:**
    - ตรวจสอบสิทธิ์และลำดับการอนุมัติ
    - อัปเดตสถานะ PO และ approval row
    - แจ้งเตือนผ่าน email ตามลำดับ

---

### 6. sp_POCancel
- **คำอธิบาย:** ยกเลิก PO
- **Parameter:**
    - @PoId, @CancelledBy, @Reason
- **Logic:**
    - ยกเลิกได้ทุกสถานะยกเว้น CLOSED และ CANCELLED
    - อัปเดตสถานะและยกเลิก approval ที่ยัง pending

---

### 7. sp_PO_02_GetPO
- **คำอธิบาย:** ดึงข้อมูล PO และรายละเอียด
- **Parameter:**
    - @PoId, @PoNo, @Status
- **Logic:**
    - ดึง header, lines, approval history

---

### 8. sp_Snapshot_03_GetSnapshotByPeriodCode
- **คำอธิบาย:** ดึง snapshot สต็อกตาม period code
- **Parameter:**
    - @PeriodCode
- **Logic:**
    - ตรวจสอบ period code และดึงข้อมูล snapshot

---

### 9. sp_POGetPendingReceive
- **คำอธิบาย:** ดึง PO ที่ยังไม่ได้รับของครบ
- **Parameter:**
    - @PoId
- **Logic:**
    - แสดงรายการที่ยังเหลือรับ

---

### 10. sp_PP_01_GetOrCreatePatientProfile
- **คำอธิบาย:** สร้างหรือดึง patient profile
- **Parameter:**
    - @PatientType, @EmployeeId, @ExternalPersonId, @CreatedBy
- **Logic:**
    - ตรวจสอบประเภทและสร้าง profile ถ้ายังไม่มี

---

### 11. sp_PP_02_UpsertPatientAllergy
- **คำอธิบาย:** เพิ่ม/แก้ไขข้อมูลแพ้ยา/อาหาร
- **Parameter:**
    - @AllergyId, @PatientId, @AllergyType, @AllergyName, @ItemId, @Reaction, @Severity, @Source, @NotedAt, @NotedBy, @IsActive
- **Logic:**
    - ตรวจสอบสถานะผู้ป่วย (soft-delete)
    - Insert หรือ Update ข้อมูลแพ้ยา

---

### 12. sp_BR_01_Create
- **คำอธิบาย:** สร้าง Borrow Request
- **Parameter:**
    - @JsonLines, @SupplierId, @Note, @CreatedBy
- **Logic:**
    - ตรวจสอบ JSON, supplier, และรายการสินค้า
    - สร้าง borrow header/lines

---

### 13. sp_BR_02_Update
- **คำอธิบาย:** แก้ไข Borrow Request
- **Parameter:**
    - @BorrowId, @JsonLines, @Note, @UpdatedBy
- **Logic:**
    - แก้ไขได้เฉพาะสถานะ DRAFT
    - อัปเดต header/lines

---

### 14. sp_BR_03_Submit
- **คำอธิบาย:** ส่ง Borrow เพื่อขออนุมัติ
- **Parameter:**
    - @BorrowId, @SubmitBy
- **Logic:**
    - อัปเดตสถานะและสร้าง approval

---

### 15. sp_BR_04_Approve
- **คำอธิบาย:** อนุมัติ/ปฏิเสธ/ส่งกลับแก้ไข Borrow
- **Parameter:**
    - @BorrowId, @Action, @ActionedBy, @Remark
- **Logic:**
    - ตรวจสอบสิทธิ์และลำดับการอนุมัติ
    - อัปเดตสถานะและ approval row
    - แจ้งเตือนผ่าน email

---

### 16. sp_BR_05_Receive
- **คำอธิบาย:** รับยาเข้าสต็อกจาก Borrow
- **Parameter:**
    - @BorrowId, @ReceivedBy
- **Logic:**
    - อัปเดต stock และสถานะ

---

### 17. sp_ExP_02_soft_delete_external_person
- **คำอธิบาย:** Soft delete/restore external person
- **Parameter:**
    - @external_person_id
- **Logic:**
    - Toggle is_deleted และบันทึกเวลา

---

### 18. sp_BR_06_GetPending
- **คำอธิบาย:** สรุป Borrow ที่รับของแล้ว (RECEIVED)
- **Parameter:**
    - @SupplierId (optional)
- **Logic:**
    - สรุปยอดและแสดงรายละเอียดแต่ละ BR

---

### 19. sp_BR_07_Cancel
- **คำอธิบาย:** ยกเลิก Borrow (DRAFT/PENDING_APPROVAL)
- **Parameter:**
    - @BorrowId, @CancelledBy, @Reason
- **Logic:**
    - อัปเดตสถานะและยกเลิก approval ที่ยัง pending

---

### 20. sp_ExP_01_upsert_external_person
- **คำอธิบาย:** เพิ่ม/แก้ไขข้อมูลบุคคลภายนอก
- **Parameter:**
    - @external_person_id, @full_name, @company, @national_id, @passport_no, @phone
- **Logic:**
    - Insert หรือ Update ข้อมูล external person

---

### 21. sp_AddStockMovementFromJson
- **คำอธิบาย:** เพิ่ม movement สินค้าจาก JSON
- **Parameter:**
    - @JsonData, @MovementType, @RefType, @RefId, @CreatedBy, @MovementDate
- **Logic:**
    - ตรวจสอบ JSON, ประเภท movement, และรายการสินค้า
    - อัปเดต stock และบันทึก movement

---

### 22. sp_SyncPhysicalStock
- **คำอธิบาย:** ปรับยอด stock ตามการนับจริง
- **Parameter:**
    - @JsonData, @RefId, @CreatedBy, @Reason
- **Logic:**
    - ใช้ OPENJSON ดึงข้อมูลและปรับยอด stock

---

> หมายเหตุ: รายละเอียดโค้ด SQL เต็มสามารถดูได้ในไฟล์ Functions.md เดิม
