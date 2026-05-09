import { Module } from '@nestjs/common';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { PoModule } from '@/src/apis/po/po.module';
import { BorrowModule } from '@/src/apis/borrow/borrow.module';

@Module({
  imports: [PoModule, BorrowModule],
  controllers: [ApprovalController],
  providers: [ApprovalService],
})
export class ApprovalModule {}
