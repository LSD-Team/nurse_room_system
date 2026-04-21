import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';

@ApiTags('approval')
@Controller('approval')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  private get currentUser(): string {
    return (global.jwtPayload as JwtPayloadData)?.UserID || 'UNKNOWN';
  }

  // ─── GET /approval/pending ───
  @Get('pending')
  @ApiOperation({
    summary: 'Get combined pending approvals (PO + Borrow)',
  })
  async getPendingApprovals() {
    return this.approvalService.getPendingApprovals();
  }

  // ─── GET /approval/history ───
  @Get('history')
  @ApiOperation({
    summary: 'Get approval history (all PO + Borrow regardless of status)',
  })
  async getApprovalHistory() {
    return this.approvalService.getApprovalHistory();
  }

  // ─── GET /approval/po/:id ───
  @Get('po/:id')
  @ApiOperation({
    summary: 'Get PO detail with lines + approval history (sp_PO_02_GetPO)',
  })
  @ApiParam({ name: 'id', type: Number })
  async getPoDetail(@Param('id') id: number) {
    return this.approvalService.getPoDetail(id);
  }

  // ─── GET /approval/borrow/:id/history ───
  @Get('borrow/:id/history')
  @ApiOperation({
    summary: 'Get borrow approval history',
  })
  @ApiParam({ name: 'id', type: Number })
  async getBorrowApprovalHistory(@Param('id') id: number) {
    return this.approvalService.getBorrowApprovalHistory(id);
  }

  // ─── GET /approval/borrow/:id/logs ───
  @Get('borrow/:id/logs')
  @ApiOperation({
    summary: 'Get borrow approval logs (persistent timeline)',
  })
  @ApiParam({ name: 'id', type: Number })
  async getBorrowApprovalLogs(@Param('id') id: number) {
    return this.approvalService.getBorrowApprovalLogs(id);
  }

  // ─── POST /approval/po/:id/approve ───
  @Post('po/:id/approve')
  @ApiOperation({ summary: 'Approve/Reject/Rework PO (sp_PO_04_ApprovePO)' })
  @ApiParam({ name: 'id', type: String })
  async approvePo(
    @Param('id') id: string,
    @Body()
    body: {
      Action: 'APPROVE' | 'REJECT' | 'REWORK';
      Remark?: string;
      SimulateAs?: string;
    },
  ) {
    const actionedBy = body.SimulateAs || this.currentUser;
    return this.approvalService.approvePo(
      id,
      body.Action,
      actionedBy,
      body.Remark || null,
    );
  }

  // ─── POST /approval/borrow/:id/approve ───
  @Post('borrow/:id/approve')
  @ApiOperation({
    summary: 'Approve/Reject/Rework Borrow (sp_BR_04_Approve)',
  })
  @ApiParam({ name: 'id', type: String })
  async approveBorrow(
    @Param('id') id: string,
    @Body()
    body: {
      Action: 'APPROVE' | 'REJECT' | 'REWORK';
      Remark?: string;
      SimulateAs?: string;
    },
  ) {
    const actionedBy = body.SimulateAs || this.currentUser;
    return this.approvalService.approveBorrow(
      id,
      body.Action,
      actionedBy,
      body.Remark || null,
    );
  }
}
