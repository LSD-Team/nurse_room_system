# ✅ Email Service Integration Complete

**Date:** 2026-05-09  
**Status:** ✨ READY FOR TESTING

---

## 📦 What Was Done

### **1. Updated PO Service** ✅
- **File:** `server/src/apis/po/po.service.ts`
- **Changes:**
  - ✅ Added `EmailService` injection
  - ✅ Added `ENotifyType` enum import
  - ✅ Updated `submitPo()` method with email trigger
  - ✅ Updated `approvePo()` method with email triggers
  - ✅ Added helper method: `getPoHeaderById()`
  - ✅ Added helper method: `getPendingApprovals()`

### **2. Updated PO Module** ✅
- **File:** `server/src/apis/po/po.module.ts`
- **Changes:**
  - ✅ Imported `EmailModule`
  - ✅ Added `EmailModule` to imports array

### **3. Updated Borrow Service** ✅
- **File:** `server/src/apis/borrow/borrow.service.ts`
- **Changes:**
  - ✅ Added `EmailService` injection
  - ✅ Added `ENotifyType` enum import
  - ✅ Updated `submitBorrow()` method with email trigger
  - ✅ Updated `approveBorrow()` method with email triggers
  - ✅ Added helper method: `getBorrowHeaderById()`
  - ✅ Added helper method: `getPendingApprovals()`

### **4. Updated Borrow Module** ✅
- **File:** `server/src/apis/borrow/borrow.module.ts`
- **Changes:**
  - ✅ Imported `EmailModule`
  - ✅ Added `EmailModule` to imports array

### **5. Build Verification** ✅
- ✅ TypeScript compilation: **SUCCESS** (zero errors)
- ✅ All dist files generated correctly
- ✅ No type mismatches or warnings

---

## 📋 Email Triggers Configuration

### **PO Workflow**

| Action | Trigger | Email Type | Recipient | Message |
|--------|---------|-----------|-----------|---------|
| User clicks "ส่งอนุมัติ" | `submitPo()` | `APPROVAL_PO` | Approvers (GROUP_LEAD) | "Please approve this PO" |
| Approver clicks "ปฏิเสธ" | `approvePo(action='REJECTED')` | `PO_REWORK` | PO Creator | "Your PO was rejected, please revise" |
| Final Approver clicks "อนุมัติ" | `approvePo(action='APPROVED')` (last approval) | `PO_COMPLETED` | PO Creator | "Your PO has been fully approved" |

### **Borrow Workflow**

| Action | Trigger | Email Type | Recipient | Message |
|--------|---------|-----------|-----------|---------|
| User clicks "ส่งอนุมัติ" | `submitBorrow()` | `APPROVAL_BORROW` | Approvers (GROUP_LEAD) | "Please approve this Borrow" |
| Approver clicks "ปฏิเสธ" | `approveBorrow(action='REJECTED')` | `BORROW_REWORK` | Borrow Creator | "Your Borrow was rejected, please revise" |
| Final Approver clicks "อนุมัติ" | `approveBorrow(action='APPROVED')` (last approval) | `BORROW_COMPLETED` | Borrow Creator | "Your Borrow has been fully approved" |

---

## 🧪 Testing Instructions

### **Phase 1: Development Testing (with Test Email Override)**

#### **Step 1: Configure Environment**
```bash
# File: server/.env.development

# Add or ensure these variables exist:
TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th
NODE_ENV=development
EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
```

#### **Step 2: Run Development Server**
```bash
cd server && pnpm dev
```

#### **Step 3: Test PO Submission Flow**
1. Open UI: `http://localhost:{port}/nurse-room-system/`
2. Navigate to **PO Management** page
3. Click a PO in **DRAFT** status
4. Click **"ส่งอนุมัติ"** (Submit for Approval) button
5. ✅ **Expected Result:**
   - UI shows success message
   - Email sent to `wayroad@shindengen.co.th` (test override)
   - Email type: `APPROVAL_PO`
   - Subject contains: PO number (e.g., "PO-2025-001")

#### **Step 4: Verify Email Log**
```bash
# Query the email_logs table
SELECT TOP 10 
  send_id, 
  document_type, 
  document_no, 
  notify_type, 
  send_to,
  test_override_original_email,
  is_test_override,
  sent_status, 
  created_at
FROM email_logs
ORDER BY created_at DESC
```

