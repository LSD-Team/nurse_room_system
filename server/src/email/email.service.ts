//  ----- 📖 Library 📖 -----
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';

//  ----- ⚙️ Services ⚙️ -----
import { DatabaseService } from '@/src/database/database.service';
import { EmailLogService } from '@/src/email/services/email-log.service';

//  ----- 📂 DTO 📂 -----
import { SendEmailDto } from '@/src/email/dto/sent-email.dto';
import { ISendApprovalEmailPayload, ENotifyType } from '@/src/email/dto/send-approval-email.dto';

@Injectable()
export class EmailService {
  //  💪 constructor
  private readonly logger = new Logger(EmailService.name);
  
  constructor(
    private readonly httpService: HttpService,
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly emailLogService: EmailLogService,
  ) {
    const testOverride = this.configService.get<string>('TEST_EMAIL_OVERRIDE');
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    this.logger.debug(
      `📧 EmailService initialized | NODE_ENV: ${nodeEnv} | TEST_EMAIL_OVERRIDE: ${testOverride ? '✅ ' + testOverride : '❌ NOT SET'}`
    );
  }

  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  /**
   * ส่ง email ไปยัง external email service
   */
  private async send_email_service(emailData: SendEmailDto): Promise<any> {
    try {
      const emailServiceUrl = this.configService.get<string>('EMAIL_SERVICE_URL');

      if (!emailServiceUrl) {
        throw new Error('EMAIL_SERVICE_URL is not configured');
      }

      const response = await firstValueFrom(
        this.httpService.post<any>(
          `${emailServiceUrl}/email/send`,
          emailData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // Handle response safely
      const responseData = response?.data || response;
      if (!responseData) {
        throw new Error('Email service returned empty response');
      }

      return responseData;
    } catch (error: any) {
      const errorMsg = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;

      this.logger.error(
        `❌ Failed to send email: ${errorMsg}`,
        error.stack,
      );

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * ดึง email จาก employee IDs
   */
  private async getEmailsByEmployeeIds(employeeIds: string[]): Promise<string[]> {
    if (!employeeIds || employeeIds.length === 0) {
      return [];
    }

    const placeholders = employeeIds.map((_, i) => `@param${i}`).join(',');
    // Query view_employee_all directly since po_headers.created_by stores numeric IDs
    // view_employee_all joins to email via IT database
    const query = `
      SELECT DISTINCT vea.email
      FROM view_employee_all vea
      WHERE CAST(vea.ID AS nvarchar(100)) IN (${placeholders})
      AND vea.email IS NOT NULL
      AND vea.email != ''
    `;

    try {
      const results = await this.databaseService.query<{ email: string }>(
        this.DATABASE_NAME,
        query,
        employeeIds,
      );
      return results.map((r) => r.email);
    } catch (error: any) {
      this.logger.error(
        `Failed to get emails for employee IDs ${employeeIds}: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * ดึง email จาก role_code (approval_roles table)
   */
  private async getApproverEmailsByRoleCode(roleCode: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT vea.email
      FROM approval_roles ar
      JOIN view_employee_all vea ON ar.approver_id = vea.ID
      WHERE ar.role_code = @param0
      AND ar.is_active = 1
      AND vea.email IS NOT NULL
      AND vea.email != ''
    `;

    try {
      const results = await this.databaseService.query<{ email: string }>(
        this.DATABASE_NAME,
        query,
        [roleCode],
      );
      return results.map((r) => r.email);
    } catch (error: any) {
      this.logger.error(
        `Failed to get approver emails for role_code ${roleCode}: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * โหลด template จากไฟล์
   */
  private loadTemplate(templateFile: string): string {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'email',
        'templates',
        templateFile,
      );

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found at: ${templatePath}`);
      }

      return fs.readFileSync(templatePath, 'utf8');
    } catch (error: any) {
      this.logger.error(
        `Failed to load email template ${templateFile}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * สร้าง HTML template โดยแทนที่ placeholder (รองรับ Handlebars if conditionals)
   */
  private renderTemplate(
    template: string,
    variables: Record<string, string | number | boolean>,
  ): string {
    let html = template;

    // Replace {{#if variable}}...{{/if}} blocks
    html = html.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, variable, content) => {
        const value = variables[variable];
        // Show content if value is truthy (not empty string, not 0, not false)
        return value ? content : '';
      },
    );

    // Replace simple {{variable}} placeholders
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      html = html.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return html;
  }

  /**
   * สร้างหัวเรื่องตาม notify type
   */
  private buildSubject(documentNo: string, notifyType: ENotifyType): string {
    let suffix = '';

    switch (notifyType) {
      case ENotifyType.APPROVAL_PO:
        suffix = 'Waiting for Approval - PO';
        break;
      case ENotifyType.APPROVAL_BORROW:
        suffix = 'Waiting for Approval - Borrow';
        break;
      case ENotifyType.PO_REWORK:
        suffix = 'Rework Required - PO';
        break;
      case ENotifyType.BORROW_REWORK:
        suffix = 'Rework Required - Borrow';
        break;
      case ENotifyType.PO_COMPLETED:
        suffix = 'Approved - PO';
        break;
      case ENotifyType.BORROW_COMPLETED:
        suffix = 'Approved - Borrow';
        break;
      case ENotifyType.APPROVAL_PHYSICAL_COUNT:
        suffix = 'Waiting for Approval - Physical Count';
        break;
      case ENotifyType.PHYSICAL_COUNT_APPROVED:
        suffix = 'Approved - Physical Count';
        break;
      case ENotifyType.PHYSICAL_COUNT_REJECTED:
        suffix = 'Rejected - Physical Count';
        break;
      default:
        suffix = 'Notification';
    }

    return `[Nurse Room System] ${documentNo} : ${suffix}`;
  }

  /**
   * หา template file ตาม notify type
   */
  private getTemplateFileByNotifyType(notifyType: ENotifyType): string {
    const templateMap: Record<ENotifyType, string> = {
      [ENotifyType.APPROVAL_PO]: 'approval-po.template.html',
      [ENotifyType.APPROVAL_BORROW]: 'approval-borrow.template.html',
      [ENotifyType.PO_REWORK]: 'rework-po.template.html',
      [ENotifyType.BORROW_REWORK]: 'rework-borrow.template.html',
      [ENotifyType.PO_COMPLETED]: 'completed-po.template.html',
      [ENotifyType.BORROW_COMPLETED]: 'completed-borrow.template.html',
      [ENotifyType.APPROVAL_PHYSICAL_COUNT]: 'approval-physical-count.template.html',
      [ENotifyType.PHYSICAL_COUNT_APPROVED]: 'approved-physical-count.template.html',
      [ENotifyType.PHYSICAL_COUNT_REJECTED]: 'rejected-physical-count.template.html',
    };

    const templateFile = templateMap[notifyType];
    if (!templateFile) {
      throw new Error(`Unknown notify type: ${notifyType}`);
    }

    return templateFile;
  }

  /**
   * ส่ง approval email
   * ใช้ NODE_ENV เพื่อตัดสินใจว่าส่งไปจริงหรือ test
   */
  async sendApprovalEmail(payload: ISendApprovalEmailPayload): Promise<void> {
    try {
      // Get TO emails
      const toEmails = await this.getEmailsByEmployeeIds(payload.toEmployeeIds);

      if (toEmails.length === 0) {
        this.logger.warn(
          `No emails found for approval notification: ${JSON.stringify(payload)}`,
        );
        return;
      }

      // Get CC emails
      const ccEmails = payload.ccEmployeeIds
        ? await this.getEmailsByEmployeeIds(payload.ccEmployeeIds)
        : [];

      // Load template
      const templateFile = this.getTemplateFileByNotifyType(payload.notifyType);
      const template = this.loadTemplate(templateFile);

      // Render template
      const variables = {
        document_no: payload.documentNo,
        document_type: payload.documentType,
        document_title: payload.documentTitle || '',
        document_description: payload.documentDescription || '',
        approved_by_name: payload.approvedByName || '',
        rejected_by_name: payload.rejectedByName || '',
        additional_message: payload.additionalMessage || '',
        sent_at: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }),
      };

      const html = this.renderTemplate(template, variables);

      // Build subject
      const subject = this.buildSubject(
        payload.documentNo,
        payload.notifyType,
      );

      // Test mode - redirect to test email
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
      const testEmailOverride = this.configService.get<string>('TEST_EMAIL_OVERRIDE');

      let finalToEmails = toEmails;
      let finalCcEmails = ccEmails;
      let isTestMode = false;

      if (!isProduction && testEmailOverride) {
        finalToEmails = [testEmailOverride];
        finalCcEmails = [];
        isTestMode = true;
        this.logger.debug(
          `🧪 Test mode: Redirecting email to ${testEmailOverride}. Original: ${toEmails.join(', ')}`,
        );
      }

      // Send email
      const emailData: SendEmailDto = {
        to: finalToEmails.join(','),
        cc: finalCcEmails.length > 0 ? finalCcEmails.join(',') : undefined,
        subject,
        html,
        sent_from_system: this.configService.get<string>('APP_NAME') || 'NURSE_ROOM_SYSTEM',
      };

      await this.send_email_service(emailData);

      // Create email log
      try {
        const notifyTypeStr = payload.notifyType as 'APPROVAL_PO' | 'APPROVAL_BORROW' | 'PO_REWORK' | 'BORROW_REWORK' | 'PO_COMPLETED' | 'BORROW_COMPLETED';
        const recipientEmails = finalToEmails.join(', ');
        await this.emailLogService.create({
          document_type: payload.documentType,
          document_id: payload.documentId,
          document_no: payload.documentNo,
          notify_type: notifyTypeStr,
          recipient_emails: recipientEmails,
          cc_emails: finalCcEmails.length > 0 ? finalCcEmails.join(', ') : undefined,
          subject: subject,
          sent_status: 'SUCCESS',
          is_test_override: isTestMode,
          sent_by_employee_id: payload.sentByEmployeeId || undefined,
        });
        this.logger.log(`✅ Email log created for approval email: ${payload.documentNo}`);
      } catch (logError) {
        this.logger.warn(`Failed to log approval email: ${logError.message}`);
      }

      this.logger.log(
        `✅ Approval email sent for ${payload.documentType} ${payload.documentNo}${isTestMode ? ' (TEST MODE)' : ''}`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to send approval email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * ส่ง approval request email โดยใช้ role_code
   */
  async sendApprovalRequestByRoleCode(
    roleCode: string,
    documentNo: string,
    documentType: 'PO' | 'BORROW',
    documentId: number,
    documentTitle: string,
    documentDescription: string,
    sentByEmployeeId?: string,
  ): Promise<void> {
    try {
      // Debug: Log the query params
      this.logger.debug(
        `[sendApprovalRequestByRoleCode] Querying approvers for role_code: ${roleCode}`,
      );

      const approverEmails = await this.getApproverEmailsByRoleCode(roleCode);

      if (approverEmails.length === 0) {
        this.logger.warn(
          `⚠️ No approvers found for role_code: ${roleCode}. Check approval_roles table and view_employee_all data.`,
        );
        return;
      }

      this.logger.debug(
        `[sendApprovalRequestByRoleCode] Found ${approverEmails.length} approver(s) for ${roleCode}: ${approverEmails.join(', ')}`,
      );

      // Load template
      const notifyType = documentType === 'PO' ? ENotifyType.APPROVAL_PO : ENotifyType.APPROVAL_BORROW;
      const templateFile = this.getTemplateFileByNotifyType(notifyType);
      const template = this.loadTemplate(templateFile);

      // Render template
      const variables = {
        document_no: documentNo,
        document_type: documentType,
        document_title: documentTitle,
        document_description: documentDescription,
        approved_by_name: '',
        rejected_by_name: '',
        additional_message: '',
        sent_at: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }),
      };

      const html = this.renderTemplate(template, variables);

      // Build subject
      const subject = this.buildSubject(documentNo, notifyType);

      // Test mode - redirect to test email
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
      const testEmailOverride = this.configService.get<string>('TEST_EMAIL_OVERRIDE');

      let finalToEmails = approverEmails;
      let isTestMode = false;

      if (!isProduction && testEmailOverride) {
        finalToEmails = [testEmailOverride];
        isTestMode = true;
        this.logger.debug(
          `🧪 Test mode: Redirecting email to ${testEmailOverride}. Original approvers: ${approverEmails.join(', ')}`,
        );
      }

      // Send email
      const emailData: SendEmailDto = {
        to: finalToEmails.join(','),
        subject,
        html,
        sent_from_system: this.configService.get<string>('APP_NAME') || 'NURSE_ROOM_SYSTEM',
      };

      await this.send_email_service(emailData);

      // Create email log
      try {
        const notifyTypeStr =
          documentType === 'PO' ? 'APPROVAL_PO' : 'APPROVAL_BORROW';
        await this.emailLogService.create({
          document_type: documentType,
          document_id: documentId,
          document_no: documentNo,
          notify_type: notifyTypeStr,
          recipient_emails: roleCode,
          subject: subject,
          sent_status: 'SUCCESS',
          is_test_override: isTestMode,
          sent_by_employee_id: sentByEmployeeId || undefined,
        });
        this.logger.log(`✅ Email log created for approval request: ${documentNo}`);
      } catch (logError) {
        this.logger.warn(`Failed to log approval request email: ${logError.message}`);
      }

      this.logger.log(
        `✅ Approval request email sent for ${documentType} ${documentNo} to ${roleCode}${isTestMode ? ' (TEST MODE)' : ''}`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to send approval request email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
