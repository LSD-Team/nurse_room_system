# 📧 Email Service for Nurse Room System

## Overview

The Email Service is a standalone NestJS module designed to send automated email notifications for PO (Purchase Order) and Borrow document approval workflows in the Nurse Room System.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│          Nurse Room System Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Email Service Module                         │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ EmailService                                  │  │  │
│  │  │  - sendApprovalEmail()                        │  │  │
│  │  │  - sendApprovalRequestByRoleCode()            │  │  │
│  │  │  - getEmailsByEmployeeIds()                   │  │  │
│  │  │  - getApproverEmailsByRoleCode()              │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ Templates (HTML)                              │  │  │
│  │  │  - approval-po.template.html                  │  │  │
│  │  │  - approval-borrow.template.html              │  │  │
│  │  │  - rework-po.template.html                    │  │  │
│  │  │  - rework-borrow.template.html                │  │  │
│  │  │  - completed-po.template.html                 │  │  │
│  │  │  - completed-borrow.template.html             │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│           ↓                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ External Email Service                               │  │
│  │ http://10.182.1.198/apis/lsd-smtp-service           │  │
│  │ (SMTP-based email delivery)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│           ↓                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Email Provider (SendGrid, AWS SES, etc.)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
server/src/email/
├── email.module.ts                 # NestJS module registration
├── email.service.ts                # Core email service logic
├── email.service.spec.ts           # Unit tests
├── dto/
│   ├── sent-email.dto.ts          # Request DTO for external service
│   ├── email-log.dto.ts           # Response DTO from external service
│   └── send-approval-email.dto.ts # Internal approval email payload
└── templates/
    ├── approval-po.template.html           # PO approval notification
    ├── approval-borrow.template.html       # Borrow approval notification
    ├── rework-po.template.html             # PO rework request
    ├── rework-borrow.template.html         # Borrow rework request
    ├── completed-po.template.html          # PO approval completion
    └── completed-borrow.template.html      # Borrow approval completion
```

## Environment Configuration

Add these variables to your `.env` and `.env.production` files:

```env
# Email Service Configuration
EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
APP_NAME=NURSE_ROOM_SYSTEM
NODE_ENV=development

# ⭐ TEST EMAIL OVERRIDE (development/testing only)
# When set and NODE_ENV is NOT 'production', ALL emails are redirected to this address
# Use during testing phase to verify emails before enabling production delivery
# Once verified, remove this variable to send emails to actual recipients
TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th
```

### Development Testing Workflow

1. **Phase 1: Testing (NODE_ENV=development + TEST_EMAIL_OVERRIDE set)**
   - All emails go to `wayroad@shindengen.co.th`
   - You can review template rendering and email content
   - External service receives test emails

2. **Phase 2: Production Ready (NODE_ENV=production or TEST_EMAIL_OVERRIDE removed)**
   - Emails go to actual approvers and recipients from database
   - Remove `TEST_EMAIL_OVERRIDE` from .env to enable real emails

## Key Features

### 1. Approval Request Notifications
- Send to approvers based on `approval_roles` table and `role_code`
- Map approver IDs to emails via `view_email` table
- Support multiple recipients with CC

### 2. Document Creator Notifications
- Send rework notifications to `po_headers.created_by` or `borrow_headers.created_by`
- Send completion notifications when final approval is granted

### 3. Template System
- 6 pre-built HTML templates with Thai language support
- Placeholder replacement: `{{document_no}}`, `{{document_type}}`, `{{additional_message}}`, etc.
- Responsive design for all devices

### 4. External Service Integration
- Contract-based communication with external email service
- POST to `{EMAIL_SERVICE_URL}/email/send`
- Error handling and logging

## Database Dependencies

### Tables Used:
- **approval_roles** - Maps role_code to approver_id
- **view_email** - Maps employee_id to email address
- **po_headers** - Contains created_by for PO document creators
- **borrow_headers** - Contains created_by for Borrow document creators

### Query Examples:

**Get approver emails by role_code:**
```sql
SELECT DISTINCT ve.email
FROM approval_roles ar
JOIN view_email ve ON ar.approver_id = ve.employee_id
WHERE ar.role_code = 'PO_APPROVER_L1'
AND ar.is_active = 1
```

**Get employee emails by IDs:**
```sql
SELECT email FROM view_email
WHERE employee_id IN (101, 102, 103)
AND email IS NOT NULL
```

## Usage Examples

### Example 1: Send PO Approval Request

```typescript
import { EmailService } from '@/src/email/email.service';
import { ENotifyType } from '@/src/email/dto/send-approval-email.dto';

// In your service
constructor(private emailService: EmailService) {}