**Expected columns:**
- `send_id`: Auto-generated ID
- `document_type`: "PO" or "BORROW"
- `document_no`: PO/Borrow number
- `notify_type`: "APPROVAL_PO", "PO_REWORK", "PO_COMPLETED", etc.
- `send_to`: "wayroad@shindengen.co.th" (test override)
- `test_override_original_email`: Contains actual approver email(s)
- `is_test_override`: 1 (true)
- `sent_status`: "SUCCESS" or "FAILED"

#### **Step 5: Test PO Rejection (Rework)**
1. Navigate to **PO Approval** or **Approvals** page
2. Click a PO that needs approval
3. Click **"ปฏิเสธ"** (Reject) button
4. Enter remark: "Please adjust quantities"
5. ✅ **Expected Result:**
   - Email sent to `wayroad@shindengen.co.th` (test override)
   - Email type: `PO_REWORK`
   - Subject contains: "Rework Required"
   - Body includes the remark

#### **Step 6: Test PO Final Approval**
1. Go back to **Approvals** page
2. Approve the same PO
3. If this is the **final approval** (no more pending approvals):
   - ✅ **Expected Result:**
     - Email sent to `wayroad@shindengen.co.th` (test override)
     - Email type: `PO_COMPLETED`
     - Subject contains: "Approval Complete"
     - Body says: "Your PO has been fully approved and is ready for ordering"

#### **Step 7: Repeat for Borrow (Optional)**
Same steps but test the **Borrow** workflow instead of PO.

---

### **Phase 2: Production Testing (Remove Test Override)**

#### **Step 1: Remove Test Email Override**
```bash
# File: server/.env.development

# Remove or comment out:
# TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th

# Keep:
NODE_ENV=production  # or remove - defaults to development
EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
```

#### **Step 2: Restart Server**
```bash
# Stop the dev server (Ctrl+C)
# Restart:
pnpm dev
```

#### **Step 3: Test PO Submission Again**
1. Click **"ส่งอนุมัติ"** on a new DRAFT PO
2. ✅ **Expected Result:**
   - Email sent to **actual approvers** from `approval_roles` table
   - Check the approver's email for receipt
   - Email log shows `is_test_override=0` and correct `send_to` addresses

#### **Step 4: Verify Email Log (Production Mode)**
```bash
SELECT TOP 10 
  send_id, 
  document_type, 
  document_no, 
  notify_type, 
  send_to,
  is_test_override,
  sent_status, 
  error_message,
  created_at
FROM email_logs
WHERE is_test_override = 0
ORDER BY created_at DESC
```

**Expected:**
- `is_test_override`: 0 (false)
- `send_to`: Actual approver emails (e.g., "approver1@company.com, approver2@company.com")
- `sent_status`: "SUCCESS"
- `error_message`: NULL

---

## 📊 Email Log Queries

### **View All Emails Sent Today**
```sql
SELECT 
  send_id, 
  document_type, 
  document_no, 
  notify_type, 
  send_to, 
  sent_status,
  created_at
FROM email_logs
WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
ORDER BY created_at DESC
```

### **View Failed Emails**
```sql
SELECT 
  send_id, 
  document_type, 
  document_no, 
  notify_type, 
  error_message,
  retry_count,
  created_at
FROM email_logs
WHERE sent_status = 'FAILED'
ORDER BY created_at DESC
```

### **View Test Override Emails**
```sql
SELECT 
  send_id, 
  document_type, 
  document_no, 
  notify_type, 
  send_to,
  test_override_original_email,
  sent_status,
  created_at
FROM email_logs
WHERE is_test_override = 1
ORDER BY created_at DESC
```

### **Audit Trail - PO Approvals**
```sql
SELECT 
  send_id, 
  document_type, 
  document_no, 
  notify_type,
  send_to,
  sent_status,
  created_at
FROM email_logs
WHERE document_type = 'PO'
  AND created_at >= DATEADD(DAY, -7, GETDATE())
ORDER BY created_at DESC
```

---

## โš™️ Configuration

### **Email Service URL** ✅
Located in: `.env.development` and `.env.production`

```env
EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
```

The email service is already integrated at:
- `server/src/email/email.service.ts` (lines 32-120)
- HTTP POST to `${EMAIL_SERVICE_URL}/send`

### **Test Email Override** ✅
Development mode only:

```env
# Development (test all emails to wayroad@shindengen.co.th)
TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th
NODE_ENV=development

# Production (send to actual recipients)
NODE_ENV=production
# TEST_EMAIL_OVERRIDE=<REMOVED>
```

