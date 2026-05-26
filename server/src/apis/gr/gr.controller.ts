import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { GrService } from './gr.service';
import {
  IAvailablePo,
  IGrDetail,
  IGrHeaderList,
  IPendingItem,
} from './gr.interface';

interface CreateGrRequestDto {
  po_id: number;
  json_lines?: string; // Optional JSON array of items to receive
  note?: string | null;
}

interface ConfirmGrResponseDto {
  status: string;
  message: string;
}

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

  // ─── GET /gr/pending-items/:poId ───
  @Get('pending-items/:poId')
  @ApiOperation({ summary: 'Get pending items from a specific PO' })
  @ApiParam({ name: 'poId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns pending items with quantities',
  })
  async getPendingItems(
    @Param('poId', ParseIntPipe) poId: number,
  ): Promise<IPendingItem[]> {
    return this.grService.getPendingItems(poId);
  }

  // ─── POST /gr/create ───
  @Post('create')
  @ApiOperation({ summary: 'Create a new GR (sp_GR_02_CreateGR)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        po_id: { type: 'number', example: 1 },
        json_lines: {
          type: 'string',
          example:
            '[{"item_id": 1, "qty": 10.0000, "po_line_id": 648}, {"item_id": 2, "qty": 5.0000, "po_line_id": 649}]',
          nullable: true,
        },
        note: { type: 'string', example: 'Some remark', nullable: true },
      },
      required: ['po_id'],
    },
  })
  @ApiResponse({ status: 200, description: 'GR created successfully' })
  async createGr(
    @Body() dto: CreateGrRequestDto,
  ): Promise<{ gr_id: number; gr_no: string }> {
    console.log('[GrController] POST /gr/create - Request Body:', {
      po_id: dto.po_id,
      json_lines: dto.json_lines,
      note: dto.note,
    });

    const createdBy = global.jwtPayload?.UserID || 'SYSTEM';
    return this.grService.createGr(
      dto.po_id,
      dto.json_lines,
      dto.note || null,
      createdBy,
    );
  }

  // ─── POST /gr/:id/confirm ───
  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm GR and update stock (sp_GR_03_ConfirmGR)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'GR confirmed successfully' })
  async confirmGr(
    @Param('id', ParseIntPipe) grId: number,
  ): Promise<ConfirmGrResponseDto> {
    const confirmedBy = global.jwtPayload?.UserID || 'SYSTEM';
    return this.grService.confirmGr(grId, confirmedBy);
  }

  // ─── POST /gr/:id/cancel ───
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel GR' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'GR cancelled successfully' })
  async cancelGr(
    @Param('id', ParseIntPipe) grId: number,
  ): Promise<ConfirmGrResponseDto> {
    const cancelledBy = global.jwtPayload?.UserID || 'SYSTEM';
    return this.grService.cancelGr(grId, cancelledBy);
  }

  // ─── GET /gr/draft-count ───
  @Get('draft-count')
  @ApiOperation({ summary: 'Get count of GRs with DRAFT status' })
  @ApiResponse({ status: 200, description: 'Returns count of DRAFT GRs' })
  async getGrDraftCount() {
    const count = await this.grService.getGrDraftCount();
    return { count };
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
