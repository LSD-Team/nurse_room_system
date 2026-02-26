import { forwardRef, Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { AuthModule } from '@/src/auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
