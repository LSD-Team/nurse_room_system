//  ----- 📖 Library 📖 -----
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { DatabaseService } from '@/src/database/database.service';

//  ----- 🧩 Interfaces & Types 🧩 -----
import { IViewEmployee } from '@/shared/template-web-stack-2025/employee.interface';
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';

@Injectable()
export class EmployeesService {
  constructor(private readonly databaseService: DatabaseService) {}

  // ใช้ getter function แทนการกำหนดค่าเริ่มต้น
  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  async findAll() {
    const query: string = `SELECT * FROM view_employee_all;`;
    const employees: IViewEmployee[] =
      await this.databaseService.query<IViewEmployee>(
        this.DATABASE_NAME,
        query,
      );
    return employees;
  }

  async findMyInfo() {
    const employees: IViewEmployee[] = await this.findAll();
    const { UserID } = global.jwtPayload as JwtPayloadData;
    let viewEmployee: IViewEmployee = {
      ID: '',
      cardcode: '',
      thai_name: '',
      eng_name: '',
      email: '',
      position_name: '',
      position_level: '',
      JobPositionCode: '',
      WorkStatus: 'Active',
      bloodeng: '',
      ExeOfficeCode: '',
      ExeOfficeDesc: '',
      SECCD: '',
      section_name: '',
      GRPCD: '',
      group_name: '',
    };
    const myData = employees.filter((employee) => employee.ID === UserID);
    if (myData.length > 0) {
      viewEmployee = myData[0];
    } else {
      throw new HttpException(
        'Not found employee, Not authorized',
        HttpStatus.FORBIDDEN,
      );
    }

    // Get user's role with default_page_route
    try {
      const roleQuery: string = `
        SELECT TOP 1
          r.id as role_id,
          r.code as role_code,
          r.name as role_name,
          r.default_page_route
        FROM dbo.role_emp re
        INNER JOIN dbo.roles r ON r.id = re.role_id
        WHERE CAST(re.employee_id AS NVARCHAR(50)) = @employeeId
          AND r.is_active = 1
        ORDER BY r.id
      `;
      const roleData = await this.databaseService.query<any>(this.DATABASE_NAME, roleQuery, { employeeId: UserID });

      if (roleData && roleData.length > 0) {
        viewEmployee.role_id = roleData[0].role_id;
        viewEmployee.role_code = roleData[0].role_code;
        viewEmployee.role_name = roleData[0].role_name;
        viewEmployee.default_page_route = roleData[0].default_page_route;
      }
    } catch (error) {
      // Role info is optional, so don't throw error if query fails
      console.warn('Failed to fetch role info:', error);
    }

    return viewEmployee;
  }
}
