//  ----- 📖 Library 📖 -----
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';
//  ----- 💼 Module 💼 -----

//  ----- ⚙️ Providers & Services ⚙️ -----
import { EmployeeService } from '@/src/apis/employee/employee.service';

//  ----- ➕ Interfaces ➕ -----
import {
  IViewEmployee,
  IViewRequest,
  IViewRequestSystem,
  IViewRequestWaitingApproval,
} from '@/shared/interfaces/lsd-request/views';
import { TNotifyType } from '@/shared/interfaces/notify.interfaces';

//  ----- 📂 DTO 📂 -----
import { EmailLogDto } from '@/src/email/dto/email-log.dto';
import { SendEmailDto } from '@/src/email/dto/sent-email.dto';

@Injectable()
export class EmailService {
  //  💪 constructor function
  constructor(
    private readonly httpService: HttpService,
    private readonly emp_service: EmployeeService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(EmailService.name);

  private async send_email_service(
    emailData: SendEmailDto,
  ): Promise<EmailLogDto> {
    try {
      const emailServiceurl =
        this.configService.get<string>('EMAIL_SERVICE_URL');

      const response = await firstValueFrom(
        this.httpService.post<EmailLogDto>(
          `${emailServiceurl}/email/send`,
          emailData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return response.data;
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

  async sent(
    TO_ID: IViewEmployee['ID'][],
    CC_ID: IViewEmployee['ID'][],
    TYPE: TNotifyType,
    HTML: string,
    request_id: IViewRequest['request_id'],
  ) {
    const emp_have_email = await this.emp_service.findHaveEmail();

    // find to_id all email in emp_have_email return email in format "email1,email2,..."
    const TO_EMAIL = emp_have_email
      .filter((emp) => TO_ID.includes(emp.ID))
      .map((emp) => emp.email)
      .join(',');

    const TO_EMAIL_TEST = 'jirayu@shindengen.co.th';

    const to =
      this.configService.get<string>('NODE_ENV') === 'production'
        ? TO_EMAIL
        : TO_EMAIL_TEST;

    // find cc_id all email in emp_have_email return email in format "email1,email2,..."
    const CC_EMAIL = emp_have_email
      .filter((emp) => CC_ID.includes(emp.ID))
      .map((emp) => emp.email)
      .join(',');

    const CC_EMAIL_TEST = ''; /** wayroad@shindengen.co.th */

    const cc =
      this.configService.get<string>('NODE_ENV') === 'production'
        ? CC_EMAIL
        : CC_EMAIL_TEST;

    let subject = `LSD Request No. #${request_id} : `;
    switch (TYPE) {
      case 'APPROVAL': // (to : next approver | cc: approver)
        subject += 'Approve';
        break;
      case 'ASSIGNMENT': // (to : assigner of system | cc: final aprover)
        subject += 'Assignment';
        break;
      case 'CF-ASSIGN': // (to : comfirm of system | cc: [])
        subject += 'Confirm Assignment';
        break;
      case 'ON-PROCESS': // (to : assignee | cc: assigner of system)
        subject += 'On-Process';
        break;
      case 'COMPLETED': // (to : requestor | cc: assignee & assigner of system)
        subject += 'Completed';
        break;
      case 'REJECTED': // (to : requestor | cc: rejecter)
        subject += 'Reject';
        break;

      case 'CONCERN': // (to : concerner | cc: updater)
        subject += 'Concern';
        break;
      case 'CANCEL-CONCERN': // (to : concerner | cc: updater)
        subject += 'Cancel concern';
        break;

      // Notify approver
      case 'NOTIFY-APPROVER-COMPLETED': // (to : all approver | cc: requestor)
        subject += 'Notify approver - Completed';
        break;
      case 'NOTIFY-APPROVER-REJECTED': // (to : all approver | cc: requestor)
        subject += 'Notify approver - Rejected';
        break;

      // Notify concerner
      case 'NOTIFY-CONCERNER-COMPLETED': // (to : all concerner | cc: requestor)
        subject += 'Notify concerner - Completed';
        break;
      case 'NOTIFY-CONCERNER-REJECTED': // (to : all concerner | cc: requestor)
        subject += 'Notify concerner - Rejected';
        break;

      case 'APPROVAL-DAILY': // (to : all approver | cc: requestor)
        subject += 'Notify approver - Daily';
        break;

      case 'PROCESS-NOTIFY': // (to : assigner of system | cc: updater)
        subject += 'Check process';
        break;

      // Other
      default:
        subject += `Other type : ${TYPE}`;
        break;
    }

    const HTML_TEST =
      '<h1>*** TEST EMAIL ***</h1><hr/>' +
      HTML +
      '<hr/><p> to: ' +
      TO_EMAIL +
      '<br/>cc: ' +
      CC_EMAIL +
      '</p>';

    const html =
      this.configService.get<string>('NODE_ENV') === 'production'
        ? HTML
        : HTML_TEST;

    const sent_from_system = this.configService.get<string>('APP_NAME');

    const email: SendEmailDto = {
      to,
      cc,
      subject,
      html,
      sent_from_system,
    };
    if (TO_EMAIL != '') {
      await this.send_email_service(email);
    } else {
      this.logger.warn(`to is empty : ${JSON.stringify(email)}`);
    }
  }

  template(
    request_id: IViewRequest['request_id'],
    request_title: IViewRequest['request_title'],
    request_description: IViewRequest['request_description'],
    request_system_name: IViewRequestSystem['request_system_name'],
    requestor_name: IViewRequest['requestor_name'],
    notify_type: TNotifyType,
    days_elapsed: IViewRequestWaitingApproval['days_elapsed'] = 0,
    rejector_name: string = '',
    additional_message: string = '',
    action_by: string = '',
  ): string {
    try {
      let templateFile: string;
      switch (notify_type) {
        case 'APPROVAL':
          templateFile = 'approval.template.html';
          break;
        case 'CONCERN':
          templateFile = 'concern.template.html';
          break;
        case 'CANCEL-CONCERN':
          templateFile = 'cancel-concern.template.html';
          break;
        case 'ASSIGNMENT':
          templateFile = 'assignment.template.html';
          break;
        case 'CF-ASSIGN':
          templateFile = 'confirm-assignment.template.html';
          break;
        case 'ON-PROCESS':
          templateFile = 'on-process.template.html';
          break;
        case 'COMPLETED':
          templateFile = 'completed.template.html';
          break;
        case 'REJECTED':
          templateFile = 'rejected.template.html';
          break;

        case 'NOTIFY-APPROVER-COMPLETED':
          templateFile = 'notify.approver.completed.template.html';
          break;
        case 'NOTIFY-APPROVER-REJECTED':
          templateFile = 'notify.approver.rejected.template.html';
          break;

        case 'NOTIFY-CONCERNER-COMPLETED':
          templateFile = 'notify.concerner.completed.template.html';
          break;
        case 'NOTIFY-CONCERNER-REJECTED':
          templateFile = 'notify.concerner.rejected.template.html';
          break;
        case 'APPROVAL-DAILY':
          templateFile = 'approval.daily.template.html';
          break;
        case 'PROCESS-NOTIFY':
          templateFile = 'process.notify.template.html';
          break;
        default:
          throw new Error('Invalid request_state_id');
      }

      // กำหนด path ให้ถูกต้องตาม project structure
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

      let template = fs.readFileSync(templatePath, 'utf8');

      // แทนที่ค่าตัวแปรใน template
      template = template
        .replace(/{{request_id}}/g, request_id.toString())
        .replace(/{{request_title}}/g, request_title)
        .replace(/{{request_description}}/g, request_description)
        .replace(/{{request_system_name}}/g, request_system_name)
        .replace(/{{requestor_name}}/g, requestor_name);

      // แทนที่ค่าตัวแปรเฉพาะสำหรับ notify_type ที่ใช้ days_elapsed
      if (notify_type === 'APPROVAL-DAILY') {
        template = template.replace(
          /{{days_elapsed}}/g,
          days_elapsed.toString(),
        );
      }

      // แทนที่ค่าตัวแปรเฉพาะสำหรับ notify_type ที่ใช้ rejector_name
      if (
        notify_type === 'REJECTED' ||
        notify_type === 'NOTIFY-APPROVER-REJECTED' ||
        notify_type === 'NOTIFY-CONCERNER-REJECTED'
      ) {
        template = template.replace(
          /{{rejector_name}}/g,
          rejector_name.toString(),
        );
      }

      // แทนที่ค่าตัวแปรเฉพาะสำหรับ notify_type ที่ใช้ action_by
      if (
        notify_type === 'COMPLETED' ||
        notify_type === 'NOTIFY-APPROVER-COMPLETED' ||
        notify_type === 'NOTIFY-CONCERNER-COMPLETED'
      ) {
        template = template.replace(/{{action_by}}/g, action_by);
      }

      // แทนที่ค่าตัวแปรเฉพาะสำหรับ notify_type ที่ใช้ additional_message
      if (
        notify_type === 'COMPLETED' ||
        notify_type === 'REJECTED' ||
        notify_type === 'NOTIFY-APPROVER-COMPLETED' ||
        notify_type === 'NOTIFY-APPROVER-REJECTED' ||
        notify_type === 'NOTIFY-CONCERNER-COMPLETED' ||
        notify_type === 'NOTIFY-CONCERNER-REJECTED'
      ) {
        template = template.replace(
          /{{additional_message}}/g,
          additional_message || '',
        );
      }

      return template;
    } catch (error: any) {
      this.logger.error(`Failed to load email template: ${error.message}`);
      throw error;
    }
  }
}
