import { Module } from '@nestjs/common';
import { PoController } from './po.controller';
import { PoService } from './po.service';
import { EmailModule } from '@/src/email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [PoController],
  providers: [PoService],
  exports: [PoService],
})
export class PoModule {}
