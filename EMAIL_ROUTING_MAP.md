# 📮 Email Routing Map - ส่ง Mail ไปไหนในทุกกรณี

---

## 🟢 **DEVELOPMENT MODE** (TEST_EMAIL_OVERRIDE = `wayroad@shindengen.co.th`)

### ทุกกรณี ✅ ALL EMAILS → `wayroad@shindengen.co.th`

```
┌─────────────────────────────────────────────────────────┐
│ Development Mode: TEST_EMAIL_OVERRIDE Active            │
│ (NODE_ENV=development & TEST_EMAIL_OVERRIDE env var set)│
└─────────────────────────────────────────────────────────┘

 Email Type          Email Normally Goes To    ↓    REDIRECTED TO
 ─────────────────────────────────────────────────────────────────
 APPROVAL_PO         All GROUP_LEAD approvers  →    wayroad@shindengen.co.th ✅
 APPROVAL_BORROW     All GROUP_LEAD approvers  →    wayroad@shindengen.co.th ✅
 PO_REWORK           PO Creator (created_by)  →    wayroad@shindengen.co.th ✅
 BORROW_REWORK       Borrow Creator           →    wayroad@shindengen.co.th ✅
 PO_COMPLETED        PO Creator (created_by)  →    wayroad@shindengen.co.th ✅
 BORROW_COMPLETED    Borrow Creator           →    wayroad@shindengen.co.th ✅

```

### ตัวอย่าง Development Database Log:

```sql
SELECT * FROM email_logs WHERE is_test_override = 1
ORDER BY created_at DESC;

Results:
───────────────────────────────────────────────────────────────────
send_id  document_no  notify_type       send_to                    
send_id  document_no  notify_type       test_override_original_email
───────────────────────────────────────────────────────────────────
1        PO-2025-001  APPROVAL_PO       wayroad@shindengen.co.th ← SENT HERE ✅
         (PO-2025-001) APPROVAL_PO       สมชาย.ป., สนธยา.ด.        ← ORIGINAL (saved)

2        BR-2025-010  APPROVAL_BORROW   wayroad@shindengen.co.th ← SENT HERE ✅
         (BR-2025-010) APPROVAL_BORROW  อนันต์.ว., สุจิตต์.ล.      ← ORIGINAL (saved)

3        PO-2025-001  PO_REWORK         wayroad@shindengen.co.th ← SENT HERE ✅
         (PO-2025-001) PO_REWORK        สมศักดิ์.ห.               ← ORIGINAL (saved)

4        PO-2025-001  PO_COMPLETED      wayroad@shindengen.co.th ← SENT HERE ✅
         (PO-2025-001) PO_COMPLETED     สมศักดิ์.ห.               ← ORIGINAL (saved)
───────────────────────────────────────────────────────────────────

is_test_override: 1 (ทุกแถว)
sent_status: SUCCESS (ทุกอันควรส่งสำเร็จ)
```

---

## 🔴 **PRODUCTION MODE** (TEST_EMAIL_OVERRIDE = removed/commented)

### ส่ง Mail ไปให้ Recipients ที่เกี่ยวข้องจริงๆ

```
┌────────────────────────────────────────────────────────┐
│ Production Mode: TEST_EMAIL_OVERRIDE NOT Active        │
│ (NODE_ENV=production or TEST_EMAIL_OVERRIDE removed)   │
└────────────────────────────────────────────────────────┘

 Email Type          Lookup From                Send To
 ────────────────────────────────────────────────────────────
 APPROVAL_PO         approval_roles             All approvers with 
                     + view_email               role_code = GROUP_LEAD ✉️
                     (by po_id)                 (email from view_email)

 APPROVAL_BORROW     approval_roles             All approvers with 
                     + view_email               role_code = GROUP_LEAD ✉️
                     (by borrow_id)             (email from view_email)

 PO_REWORK           po_headers.created_by     Email of PO creator ✉️
                     + view_email               (who originally created it)

 BORROW_REWORK       borrow_headers.created_by Email of Borrow creator ✉️
                     + view_email               (who originally created it)

 PO_COMPLETED        po_headers.created_by     Email of PO creator ✉️
                     + view_email               (who originally created it)

 BORROW_COMPLETED    borrow_headers.created_by Email of Borrow creator ✉️
                     + view_email               (who originally created it)
```

