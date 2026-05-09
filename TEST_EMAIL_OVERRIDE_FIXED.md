# ✅ TEST EMAIL OVERRIDE FIXED

**Problem Found:** `TEST_EMAIL_OVERRIDE` was missing from `.env.development`

---

## 🐛 What Was Wrong

**File:** `server/.env.development`

❌ **Before:**
```env
EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
# ← TEST_EMAIL_OVERRIDE was MISSING
```

✅ **After:**
```env
EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th
```

---

## 🔧 Why It Wasn't Working

The email service code **already had** the test override feature:

✅ `getEmailsByEmployeeIds()` - Line 172
```typescript
return this.overrideEmailsForTesting(emails);
```

✅ `getApproverEmailsByRoleCode()` - Line 238
```typescript
return this.overrideEmailsForTesting(emails);
```

✅ `isTestMode()` - Lines 206-214
```typescript
private isTestMode(): boolean {
  if (this.configService.get<string>('NODE_ENV') === 'production') {
    return false;
  }
  const testEmailOverride =
    this.configService.get<string>('TEST_EMAIL_OVERRIDE');
  return !!testEmailOverride;
}
```

**But the environment variable was not set, so the override never activated!**

---

## ✅ Now All Emails Will Go To

### **Development Mode (Current Setup)**
```
TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th
        ↓
ALL EMAILS → wayroad@shindengen.co.th ✉️
```

| Scenario | Email Goes To |
|----------|---|
| Submit PO/Borrow | wayroad@shindengen.co.th |
| Reject PO/Borrow (Rework) | wayroad@shindengen.co.th |
| Approve PO/Borrow (Final) | wayroad@shindengen.co.th |
| Any other email | wayroad@shindengen.co.th |

**Database Log:**
- `is_test_override: 1` (ทุกแถว)
- `test_override_original_email`: Contains actual approver emails (saved for reference)
- `send_to`: wayroad@shindengen.co.th

---

## 🚀 Next Steps

### **Step 1: Restart Server**
```bash
# Stop current dev server (Ctrl+C)

# Start again:
cd server && pnpm dev

# Server will now read the new TEST_EMAIL_OVERRIDE value
```

### **Step 2: Test Email Sending**
1. Navigate to PO Management page
2. Click "ส่งอนุมัติ" button on a PO in DRAFT status
3. ✅ **Expected:** Email should arrive at `wayroad@shindengen.co.th`
4. Check email_logs table:
   ```sql
   SELECT TOP 5 * FROM email_logs 
   ORDER BY created_at DESC;
   ```
   - `send_to` should be: `wayroad@shindengen.co.th`
   - `is_test_override` should be: `1`

### **Step 3: Verify Test Override Tracking**
```sql
SELECT 
  send_id,
  document_no,
  notify_type,
  send_to,
  test_override_original_email,
  is_test_override,
  sent_status
FROM email_logs
WHERE is_test_override = 1
ORDER BY created_at DESC;
```

**Expected Result:**
```
send_id | document_no | notify_type    | send_to                        | test_override_original_email           | is_test_override | sent_status
--------|-------------|----------------|--------------------------------|----------------------------------------|------------------|------------
1       | PO-2025-001 | APPROVAL_PO    | wayroad@shindengen.co.th      | สมชาย.ป.@com, สนธยา.ด.@com           | 1                | SUCCESS
2       | BR-2025-010 | APPROVAL_BORROW| wayroad@shindengen.co.th      | อนันต์.ว.@com, สุจิตต์.ล.@com        | 1                | SUCCESS
```

---

## 🔄 Switching to Production

When ready to send emails to **real approvers**:

```bash
# Edit: server/.env.development
# Comment out or delete:
# TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th

# Restart server:
Ctrl+C
pnpm dev
```

Then:
- `is_test_override: 0`
- `send_to`: Real approver emails from approval_roles
- Emails delivered to actual recipients

---

## ✅ Configuration Summary

```
File: server/.env.development
───────────────────────────────────────────

Node Environment:   NODE_ENV=development

Email Service:      EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
Test Override:      TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th ✅ ADDED

Result:             All emails → wayroad@shindengen.co.th (Development Testing)
```

---

## 📋 Checklist

- [x] Added `TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th` to `.env.development`
- [ ] Restart server (Ctrl+C then `pnpm dev`)
- [ ] Test PO/Borrow submission
- [ ] Verify email arrives at wayroad@shindengen.co.th
- [ ] Check email_logs table for `is_test_override=1`
- [ ] Verify `test_override_original_email` contains actual recipients

---

## ⚠️ Important Notes

1. **Server must be restarted** for new `.env` values to take effect
   - Node.js loads `.env` at startup only
   - Stop server: `Ctrl+C`
   - Start again: `pnpm dev`

2. **Environment variable format:**
   ```env
   ✅ TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th
   ❌ TEST_EMAIL_OVERRIDE=true
   ```
   Must be an actual email address!

3. **In production:**
   ```bash
   # server/.env.production
   # TEST_EMAIL_OVERRIDE=<removed>
   NODE_ENV=production
   EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
   ```

---

## 🔍 Verification Commands

### Verify config was set correctly:
```bash
cd server
echo $env:TEST_EMAIL_OVERRIDE  # PowerShell
# or
echo $TEST_EMAIL_OVERRIDE      # Bash
```

### Watch server logs while testing:
```bash
# After starting server, look for:
# ✅ Test mode: Redirecting X email(s) to: wayroad@shindengen.co.th
# ✅ Approval email sent for PO ...
```

### Query email logs:
```sql
SELECT TOP 1 * FROM email_logs 
WHERE is_test_override = 1
ORDER BY created_at DESC;
```

---

**ตอนนี้ก็พร้อมแล้ว! 🚀**

ส่ง restart server และ test ใหม่ เมลทุกฉบับจะไปถึง wayroad@shindengen.co.th

