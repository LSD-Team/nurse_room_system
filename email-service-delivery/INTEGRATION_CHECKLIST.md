# 📋 Integration Checklist

- [ ] Copy mail-module folder to server/src/email/
- [ ] Update .env with EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
- [ ] Run pnpm add @nestjs/axios axios in server directory
- [ ] Verify pp.module.ts imports EmailModule
- [ ] Verify 
est-cli.json has email templates asset configuration
- [ ] Run pnpm run build and verify templates in dist/src/email/templates/
- [ ] Run pnpm test email.service.spec to verify tests pass
- [ ] Read INTEGRATION_EXAMPLE.ts for integration patterns
- [ ] Inject EmailService into your approval services
- [ ] Add email notifications to approval workflow methods
- [ ] Test with external email service URL
- [ ] Configure real approver emails in pproval_roles and iew_email

## Integration Points

### For PO Module
- [ ] Add email notification in po.service.ts after PO creation
- [ ] Add rework notification when PO is rejected
- [ ] Add completion notification when PO is finally approved

### For Borrow Module
- [ ] Add email notification in orrow.service.ts after Borrow creation
- [ ] Add rework notification when Borrow is rejected
- [ ] Add completion notification when Borrow is finally approved

### For Approval Module
- [ ] Integrate email sending in approval/rejection endpoints
- [ ] Handle multiple approval levels with proper notifications

## Testing Checklist

- [ ] Email service initializes without errors
- [ ] Templates load and render correctly
- [ ] Employee emails are fetched from database
- [ ] Approver emails are fetched by role_code
- [ ] External service receives POST request with correct format
- [ ] Error handling works for missing recipients
- [ ] Error handling works for invalid email service URL
