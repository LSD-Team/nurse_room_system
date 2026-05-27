import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';
import { SpecialDrugClaimService } from './special-drug-claim.service';
import type {
  ICreateSpecialDrugClaimBody,
  IReturnSpecialDrugBody,
  IUpdateSpecialDrugClaimBody,
} from './special-drug-claim.interface';

@ApiTags('special-drug-claim')
@ApiBearerAuth()
@Controller('special-drug-claim')
export class SpecialDrugClaimController {
  constructor(
    private readonly specialDrugClaimService: SpecialDrugClaimService,
  ) {}

  private get currentUser(): string {
    return (global.jwtPayload as JwtPayloadData)?.UserID || 'UNKNOWN';
  }

  @Get()
  @ApiOperation({ summary: 'Get all special drug claims' })
  @ApiResponse({ status: 200, description: 'Returns claim headers' })
  async getClaims() {
    return this.specialDrugClaimService.getClaims();
  }

  @Get(':claimId')
  @ApiOperation({ summary: 'Get special drug claim detail by claim id' })
  @ApiParam({ name: 'claimId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns claim header, items, movement summary',
  })
  async getClaimById(@Param('claimId') claimId: string) {
    return this.specialDrugClaimService.getClaimById(Number(claimId));
  }

  @Post()
  @ApiOperation({ summary: 'Create special drug claim (sp_SC_01_Create)' })
  @ApiResponse({ status: 200, description: 'Claim created and stock updated' })
  async createClaim(@Body() body: ICreateSpecialDrugClaimBody) {
    return this.specialDrugClaimService.createClaim(body, this.currentUser);
  }

  @Put(':claimId')
  @ApiOperation({
    summary:
      'Update special drug claim by compensating movement (sp_SC_03_Update)',
  })
  @ApiParam({ name: 'claimId', type: Number })
  @ApiResponse({ status: 200, description: 'Claim updated' })
  async updateClaim(
    @Param('claimId') claimId: string,
    @Body() body: IUpdateSpecialDrugClaimBody,
  ) {
    return this.specialDrugClaimService.updateClaim(
      Number(claimId),
      body,
      this.currentUser,
    );
  }

  @Post('return')
  @ApiOperation({
    summary: 'Return special drug by claim item (sp_SC_02_Return)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return completed and stock updated',
  })
  async returnClaimItem(@Body() body: IReturnSpecialDrugBody) {
    return this.specialDrugClaimService.returnClaimItem(body, this.currentUser);
  }

  @Post(':claimId/close')
  @ApiOperation({ summary: 'Close special drug claim (sp_SC_04_Close)' })
  @ApiParam({ name: 'claimId', type: Number })
  @ApiResponse({ status: 200, description: 'Claim closed' })
  async closeClaim(@Param('claimId') claimId: string) {
    return this.specialDrugClaimService.closeClaim(
      Number(claimId),
      this.currentUser,
    );
  }
}
