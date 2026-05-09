# 📧 Email Logging Service - User Guide

## Overview
Email Log Service บันทึกข้อมูลการส่ง email ทั้งหมดเพื่อสามารถติดตาม status การส่ง, debug ปัญหา และตรวจสอบประวัติการสื่อสาร

---

## Database Schema

### Table: `email_logs`
| Column | Type | Description |
|--------|------|-------------|
| `email_log_id` | INT (PK) | ตัวระบุ log ที่ไม่ซ้ำกัน |
| `document_type` | NVARCHAR(50) | ประเภทเอกสาร: 'PO' หรือ 'BORROW' |
| `document_id` | INT | ID ของเอกสาร (po_id / borrow_id) |
| `document_no` | NVARCHAR(50) | เลขที่เอกสาร (PO-2026-001) |
| `notify_type` | NVARCHAR(50) | ประเภทการแจ้ง (APPROVAL_PO, REWORK_BORROW, etc.) |
| `recipient_emails` | NVARCHAR(MAX) | อีเมลผู้รับ (comma-separated) |
| `cc_emails` | NVARCHAR(MAX) | อีเมล CC ผู้รับสำเนา |
| `bcc_emails` | NVARCHAR(MAX) | อีเมล BCC ผู้รับสำเนาลับ |
| `subject` | NVARCHAR(500) | หัวเรื่อง email |
| `sent_status` | NVARCHAR(20) | สถานะ: PENDING, SUCCESS, FAILED |
| `external_service_response` | NVARCHAR(MAX) | Full JSON response จาก external service |
| `error_message` | NVARCHAR(MAX) | ข้อความ error (ถ้า FAILED) |
| `external_message_id` | NVARCHAR(500) | Message ID จาก external service |
| `is_test_override` | BIT | 1 = ใช้ test email override, 0 = production |
| `test_override_original_email` | NVARCHAR(MAX) | Original emails ก่อนเปลี่ยน override |
| `sent_by_employee_id` | INT | Employee ID ที่ trigger การส่ง (optional) |
| `created_at` | DATETIME | เวลาที่สร้าง log |
| `external_sent_at` | DATETIME | เวลาที่ external service ส่งสำเร็จ |
| `retry_count` | INT | จำนวน retry (default: 0) |
| `last_retry_at` | DATETIME | เวลา retry ครั้งล่าสุด |

---

## Setup - สร้างตาราง

### 1. Run SQL Script
```bash
# ตรวจสอบก่อน: ไปที่ server/src/email/migrations/
# Execute: create-email-logs-table.sql
```

**ใน SQL Server Management Studio:**
```sql
-- Copy and run content from:
-- server/src/email/migrations/create-email-logs-table.sql

-- Verify:
SELECT * FROM email_logs;  -- Should be empty
```

### 2. Update Environment
```bash
# ตรวจสอบ .env มีตัวแปรเหล่านี้:
EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service
TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th   # (for testing)
NODE_ENV=development
```

---

## Features - ฟีเจอร์ที่มี

### ✅ Automatic Logging
- ทุกครั้งที่ส่ง email จะบันทึก log โดยอัตโนมัติ
- บันทึก PENDING ก่อน → อัพเดทเป็น SUCCESS/FAILED หลังจากส่ง

### ✅ Test Override Tracking
- บันทึกว่าใช้ test email override หรือไม่ (is_test_override)
- บันทึก original recipients ก่อน override (test_override_original_email)
- ช่วยให้ verify ว่า test mode ทำงาน

### ✅ Error Tracking
- บันทึก error_message เมื่อส่ง email ล้มเหลว
- บันทึก response จาก external service เต็ม
- บันทึก retry_count และ last_retry_at

### ✅ Full Audit Trail
- เก็บประวัติทั้งหมด (created_at, external_sent_at, etc.)
- ติดตาม flow ทั้งหมดตั้งแต่ pending → success/failed

---

## API Endpoints - REST Query

