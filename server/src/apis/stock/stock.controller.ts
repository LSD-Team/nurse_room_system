import { Controller, Get } from '@nestjs/common';
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
}
