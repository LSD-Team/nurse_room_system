import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
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
  // GET /physical-count/periods
  // ────────────────────────────────────────────────────────────────
  @Get('periods')
  @ApiOperation({
    summary: 'Get all available stock periods',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all stock periods',
  })
  async getAvailablePeriods() {
    return this.physicalCountService.getAvailablePeriods();
  }

  // ────────────────────────────────────────────────────────────────
  // POST /physical-count/periods
  // ────────────────────────────────────────────────────────────────
  @Post('periods')
  @ApiOperation({
    summary: 'Create stock period (sp_Snapshot_01_CreateStockPeriod)',
  })
  @ApiResponse({
    status: 200,
    description: 'Period created successfully',
  })
  async createPeriod(
    @Body() body: { periodEnd: string },
  ) {
    return this.physicalCountService.createPeriod(
      new Date(body.periodEnd),
      this.currentUser,
    );
  }

  // ────────────────────────────────────────────────────────────────
  // PUT /physical-count/periods/:periodCode
  // ────────────────────────────────────────────────────────────────
  @Put('periods/:periodCode')
  @ApiOperation({
    summary: 'Edit period end date (sp_Snapshot_04_editPeriodEnd) — OPEN only',
  })
  @ApiParam({ name: 'periodCode', type: String })
  @ApiResponse({
    status: 200,
    description: 'Period end date updated successfully',
  })
  async editPeriodEnd(
    @Param('periodCode') periodCode: string,
    @Body() body: { newPeriodEnd: string },
  ) {
    return this.physicalCountService.editPeriodEnd(
      periodCode,
      new Date(body.newPeriodEnd),
    );
  }

  // ────────────────────────────────────────────────────────────────
  // DELETE /physical-count/periods/:periodCode
  // ────────────────────────────────────────────────────────────────
  @Delete('periods/:periodCode')
  @ApiOperation({
    summary: 'Delete period (sp_Snapshot_05_deletePeriod) — OPEN only',
  })
  @ApiParam({ name: 'periodCode', type: String })
  @ApiResponse({
    status: 200,
    description: 'Period deleted successfully',
  })
  async deletePeriod(@Param('periodCode') periodCode: string) {
    return this.physicalCountService.deletePeriod(periodCode);
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
