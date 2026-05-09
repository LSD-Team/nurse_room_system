# 🧪 Email Service - Testing Guide

**Status:** Ready for testing with redirected emails  
**Test Email:** wayroad@shindengen.co.th  
**When to Remove Override:** After verifying email templates and delivery

---

## Quick Start for Testing

### Step 1: Extract and Setup

```bash
# Extract ZIP
unzip email-service-delivery-20260509-HHMMSS.zip

# Copy to project
cp -r email-service-delivery/email-module server/src/email/

# Install dependencies
cd server
pnpm add @nestjs/axios axios
```

### Step 2: Configure for Testing

**Copy the environment template:**
```bash
cp email-service-delivery/.env.development.email-example .env.development
```

**Verify TEST_EMAIL_OVERRIDE is set:**
```env
NODE_ENV=development
TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th
```

This ensures ALL emails in testing phase go to `wayroad@shindengen.co.th`

### Step 3: Build and Run

```bash
pnpm run build
pnpm run dev
```

### Step 4: Test Email Sending

**Option A: Using your approval workflow**
```typescript
import { EmailService } from '@/src/email/email.service';

// Inject the service
constructor(private emailService: EmailService) {}

// When testing, call:
await this.emailService.sendApprovalRequestByRoleCode(
  'PO_APPROVER_L1',
  'PO-TEST-001',
  'PO',
  'Test PO',
  'This is a test email'
);

// ✅ Email will be sent to wayroad@shindengen.co.th
```

**Option B: Direct service test**
```typescript
import { ENotifyType } from '@/src/email/dto/send-approval-email.dto';

await this.emailService.sendApprovalEmail({
  notifyType: ENotifyType.APPROVAL_PO,
  documentId: 1,
  documentNo: 'PO-TESTING-001',
  documentType: 'PO',
  toEmployeeIds: [101, 102, 103],  // Any employee IDs
  documentTitle: 'Testing Email Service',
  documentDescription: 'This email should arrive at wayroad@shindengen.co.th',
});

// ✅ All emails redirected to test address
```

### Step 5: Check Application Logs

Look for this log message:
```
[EmailService] Test mode: Redirecting 5 email(s) to: wayroad@shindengen.co.th
```

This confirms the email override is active.

---

## What to Verify During Testing

### ✅ Email Delivery
- [ ] Email arrives at wayroad@shindengen.co.th
- [ ] Email subject is correct: `[Nurse Room System] DOC-NO : Status`
- [ ] Email is from external service (http://10.182.1.198/...)

### ✅ Template Rendering
- [ ] HTML template renders correctly
- [ ] Placeholders are replaced (document_no, document_type, etc.)
- [ ] Thai characters display correctly
- [ ] Images/styling looks good on mobile

### ✅ Different Notification Types
Test each type to verify correct template:

| Type | What to Send | Expected Template |
|------|-------------|-------------------|
| `APPROVAL_PO` | sendApprovalRequestByRoleCode('PO_APPROVER_L1', 'PO-001', 'PO') | Approval (blue header) |
| `APPROVAL_BORROW` | sendApprovalRequestByRoleCode('BR_APPROVER_L1', 'BRW-001', 'BORROW') | Approval (green header) |
| `PO_REWORK` | sendApprovalEmail with REWORK type | Rework (orange header) |
| `PO_COMPLETED` | sendApprovalEmail with COMPLETED type | Completed (green header) |
| `BORROW_REWORK` | sendApprovalEmail with BORROW_REWORK | Rework (orange header) |
| `BORROW_COMPLETED` | sendApprovalEmail with BORROW_COMPLETED | Completed (teal header) |

### ✅ Error Handling
- [ ] If employee not in database → email not sent, warning logged
- [ ] If external service down → error logged, no crash
- [ ] If template missing → error logged, process stops gracefully

---

## Troubleshooting During Testing

### Issue: Email Not Received
**Check:**
1. Is TEST_EMAIL_OVERRIDE in .env? → `TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th`
2. Is NODE_ENV not 'production'? → `NODE_ENV=development`
3. Check logs for error messages
4. Verify external service is reachable: `curl http://10.182.1.198/apis/lsd-smtp-service/health`

### Issue: Template Not Rendering
**Check:**
1. Run `pnpm run build` to compile templates
2. Verify files in `dist/src/email/templates/` exist
3. Check spelling of template file names (e.g., `approval-po.template.html`)
4. Verify placeholder syntax: `{{placeholder_name}}`

### Issue: TEST_EMAIL_OVERRIDE Not Working
**Check logs for:**
```
[EmailService] Test mode: Redirecting X email(s) to: wayroad@shindengen.co.th
```

If not present:
- Verify .env has `TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th`
- Restart dev server: `pnpm run dev`
- Check NODE_ENV is not 'production'

---

## Switching to Production (After Testing Complete)

### Step 1: Disable Test Override
```env
# Remove or comment out this line:
# TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th

# Or change NODE_ENV:
NODE_ENV=production
```

### Step 2: Rebuild
```bash
pnpm run build
pnpm run dev
```

### Step 3: Verify Production Mode
Logs should NOT show:
```
[EmailService] Test mode: Redirecting...
```

Instead, emails will be sent to actual recipients from database.

### Step 4: Final Verification
- [ ] Approvers receive approval notifications
- [ ] Document creators receive rework alerts
- [ ] Document creators receive completion notifications
- [ ] All recipients are correct (from database)

---

## Email Delivery Verification

### From wayroad@shindengen.co.th Mailbox
1. Open inbox
2. Look for emails with subject: `[Nurse Room System] ...`
3. Check different templates are being used
4. Verify HTML rendering in email client

### From Application Logs
```bash
# Successful send
[EmailService] Email sent successfully for PO PO-2026-001

# Test mode redirect
[EmailService] Test mode: Redirecting 5 email(s) to: wayroad@shindengen.co.th

# Error case
[EmailService] Failed to send approval email: Unable to connect to external service
```

---

## Quick Reference: Environment Variables

| Variable | Value (Testing) | Value (Production) | Purpose |
|----------|-----------------|-------------------|---------|
| `NODE_ENV` | `development` | `production` | Enable/disable test override |
| `TEST_EMAIL_OVERRIDE` | `wayroad@shindengen.co.th` | (removed) | Redirect all emails in testing |
| `EMAIL_SERVICE_URL` | `http://10.182.1.198/apis/lsd-smtp-service` | Same | External email service |
| `APP_NAME` | `NURSE_ROOM_SYSTEM` | Same | System name in email |

---

## Testing Checklist

- [ ] Dependencies installed (@nestjs/axios, axios)
- [ ] .env.development configured with TEST_EMAIL_OVERRIDE
- [ ] Build successful: `pnpm run build`
- [ ] Dev server running: `pnpm run dev`
- [ ] Email received at wayroad@shindengen.co.th
- [ ] HTML template renders correctly
- [ ] All 6 notification types tested
- [ ] Error cases handled gracefully
- [ ] No crashes on missing recipients
- [ ] Production override (TEST_EMAIL_OVERRIDE removed)
- [ ] Production emails sent to actual recipients

---

## Support

If emails don't arrive:

1. **Check logs in application console** - look for error messages
2. **Verify external service** - can curl reach it?
3. **Verify database connection** - are employee IDs/emails in view_email?
4. **Check .env configuration** - is TEST_EMAIL_OVERRIDE set correctly?
5. **Restart dev server** - sometimes env changes need restart

For detailed API reference, see `README.md` in email-module.

---

**Once testing is verified, you can proceed with production configuration!** ✅
