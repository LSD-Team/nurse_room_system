//  ----- 📖 Library 📖 -----
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

//  ----- 📦 Modules 📦 -----
import { ApprovalModule } from '@/src/apis/approval/approval.module';
import { BorrowModule } from '@/src/apis/borrow/borrow.module';
import { BulletModule } from '@/src/apis/bullet/bullet.module';
import { EmployeesModule } from '@/src/apis/employees/employees.module';
import { GrModule } from '@/src/apis/gr/gr.module';
import { PoModule } from '@/src/apis/po/po.module';
import { StockModule } from '@/src/apis/stock/stock.module';
import { PhysicalCountModule } from '@/src/apis/physical-count/physical-count.module';
import { TreatmentModule } from '@/src/apis/treatment/treatment.module';
import { ReferModule } from '@/src/apis/refer/refer.module';
import { MasterDataModule } from '@/src/apis/master-data/master-data.module';
import { MenuModule } from '@/src/apis/menu/menu.module';
import { SpecialDrugClaimModule } from '@/src/apis/special-drug-claim/special-drug-claim.module';
import { HolidayWorkModule } from '@/src/apis/holiday-work/holiday-work.module';
import { AuthModule } from '@/src/auth/auth.module';
import { DatabaseModule } from '@/src/database/database.module';
import { EmailModule } from '@/src/email/email.module';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { AppService } from '@/src/app.service';
import { AppGuard } from '@/src/auth/guard';

//  ----- 🔗 Controllers 🔗 -----
import { AppController } from '@/src/app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.development',
    }),
    AuthModule,
    DatabaseModule,
    EmailModule,
    ApprovalModule,
    BorrowModule,
    BulletModule,
    EmployeesModule,
    GrModule,
    PoModule,
    StockModule,
    PhysicalCountModule,
    TreatmentModule,
    ReferModule,
    MasterDataModule,
    MenuModule,
    SpecialDrugClaimModule,
    HolidayWorkModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AppGuard,
    },
  ],
})
export class AppModule {}
