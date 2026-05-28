import type { IViewEmployeeAll } from '@/shared/hrm-odbc-db/view_employee_all.interface';

interface IViewEmployee extends IViewEmployeeAll {
  role_id?: number;
  role_code?: string;
  role_name?: string;
  default_page_route?: string;
}

export type { IViewEmployee };
