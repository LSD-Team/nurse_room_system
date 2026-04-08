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
    const query: string = `SELECT * FROM view_employee;`;
    const employees: IViewEmployee[] = await this.databaseService.query<
      IViewEmployee[]
    >(this.DATABASE_NAME, query);
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
    return viewEmployee;
  }
}
