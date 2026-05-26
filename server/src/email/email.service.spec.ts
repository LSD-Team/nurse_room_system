import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '@/src/email/email.service';
import { DatabaseService } from '@/src/database/database.service';
import {
  ENotifyType,
  ISendApprovalEmailPayload,
} from '@/src/email/dto/send-approval-email.dto';
import { of } from 'rxjs';
import * as fs from 'fs';

describe('EmailService', () => {
  let service: EmailService;
  let httpService: HttpService;
  let configService: ConfigService;
  let databaseService: DatabaseService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'EMAIL_SERVICE_URL') {
        return 'http://10.182.1.198/apis/lsd-smtp-service';
      }
      if (key === 'APP_NAME') {
        return 'NURSE_ROOM_SYSTEM';
      }
      if (key === 'NODE_ENV') {
        return 'development';
      }
      return null;
    }),
  };

  const mockDatabaseService = {
    getDatabaseName: jest.fn().mockReturnValue('TEMPLATE_WEB_STACK_2025'),
    query: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(() =>
      of({
        data: {
          id: 1,
          to_recipients: 'test@example.com',
          cc_recipients: null,
          subject: 'Test Email',
          body: '<p>Test</p>',
          sent_from_system: 'NURSE_ROOM_SYSTEM',
          status: 'SUCCESS',
          error_message: null,
          sent_at: new Date(),
        },
      }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendApprovalEmail', () => {
    it('should send approval email for PO', async () => {
      mockDatabaseService.query.mockResolvedValueOnce([
        { email: 'approver@example.com' },
      ]);

      // Mock template file
      const templatePath = expect.stringContaining('approval-po.template.html');
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('<p>{{document_no}}</p>');

      const payload: ISendApprovalEmailPayload = {
        notifyType: ENotifyType.APPROVAL_PO,
        documentId: 1,
        documentNo: 'PO-2026-001',
        documentType: 'PO',
        toEmployeeIds: [101],
        documentTitle: 'Test PO',
        documentDescription: 'Test Description',
      };

      await service.sendApprovalEmail(payload);

      expect(databaseService.query).toHaveBeenCalled();
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/email/send'),
        expect.objectContaining({
          to: 'approver@example.com',
          subject: expect.stringContaining('PO-2026-001'),
          sent_from_system: 'NURSE_ROOM_SYSTEM',
        }),
        expect.any(Object),
      );
    });

    it('should send approval email for BORROW', async () => {
      mockDatabaseService.query.mockResolvedValueOnce([
        { email: 'approver@example.com' },
      ]);

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('<p>{{document_no}}</p>');

      const payload: ISendApprovalEmailPayload = {
        notifyType: ENotifyType.APPROVAL_BORROW,
        documentId: 1,
        documentNo: 'BRW-2026-001',
        documentType: 'BORROW',
        toEmployeeIds: [101],
        documentTitle: 'Test Borrow',
        documentDescription: 'Test Description',
      };

      await service.sendApprovalEmail(payload);

      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/email/send'),
        expect.objectContaining({
          to: 'approver@example.com',
          subject: expect.stringContaining('BRW-2026-001'),
        }),
        expect.any(Object),
      );
    });

    it('should handle multiple recipients', async () => {
      mockDatabaseService.query.mockResolvedValueOnce([
        { email: 'approver1@example.com' },
        { email: 'approver2@example.com' },
      ]);

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('<p>{{document_no}}</p>');

      const payload: ISendApprovalEmailPayload = {
        notifyType: ENotifyType.APPROVAL_PO,
        documentId: 1,
        documentNo: 'PO-2026-002',
        documentType: 'PO',
        toEmployeeIds: [101, 102],
      };

      await service.sendApprovalEmail(payload);

      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/email/send'),
        expect.objectContaining({
          to: 'approver1@example.com,approver2@example.com',
        }),
        expect.any(Object),
      );
    });

    it('should not send email if no recipients found', async () => {
      mockDatabaseService.query.mockResolvedValueOnce([]);

      const payload: ISendApprovalEmailPayload = {
        notifyType: ENotifyType.APPROVAL_PO,
        documentId: 1,
        documentNo: 'PO-2026-003',
        documentType: 'PO',
        toEmployeeIds: [999],
      };

      await service.sendApprovalEmail(payload);

      expect(httpService.post).not.toHaveBeenCalled();
    });
  });

  describe('getTemplateFileByNotifyType', () => {
    it('should return correct template file for each notify type', () => {
      const testCases = [
        [ENotifyType.APPROVAL_PO, 'approval-po.template.html'],
        [ENotifyType.APPROVAL_BORROW, 'approval-borrow.template.html'],
        [ENotifyType.PO_REWORK, 'rework-po.template.html'],
        [ENotifyType.BORROW_REWORK, 'rework-borrow.template.html'],
        [ENotifyType.PO_COMPLETED, 'completed-po.template.html'],
        [ENotifyType.BORROW_COMPLETED, 'completed-borrow.template.html'],
      ];

      testCases.forEach(([notifyType, expectedFile]) => {
        // Access private method through any type assertion for testing
        const result = (service as any).getTemplateFileByNotifyType(notifyType);
        expect(result).toBe(expectedFile);
      });
    });
  });
});
