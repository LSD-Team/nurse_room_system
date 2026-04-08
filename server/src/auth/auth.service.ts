//  ----- 📖 Library 📖 -----
import { Injectable, Logger } from '@nestjs/common';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { DatabaseService } from '@/src/database/database.service';

//  ----- ➕ Interfaces ➕ -----
import { ISpAuthorizeApplication } from '@/shared/lsd-system-center/application.interface';
import {
  BooleanStatus,
  JwtPayloadData,
} from '@/shared/lsd-system-center/auth.interface';

import { enumAuthLevelID } from '@/src/enum/authorize-level.enum';

@Injectable()
export class AuthService {
  //  💪 constructor function
  constructor(private readonly databaseService: DatabaseService) {}

  // ใช้ getter function แทนการกำหนดค่าเริ่มต้น
  private get DATABASE_NAME(): string {
    return 'LSD_SYSTEM_CENTER';
  }

  private readonly logger = new Logger(AuthService.name);

  async checkAuthorizeApp(
    AuthLevelID?: enumAuthLevelID,
  ): Promise<BooleanStatus> {
    const AppID: ISpAuthorizeApplication['AppID'] = process.env.APP_ID
      ? +process.env.APP_ID
      : 0;
    if (AppID === 0) {
      this.logger.error(`AppID is not defined in environment variables.`);
      return { status: false };
    }

    const data: BooleanStatus = {
      status: false,
    };
    const { UserID, SECCD } = global.jwtPayload as JwtPayloadData;
    const procedureName = 'sp_authorize_application';
    const params = {
      UserID: UserID.toString(),
      SECCD: SECCD,
    };
    const AuthorizeApplication =
      await this.databaseService.executeStoredProcedure<ISpAuthorizeApplication>(
        this.DATABASE_NAME,
        procedureName,
        params,
      );
    const findResult = AuthorizeApplication.find((app) => app.AppID === AppID);
    if (findResult !== undefined) {
      if (!AuthLevelID) {
        //  If AuthLevelID is not provided, just check if the application exists
        data.status = true;
        return data;
      }
      if (String(findResult.AppAuthLevelID) === String(AuthLevelID)) {
        //  If AuthLevelID is provided, check if it matches the application's auth level
        data.status = true;
      }
    }
    return data;
  }
}