---

## ✅ Verification Checklist

Before considering the integration complete, verify:

- [ ] **Build succeeds** with zero TypeScript errors
- [ ] **PO submission** triggers `APPROVAL_PO` email to test address
- [ ] **PO rejection** triggers `PO_REWORK` email with remark
- [ ] **PO final approval** triggers `PO_COMPLETED` email
- [ ] **Borrow submission** triggers `APPROVAL_BORROW` email to test address
- [ ] **Borrow rejection** triggers `BORROW_REWORK` email with remark
- [ ] **Borrow final approval** triggers `BORROW_COMPLETED` email
- [ ] **Email log entries** created with correct `notify_type` and `sent_status`
- [ ] **Test override** shows `is_test_override=1` and preserves original email in `test_override_original_email`
- [ ] **Production mode** sends to actual approvers with `is_test_override=0`
- [ ] **Failed emails** logged with error details in `error_message`
- [ ] **All Thai text** displays correctly in email templates

---

## ๐Ÿ"ง Troubleshooting

### **Emails not sending?**

1. **Check `.env` variables:**
   ```bash
   echo $EMAIL_SERVICE_URL  # Should output: http://10.182.1.198/apis/lsd-smtp-service
   echo $TEST_EMAIL_OVERRIDE  # Should output: wayroad@shindengen.co.th (in dev)
   ```

2. **Check email_logs table:**
   ```sql
   SELECT TOP 1 * FROM email_logs ORDER BY created_at DESC
   ```

3. **Review server logs:**
   ```
   โœ… [PoService] Approval email sent for PO: PO-2025-001
   โœ… [BorrowService] Approval email sent for Borrow: BR-2025-001
   ```

4. **Check external email service:**
   - Test connection: `curl -X POST http://10.182.1.198/apis/lsd-smtp-service/send -H "Content-Type: application/json"`
   - Verify service is running

### **Email log is empty?**

1. **Database table not created?**
   - Run: `server/src/email/migrations/RUN_THIS.sql`
   - Verify: `SELECT COUNT(*) FROM email_logs`

2. **Wrong database name?**
   - Check: `.env.development` and `.env.production`
   - Verify: `DATABASE_NAME` variable

3. **EmailModule not registered?**
   - Check: `server/src/apis/po/po.module.ts` imports `EmailModule`
   - Check: `server/src/apis/borrow/borrow.module.ts` imports `EmailModule`

---

## ๐Ÿ"ค Next Steps

After testing is complete:

1. **Confirm all email types work** (6 types: APPROVAL_PO, APPROVAL_BORROW, PO_REWORK, BORROW_REWORK, PO_COMPLETED, BORROW_COMPLETED)
2. **Verify Thai text** displays correctly in all email templates
3. **Monitor email_logs** table for any failed deliveries
4. **Deploy to production** once confirmed
5. **Notify approvers** that they will receive approval emails going forward

---

## ๐Ÿ"„ Files Modified

| File | Changes |
|------|---------|
| `server/src/apis/po/po.service.ts` | Added EmailService injection + 3 email triggers |
| `server/src/apis/po/po.module.ts` | Added EmailModule import |
| `server/src/apis/borrow/borrow.service.ts` | Added EmailService injection + 3 email triggers |
| `server/src/apis/borrow/borrow.module.ts` | Added EmailModule import |

**Files NOT modified (already exist):**
- `server/src/email/email.service.ts` (existing with logging)
- `server/src/email/email-log.service.ts` (existing)
- `server/src/email/email-log.controller.ts` (existing)
- `server/src/email/email.module.ts` (existing, with EmailLogService + controller)
- Database table: `email_logs` (create with SQL script)

---

## ๐Ÿ"Š Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| TypeScript Build | โœ… PASS | Zero compilation errors |
| PO Email Integration | โœ… PASS | 3 triggers added (submit, reject, approve) |
| Borrow Email Integration | โœ… PASS | 3 triggers added (submit, reject, approve) |
| Module Registration | โœ… PASS | EmailModule imported in both modules |
| Type Safety | โœ… PASS | All notifyType use ENotifyType enum |
| Logging System | โœ… PASS | Integrated into email service |
| Test Override | โœ… PASS | Ready for development testing |
| Production Ready | โœ… PASS | Can remove TEST_EMAIL_OVERRIDE for production |

---

**Ready to test! ๐Ÿš€**

