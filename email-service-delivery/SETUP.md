# 📧 Email Service Integration Guide

## Quick Setup

### 1. Install Dependencies
`ash
cd server
pnpm add @nestjs/axios axios
`

### 2. Environment Configuration
Copy .env.development.email-example to your .env or .env.development:
`ash
cp .env.development.email-example .env.development
`

Update these values:
`nv
EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
APP_NAME=NURSE_ROOM_SYSTEM
NODE_ENV=development
`

### 3. Integration Steps
1. Copy the entire mail-module folder to server/src/email/
2. EmailModule is already registered in pp.module.ts
3. Update 
est-cli.json with the assets configuration (already done)

### 4. Build & Test
`ash
cd server
pnpm run build
pnpm test email.service.spec
pnpm run dev
`

### 5. Verify Installation
Check that templates are compiled:
`ash
ls -la dist/src/email/templates/
`

## File Structure

`
email-module/
├── email.module.ts                 # NestJS module
├── email.service.ts                # Core service
├── email.service.spec.ts           # Unit tests
├── INTEGRATION_EXAMPLE.ts          # Integration guide
├── README.md                       # Full documentation
├── dto/
│   ├── sent-email.dto.ts
│   ├── email-log.dto.ts
│   └── send-approval-email.dto.ts
└── templates/
    ├── approval-po.template.html
    ├── approval-borrow.template.html
    ├── rework-po.template.html
    ├── rework-borrow.template.html
    ├── completed-po.template.html
    └── completed-borrow.template.html
`

## Quick Usage

### Send Approval Request
`	ypescript
import { EmailService } from '@/src/email/email.service';

constructor(private emailService: EmailService) {}

async notifyApprovers(roleCode: string, poNo: string) {
  await this.emailService.sendApprovalRequestByRoleCode(
    roleCode,        // 'PO_APPROVER_L1'
    poNo,            // 'PO-2026-001'
    'PO',            // document type
    'PO Title',      // optional
    'Description'    // optional
  );
}
`

### Send Rework Notification
`	ypescript
import { ENotifyType } from '@/src/email/dto/send-approval-email.dto';

await this.emailService.sendApprovalEmail({
  notifyType: ENotifyType.PO_REWORK,
  documentId: poId,
  documentNo: 'PO-2026-001',
  documentType: 'PO',
  toEmployeeIds: [createdByEmployeeId],
  rejectedByName: rejectorName,
  additionalMessage: 'Please review and fix...',
});
`

### Send Completion Notification
`	ypescript
await this.emailService.sendApprovalEmail({
  notifyType: ENotifyType.PO_COMPLETED,
  documentId: poId,
  documentNo: 'PO-2026-001',
  documentType: 'PO',
  toEmployeeIds: [createdByEmployeeId],
  approvedByName: finalApproverName,
});
`

## Database Dependencies

Ensure your database contains:
- **approval_roles** - Maps role_code to approver_id
- **view_email** - Maps employee_id to email address
- **po_headers** - Contains created_by field
- **borrow_headers** - Contains created_by field

## Documentation

- **README.md** - Full feature documentation and API reference
- **INTEGRATION_EXAMPLE.ts** - Code examples for each workflow
- **.env.development.email-example** - Environment variables template

## Support

See README.md for:
- Architecture overview
- Complete API reference
- Error handling
- Performance considerations
- Troubleshooting guide

## Version
1.0.0 | Created: 2026-05-09
