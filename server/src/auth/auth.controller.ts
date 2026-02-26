//  ----- 📖 Library 📖 -----
import { Controller, Get } from '@nestjs/common';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { AuthService } from '@/src/auth/auth.service';

//  ----- ➕ Interfaces ➕ -----
import { BooleanStatus } from '@/shared/lsd-system-center/auth.interface';

import { enumAuthLevelID } from '@/src/enum/authorize-level.enum';
import { EmployeesService } from '@/src/apis/employees/employees.service';

@Controller('auth') // Controller Name
export class AuthController {
  //  💪 constructor function
  constructor(
    private readonly authService: AuthService,
    private readonly employeesService: EmployeesService,
  ) {}

  @Get('user-info')
  async getUserInfo() {
    return this.employeesService.findMyInfo();
  }

  //  Check Admin Status
  @Get('check-admin')
  async checkAdmin(): Promise<BooleanStatus> {
    return this.authService.checkAuthorizeApp(enumAuthLevelID.ADMIN);
  }
}
