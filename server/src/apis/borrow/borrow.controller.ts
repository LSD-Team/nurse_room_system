import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BorrowService } from './borrow.service';
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';

@ApiTags('borrow')
@Controller('borrow')
export class BorrowController {
  constructor(private readonly borrowService: BorrowService) {}

  private get currentUser(): string {
    return (global.jwtPayload as JwtPayloadData)?.UserID || 'UNKNOWN';
  }

  // โ”€โ”€โ”€ GET /borrow โ”€โ”€โ”€
  @Get()
  @ApiOperation({
    summary: 'Get all borrow headers from view_borrowed_items_header',
  })
  @ApiResponse({ status: 200, description: 'Returns all borrow headers' })
  async getBorrowHeaders() {
    return this.borrowService.getBorrowHeaders();
  }

  // โ”€โ”€โ”€ GET /borrow/suppliers โ”€โ”€โ”€
  @Get('suppliers')
  @ApiOperation({ summary: 'Get active suppliers for dropdown' })
  async getSuppliers() {
    return this.borrowService.getSuppliers();
  }

  // โ”€โ”€โ”€ GET /borrow/supplier-prices/:supplierId โ”€โ”€โ”€
  @Get('supplier-prices/:supplierId')
  @ApiOperation({ summary: 'Get current item prices for a supplier' })
  @ApiParam({ name: 'supplierId', type: Number })
  async getSupplierPrices(@Param('supplierId') supplierId: number) {
    return this.borrowService.getSupplierPrices(supplierId);
  }

  // โ”€โ”€โ”€ GET /borrow/pending โ”€โ”€โ”€
  @Get('pending')
  @ApiOperation({
    summary: 'Get borrow records pending settlement (RECEIVED status)',
  })
  @ApiQuery({ name: 'supplierId', required: false })
  async getPendingBorrows(@Query('supplierId') supplierId?: string) {
    return this.borrowService.getPendingBorrows(supplierId || null);
  }

  // โ”€โ”€โ”€ GET /borrow/:id/lines โ”€โ”€โ”€
  @Get(':id/lines')
  @ApiOperation({ summary: 'Get borrow line details by borrow ID' })
  @ApiParam({ name: 'id', type: Number })
  async getBorrowLines(@Param('id') id: number) {
    return this.borrowService.getBorrowLines(id);
  }

  // โ”€โ”€โ”€ POST /borrow โ”€โ”€โ”€
  @Post()
  @ApiOperation({ summary: 'Create a new borrow (sp_BR_01_Create)' })
  async createBorrow(
    @Body() body: { JsonLines: string; SupplierId: string; Note?: string },
  ) {
    return this.borrowService.createBorrow(
      body.JsonLines,
      body.SupplierId,
      body.Note || null,
      this.currentUser,
    );
  }

  // โ”€โ”€โ”€ PUT /borrow/:id โ”€โ”€โ”€
  @Put(':id')
  @ApiOperation({ summary: 'Update a borrow (sp_BR_02_Update, DRAFT only)' })
  @ApiParam({ name: 'id', type: String })
  async updateBorrow(
    @Param('id') id: string,
    @Body() body: { JsonLines?: string; Note?: string },
  ) {
    return this.borrowService.updateBorrow(
      id,
      body.JsonLines || null,
      body.Note || null,
      this.currentUser,
    );
  }

  // โ”€โ”€โ”€ POST /borrow/:id/submit โ”€โ”€โ”€
  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit borrow for approval (sp_BR_03_Submit)' })
  @ApiParam({ name: 'id', type: String })
  async submitBorrow(@Param('id') id: string) {
    return this.borrowService.submitBorrow(id, this.currentUser);
  }

  // โ”€โ”€โ”€ POST /borrow/:id/approve โ”€โ”€โ”€
  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve/Reject/Rework borrow (sp_BR_04_Approve)' })
  @ApiParam({ name: 'id', type: String })
  async approveBorrow(
    @Param('id') id: string,
    @Body() body: { Action: 'APPROVE' | 'REJECT' | 'REWORK'; Remark?: string },
  ) {
    return this.borrowService.approveBorrow(
      id,
      body.Action,
      this.currentUser,
      body.Remark || null,
    );
  }

  // โ”€โ”€โ”€ POST /borrow/:id/receive โ”€โ”€โ”€
  @Post(':id/receive')
  @ApiOperation({ summary: 'Receive borrow into stock (sp_BR_05_Receive)' })
  @ApiParam({ name: 'id', type: String })
  async receiveBorrow(@Param('id') id: string) {
    return this.borrowService.receiveBorrow(id, this.currentUser);
  }

  // โ”€โ”€โ”€ POST /borrow/:id/cancel โ”€โ”€โ”€
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a borrow (sp_BR_07_Cancel)' })
  @ApiParam({ name: 'id', type: String })
  async cancelBorrow(
    @Param('id') id: string,
    @Body() body: { Reason?: string },
  ) {
    return this.borrowService.cancelBorrow(
      id,
      this.currentUser,
      body.Reason || null,
    );
  }
}
