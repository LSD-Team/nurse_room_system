import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@/src/database/database.service';
import { ISendApprovalEmailPayload } from '@/src/email/dto/send-approval-email.dto';
export declare class EmailService {
    private readonly httpService;
    private readonly databaseService;
    private readonly configService;
    constructor(httpService: HttpService, databaseService: DatabaseService, configService: ConfigService);
    private readonly logger;
    private get DATABASE_NAME();
    private sendEmailService;
    private getEmailsByEmployeeIds;
    private overrideEmailsForTesting;
    private getApproverEmailsByRoleCode;
    private loadTemplate;
    private renderTemplate;
    private buildSubject;
    sendApprovalEmail(payload: ISendApprovalEmailPayload): Promise<void>;
    private getTemplateFileByNotifyType;
    sendApprovalRequestByRoleCode(roleCode: string, documentNo: string, documentType: 'PO' | 'BORROW', documentTitle?: string, documentDescription?: string): Promise<void>;
}
