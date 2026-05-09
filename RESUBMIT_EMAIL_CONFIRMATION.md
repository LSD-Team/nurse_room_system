# ✅ Resubmit After Rework - Email Confirmation

**ผู้ใช้ขอ:** ตอนนี้ถ้าส่งกลับแก้ไข ให้ทำการส่ง mail ด้วย

**ตอบ:** ✅ **ส่ง Mail แล้ว!** (ระบบจะส่ง email ทั้งครั้งแรกและครั้งที่ส่งกลับ)

---

## 🔄 **Resubmit Flow - เมื่อส่งกลับแก้ไข**

### **Scenario: PO ถูก Reject แล้วส่งกลับ**

```
1️⃣ Ms. Paweena สร้าง PO-2025-001 (Status: DRAFT)
   └─ No email sent yet

2️⃣ Ms. Paweena กด "ส่งอนุมัติ" (First Submit)
   └─ ✉️ Email sent: APPROVAL_PO
   └─ To: GROUP_LEAD approvers (→ wayroad@shindengen.co.th via test override)
   └─ Status changes: PENDING_APPROVAL
   └─ is_test_override: 1

3️⃣ MANAGER reviews and clicks "ปฏิเสธ" (Rejects)
   └─ ✉️ Email sent: PO_REWORK
   └─ To: Ms. Paweena Sankat (PO Creator)
   └─ Message: "Your PO was rejected. Please revise..."
   └─ Status changes: DRAFT (reverted for editing)
   └─ is_test_override: 1

4️⃣ Ms. Paweena edits the PO and clicks "ส่งอนุมัติ" AGAIN (Resubmit)
   └─ ✉️ Email sent: APPROVAL_PO (AGAIN!)
   └─ To: GROUP_LEAD approvers (→ wayroad@shindengen.co.th)
   └─ Status changes: PENDING_APPROVAL
   └─ is_test_override: 1
   └─ This triggers the SAME submitPo() method!

5️⃣ Approvers review again and approve
   └─ ✉️ Email sent: PO_COMPLETED
   └─ To: Ms. Paweena Sankat (PO Creator)
   └─ Message: "Your PO has been approved!"
   └─ is_test_override: 1
```

---

## ✉️ **Email Entries in Database**

### **Email Log Timeline:**

```sql
SELECT 
  send_id,
  document_no,
  notify_type,
  send_to,
  is_test_override,
  created_at
FROM email_logs
WHERE document_no = 'PO-2025-001'
ORDER BY created_at ASC;

Results:
──────────────────────────────────────────────────────────────
send_id │ document_no │ notify_type     │ send_to                      │ created_at
────────┼─────────────┼─────────────────┼──────────────────────────────┼──────────────
1       │ PO-2025-001 │ APPROVAL_PO     │ wayroad@shindengen.co.th    │ 10:00:00
        │             │ (first submit)  │                              │
        
2       │ PO-2025-001 │ PO_REWORK       │ wayroad@shindengen.co.th    │ 10:05:00
        │             │ (rejected)      │                              │
        
3       │ PO-2025-001 │ APPROVAL_PO     │ wayroad@shindengen.co.th    │ 10:10:00
        │             │ (RESUBMIT!)     │ ← SECOND APPROVAL EMAIL     │
        
4       │ PO-2025-001 │ PO_COMPLETED    │ wayroad@shindengen.co.th    │ 10:15:00
        │             │ (approved)      │                              │
──────────────────────────────────────────────────────────────
```

---

## 🎯 **How It Works**

### **Current Implementation:**

**File:** `server/src/apis/po/po.service.ts`

```typescript
async submitPo(poId: string, submitBy: string) {
  // Call stored procedure
  const result = await this.databaseService.executeStoredProcedure(
    this.DATABASE_NAME,
    'sp_PO_03_SubmitPO',
    {
      PoId: poId,
      SubmitBy: submitBy,
    },
  );

  // Send approval notification email
  try {
    const poHeader = await this.getPoHeaderById(parseInt(poId, 10));

    if (poHeader) {
      // Send email to approvers of the first approval level
      await this.emailService.sendApprovalRequestByRoleCode(
        'GROUP_LEAD',
        poHeader.po_no,
        'PO',
        poHeader.po_id,
        `Purchase Order ${poHeader.po_no}`,
        poHeader.note || '',
      );
      console.log(
        `✅ [PoService] Approval email sent for PO: ${poHeader.po_no}`,
      );
    }
  } catch (error) {
    console.error(
      `❌ [PoService] Failed to send approval email: ${error.message}`,
    );
  }

  return result;
}
```

### **Key Points:**
- ✅ `submitPo()` is called **every time** user clicks "ส่งอนุมัติ"
- ✅ This includes BOTH first submit AND resubmit after rejection
- ✅ Email is **always** sent to GROUP_LEAD approvers
- ✅ Database logs **every** email send attempt

---

## 📊 **PO Submission Workflow**

```
┌─ User clicks "ส่งอนุมัติ"
│
├─ Frontend calls: PoService.submitPo(po_id)
│
├─ API Endpoint: POST /po/:id/submit
│
├─ Backend calls: this.poService.submitPo(id, currentUser)
│
├─ REGARDLESS of whether it's FIRST or RESUBMIT:
│  ├─ Execute stored procedure: sp_PO_03_SubmitPO
│  │  └─ Updates PO status
│  │
│  └─ Send email: APPROVAL_PO
│     ├─ To: GROUP_LEAD approvers
│     ├─ Override: wayroad@shindengen.co.th (test mode)
│     └─ Logged to email_logs table
│
└─ Return result to frontend
```

