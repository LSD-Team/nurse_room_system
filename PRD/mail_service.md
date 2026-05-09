Mail Service Integration Guide (LSD-Request)

Purpose
-------
เอกสารนี้อธิบายการสร้างและการใช้งานระบบส่งอีเมลของโปรเจค "LSD-Request" โดยสรุปโครงสร้าง โดเมนข้อมูล (DTO), contract ของ API ภายนอกที่ใช้ส่งเมล, วิธีเตรียม template, ตัวอย่างโค้ดการเรียกใช้งาน และสคริปต์ทดสอบจริง (real email). ไฟล์นี้ออกแบบให้อ่านโดยทั้งมนุษย์และ AI เพื่อให้สามารถสร้างระบบส่งเมลที่ทำงานเหมือนตัวอย่างในโปรเจคได้อย่างครบถ้วน.

Architecture (สรุปการทำงาน)
----------------------------
1. EmailService (server/src/email/email.service.ts)
   - สร้าง HTML โดยอ่าน template จาก src/email/templates และแทนที่ตัวแปร (placeholders)
   - หาอีเมลผู้รับ (to) และสำเนา (cc) โดยเรียก EmployeeService.findHaveEmail() แล้วแม็ป ID -> email
   - สร้าง SendEmailDto และ POST ไปที่ภายนอก: ${EMAIL_SERVICE_URL}/email/send
   - ถ้า NODE_ENV != 'production' จะส่งไปที่ TEST_EMAIL_TO (ค่าใน .env) แทน
2. External Email Service
   - รับ POST /email/send (application/json) ตาม schema ของ SendEmailDto
   - ส่งอีเมลจริงผ่าน SMTP/provider และตอบกลับ EmailLogDto

Important files (ตำแหน่งใน repo)
---------------------------------
- E:\GitHub_Repo\LSD-Request\server\src\email\email.service.ts
- E:\GitHub_Repo\LSD-Request\server\src\email\email.module.ts
- E:\GitHub_Repo\LSD-Request\server\src\email\dto\sent-email.dto.ts
- E:\GitHub_Repo\LSD-Request\server\src\email\dto\email-log.dto.ts
- E:\GitHub_Repo\LSD-Request\server\src\email\templates\*.html (all templates used)
- E:\GitHub_Repo\LSD-Request\server\src\email\email.real-send-all-templates.spec.ts (jest test to send all templates)
- E:\GitHub_Repo\LSD-Request\server\scripts\test-email-real.js (helper script to run the jest spec with env overrides)
- E:\GitHub_Repo\LSD-Request\server\.env.development and .env.production
- E:\GitHub_Repo\LSD-Request\server\nest-cli.json (ensures templates are copied to dist)

