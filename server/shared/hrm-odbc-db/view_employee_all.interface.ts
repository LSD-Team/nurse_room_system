import type { IEmailAddress } from '@/shared/it/email_address.interface';

interface IViewEmployeeAll {
  // personal info
  ID: string;
  cardcode: string;
  thai_name: string;
  eng_name: string;
  email: IEmailAddress['email_address'];
  position_name: string;
  position_level: string;
  JobPositionCode: string;
  WorkStatus: 'Active' | 'Resigned';

  // organizational info
  ExeOfficeCode: string;
  ExeOfficeDesc: string;
  SECCD: string;
  section_name: string;
  GRPCD: string;
  group_name: string;
}

export type { IViewEmployeeAll };
