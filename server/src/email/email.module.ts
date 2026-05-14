//  ----- 📖 Library 📖 -----
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

//  ----- 💼 Module 💼 -----
import { DatabaseModule } from '@/src/database/database.module';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { EmailService } from '@/src/email/email.service';
import { EmailLogService } from '@/src/email/services/email-log.service';

//  ----- 🎮 Controllers 🎮 -----
import { EmailLogController } from '@/src/email/email-log.controller';

@Module({
  imports: [HttpModule, DatabaseModule],
  providers: [EmailService, EmailLogService],
  exports: [EmailService, EmailLogService],
  controllers: [EmailLogController],
})
export class EmailModule {}
