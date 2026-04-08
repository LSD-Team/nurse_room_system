//  ----- 📖 Library 📖 -----
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { AuthService } from '@/src/auth/auth.service';

//  ----- 🐉 Guard 🐉 -----
import { JwtAuthGuard } from '@/src/auth/guard/jwt-auth.guard';

//  ----- 📝 Custom 📝 -----
import { CustomForbiddenException } from '@/src/custom/exception.custom';

//  ----- 🧩 Enums 🧩 -----
import { enumAuthLevelID } from '@/src/enum/authorize-level.enum';

@Injectable()
export class UserGuard implements CanActivate {
  //  💪 constructor function
  constructor(private readonly service: AuthService) {}

  private readonly logger = new Logger(UserGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, execute JwtAuthGuard
    const jwtAuthGuard = new JwtAuthGuard();
    await jwtAuthGuard.canActivate(context);

    // Check Admin
    const isAuthorized = await this.service.checkAuthorizeApp(
      enumAuthLevelID.USER,
    );

    if (!isAuthorized.status) {
      throw new CustomForbiddenException(
        `You do not have user rights.`,
        '/',
        '',
      );
    }
    return true;
  }
}
