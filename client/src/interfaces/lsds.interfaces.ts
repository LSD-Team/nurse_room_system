import type { IViewEmployeeAll } from '@/shared/hrm-odbc-db/view_employee_all.interface';

export interface IUserInfo {
  UserID: IViewEmployeeAll['ID'];
  cardcode: IViewEmployeeAll['cardcode'];
  SECCD: IViewEmployeeAll['SECCD'];
  section_name: IViewEmployeeAll['section_name'];
  GRPCD: IViewEmployeeAll['GRPCD'];
  group_name: IViewEmployeeAll['group_name'];
  thai_name: IViewEmployeeAll['thai_name'];
  eng_name: IViewEmployeeAll['eng_name'];
  email: IViewEmployeeAll['email'];
  position_name: IViewEmployeeAll['position_name'];
  position_level: IViewEmployeeAll['position_level'];
  ExeOfficeCode: IViewEmployeeAll['ExeOfficeCode'];
  UserPassword: string;
}
