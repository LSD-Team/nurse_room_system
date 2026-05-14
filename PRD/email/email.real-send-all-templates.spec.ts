/// <reference types="jest" />

import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EmployeeService } from '@/src/apis/employee/employee.service';
import { EmailService } from '@/src/email/email.service';
import { TNotifyType } from '@/shared/interfaces/notify.interfaces';

interface ITestEmailMapping {
  employees: Array<{ ID: string; email: string }>;
  toIds: string[];
  ccIds: string[];
}

const ALL_NOTIFY_TYPES: TNotifyType[] = [
  'APPROVAL',
  'CONCERN',
  'CANCEL-CONCERN',
  'ASSIGNMENT',
  'CF-ASSIGN',
  'ON-PROCESS',
  'REJECTED',
  'COMPLETED',
  'NOTIFY-APPROVER-COMPLETED',
  'NOTIFY-APPROVER-REJECTED',
  'NOTIFY-CONCERNER-COMPLETED',
  'NOTIFY-CONCERNER-REJECTED',
  'APPROVAL-DAILY',
  'PROCESS-NOTIFY',
];

const parseEmailList = (rawValue?: string): string[] => {
  return (rawValue ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
};

const buildTestEmailMapping = (
  toEmails: string[],
  ccEmails: string[],
): ITestEmailMapping => {
  const toEmployees = toEmails.map((email, index) => ({
    ID: `TO_${index + 1}`,
    email,
  }));

  const ccEmployees = ccEmails.map((email, index) => ({
    ID: `CC_${index + 1}`,
    email,
  }));

  return {
    employees: [...toEmployees, ...ccEmployees],
    toIds: toEmployees.map((employee) => employee.ID),
    ccIds: ccEmployees.map((employee) => employee.ID),
  };
};

const runRealEmailTest = process.env.RUN_REAL_EMAIL_TEMPLATE_TEST === 'true';
const describeIfEnabled = runRealEmailTest ? describe : describe.skip;

describeIfEnabled('EmailService (real template delivery)', () => {
  let moduleRef: TestingModule;
  let emailService: EmailService;
  let testEmailMapping: ITestEmailMapping;

  const emailServiceUrl = process.env.EMAIL_SERVICE_URL ?? '';
  const toEmails = parseEmailList(process.env.TEST_EMAIL_TO);
  const ccEmails = parseEmailList(process.env.TEST_EMAIL_CC);
  const appName = process.env.APP_NAME ?? 'LSD_REQUEST_EMAIL_TEMPLATE_TEST';

  beforeAll(async () => {
    if (!emailServiceUrl) {
      throw new Error(
        'EMAIL_SERVICE_URL is required when RUN_REAL_EMAIL_TEMPLATE_TEST=true',
      );
    }

    if (toEmails.length === 0) {
      throw new Error(
        'TEST_EMAIL_TO is required when RUN_REAL_EMAIL_TEMPLATE_TEST=true',
      );
    }

    testEmailMapping = buildTestEmailMapping(toEmails, ccEmails);

    const configServiceMock = {
      get: jest.fn((key: string) => {
        const configMap: Record<string, string> = {
          EMAIL_SERVICE_URL: emailServiceUrl,
          NODE_ENV: 'production',
          APP_NAME: appName,
        };

        return configMap[key];
      }),
    };

    const employeeServiceMock = {
      findHaveEmail: jest.fn().mockResolvedValue(testEmailMapping.employees),
    };

    moduleRef = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        EmailService,
        {
          provide: EmployeeService,
          useValue: employeeServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    emailService = moduleRef.get<EmailService>(EmailService);
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it(
    'sends every email template sequentially to configured destination',
    async () => {
      const baseRequestId = Date.now().toString();

      for (let index = 0; index < ALL_NOTIFY_TYPES.length; index++) {
        const notifyType = ALL_NOTIFY_TYPES[index];
        const requestId = Number(`${baseRequestId}${index}`.slice(-10));

        const html = emailService.template(
          requestId,
          `Email Template Display Test (${notifyType})`,
          `Template preview body for ${notifyType}`,
          'LSD Request',
          'Template QA User',
          notifyType,
          7,
          'Template Rejector',
          `Additional message for ${notifyType}`,
          'Template Action User',
        );

        await emailService.sent(
          testEmailMapping.toIds,
          testEmailMapping.ccIds,
          notifyType,
          html,
          requestId,
        );
      }
    },
    300_000,
  );
});
