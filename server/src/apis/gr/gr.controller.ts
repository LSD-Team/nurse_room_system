import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GrService } from './gr.service';
import { IAvailablePo, IGrDetail, IGrHeaderList } from './gr.interface';

@ApiTags('gr')
@Controller('gr')
export class GrController {
  constructor(private readonly grService: GrService) {}

  // ─── GET /gr ───
  @Get()
  @ApiOperation({ summary: 'Get all GR headers' })
  @ApiResponse({ status: 200, description: 'Returns all GR headers' })
  async getGrHeaders(): Promise<IGrHeaderList[]> {
    return this.grService.getGrList();
  }

  // ─── GET /gr/list ───
  @Get('list')
  @ApiOperation({ summary: 'Get all GR headers (legacy route)' })
  @ApiResponse({ status: 200, description: 'Returns all GR headers' })
  async getGrList(): Promise<IGrHeaderList[]> {
    return this.grService.getGrList();
  }

  // ─── GET /gr/available-po ───
  @Get('available-po')
  @ApiOperation({ summary: 'Get POs available for goods receipt' })
  @ApiResponse({
    status: 200,
    description: 'Returns POs in ORDERED or PARTIAL status',
  })
  async getAvailablePos(): Promise<IAvailablePo[]> {
    return this.grService.getAvailablePos();
  }

  // ─── GET /gr/:id ───
  @Get(':id')
  @ApiOperation({ summary: 'Get GR detail by GR ID' })
  @ApiParam({ name: 'id', type: Number })
  async getGrDetail(
    @Param('id', ParseIntPipe) grId: number,
  ): Promise<IGrDetail> {
    return this.grService.getGrDetail(grId);
  }
}