async approvePO(poId: number, roleCode: string) {
  // Your approval logic here
  
  // Send approval notification to role-based approvers
  await this.emailService.sendApprovalRequestByRoleCode(
    roleCode,           // 'PO_APPROVER_L1'
    'PO-2026-001',      // documentNo
    'PO',               // documentType
    'Test PO Title',    // optional documentTitle
    'Test Description'  // optional documentDescription
  );
}
```

### Example 2: Send Rework Notification

```typescript
async sendReworkNotification(
  createdByEmployeeId: number,
  documentNo: string,
  documentType: 'PO' | 'BORROW',
  rejectionReason: string
) {
  const notifyType = documentType === 'PO' 
    ? ENotifyType.PO_REWORK 
    : ENotifyType.BORROW_REWORK;

  await this.emailService.sendApprovalEmail({
    notifyType,
    documentId: 1,
    documentNo,
    documentType,
    toEmployeeIds: [createdByEmployeeId],
    additionalMessage: rejectionReason,
  });
}
```

### Example 3: Send Completion Notification

```typescript
async sendCompletionNotification(
  createdByEmployeeId: number,
  documentNo: string,
  documentType: 'PO' | 'BORROW',
  approverName: string
) {
  const notifyType = documentType === 'PO'
    ? ENotifyType.PO_COMPLETED
    : ENotifyType.BORROW_COMPLETED;

  await this.emailService.sendApprovalEmail({
    notifyType,
    documentId: 1,
    documentNo,
    documentType,
    toEmployeeIds: [createdByEmployeeId],
    approvedByName: approverName,
  });
}
```

## DTOs

### SendEmailDto (Request to External Service)
```typescript
export class SendEmailDto {
  to: string | string[];              // Comma-separated or array of emails
  cc?: string | string[];             // Optional CC recipients
  bcc?: string | string[];            // Optional BCC recipients
  subject: string;                    // Email subject
  html: string;                       // HTML email body
  sent_from_system: string;           // System name sending the email
}
```

### EmailLogDto (Response from External Service)
```typescript
export class EmailLogDto {
  id: number;                         // Email log ID
  to_recipients: string;              // Comma-separated recipients
  cc_recipients: string | null;       // Comma-separated CC recipients
  subject: string;                    // Email subject sent
  body: string;                       // HTML body sent
  sent_from_system: string;           // System that sent it
  status: 'SUCCESS' | 'FAILED';      // Delivery status
  error_message?: string | null;      // Error details if failed
  sent_at: Date;                      // Timestamp when sent
}
```

### ISendApprovalEmailPayload (Internal Approval Payload)
```typescript
export interface ISendApprovalEmailPayload {
  notifyType: ENotifyType;                    // Type of notification
  documentId: number;                         // Document ID
  documentNo: string;                         // Document number
  documentType: 'PO' | 'BORROW';            // Document type
  toEmployeeIds: number[];                    // Recipient employee IDs
  ccEmployeeIds?: number[];                   // Optional CC employee IDs
  documentTitle?: string;                     // Optional document title
  documentDescription?: string;               // Optional description
  createdByEmployeeId?: number;              // Document creator ID
  approvedByEmployeeId?: number;             // Approver ID
  approvedByName?: string;                   // Approver name
  rejectedByEmployeeId?: number;             // Rejector ID
  rejectedByName?: string;                   // Rejector name
  additionalMessage?: string;                // Additional message/remarks
}
```

### ENotifyType (Notification Types)
```typescript
enum ENotifyType {
  APPROVAL_PO = 'APPROVAL_PO',              // Waiting for PO approval
  APPROVAL_BORROW = 'APPROVAL_BORROW',      // Waiting for Borrow approval
  PO_REWORK = 'PO_REWORK',                  // PO needs rework
  BORROW_REWORK = 'BORROW_REWORK',          // Borrow needs rework
  PO_COMPLETED = 'PO_COMPLETED',            // PO approved
  BORROW_COMPLETED = 'BORROW_COMPLETED',    // Borrow approved
}
```

## Template Placeholders

All templates support the following placeholders:

| Placeholder | Description | Used In |
|---|---|---|
| `{{document_no}}` | Document number (PO-2026-001) | All templates |
| `{{document_type}}` | Document type (PO / BORROW) | All templates |
| `{{document_title}}` | Document title | All templates |
| `{{document_description}}` | Document description | All templates |
| `{{approved_by_name}}` | Name of approver | Completion templates |
| `{{rejected_by_name}}` | Name of rejector | Rework templates |
| `{{additional_message}}` | Additional remarks/feedback | Rework & Completion |
| `{{sent_at}}` | Email send timestamp (Thai locale) | All templates |

## Integration Steps

### 1. Install Module (Already Done)
EmailModule is registered in `app.module.ts`

### 2. Inject EmailService into Your Service

```typescript
import { EmailService } from '@/src/email/email.service';

