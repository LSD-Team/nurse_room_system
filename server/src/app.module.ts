//  ----- 📖 Library 📖 -----
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

//  ----- 📦 Modules 📦 -----
import { EmployeesModule } from '@/src/apis/employees/employees.module';
import { StockModule } from '@/src/apis/stock/stock.module';
import { AuthModule } from '@/src/auth/auth.module';
import { DatabaseModule } from '@/src/database/database.module';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { AppService } from '@/src/app.service';
import { AppGuard } from '@/src/auth/guard';

//  ----- 🔗 Controllers 🔗 -----
import { AppController } from '@/src/app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env. NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    AuthModule,
    DatabaseModule,
    EmployeesModule,
    StockModule,
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
