# 📮 PO Approval Page - Email Flow

**Page:** Approve Purchase (ยืนยัน PO)  
**PO Number:** PO202605-012  
**Created By:** Ch.CHAROEN (Ms. Paweena Sankat)  
**Status:** PENDING APPROVAL

---

## 🎯 Email Sending Logic - ที่จะส่ง Mail ไปหาผู้สร้าง

เมื่อคลิกปุ่มต่างๆ ในหน้า Approve Purchase:

---

## ✅ Button 1: **อนุมัติ** (Approve) - GREEN

```
User clicks: ✅ อนุมัติ
        ↓
Trigger: approvePo(action='APPROVED')
        ↓
Logic:
  1. Check if this is FINAL approval (no more PENDING approvals)
  2. If YES (final):
     └─ Send email: PO_COMPLETED
        TO: PO Creator (Ch.CHAROEN / Ms. Paweena Sankat)
        MESSAGE: "Your PO has been fully approved and is ready for ordering"
        
  3. If NO (more levels pending):
     └─ No email sent (wait for final approval)
```

### **Email Details:**
```
To: Ms. Paweena Sankat (PO creator)
Email Address: (from view_email where employee_id = created_by)
Subject: [Nurse Room System] PO202605-012 : Approved - PO
Type: PO_COMPLETED
Status: is_test_override=1 → wayroad@shindengen.co.th ✅
```

### **Email Log Entry:**
```sql
INSERT INTO email_logs (
  document_type: 'PO',
  document_no: 'PO202605-012',
  notify_type: 'PO_COMPLETED',
  send_to: 'wayroad@shindengen.co.th',  ← Test override
  is_test_override: 1,
  test_override_original_email: 'Ms.Paweena.Sankat@company.com',
  sent_status: 'SUCCESS'
)
```

---

## ❌ Button 2: **ปฏิเสธ** (Reject) - RED

```
User clicks: ❌ ปฏิเสธ
        ↓
Trigger: approvePo(action='REJECTED')
        ↓
Email Sent: ALWAYS (no matter which approval level)
        ↓
Send email: PO_REWORK
TO: PO Creator (Ch.CHAROEN / Ms. Paweena Sankat)
MESSAGE: "Your PO was rejected. Please revise and resubmit."
         + Rejection remark (if provided)
```

### **Email Details:**
```
To: Ms. Paweena Sankat (PO creator)
Subject: [Nurse Room System] PO202605-012 : Rework Required - PO
Type: PO_REWORK
Status: is_test_override=1 → wayroad@shindengen.co.th ✅
```

### **Email Log Entry:**
```sql
INSERT INTO email_logs (
  document_type: 'PO',
  document_no: 'PO202605-012',
  notify_type: 'PO_REWORK',
  send_to: 'wayroad@shindengen.co.th',  ← Test override
  is_test_override: 1,
  test_override_original_email: 'Ms.Paweena.Sankat@company.com',
  error_message: (if provided by approver),
  sent_status: 'SUCCESS'
)
```

---

## ⏱ Button 3: **สั่งรับต้องไป** (Receiving) - ORANGE

```
This button is for different workflow (Goods Receipt)
- NOT related to approval emails
- Used when PO is ready to receive goods
- No email sent from approval process
```

---

## 🔄 Full Approval Flow (3 Levels)

### **Current Scenario:**
```
Level 1: GROUP_LEADER   - PENDING
Level 2: MANAGER        - PENDING
Level 3: DEPARTMENT     - PENDING
```

### **Scenario A: Approve at Level 1**
```
Level 1 Approver clicks: ✅ อนุมัติ
        ↓
Check: Are Level 2 & 3 still PENDING? YES
        ↓
Result: No email sent yet (wait for others)
```

### **Scenario B: Approve at Level 2**
```
Level 2 Approver clicks: ✅ อนุมัติ
        ↓
Check: Are Level 3 still PENDING? YES
        ↓
Result: No email sent yet (wait for Level 3)
```

### **Scenario C: Approve at Level 3 (FINAL)**
```
Level 3 Approver clicks: ✅ อนุมัติ
        ↓
Check: Are there any more PENDING? NO
        ↓
Result: ✉️ Send PO_COMPLETED email to Ms. Paweena Sankat
```

### **Scenario D: Reject at ANY Level**
```
Any Level Approver clicks: ❌ ปฏิเสธ
        ↓
Result: ✉️ Send PO_REWORK email to Ms. Paweena Sankat (IMMEDIATELY)
        ↓
PO Status: Changes back to DRAFT
        ↓
Ms. Paweena must revise and resubmit
```

---

## 📊 Approval Status Table (from screenshot)

```
Level    Role           Status       Action
────────────────────────────────────────────
1        GROUP_LEADER   PENDING      Waiting for approval
2        MANAGER        PENDING      Waiting for approval
3        DEPARTMENT     PENDING      Waiting for approval
```

### **How Email Tracking Works:**

