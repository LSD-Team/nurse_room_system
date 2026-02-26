//  ----- 📖 Library 📖 -----
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

//  ----- 🐉 Guard 🐉 -----
import { JwtAuthGuard } from '@/src/auth/guard/jwt-auth.guard';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { AuthService } from '@/src/auth/auth.service';

import { IS_PUBLIC_KEY } from '@/src/auth/decorators/public.decorator';

@Injectable()
export class AppGuard implements CanActivate {
  constructor(
    private readonly service: AuthService,
    private readonly reflector: Reflector,
  ) {}

  private readonly logger = new Logger(AppGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // First, execute JwtAuthGuard
    const jwtAuthGuard = new JwtAuthGuard();
    await jwtAuthGuard.canActivate(context);

    const isAuthorized = await this.service.checkAuthorizeApp();
    if (!isAuthorized.status) {
      throw new ForbiddenException(
        `You do not have the right to use this system.`,
      );
    }
    return true;
  }
}