@Injectable()
export class YourService {
  constructor(
    private readonly emailService: EmailService,
  ) {}
}
```

### 3. Call Email Methods During Workflows

**In Approval Workflow:**
```typescript
// When document is created and needs approval
await this.emailService.sendApprovalRequestByRoleCode(
  'PO_APPROVER_L1',
  poNo,
  'PO'
);

// When approval is rejected (rework)
await this.emailService.sendApprovalEmail({
  notifyType: ENotifyType.PO_REWORK,
  documentId: poId,
  documentNo: poNo,
  documentType: 'PO',
  toEmployeeIds: [po.created_by],
  rejectedByName: rejectorName,
  additionalMessage: rejectionReason,
});

// When approval is final (all levels approved)
await this.emailService.sendApprovalEmail({
  notifyType: ENotifyType.PO_COMPLETED,
  documentId: poId,
  documentNo: poNo,
  documentType: 'PO',
  toEmployeeIds: [po.created_by],
  approvedByName: approverName,
});
```

## Testing

### Development/Testing Phase Setup

To test emails before enabling production delivery:

1. **Set TEST_EMAIL_OVERRIDE in .env:**
```env
NODE_ENV=development
TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th
```

2. **All emails will be redirected to wayroad@shindengen.co.th:**
   - Approval notifications
   - Rework alerts
   - Completion confirmations
   - ALL recipients are overridden in test mode

3. **Verify in logs:**
```
[EmailService] Test mode: Redirecting 5 email(s) to: wayroad@shindengen.co.th
```

4. **When ready for production:**
   - Remove or comment out `TEST_EMAIL_OVERRIDE` in .env
   - Change `NODE_ENV=production`
   - Emails will now go to actual approvers and recipients

### Run Unit Tests
```bash
cd server
pnpm test email.service.spec
```

### Test Specific Features
```bash
pnpm test email.service.spec --testNamePattern="sendApprovalEmail"
```

### Manual Testing Example
```typescript
// With TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th
const result = await this.emailService.sendApprovalEmail({
  notifyType: ENotifyType.APPROVAL_PO,
  documentId: 1,
  documentNo: 'PO-TEST-001',
  documentType: 'PO',
  toEmployeeIds: [101, 102, 103],  // emails from DB
  // ↓ In test mode, ALL emails go to wayroad@shindengen.co.th
});
```

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  await this.emailService.sendApprovalEmail(payload);
} catch (error) {
  // Error is logged in logger
  // Consider retry logic or fallback notification
}
```

Common errors:

| Error | Cause | Solution |
|---|---|---|
| `EMAIL_SERVICE_URL is not configured` | Missing env variable | Add `EMAIL_SERVICE_URL` to .env |
| `Template file not found` | Template path incorrect | Verify template files in `src/email/templates/` |
| `Failed to get emails for employee IDs` | Database query error | Check `view_email` table and employee IDs |
| `Failed to send email: ...` | External service error | Check external service URL and network |

## Logging

All operations are logged using NestJS Logger:

```
[EmailService] Email sent successfully for PO PO-2026-001
[EmailService] Failed to get approver emails for role_code PO_APPROVER_L1
[EmailService] Failed to load email template approval-po.template.html
```

## Performance Considerations

- Emails are sent synchronously (awaited)
- For high-volume scenarios, consider making calls fire-and-forget
- Consider batch sending if multiple recipients
- Template loading is done on-demand (no caching currently)

## Future Enhancements

- [ ] Add email retry logic with exponential backoff
- [ ] Cache templates in memory for performance
- [ ] Support email attachments (PDF documents)
- [ ] Add BCC functionality for audit trail
- [ ] Implement queue-based sending for high volume
- [ ] Add email delivery status tracking
- [ ] Support for email templates in database
- [ ] Multi-language template support

## Troubleshooting

### Emails not sending?

1. Check `EMAIL_SERVICE_URL` in .env
2. Verify network connectivity to external service
3. Check employee emails in `view_email` table
4. Review application logs for error messages
5. Verify template files exist in `src/email/templates/`

### Recipients not found?

1. Check if employee IDs exist in database
2. Verify `view_email` table contains email addresses
3. Ensure employee_id in `view_email` matches your employee IDs
4. Check if email is NULL or empty string

### Template rendering issues?

1. Verify placeholder syntax: `{{key_name}}`
2. Ensure template file encoding is UTF-8
3. Check for typos in placeholder keys
4. Verify all required variables are passed

## Support

For issues or questions:
1. Check logs in application
2. Verify configuration
3. Test template rendering separately
4. Contact system administrator

---

**Version:** 1.0.0  
**Last Updated:** 2026-05-09  
**Author:** Copilot