```sql
-- Check pending approvals for this PO
SELECT * FROM po_approvals 
WHERE po_id = (SELECT po_id FROM po_headers WHERE po_no = 'PO202605-012')
ORDER BY approval_level;

Results:
┌───────────────────────────────────────────┐
│ approval_level │ approval_role │ status  │
├───────────────────────────────────────────┤
│ 1              │ GROUP_LEADER  │ PENDING │
│ 2              │ MANAGER       │ PENDING │
│ 3              │ DEPARTMENT    │ PENDING │
└───────────────────────────────────────────┘

-- After Level 1 approves:
│ 1              │ GROUP_LEADER  │ APPROVED│
│ 2              │ MANAGER       │ PENDING │ ← Still pending = No email yet
│ 3              │ DEPARTMENT    │ PENDING │

-- After Level 2 approves:
│ 1              │ GROUP_LEADER  │ APPROVED│
│ 2              │ MANAGER       │ APPROVED│
│ 3              │ DEPARTMENT    │ PENDING │ ← Still pending = No email yet

-- After Level 3 approves (FINAL):
│ 1              │ GROUP_LEADER  │ APPROVED│
│ 2              │ MANAGER       │ APPROVED│
│ 3              │ DEPARTMENT    │ APPROVED│ ← NO MORE PENDING = SEND EMAIL!
```

---

## ✉️ Email Recipients - ผู้รับ Email

### **ในทุกกรณี:**
```
TO: Ms. Paweena Sankat (PO Creator - Ch.CHAROEN)
    Email: wayroad@shindengen.co.th (test override) ✅

CC: (empty)

BCC: (empty)
```

### **Test Override Tracking:**
```
send_to: wayroad@shindengen.co.th
test_override_original_email: Ms.Paweena.Sankat@company.com (saved for reference)
is_test_override: 1
```

---

## 🧪 Testing This Flow

### **Step 1: Click "ส่งอนุมัติ" on PO (First Time - Submits for Approval)**
```
PO Status changes: DRAFT → PENDING_APPROVAL
Email sent: ✉️ APPROVAL_PO
TO: GROUP_LEADER approvers
is_test_override: 1 → wayroad@shindengen.co.th
```

### **Step 2: GROUP_LEADER Approver clicks "อนุมัติ"**
```
Level 1 status: APPROVED
Check: Levels 2,3 still PENDING? YES
Result: ❌ NO email sent (wait for other levels)
```

### **Step 3: MANAGER Approver clicks "อนุมัติ"**
```
Level 2 status: APPROVED
Check: Level 3 still PENDING? YES
Result: ❌ NO email sent (wait for final level)
```

### **Step 4: DEPARTMENT Approver clicks "อนุมัติ"**
```
Level 3 status: APPROVED
Check: Any PENDING left? NO
Result: ✅ SEND EMAIL PO_COMPLETED to Ms. Paweena Sankat
email_logs:
  notify_type: 'PO_COMPLETED'
  send_to: 'wayroad@shindengen.co.th'
  is_test_override: 1
  sent_status: 'SUCCESS'
```

---

## ❌ Alternative: Rejection Flow

### **ANY Level Approver clicks "ปฏิเสธ" at ANY time**
```
Immediately send email: ✉️ PO_REWORK
TO: Ms. Paweena Sankat (PO Creator)
MESSAGE: "Your PO was rejected. Please revise."
is_test_override: 1 → wayroad@shindengen.co.th

PO Status: Reverts to DRAFT
Ms. Paweena must fix and resubmit
```

---

## 📋 Database Queries to Verify

### **Query 1: Check Pending Approvals**
```sql
SELECT * FROM po_approvals 
WHERE po_no = 'PO202605-012'
ORDER BY approval_level;
```

### **Query 2: Check Email Log Entries**
```sql
SELECT 
  send_id,
  document_no,
  notify_type,
  send_to,
  is_test_override,
  test_override_original_email,
  sent_status,
  created_at
FROM email_logs
WHERE document_no = 'PO202605-012'
ORDER BY created_at DESC;
```

### **Query 3: Verify PO Creator**
```sql
SELECT 
  h.po_no,
  h.created_by,
  e.eng_name,
  e.email
FROM po_headers h
JOIN view_email e ON h.created_by = e.employee_id
WHERE h.po_no = 'PO202605-012';
```

---

## ✅ Implementation Status

| Feature | Status | Location |
|---------|--------|----------|
| Send APPROVAL_PO to GROUP_LEAD | ✅ | po.service.ts:submitPo() |
| Send PO_REWORK to Creator | ✅ | po.service.ts:approvePo() |
| Send PO_COMPLETED to Creator (final only) | ✅ | po.service.ts:approvePo() |
| Test Override (TEST_EMAIL_OVERRIDE) | ✅ | .env.development |
| Email Logging | ✅ | email-log.service.ts |
| Approval Level Checking | ✅ | po.service.ts:getPendingApprovals() |

---

## 🚀 Current Status

✅ ทุกอย่างพร้อมแล้ว!

เมื่อคลิกปุ่ม:
- **✅ อนุมัติ** (เมื่อเป็นการอนุมัติสุดท้าย) → Email ไปหาผู้สร้าง
- **❌ ปฏิเสธ** (ทุกระดับ) → Email ไปหาผู้สร้าง
- **⏱ สั่งรับต้องไป** → ไม่ส่ง email (workflow อื่น)

ทั้งหมดส่งไป: **wayroad@shindengen.co.th** (test override) ✉️

