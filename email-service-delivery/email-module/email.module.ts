//  ----- 📖 Library 📖 -----
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

//  ----- 💼 Module 💼 -----
import { DatabaseModule } from '@/src/database/database.module';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { EmailService } from '@/src/email/email.service';

@Module({
  imports: [HttpModule, DatabaseModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
