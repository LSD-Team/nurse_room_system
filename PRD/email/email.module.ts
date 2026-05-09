//  ----- 📖 Library 📖 -----
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

//  ----- 💼 Module 💼 -----
import { EmployeeModule } from '@/src/apis/employee/employee.module';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { EmailService } from '@/src/email/email.service';

@Module({
  imports: [HttpModule, EmployeeModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
