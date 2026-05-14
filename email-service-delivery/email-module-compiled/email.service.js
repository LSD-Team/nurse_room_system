"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const rxjs_1 = require("rxjs");
const database_service_1 = require("../database/database.service");
const send_approval_email_dto_1 = require("./dto/send-approval-email.dto");
let EmailService = EmailService_1 = class EmailService {
    httpService;
    databaseService;
    configService;
    constructor(httpService, databaseService, configService) {
        this.httpService = httpService;
        this.databaseService = databaseService;
        this.configService = configService;
    }
    logger = new common_1.Logger(EmailService_1.name);
    get DATABASE_NAME() {
        return this.databaseService.getDatabaseName();
    }
    async sendEmailService(emailData) {
        try {
            const emailServiceUrl = this.configService.get('EMAIL_SERVICE_URL');
            if (!emailServiceUrl) {
                throw new Error('EMAIL_SERVICE_URL is not configured');
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${emailServiceUrl}/email/send`, emailData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            }));
            return response.data;
        }
        catch (error) {
            if (error.response) {
                this.logger.error(`Failed to send email: ${error.message}. Response: ${JSON.stringify(error.response.data)}`, error.stack);
            }
            else {
                this.logger.error(`Failed to send email: ${error.message}`, error.stack);
            }
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
    async getEmailsByEmployeeIds(employeeIds) {
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
            const results = await this.databaseService.query(this.DATABASE_NAME, query);
            const emails = results.map((r) => r.email);
            return this.overrideEmailsForTesting(emails);
        }
        catch (error) {
            this.logger.error(`Failed to get emails for employee IDs ${employeeIds}: ${error.message}`, error.stack);
            return [];
        }
    }
    overrideEmailsForTesting(emails) {
        if (this.configService.get('NODE_ENV') === 'production') {
            return emails;
        }
        const testEmailOverride = this.configService.get('TEST_EMAIL_OVERRIDE');
        if (testEmailOverride) {
            this.logger.debug(`Test mode: Redirecting ${emails.length} email(s) to: ${testEmailOverride}`);
            return [testEmailOverride];
        }
        return emails;
    }
    async getApproverEmailsByRoleCode(roleCode) {
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
            const results = await this.databaseService.query(this.DATABASE_NAME, query);
            const emails = results.map((r) => r.email);
            return this.overrideEmailsForTesting(emails);
        }
        catch (error) {
            this.logger.error(`Failed to get approver emails for role_code ${roleCode}: ${error.message}`, error.stack);
            return [];
        }
    }
    loadTemplate(templateFile) {
        try {
            const templatePath = path.join(process.cwd(), 'src', 'email', 'templates', templateFile);
            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template file not found at: ${templatePath}`);
            }
            return fs.readFileSync(templatePath, 'utf8');
        }
        catch (error) {
            this.logger.error(`Failed to load email template ${templateFile}: ${error.message}`);
            throw error;
        }
    }
    renderTemplate(template, variables) {
        let html = template;
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            html = html.replace(new RegExp(placeholder, 'g'), String(value));
        }
        return html;
    }
    buildSubject(documentNo, notifyType) {
        let suffix = '';
        switch (notifyType) {
            case send_approval_email_dto_1.ENotifyType.APPROVAL_PO:
                suffix = 'Waiting for Approval - PO';
                break;
            case send_approval_email_dto_1.ENotifyType.APPROVAL_BORROW:
                suffix = 'Waiting for Approval - Borrow';
                break;
            case send_approval_email_dto_1.ENotifyType.PO_REWORK:
                suffix = 'Rework Required - PO';
                break;
            case send_approval_email_dto_1.ENotifyType.BORROW_REWORK:
                suffix = 'Rework Required - Borrow';
                break;
            case send_approval_email_dto_1.ENotifyType.PO_COMPLETED:
                suffix = 'Approved - PO';
                break;
            case send_approval_email_dto_1.ENotifyType.BORROW_COMPLETED:
                suffix = 'Approved - Borrow';
                break;
            default:
                suffix = 'Notification';
        }
        return `[Nurse Room System] ${documentNo} : ${suffix}`;
    }
    async sendApprovalEmail(payload) {
        try {
            const toEmails = await this.getEmailsByEmployeeIds(payload.toEmployeeIds);
            if (toEmails.length === 0) {
                this.logger.warn(`No emails found for approval notification: ${JSON.stringify(payload)}`);
                return;
            }
            const ccEmails = payload.ccEmployeeIds
                ? await this.getEmailsByEmployeeIds(payload.ccEmployeeIds)
                : [];
            const templateFile = this.getTemplateFileByNotifyType(payload.notifyType);
            const template = this.loadTemplate(templateFile);
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
            const subject = this.buildSubject(payload.documentNo, payload.notifyType);
            const emailData = {
                to: toEmails.join(','),
                cc: ccEmails.length > 0 ? ccEmails.join(',') : undefined,
                subject,
                html,
                sent_from_system: this.configService.get('APP_NAME') || 'NURSE_ROOM_SYSTEM',
            };
            await this.sendEmailService(emailData);
            this.logger.log(`Email sent successfully for ${payload.documentType} ${payload.documentNo}`);
        }
        catch (error) {
            this.logger.error(`Failed to send approval email: ${error.message}`, error.stack);
            throw error;
        }
    }
    getTemplateFileByNotifyType(notifyType) {
        const templateMap = {
            [send_approval_email_dto_1.ENotifyType.APPROVAL_PO]: 'approval-po.template.html',
            [send_approval_email_dto_1.ENotifyType.APPROVAL_BORROW]: 'approval-borrow.template.html',
            [send_approval_email_dto_1.ENotifyType.PO_REWORK]: 'rework-po.template.html',
            [send_approval_email_dto_1.ENotifyType.BORROW_REWORK]: 'rework-borrow.template.html',
            [send_approval_email_dto_1.ENotifyType.PO_COMPLETED]: 'completed-po.template.html',
            [send_approval_email_dto_1.ENotifyType.BORROW_COMPLETED]: 'completed-borrow.template.html',
        };
        const templateFile = templateMap[notifyType];
        if (!templateFile) {
            throw new Error(`Unknown notify type: ${notifyType}`);
        }
        return templateFile;
    }
    async sendApprovalRequestByRoleCode(roleCode, documentNo, documentType, documentTitle, documentDescription) {
        try {
            const toEmails = await this.getApproverEmailsByRoleCode(roleCode);
            if (toEmails.length === 0) {
                this.logger.warn(`No approvers found for role_code: ${roleCode}`);
                return;
            }
            const notifyType = documentType === 'PO'
                ? send_approval_email_dto_1.ENotifyType.APPROVAL_PO
                : send_approval_email_dto_1.ENotifyType.APPROVAL_BORROW;
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
            const emailData = {
                to: toEmails.join(','),
                subject,
                html,
                sent_from_system: this.configService.get('APP_NAME') || 'NURSE_ROOM_SYSTEM',
            };
            await this.sendEmailService(emailData);
            this.logger.log(`Approval request email sent for ${documentType} ${documentNo} to role ${roleCode}`);
        }
        catch (error) {
            this.logger.error(`Failed to send approval request: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        database_service_1.DatabaseService,
        config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map