### ตัวอย่าง Production Database Log:

```sql
SELECT * FROM email_logs WHERE is_test_override = 0
ORDER BY created_at DESC;

Results:
────────────────────────────────────────────────────────────────────
send_id  document_no  notify_type       send_to
────────────────────────────────────────────────────────────────────
1        PO-2025-001  APPROVAL_PO       สมชาย.ป.@company.com,
                                        สนธยา.ด.@company.com ← REAL APPROVERS ✉️

2        BR-2025-010  APPROVAL_BORROW   อนันต์.ว.@company.com,
                                        สุจิตต์.ล.@company.com ← REAL APPROVERS ✉️

3        PO-2025-001  PO_REWORK         สมศักดิ์.ห.@company.com ← PO CREATOR ✉️

4        PO-2025-001  PO_COMPLETED      สมศักดิ์.ห.@company.com ← PO CREATOR ✉️
────────────────────────────────────────────────────────────────────

is_test_override: 0 (ทุกแถว)
sent_status: SUCCESS (ส่งไปให้จริง)
test_override_original_email: NULL (ไม่ได้ override)
```

---

## 📊 **Lookup Logic ในระบบ**

### **APPROVAL_PO & APPROVAL_BORROW**
```sql
-- ระบบจะค้นหา approvers ดังนี้:
SELECT ar.approver_id, ve.email
FROM approval_roles ar
JOIN view_email ve ON ar.approver_id = ve.employee_id
WHERE ar.role_code = 'GROUP_LEAD'
  AND ar.is_active = 1
```

**ผลลัพธ์:** Get email addresses of all GROUP_LEAD approvers

### **PO_REWORK & PO_COMPLETED**
```sql
-- ค้นหา PO creator:
SELECT ph.created_by, ve.email
FROM po_headers ph
JOIN view_email ve ON ph.created_by = ve.employee_id
WHERE ph.po_id = @po_id
```

**ผลลัพธ์:** Email of the person who created the PO

### **BORROW_REWORK & BORROW_COMPLETED**
```sql
-- ค้นหา Borrow creator:
SELECT bh.created_by, ve.email
FROM borrow_headers bh
JOIN view_email ve ON bh.created_by = ve.employee_id
WHERE bh.borrow_id = @borrow_id
```

**ผลลัพธ์:** Email of the person who created the Borrow

---

## 🔄 **การเปลี่ยนจาก Development → Production**

### **Step 1: Development Mode (ปัจจุบัน)**
```bash
# server/.env.development
TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th
EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
NODE_ENV=development

# ผลลัพธ์: ALL EMAILS → wayroad@shindengen.co.th
```

### **Step 2: Switch to Production**
```bash
# server/.env.development (เปลี่ยน)
# TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th  ← COMMENT OUT/DELETE

EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
NODE_ENV=production

# ผลลัพธ์: EMAILS → REAL RECIPIENTS
```

### **Step 3: Restart Server**
```bash
# Stop current dev server (Ctrl+C)

# Start again
cd server && pnpm dev

# Now all emails go to real recipients
```

---

## 📋 **Email Routing Decision Tree**

```
┌─ User clicks "ส่งอนุมัติ" (PO)
│
├─ Check: TEST_EMAIL_OVERRIDE env var exists?
│  │
│  ├─ YES (Development) → Send to wayroad@shindengen.co.th ✅
│  │   └─ Save original recipients in: test_override_original_email
│  │
│  └─ NO (Production) → Get GROUP_LEAD approvers from:
│      └─ approval_roles + view_email → Send to actual approvers ✉️
│
└─ Log entry created with:
   ├─ send_to: wayroad... OR approver emails
   ├─ is_test_override: 1 or 0
   ├─ test_override_original_email: saved (if dev mode)
   └─ sent_status: SUCCESS or FAILED
```

---

## ✅ **Quick Reference Chart**

