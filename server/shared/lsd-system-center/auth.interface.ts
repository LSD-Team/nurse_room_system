import { IViewEmployeeAll } from '../hrm-odbc-db/view_employee_all.interface';

//  ➕ Interfaces : jwt payload for generate jwt
export interface JwtPayloadData {
  UserID: string;
  SECCD: string;
  iat?: number;
  exp?: number;
}

export interface UserData {
  UserID: IViewEmployeeAll['ID'];
  cardcode: IViewEmployeeAll['cardcode'];
  UserPassword?: string; // hash md5
  SECCD: IViewEmployeeAll['SECCD'];
  section_name: IViewEmployeeAll['section_name'];
  thai_name: IViewEmployeeAll['thai_name'];
  eng_name: IViewEmployeeAll['eng_name'];
  email: IViewEmployeeAll['email'];
  position_name: IViewEmployeeAll['position_name'];
  position_level: IViewEmployeeAll['position_level'];
  ExeOfficeCode: IViewEmployeeAll['ExeOfficeCode'];
}

export interface BooleanStatus {
  status: boolean;
}
