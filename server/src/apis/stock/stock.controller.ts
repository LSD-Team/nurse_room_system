import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StockService } from './stock.service';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('stock-status')
  @ApiOperation({ summary: 'Get stock status from view_items' })
  @ApiResponse({ status: 200, description: 'Returns all stock on hand items' })
  async getStockStatus() {
    return this.stockService.getStockStatus();
  }

  @Get('movements')
  @ApiOperation({ summary: 'Get all stock movement records' })
  @ApiResponse({
    status: 200,
    description: 'Returns all stock movements with employee names',
  })
  async getMovementRecords() {
    return this.stockService.getMovementRecords();
  }

  @Get('monthly-report/periods')
  @ApiOperation({ summary: 'Get available periods for monthly report' })
  @ApiResponse({
    status: 200,
    description: 'Returns all distinct period codes',
  })
  async getAvailablePeriods() {
    return this.stockService.getAvailablePeriods();
  }

  @Get('monthly-report/:periodCode')
  @ApiOperation({ summary: 'Get stock monthly report for a specific period' })
  @ApiResponse({
    status: 200,
    description: 'Returns stock snapshot for the period',
  })
  async getStockMonthlyReport(@Param('periodCode') periodCode: string) {
    return this.stockService.getStockMonthlyReport(periodCode);
  }
}
