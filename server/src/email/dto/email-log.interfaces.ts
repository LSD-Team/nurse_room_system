/**
 * Email Log DTO - Data structure for saving email logs to database
 */

export interface IEmailLog {
  email_log_id?: number;
  document_type: 'PO' | 'BORROW';
  document_id: number;
  document_no: string;
  notify_type: 'APPROVAL_PO' | 'APPROVAL_BORROW' | 'PO_REWORK' | 'BORROW_REWORK' | 'PO_COMPLETED' | 'BORROW_COMPLETED';
  recipient_emails: string; // comma-separated: 'email1@x.com,email2@x.com'
  cc_emails?: string;
  bcc_emails?: string;
  subject: string;
  sent_status: 'PENDING' | 'SUCCESS' | 'FAILED';
  external_service_response?: string; // Full JSON response from external service
  error_message?: string;
  external_message_id?: string;
  is_test_override: boolean;
  test_override_original_email?: string; // Original emails before override
  sent_by_employee_id?: string;
  created_at?: Date;
  external_sent_at?: Date;
  retry_count?: number;
  last_retry_at?: Date;
}

export class CreateEmailLogDto {
  document_type: 'PO' | 'BORROW';
  document_id: number;
  document_no: string;
  notify_type: 'APPROVAL_PO' | 'APPROVAL_BORROW' | 'PO_REWORK' | 'BORROW_REWORK' | 'PO_COMPLETED' | 'BORROW_COMPLETED';
  recipient_emails: string;
  cc_emails?: string;
  bcc_emails?: string;
  subject: string;
  sent_status: 'PENDING' | 'SUCCESS' | 'FAILED';
  external_service_response?: string;
  error_message?: string;
  external_message_id?: string;
  is_test_override: boolean;
  test_override_original_email?: string;
  sent_by_employee_id?: string;
  retry_count?: number;
}

export class UpdateEmailLogDto {
  sent_status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  external_service_response?: string;
  error_message?: string;
  external_message_id?: string;
  external_sent_at?: Date;
  retry_count?: number;
  last_retry_at?: Date;
}

export class EmailLogResponse {
  email_log_id: number;
  document_type: string;
  document_id: number;
  document_no: string;
  notify_type: string;
  sent_status: string;
  created_at: Date;
  is_test_override: boolean;
}
