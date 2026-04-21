import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PoService } from './po.service';
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';

@ApiTags('po')
@Controller('po')
export class PoController {
  constructor(private readonly poService: PoService) {}

  private get currentUser(): string {
    return (global.jwtPayload as JwtPayloadData)?.UserID || 'UNKNOWN';
  }

  // ─── GET /po ───
  @Get()
  @ApiOperation({ summary: 'Get all PO headers' })
  @ApiResponse({ status: 200, description: 'Returns all PO headers' })
  async getPoHeaders() {
    return this.poService.getPoHeaders();
  }

  // ─── GET /po/suppliers ───
  @Get('suppliers')
  @ApiOperation({ summary: 'Get active suppliers for dropdown' })
  async getSuppliers() {
    return this.poService.getSuppliers();
  }

  // ─── GET /po/supplier-prices/:supplierId ───
  @Get('supplier-prices/:supplierId')
  @ApiOperation({ summary: 'Get current item prices for a supplier' })
  @ApiParam({ name: 'supplierId', type: Number })
  async getSupplierPrices(@Param('supplierId') supplierId: number) {
    return this.poService.getSupplierPrices(supplierId);
  }

  // ─── GET /po/pending-borrows ───
  @Get('pending-borrows')
  @ApiOperation({ summary: 'Get borrows pending settlement (RECEIVED status)' })
  @ApiQuery({ name: 'supplierId', required: false })
  async getPendingBorrows(@Query('supplierId') supplierId?: string) {
    return this.poService.getPendingBorrows(supplierId || null);
  }

  // ─── GET /po/:id/lines ───
  @Get(':id/lines')
  @ApiOperation({ summary: 'Get PO line details by PO ID' })
  @ApiParam({ name: 'id', type: Number })
  async getPoLines(@Param('id') id: number) {
    return this.poService.getPoLines(id);
  }

  // ─── GET /po/:id/settled-borrows ───
  @Get(':id/settled-borrows')
  @ApiOperation({ summary: 'Get settled borrows for a PO' })
  @ApiParam({ name: 'id', type: Number })
  async getSettledBorrows(@Param('id') id: number) {
    return this.poService.getSettledBorrows(id);
  }

  // ─── GET /po/:id/approvals ───
  @Get(':id/approvals')
  @ApiOperation({ summary: 'Get PO approval history by PO ID' })
  @ApiParam({ name: 'id', type: Number })
  async getPoApprovals(@Param('id') id: number) {
    return this.poService.getPoApprovals(id);
  }

  // ─── POST /po ───
  @Post()
  @ApiOperation({ summary: 'Create a new PO (sp_PO_01_CreatePO)' })
  async createPo(
    @Body()
    body: {
      SupplierId: string;
      PoDate: string;
      DueDate?: string;
      JsonLines: string;
      BorrowIds?: string;
      Note?: string;
    },
  ) {
    return this.poService.createPo(
      body.SupplierId,
      body.PoDate,
      body.DueDate || null,
      body.JsonLines,
      body.BorrowIds || null,
      body.Note || null,
      this.currentUser,
    );
  }

  // ─── PUT /po/:id ───
  @Put(':id')
  @ApiOperation({ summary: 'Update a PO (sp_POUpdate, DRAFT only)' })
  @ApiParam({ name: 'id', type: String })
  async updatePo(
    @Param('id') id: string,
    @Body()
    body: {
      DueDate?: string;
      JsonLines?: string;
      BorrowIds?: string;
      Note?: string;
    },
  ) {
    return this.poService.updatePo(
      id,
      body.DueDate || null,
      body.JsonLines || null,
      body.BorrowIds ?? null,
      body.Note || null,
      this.currentUser,
    );
  }

  // ─── POST /po/:id/submit ───
  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit PO for approval (sp_PO_03_SubmitPO)' })
  @ApiParam({ name: 'id', type: String })
  async submitPo(@Param('id') id: string) {
    return this.poService.submitPo(id, this.currentUser);
  }

  // ─── POST /po/:id/approve ───
  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve/Reject PO (sp_PO_04_ApprovePO)' })
  @ApiParam({ name: 'id', type: String })
  async approvePo(
    @Param('id') id: string,
    @Body() body: { Action: 'APPROVE' | 'REJECT'; Remark?: string },
  ) {
    return this.poService.approvePo(
      id,
      body.Action,
      this.currentUser,
      body.Remark || null,
    );
  }

  // ─── POST /po/:id/cancel ───
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a PO (sp_POCancel)' })
  @ApiParam({ name: 'id', type: String })
  async cancelPo(
    @Param('id') id: string,
    @Body() body: { Reason?: string },
  ) {
    return this.poService.cancelPo(id, this.currentUser, body.Reason || null);
  }

  // ─── GET /po/receiving/pending ───
  @Get('receiving/pending')
  @ApiOperation({
    summary: 'Get POs pending goods receipt (ORDERED/PARTIAL)',
  })
  async getPendingReceiving() {
    return this.poService.getPendingReceiving();
  }

  // ─── PUT /po/:id/receiving ───
  @Put(':id/receiving')
  @ApiOperation({ summary: 'Update qty_received for PO lines (GRN)' })
  @ApiParam({ name: 'id', type: String })
  async updateQtyReceived(
    @Param('id') id: string,
    @Body() body: { JsonLines: string },
  ) {
    return this.poService.updateQtyReceived(id, this.currentUser, body.JsonLines);
  }
}