| Scenario | TEST_EMAIL_OVERRIDE | EMAIL GOES TO | is_test_override |
|----------|-------------------|---------------|------------------|
| 📌 User clicks "ส่งอนุมัติ" PO | SET (dev) | wayroad@shindengen.co.th | 1 |
| 📌 User clicks "ส่งอนุมัติ" PO | NOT SET (prod) | GROUP_LEAD approvers | 0 |
| 📌 Approver rejects PO | SET (dev) | wayroad@shindengen.co.th | 1 |
| 📌 Approver rejects PO | NOT SET (prod) | PO creator | 0 |
| 📌 Final approver approves | SET (dev) | wayroad@shindengen.co.th | 1 |
| 📌 Final approver approves | NOT SET (prod) | PO creator | 0 |
| 🔄 Same for BORROW | SET (dev) | wayroad@shindengen.co.th | 1 |
| 🔄 Same for BORROW | NOT SET (prod) | Real recipients | 0 |

---

## 🔍 **How to Verify in Database**

### **Query 1: See all test mode emails (Development)**
```sql
SELECT 
  send_id, 
  document_no, 
  notify_type,
  send_to,
  test_override_original_email,
  is_test_override,
  sent_status,
  created_at
FROM email_logs
WHERE is_test_override = 1
ORDER BY created_at DESC;

-- All send_to should be: wayroad@shindengen.co.th
```

### **Query 2: See all production emails (Real)**
```sql
SELECT 
  send_id, 
  document_no, 
  notify_type,
  send_to,
  is_test_override,
  sent_status,
  created_at
FROM email_logs
WHERE is_test_override = 0
ORDER BY created_at DESC;

-- send_to should contain actual approver/creator emails
```

### **Query 3: Verify a specific PO**
```sql
-- Development (should show redirect):
SELECT * FROM email_logs 
WHERE document_no = 'PO-2025-001' 
  AND is_test_override = 1;

-- Production (should show real recipients):
SELECT * FROM email_logs 
WHERE document_no = 'PO-2025-001' 
  AND is_test_override = 0;
```

---

## 📊 **Email Flow Diagram**

```
User Action (PO/Borrow Submit/Approve/Reject)
        ↓
   EmailService Triggered
        ↓
   ┌─ Check TEST_EMAIL_OVERRIDE ─┐
   │                             │
   ├─ YES (Development)          ├─ NO (Production)
   │                             │
   ↓                             ↓
Send to:                    Lookup Recipients:
wayroad@               
shindengen.co.th      ├─ APPROVAL → approval_roles
   ✅                 │            + view_email
                      │
   is_test_override=1  ├─ REWORK/COMPLETED → 
                       │   created_by (from headers)
   Save original:      │   + view_email
   test_override_      │
   original_email      └─ Send to real emails
                          is_test_override=0 ✉️
        ↓                      ↓
   Create Log Entry (email_logs table)
        ↓
   Sent Status:
   ├─ SUCCESS (email delivered) ✅
   └─ FAILED (error in send) ❌
```

---

## 🎯 **Summary: WHERE EMAIL GOES**

### **🟢 Development** (ปัจจุบัน)
```
ทุกการส่ง Mail ไม่ว่าเป็นกรณีไหน → wayroad@shindengen.co.th
```

### **🔴 Production** (หลังจากเปลี่ยน)
```
APPROVAL emails   → Approvers (from approval_roles)
REWORK emails     → Document creator (from created_by)
COMPLETED emails  → Document creator (from created_by)
```

---

## ⚠️ **Important Notes**

1. **TEST_EMAIL_OVERRIDE** คือตัวแปร `string` - ต้องมี email address
   ```bash
   ❌ TEST_EMAIL_OVERRIDE=true        (WRONG)
   ✅ TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th  (CORRECT)
   ```

2. **Environment variable check** (in `email.service.ts`):
   ```typescript
   const isTestMode = process.env.NODE_ENV !== 'production' 
                      && process.env.TEST_EMAIL_OVERRIDE;
   ```

3. **Email log table** เก็บทุกรายการ (ไม่ว่า dev หรือ prod)
   - Use `is_test_override` flag to distinguish

4. **ถ้า TEST_EMAIL_OVERRIDE set แล้ว test ไม่ได้**
   - ตรวจสอบ `.env` file ว่ามี typo หรือไม่
   - Restart server (ใช้ค่า env ใหม่)

---

**ขอบคุณที่ถาม! ตอนนี้ชัดเจนแล้วว่าส่งไปไหน 📮**

