//  ----- 📖 Library 📖 -----
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';

//  ----- ⚙️ Services ⚙️ -----
import { DatabaseService } from '@/src/database/database.service';

//  ----- 📂 DTO 📂 -----
import { EmailLogDto } from '@/src/email/dto/email-log.dto';
import { SendEmailDto } from '@/src/email/dto/sent-email.dto';
import { ENotifyType, ISendApprovalEmailPayload } from '@/src/email/dto/send-approval-email.dto';

@Injectable()
export class EmailService {
  constructor(
    private readonly httpService: HttpService,
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(EmailService.name);
  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  /**
   * ส่ง email ไปยัง external email service
   */
  private async sendEmailService(
    emailData: SendEmailDto,
  ): Promise<EmailLogDto> {
    try {
      const emailServiceUrl =
        this.configService.get<string>('EMAIL_SERVICE_URL');

      if (!emailServiceUrl) {
        throw new Error('EMAIL_SERVICE_URL is not configured');
      }

      const response = await firstValueFrom(
        this.httpService.post<EmailLogDto>(
          `${emailServiceUrl}/email/send`,
          emailData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return response.data as EmailLogDto;
    } catch (error: any) {
      if (error.response) {
        this.logger.error(
          `Failed to send email: ${error.message}. Response: ${JSON.stringify(error.response.data)}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Failed to send email: ${error.message}`,
          error.stack,
        );
      }
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * ดึง email จากฐานข้อมูล โดยใช้ employee IDs
   */
  private async getEmailsByEmployeeIds(employeeIds: number[]): Promise<string[]> {
    if (!employeeIds || employeeIds.length === 0) {
      return [];
    }

    const query = `
      SELECT DISTINCT email 
      FROM view_email 
      WHERE employee_id IN (${employeeIds.join(',')})
      AND email IS NOT NULL
      AND email != ''
    `;

    try {
      const results = await this.databaseService.query<{ email: string }>(
        this.DATABASE_NAME,
        query,
      );
      const emails = results.map((r) => r.email);
      
      // Override emails in non-production for testing
      return this.overrideEmailsForTesting(emails);
    } catch (error: any) {
      this.logger.error(
        `Failed to get emails for employee IDs ${employeeIds}: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Override emails to test email if in development/testing mode
   */
  private overrideEmailsForTesting(emails: string[]): string[] {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      return emails;
    }

    const testEmailOverride =
      this.configService.get<string>('TEST_EMAIL_OVERRIDE');

    if (testEmailOverride) {
      this.logger.debug(
        `Test mode: Redirecting ${emails.length} email(s) to: ${testEmailOverride}`,
      );
      return [testEmailOverride];
    }

    return emails;
  }

  /**
   * ดึง email จากตาราง approval_roles ตาม role_code
   */
  private async getApproverEmailsByRoleCode(roleCode: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT ve.email
      FROM approval_roles ar
      JOIN view_email ve ON ar.approver_id = ve.employee_id
      WHERE ar.role_code = '${roleCode}'
      AND ar.is_active = 1
      AND ve.email IS NOT NULL
      AND ve.email != ''
    `;

    try {
      const results = await this.databaseService.query<{ email: string }>(
        this.DATABASE_NAME,
        query,
      );
      const emails = results.map((r) => r.email);
      
      // Override emails in non-production for testing
      return this.overrideEmailsForTesting(emails);
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
   * สร้าง HTML template โดยแทนที่ placeholder
   */
  private renderTemplate(
    template: string,
    variables: Record<string, string | number>,
  ): string {
    let html = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      html = html.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return html;
  }

  /**
   * สร้างหัวเรื่องตาม notify type
   */
  private buildSubject(
    documentNo: string,
    notifyType: ENotifyType,
  ): string {
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
      default:
        suffix = 'Notification';
    }

    return `[Nurse Room System] ${documentNo} : ${suffix}`;
  }

  /**
   * ส่ง email for approval workflow
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
        sent_at: new Date().toLocaleString('th-TH'),
      };

      const html = this.renderTemplate(template, variables);

      // Build subject
      const subject = this.buildSubject(
        payload.documentNo,
        payload.notifyType,
      );

      // Send email
      const emailData: SendEmailDto = {
        to: toEmails.join(','),
        cc: ccEmails.length > 0 ? ccEmails.join(',') : undefined,
        subject,
        html,
        sent_from_system: this.configService.get<string>('APP_NAME') || 'NURSE_ROOM_SYSTEM',
      };

      await this.sendEmailService(emailData);
      this.logger.log(
        `Email sent successfully for ${payload.documentType} ${payload.documentNo}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send approval email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
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
    };

    const templateFile = templateMap[notifyType];
    if (!templateFile) {
      throw new Error(`Unknown notify type: ${notifyType}`);
    }

    return templateFile;
  }

  /**
   * ส่ง email แจ้งให้ approver ยืนยัน (ใช้ role_code)
   */
  async sendApprovalRequestByRoleCode(
    roleCode: string,
    documentNo: string,
    documentType: 'PO' | 'BORROW',
    documentTitle?: string,
    documentDescription?: string,
  ): Promise<void> {
    try {
      const toEmails = await this.getApproverEmailsByRoleCode(roleCode);
      if (toEmails.length === 0) {
        this.logger.warn(
          `No approvers found for role_code: ${roleCode}`,
        );
        return;
      }

      const notifyType =
        documentType === 'PO'
          ? ENotifyType.APPROVAL_PO
          : ENotifyType.APPROVAL_BORROW;

      const templateFile = this.getTemplateFileByNotifyType(notifyType);
      const template = this.loadTemplate(templateFile);

      const variables = {
        document_no: documentNo,
        document_type: documentType,
        document_title: documentTitle || '',
        document_description: documentDescription || '',
        sent_at: new Date().toLocaleString('th-TH'),
      };

      const html = this.renderTemplate(template, variables);
      const subject = this.buildSubject(documentNo, notifyType);

      const emailData: SendEmailDto = {
        to: toEmails.join(','),
        subject,
        html,
        sent_from_system: this.configService.get<string>('APP_NAME') || 'NURSE_ROOM_SYSTEM',
      };

      await this.sendEmailService(emailData);
      this.logger.log(
        `Approval request email sent for ${documentType} ${documentNo} to role ${roleCode}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send approval request: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
