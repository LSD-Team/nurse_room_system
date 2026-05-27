import { Module } from '@nestjs/common';
import { SpecialDrugClaimController } from './special-drug-claim.controller';
import { SpecialDrugClaimService } from './special-drug-claim.service';

@Module({
  controllers: [SpecialDrugClaimController],
  providers: [SpecialDrugClaimService],
  exports: [SpecialDrugClaimService],
})
export class SpecialDrugClaimModule {}
