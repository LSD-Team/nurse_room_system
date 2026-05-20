import { Module } from '@nestjs/common';
import { PhysicalCountController } from './physical-count.controller';
import { PhysicalCountService } from './physical-count.service';
import { EmailModule } from '@/src/email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [PhysicalCountController],
  providers: [PhysicalCountService],
  exports: [PhysicalCountService],
})
export class PhysicalCountModule {}
