import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PhysicalCountService } from './physical-count.service';
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';

@ApiTags('physical-count')
@Controller('physical-count')
export class PhysicalCountController {
  constructor(private readonly physicalCountService: PhysicalCountService) {}

  private get currentUser(): string {
    return (global.jwtPayload as JwtPayloadData)?.UserID || 'UNKNOWN';
  }

  // ────────────────────────────────────────────────────────────────
  // POST /physical-count/create
  // ────────────────────────────────────────────────────────────────
  @Post('create')
  @ApiOperation({
    summary: 'Start physical count session (sp_PhysCount_01_Create)',
  })
  @ApiResponse({
    status: 200,
    description: 'Physical count session created',
  })
  async createPhysicalCount(
    @Body() body: { PeriodCode: string; Note?: string },
  ) {
    return this.physicalCountService.createPhysicalCount(
      body.PeriodCode,
      this.currentUser,
      body.Note,
    );
  }

  // ────────────────────────────────────────────────────────────────
  // POST /physical-count/:countId/save-lines
  // ────────────────────────────────────────────────────────────────
  @Post(':countId/save-lines')
  @ApiOperation({
    summary: 'Save counted quantities (sp_PhysCount_02_SaveLines)',
  })
  @ApiParam({ name: 'countId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Quantities saved',
  })
  async saveCountLines(
    @Param('countId') countId: number,
    @Body() body: { JsonData: string },
  ) {
    return this.physicalCountService.saveCountLines(countId, body.JsonData);
  }

  // ────────────────────────────────────────────────────────────────
  // GET /physical-count/:countId/comparison
  // ────────────────────────────────────────────────────────────────
  @Get(':countId/comparison')
  @ApiOperation({
    summary: 'Get comparison report (sp_PhysCount_03_GetComparison)',
  })
  @ApiParam({ name: 'countId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Comparison data with header and lines',
  })
  async getComparison(@Param('countId') countId: number) {
    return this.physicalCountService.getComparison(countId);
  }

  // ────────────────────────────────────────────────────────────────
  // POST /physical-count/:countId/submit
  // ────────────────────────────────────────────────────────────────
  @Post(':countId/submit')
  @ApiOperation({
    summary: 'Submit for approval (sp_PhysCount_04_Submit)',
  })
  @ApiParam({ name: 'countId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Submitted and email sent to GROUP_LEAD',
  })
  async submitCount(@Param('countId') countId: number) {
    return this.physicalCountService.submitCount(countId, this.currentUser);
  }

  // ────────────────────────────────────────────────────────────────
  // POST /physical-count/:countId/approve
  // ────────────────────────────────────────────────────────────────
  @Post(':countId/approve')
  @ApiOperation({
    summary: 'Approve by GROUP_LEAD (sp_PhysCount_05_Approve)',
  })
  @ApiParam({ name: 'countId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Approved and snapshot created',
  })
  async approveCount(@Param('countId') countId: number) {
    return this.physicalCountService.approveCount(countId, this.currentUser);
  }

  // ────────────────────────────────────────────────────────────────
  // POST /physical-count/:countId/reject
  // ────────────────────────────────────────────────────────────────
  @Post(':countId/reject')
  @ApiOperation({
    summary: 'Reject by GROUP_LEAD (sp_PhysCount_06_Reject)',
  })
  @ApiParam({ name: 'countId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Rejected and period reopened',
  })
  async rejectCount(
    @Param('countId') countId: number,
    @Body() body: { RejectedReason: string },
  ) {
    return this.physicalCountService.rejectCount(
      countId,
      this.currentUser,
      body.RejectedReason,
    );
  }
}