Environment variables (สำคัญ)
-----------------------------
- EMAIL_SERVICE_URL — base URL ของ external email service (example: http://10.182.1.198/apis/lsd-smtp-service)
- NODE_ENV — 'production' หรืออื่นๆ (ถ้าไม่ใช่ production จะใช้ TEST_EMAIL_TO)
- RUN_REAL_EMAIL_TEMPLATE_TEST — (boolean) ถ้า true จะรัน test ที่ส่งเมลจริง
- TEST_EMAIL_TO — รายการอีเมลสำหรับทดสอบ (development)
- TEST_EMAIL_CC — รายการ CC สำหรับทดสอบ (development)
- APP_NAME — ค่า sent_from_system ที่จะส่งไปกับเมล

DTOs / Contract
----------------
SendEmailDto (request body sent to external service)
```ts
// server/src/email/dto/sent-email.dto.ts
export class SendEmailDto {
  to: string | string[]; // project uses comma-separated string but should accept array too
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string; // HTML body
  sent_from_system: string;
}
```
Notes: current EmailService passes `to` and `cc` as comma-separated strings ("a@x.com,b@y.com"). External service SHOULD accept either comma-separated strings or arrays and normalize them.

EmailLogDto (response from external service)
```ts
export class EmailLogDto {
  id: number;
  to_recipients: string;  // comma-separated
  cc_recipients: string | null;
  subject: string;
  body: string; // HTML
  sent_from_system: string;
  status: 'SUCCESS' | 'FAILED';
  error_message?: string | null;
  sent_at: Date;
}
```

External API contract
---------------------
- Endpoint: POST {EMAIL_SERVICE_URL}/email/send
- Content-Type: application/json
- Request body: SendEmailDto (JSON)
- Response: EmailLogDto (JSON)

Example request (JSON):
```json
{
  "to": "qa@company.com,lead@company.com",
  "cc": "mgr@company.com",
  "subject": "LSD Request No. #123 : Approve",
  "html": "<h1>...</h1>",
  "sent_from_system": "LSD_REQUEST"
}
```
Example response (success):
```json
{
  "id": 101,
  "to_recipients": "qa@company.com,lead@company.com",
  "cc_recipients": "mgr@company.com",
  "subject": "LSD Request No. #123 : Approve",
  "body": "<h1>...</h1>",
  "sent_from_system": "LSD_REQUEST",
  "status": "SUCCESS",
  "error_message": null,
  "sent_at": "2026-05-09T00:00:00.000Z"
}
```

Template system
---------------
- Templates are plain HTML files located at: src/email/templates/*.html
- EmailService.template(...) picks template by notify type and then does placeholder replacements.
- Supported placeholders (replaceable):
  - {{request_id}}
  - {{request_title}}
  - {{request_description}}
  - {{request_system_name}}
  - {{requestor_name}}
  - {{days_elapsed}} (for APPROVAL-DAILY)
  - {{rejector_name}} (for REJECTED / notify rejected)
  - {{action_by}} (for COMPLETED)
  - {{additional_message}} (for messages)

Notify type -> template mapping (from code):
- APPROVAL -> approval.template.html
- ASSIGNMENT -> assignment.template.html
- CF-ASSIGN -> confirm-assignment.template.html
- ON-PROCESS -> on-process.template.html
- COMPLETED -> completed.template.html
- REJECTED -> rejected.template.html
- CONCERN -> concern.template.html
- CANCEL-CONCERN -> cancel-concern.template.html
- NOTIFY-APPROVER-COMPLETED -> notify.approver.completed.template.html
- NOTIFY-APPROVER-REJECTED -> notify.approver.rejected.template.html
- NOTIFY-CONCERNER-COMPLETED -> notify.concerner.completed.template.html
- NOTIFY-CONCERNER-REJECTED -> notify.concerner.rejected.template.html
- APPROVAL-DAILY -> approval.daily.template.html
- PROCESS-NOTIFY -> process.notify.template.html

Subject format (EmailService builds subject):
- Prefix: `LSD Request No. #${request_id} : `
- Suffix depends on notify type (e.g., 'Approve', 'Assignment', 'Completed', 'Reject', 'Concern', ...). Match the mapping in email.service.ts.

Template path note
------------------
email.service.ts resolves templates with:
```ts
const templatePath = path.join(process.cwd(), 'src', 'email', 'templates', templateFile);
```
When compiled, ensure templates are copied into dist/src/email/templates. The repo's nest-cli.json already includes an asset copy rule: "include": "email/templates/*.html", "outDir": "dist/src".

How EmailService finds recipients
--------------------------------
- EmailService calls EmployeeService.findHaveEmail(), expects array of employees with fields { ID, email }.
- It maps given TO_ID and CC_ID arrays to email addresses and joins them with commas.
- If no recipients found, it logs a warning and does not call external service.

Usage (NestJS example)
----------------------
1. Import EmailModule into your module (email.module.ts already exports EmailService)
2. Inject EmailService and call:
```ts
const html = emailService.template(
  request_id, title, description, systemName, requestorName, notifyType,
  daysElapsed, rejectorName, additionalMessage, actionBy,
);
await emailService.sent(toIdsArray, ccIdsArray, notifyType, html, request_id);
```
- toIdsArray and ccIdsArray are arrays of employee IDs (EmailService will map to email addresses via EmployeeService).

Running real-template test (example)
------------------------------------
Use the helper script to run the jest spec which sends each template to provided addresses.
Example:
```
pnpm run test:email:real -- --to qa@company.com --cc lead@company.com --url http://10.182.1.198/apis/lsd-smtp-service
```
The script (server/scripts/test-email-real.js) sets env vars RUN_REAL_EMAIL_TEMPLATE_TEST=true and TEST_EMAIL_TO/CC and runs jest on email.real-send-all-templates.spec.ts.

How to implement the external email service
------------------------------------------
Minimum contract to satisfy EmailService in this repo:
- Endpoint: POST /email/send
- Accept body per SendEmailDto (either comma-separated string or array for to/cc)
- Send email using your provider (SMTP, SendGrid, SES, etc.)
- Return EmailLogDto with status 'SUCCESS' or 'FAILED' and sent_at timestamp

Minimal Express + nodemailer example (outline):
```js
// POST /email/send
app.post('/email/send', async (req, res) => {
  const { to, cc, bcc, subject, html, sent_from_system } = req.body;
  const toList = Array.isArray(to) ? to : to.split(',').map(s => s.trim()).filter(Boolean);
  // use nodemailer to send
  try {
    await transporter.sendMail({ to: toList, cc, bcc, subject, html });
    res.json({ id: 1, to_recipients: toList.join(','), cc_recipients: cc||null, subject, body: html, sent_from_system, status: 'SUCCESS', error_message: null, sent_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ id: 0, to_recipients: toList.join(','), cc_recipients: cc||null, subject, body: html, sent_from_system, status: 'FAILED', error_message: err.message, sent_at: new Date().toISOString() });
  }
});
```
Also accept and document SMTP config via env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.

Integration checklist for other projects / AI
-------------------------------------------
- Provide an EmployeeService or equivalent that can map employee IDs to email addresses.
- Provide templates at src/email/templates and ensure they are bundled into built output (dist/src/email/templates) or change template resolution accordingly.
- Configure env vars: EMAIL_SERVICE_URL, APP_NAME, NODE_ENV; for testing set RUN_REAL_EMAIL_TEMPLATE_TEST and TEST_EMAIL_TO/CC.
- Implement external email service POST /email/send that accepts SendEmailDto and returns EmailLogDto.
- Make sure to handle both comma-separated strings and arrays for to/cc.
- Respect validation: only valid email formats should be accepted; return meaningful error_message on failures.

Notes & Recommendations
-----------------------
- Prefer arrays for `to`/`cc` in a new implementation (but accept comma-separated for compatibility).
- Deduplicate addresses before sending.
- Use retry/backoff on transient SMTP/provider failures and return clear error messages in EmailLogDto.
- Keep templates simple and avoid inline scripts. Use placeholders documented above.
- Ensure logging of requests/responses for troubleshooting.

Contact / Reference
-------------------
Implementation reference: server/src/email/email.service.ts (follow logic for subject, template selection, NODE_ENV test override, and send flow).

-- End of mail_service.md