### 1. Get Email Log by ID
```
GET /email-logs/:id
```

**Example:**
```bash
curl http://localhost:3000/email-logs/5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "email_log_id": 5,
    "document_type": "PO",
    "document_id": 1,
    "document_no": "PO-2026-001",
    "notify_type": "APPROVAL_PO",
    "recipient_emails": "wayroad@shindengen.co.th",
    "subject": "[Nurse Room System] PO-2026-001 : Waiting for Approval - PO",
    "sent_status": "SUCCESS",
    "is_test_override": 1,
    "test_override_original_email": "approver1@x.com,approver2@x.com",
    "created_at": "2026-05-09T10:15:00.000Z",
    "external_sent_at": "2026-05-09T10:15:02.000Z"
  }
}
```

---

### 2. Get Logs for Document
```
GET /email-logs/document/:documentType/:documentId
```

**Example:**
```bash
curl http://localhost:3000/email-logs/document/PO/1
```

**Shows all emails sent related to PO ID 1:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    { "email_log_id": 1, "notify_type": "APPROVAL_PO", "sent_status": "SUCCESS", "created_at": "..." },
    { "email_log_id": 2, "notify_type": "PO_REWORK", "sent_status": "SUCCESS", "created_at": "..." },
    { "email_log_id": 3, "notify_type": "PO_COMPLETED", "sent_status": "SUCCESS", "created_at": "..." }
  ]
}
```

---

### 3. Overall Statistics
```
GET /email-logs/stats/all
```

**Shows success/failed rate:**
```json
{
  "success": true,
  "data": [
    { "sent_status": "SUCCESS", "count": 95, "percentage": "95%" },
    { "sent_status": "FAILED", "count": 5, "percentage": "5%" },
    { "sent_status": "PENDING", "count": 0, "percentage": "0%" }
  ]
}
```

---

### 4. Statistics by Notification Type
```
GET /email-logs/stats/by-type
```

**Shows breakdown by email type:**
```json
{
  "success": true,
  "data": [
    {
      "notify_type": "APPROVAL_PO",
      "total": 45,
      "success": 44,
      "failed": 1,
      "test_emails": 20
    },
    {
      "notify_type": "PO_REWORK",
      "total": 15,
      "success": 15,
      "failed": 0,
      "test_emails": 8
    },
    ...
  ]
}
```

---

### 5. Failed Emails (for Retry)
```
GET /email-logs/failed?limit=50
```

**Shows emails that failed (retry_count < 3):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "email_log_id": 42,
      "document_no": "PO-2026-005",
      "error_message": "Connection timeout",
      "retry_count": 0,
      "created_at": "2026-05-09T09:15:00.000Z"
    },
    ...
  ]
}
```

---

### 6. Email History by Date Range
```
GET /email-logs/history?from=2026-05-09T00:00:00Z&to=2026-05-09T23:59:59Z&limit=100
```

**Shows all emails in date range:**
```json
{
  "success": true,
  "count": 23,
  "data": [
    {
      "email_log_id": 1,
      "document_no": "PO-2026-001",
      "notify_type": "APPROVAL_PO",
      "sent_status": "SUCCESS",
      "is_test_override": 1,
      "created_at": "2026-05-09T10:15:00.000Z"
    },
    ...
  ]
}
```

---

## Database Queries - SQL Examples

### Query 1: Summary by Status
```sql
SELECT 
  sent_status,
  COUNT(*) as count,
  AVG(DATEDIFF(SECOND, created_at, external_sent_at)) as avg_response_time_sec
FROM email_logs
GROUP BY sent_status;
```

### Query 2: Find Failed Emails
```sql
SELECT 
  email_log_id,
  document_no,
  error_message,
  created_at
FROM email_logs
WHERE sent_status = 'FAILED'
ORDER BY created_at DESC;
```

### Query 3: Test Mode Usage
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_test_override = 1 THEN 1 ELSE 0 END) as test_mode,
  SUM(CASE WHEN is_test_override = 0 THEN 1 ELSE 0 END) as production
