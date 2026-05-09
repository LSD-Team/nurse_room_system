import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import { CreateEmailLogDto, UpdateEmailLogDto, EmailLogResponse } from '@/src/email/dto/email-log.interfaces';

/**
 * Email Log Service - จัดการบันทึกการส่ง email ทั้งหมด
 * บันทึกข้อมูลการส่ง email ลงในตาราง email_logs เพื่อติดตาม status และประวัติ
 */
@Injectable()
export class EmailLogService {
  private readonly logger = new Logger(EmailLogService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  /**
   * สร้างบันทึก email log ใหม่
   * @param createEmailLogDto ข้อมูลสำหรับสร้าง log
   * @returns email_log_id ที่สร้างขึ้น
   */
  async create(createEmailLogDto: CreateEmailLogDto): Promise<number> {
    try {
      const {
        document_type,
        document_id,
        document_no,
        notify_type,
        recipient_emails,
        cc_emails,
        bcc_emails,
        subject,
        sent_status = 'PENDING',
        external_service_response,
        error_message,
        external_message_id,
        is_test_override,
        test_override_original_email,
        sent_by_employee_id,
        retry_count = 0,
      } = createEmailLogDto;

      const ccEmailsStr = cc_emails ? `'${cc_emails}'` : 'NULL';
      const bccEmailsStr = bcc_emails ? `'${bcc_emails}'` : 'NULL';
      const responseStr = external_service_response ? `'${external_service_response.replace(/'/g, "''")}'` : 'NULL';
      const errorStr = error_message ? `'${error_message.replace(/'/g, "''")}'` : 'NULL';
      const messageIdStr = external_message_id ? `'${external_message_id}'` : 'NULL';
      const originalEmailStr = test_override_original_email ? `'${test_override_original_email.replace(/'/g, "''")}'` : 'NULL';
      const sentByStr = sent_by_employee_id ? sent_by_employee_id : 'NULL';

      const sql = `
        INSERT INTO email_logs (
          document_type,
          document_id,
          document_no,
          notify_type,
          recipient_emails,
          cc_emails,
          bcc_emails,
          subject,
          sent_status,
          external_service_response,
          error_message,
          external_message_id,
          is_test_override,
          test_override_original_email,
          sent_by_employee_id,
          retry_count
        ) VALUES (
          '${document_type}',
          ${document_id},
          '${document_no}',
          '${notify_type}',
          '${recipient_emails.replace(/'/g, "''")}',
          ${ccEmailsStr},
          ${bccEmailsStr},
          '${subject.replace(/'/g, "''")}',
          '${sent_status}',
          ${responseStr},
          ${errorStr},
          ${messageIdStr},
          ${is_test_override ? 1 : 0},
          ${originalEmailStr},
          ${sentByStr},
          ${retry_count}
        );
        SELECT SCOPE_IDENTITY() as email_log_id;
      `;

      const result = await this.databaseService.query<{ email_log_id: number }>(
        this.DATABASE_NAME,
        sql,
      );

      const emailLogId = result[0]?.email_log_id;
      this.logger.log(
        `✅ Email log created: ID=${emailLogId}, Document=${document_type}-${document_no}, Status=${sent_status}`,
      );

      return emailLogId;
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to create email log: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * อัพเดท status ของ email log
   * @param emailLogId ตัวระบุ log
   * @param updateEmailLogDto ข้อมูลที่ต้องการอัพเดท
   */
  async update(
    emailLogId: number,
    updateEmailLogDto: UpdateEmailLogDto,
  ): Promise<void> {
    try {
      const {
        sent_status,
        external_service_response,
        error_message,
        external_message_id,
        external_sent_at,
        retry_count,
        last_retry_at,
      } = updateEmailLogDto;

      const updates: string[] = [];

      if (sent_status !== undefined) {
        updates.push(`sent_status = '${sent_status}'`);
      }

      if (external_service_response !== undefined) {
        const responseStr = external_service_response 
          ? `'${external_service_response.replace(/'/g, "''")}'` 
          : 'NULL';
        updates.push(`external_service_response = ${responseStr}`);
      }

      if (error_message !== undefined) {
        const errorStr = error_message ? `'${error_message.replace(/'/g, "''")}'` : 'NULL';
        updates.push(`error_message = ${errorStr}`);
      }

      if (external_message_id !== undefined) {
        const idStr = external_message_id ? `'${external_message_id}'` : 'NULL';
        updates.push(`external_message_id = ${idStr}`);
      }

      if (external_sent_at !== undefined) {
        updates.push(`external_sent_at = '${external_sent_at.toISOString()}'`);
      }

      if (retry_count !== undefined) {
        updates.push(`retry_count = ${retry_count}`);
      }

      if (last_retry_at !== undefined) {
        updates.push(`last_retry_at = '${last_retry_at.toISOString()}'`);
      }

      if (updates.length === 0) {
        this.logger.warn(`No fields to update for email log ID: ${emailLogId}`);
        return;
      }

      const sql = `UPDATE email_logs SET ${updates.join(', ')} WHERE email_log_id = ${emailLogId}`;
      await this.databaseService.query<any>(this.DATABASE_NAME, sql);

      this.logger.debug(
        `✅ Email log updated: ID=${emailLogId}, Status=${sent_status}`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to update email log ${emailLogId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * ดึงข้อมูล email log โดย ID
   */
  async findById(emailLogId: number): Promise<any> {
    try {
      const sql = `SELECT * FROM email_logs WHERE email_log_id = ${emailLogId}`;
      const result = await this.databaseService.query<any>(this.DATABASE_NAME, sql);
      return result[0] || null;
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to find email log ${emailLogId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * ดึงข้อมูล email log สำหรับเอกสาร (PO/Borrow)
   */
  async findByDocument(
    documentType: 'PO' | 'BORROW',
    documentId: number,
  ): Promise<any[]> {
    try {
      const sql = `
        SELECT * FROM email_logs 
        WHERE document_type = '${documentType}' AND document_id = ${documentId}
        ORDER BY created_at DESC
      `;
      return await this.databaseService.query<any>(this.DATABASE_NAME, sql);
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to find email logs for ${documentType}-${documentId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * ดึงสรุปสถิติของ email ทั้งหมด
   */
  async getStatistics(): Promise<any[]> {
    try {
      const sql = `
        SELECT 
          sent_status,
          COUNT(*) as count,
          CONVERT(VARCHAR, CAST(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM email_logs) AS DECIMAL(5,2))) + '%' as percentage
        FROM email_logs
        GROUP BY sent_status
      `;
      return await this.databaseService.query<any>(this.DATABASE_NAME, sql);
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to get email statistics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * ดึงข้อมูล email ที่ล้มเหลว (สำหรับ retry)
   */
  async getFailedEmails(limit: number = 100): Promise<any[]> {
    try {
      const sql = `
        SELECT TOP ${limit} * FROM email_logs 
        WHERE sent_status = 'FAILED' AND retry_count < 3
        ORDER BY created_at ASC
      `;
      return await this.databaseService.query<any>(this.DATABASE_NAME, sql);
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to get failed emails: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * ดึงสรุปการส่ง email โดย notify type
   */
  async getStatisticsByNotifyType(): Promise<any[]> {
    try {
      const sql = `
        SELECT 
          notify_type,
          COUNT(*) as total,
          SUM(CASE WHEN sent_status = 'SUCCESS' THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN sent_status = 'FAILED' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN is_test_override = 1 THEN 1 ELSE 0 END) as test_emails
        FROM email_logs
        GROUP BY notify_type
        ORDER BY total DESC
      `;
      return await this.databaseService.query<any>(this.DATABASE_NAME, sql);
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to get statistics by notify type: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * ดึงประวัติส่ง email ในช่วงเวลาที่กำหนด
   */
  async getEmailHistory(
    fromDate: Date,
    toDate: Date,
    limit: number = 100,
  ): Promise<any[]> {
    try {
      const fromStr = fromDate.toISOString();
      const toStr = toDate.toISOString();

      const sql = `
        SELECT TOP ${limit} 
          email_log_id,
          document_no,
          notify_type,
          recipient_emails,
          sent_status,
          is_test_override,
          created_at
        FROM email_logs 
        WHERE created_at BETWEEN '${fromStr}' AND '${toStr}'
        ORDER BY created_at DESC
      `;
      return await this.databaseService.query<any>(this.DATABASE_NAME, sql);
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to get email history: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