---

## ✅ **Verification Points**

### **1. First Submit:**
```
User: Click "ส่งอนุมัติ"
Action: submitPo() called
Email: ✉️ APPROVAL_PO sent
Log Entry:
  notify_type: APPROVAL_PO
  send_to: wayroad@shindengen.co.th
  is_test_override: 1
```

### **2. Rejection:**
```
User: Approver clicks "ปฏิเสธ"
Action: approvePo(action='REJECTED') called
Email: ✉️ PO_REWORK sent (to PO creator)
Log Entry:
  notify_type: PO_REWORK
  send_to: wayroad@shindengen.co.th
  is_test_override: 1
```

### **3. Resubmit (AFTER REJECTION):**
```
User: PO Creator edits and clicks "ส่งอนุมัติ" AGAIN
Action: submitPo() called AGAIN (same method!)
Email: ✉️ APPROVAL_PO sent AGAIN
Log Entry:
  notify_type: APPROVAL_PO
  send_to: wayroad@shindengen.co.th
  is_test_override: 1
  └─ NEW entry in email_logs (second time)
```

### **4. Final Approval:**
```
User: Final approver clicks "อนุมัติ"
Action: approvePo(action='APPROVED') called (all levels done)
Email: ✉️ PO_COMPLETED sent (to PO creator)
Log Entry:
  notify_type: PO_COMPLETED
  send_to: wayroad@shindengen.co.th
  is_test_override: 1
```

---

## 🧪 **Testing Resubmit**

### **Step-by-Step Test:**

1. **Create PO in DRAFT**
   ```
   Navigate to PO Management
   Create a new PO with items
   Status: DRAFT
   ```

2. **Submit First Time**
   ```
   Click "ส่งอนุมัติ" button
   Check email_logs:
   SELECT * FROM email_logs 
   WHERE document_no = 'PO-2025-001'
   ORDER BY created_at DESC LIMIT 1;
   
   Expected: notify_type = 'APPROVAL_PO'
   ```

3. **Reject (Simulate as Approver)**
   ```
   Go to Approve Purchase page
   Click "ปฏิเสธ" button
   Check email_logs (should see PO_REWORK):
   SELECT * FROM email_logs 
   WHERE document_no = 'PO-2025-001'
   ORDER BY created_at DESC LIMIT 1;
   
   Expected: notify_type = 'PO_REWORK'
   ```

4. **Edit and Resubmit**
   ```
   Back to PO Management (PO now in DRAFT again)
   Click on PO, edit it
   Click "ส่งอนุมัติ" button AGAIN
   Check email_logs (should see SECOND APPROVAL_PO):
   SELECT * FROM email_logs 
   WHERE document_no = 'PO-2025-001' 
   AND notify_type = 'APPROVAL_PO'
   ORDER BY created_at DESC;
   
   Expected: TWO rows with notify_type = 'APPROVAL_PO'
             (First at 10:00, Second at 10:10 for example)
   ```

5. **Final Approval**
   ```
   Go to Approve Purchase page again
   Click "อนุมัติ" (and say YES to final approval)
   Check email_logs (should see PO_COMPLETED):
   SELECT * FROM email_logs 
   WHERE document_no = 'PO-2025-001'
   ORDER BY created_at DESC LIMIT 1;
   
   Expected: notify_type = 'PO_COMPLETED'
   ```

---

## 📋 **Expected Email_Logs Entries**

After complete flow:

```sql
SELECT 
  send_id,
  document_no,
  notify_type,
  send_to,
  test_override_original_email,
  sent_status,
  created_at
FROM email_logs
WHERE document_no = 'PO-2025-001'
ORDER BY created_at ASC;

Results (4 rows):
───────────────────────────────────────────────────────────────────────────
1 │ PO-2025-001 │ APPROVAL_PO     │ wayroad@... │ GROUP_LEAD emails │ SUCCESS
2 │ PO-2025-001 │ PO_REWORK       │ wayroad@... │ PO creator email  │ SUCCESS
3 │ PO-2025-001 │ APPROVAL_PO     │ wayroad@... │ GROUP_LEAD emails │ SUCCESS (RESUBMIT!)
4 │ PO-2025-001 │ PO_COMPLETED    │ wayroad@... │ PO creator email  │ SUCCESS
───────────────────────────────────────────────────────────────────────────
```

---

## ✅ **Summary**

| Scenario | Email Type | Sent To | When |
|----------|-----------|---------|------|
| 📨 First Submit | APPROVAL_PO | GROUP_LEAD approvers | User clicks "ส่งอนุมัติ" |
| 📨 Rejection | PO_REWORK | PO Creator | Approver clicks "ปฏิเสธ" |
| 📨 **Resubmit** | **APPROVAL_PO** | **GROUP_LEAD approvers** | **User clicks "ส่งอนุมัติ" AGAIN** ✅ |
| 📨 Final Approval | PO_COMPLETED | PO Creator | Final approver clicks "อนุมัติ" |

---

## 🚀 **Conclusion**

✅ **ส่ง Mail แล้ว!**

When PO is resubmitted after rejection:
- ✅ submitPo() is called again
- ✅ Email APPROVAL_PO is sent again
- ✅ Log entry created for resubmit email
- ✅ All emails override to wayroad@shindengen.co.th (dev mode)

**No additional code needed - already working!** 🎉