FROM email_logs;
```

### Query 4: Email Volume by Type
```sql
SELECT 
  notify_type,
  COUNT(*) as count,
  SUM(CASE WHEN sent_status = 'SUCCESS' THEN 1 ELSE 0 END) as success_count,
  CAST(SUM(CASE WHEN sent_status = 'SUCCESS' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) as success_rate
FROM email_logs
GROUP BY notify_type
ORDER BY count DESC;
```

### Query 5: Retry Analysis
```sql
SELECT 
  document_type,
  COUNT(DISTINCT document_id) as unique_documents,
  MAX(retry_count) as max_retries,
  AVG(retry_count) as avg_retries
FROM email_logs
WHERE sent_status = 'FAILED'
GROUP BY document_type;
```

---

## Integration - วิธีใช้ใน Code

### ใน EmailService
ตัวอักษรบันทึกเกิดขึ้นโดยอัตโนมัติ:

```typescript
await this.sendApprovalEmail({
  notifyType: ENotifyType.APPROVAL_PO,
  documentId: 1,
  documentNo: 'PO-2026-001',
  documentType: 'PO',
  toEmployeeIds: [123, 456],
  // ... other fields
});

// 🔄 Automatic logging:
// 1. Create log with PENDING status
// 2. Send email to external service
// 3. Update log to SUCCESS (with response)
// 4. Or update log to FAILED (with error)
```

### ใน Controller (Optional - Inject EmailLogService)
```typescript
import { EmailLogService } from '@/src/email/services/email-log.service';

constructor(private emailLogService: EmailLogService) {}

// Query statistics
const stats = await this.emailLogService.getStatistics();

// Get failed emails for retry
const failed = await this.emailLogService.getFailedEmails(100);

// Get history for audit
const history = await this.emailLogService.getEmailHistory(
  new Date('2026-05-01'),
  new Date('2026-05-31')
);
```

---

## Testing Workflow

### Phase 1: Development with Test Override
```
1. Set TEST_EMAIL_OVERRIDE=wayroad@shindengen.co.th
2. Send emails (they redirect to wayroad@)
3. Check logs: is_test_override=1
4. Verify template rendering at wayroad@
```

### Phase 2: Production
```
1. Remove TEST_EMAIL_OVERRIDE from .env
2. Set NODE_ENV=production
3. Send emails (go to real recipients)
4. Check logs: is_test_override=0
5. Monitor success/failed rates
```

---

## Troubleshooting

### ❌ No logs appearing in database
```sql
-- Check if email_logs table exists
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'email_logs';

-- Check if EmailLogService is injected in EmailModule
-- Check application logs for errors
```

### ❌ All emails marked as FAILED
```sql
-- Check error messages
SELECT email_log_id, document_no, error_message 
FROM email_logs 
WHERE sent_status = 'FAILED' 
LIMIT 10;

-- Verify EMAIL_SERVICE_URL is correct
-- Check if external email service is running
```

### ❌ Logs created but not updated to SUCCESS
```sql
-- Check if external_sent_at is NULL
SELECT email_log_id, external_sent_at, sent_status 
FROM email_logs 
WHERE sent_status != 'FAILED' 
AND external_sent_at IS NULL;

-- Check if EmailLogService.update() was called
-- Check application logs
```

---

## Performance Considerations

- **Indexes created:** document_type, created_at, notify_type, sent_status
- **Retention:** All logs are kept (no auto-delete)
- **Disk space:** ~1KB per log entry
- **Query time:** Should return results in <100ms for most queries

---

## Next Steps

1. ✅ Run create-email-logs-table.sql in your database
2. ✅ Restart application (EmailLogService will be injected)
3. ✅ Send test emails
4. ✅ Verify logs appear in email_logs table
5. ✅ Query API endpoints to view logs
6. ✅ Switch to production (remove test override)
