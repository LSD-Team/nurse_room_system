import { Module } from '@nestjs/common';
import { ReferController } from './refer.controller';
import { ReferService } from './refer.service';

@Module({
  controllers: [ReferController],
  providers: [ReferService],
  exports: [ReferService],
})
export class ReferModule {}
