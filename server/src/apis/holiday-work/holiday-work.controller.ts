import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';
import { HolidayWorkService } from './holiday-work.service';
import type {
  ICreateHolidayWorkDto,
  IUpdateHolidayWorkDto,
} from './holiday-work.interface';

@ApiTags('holiday-work')
@ApiBearerAuth()
@Controller('holiday-work')
export class HolidayWorkController {
  constructor(private readonly holidayWorkService: HolidayWorkService) {}

  private get currentUserId(): number {
    const userId = (global.jwtPayload as JwtPayloadData)?.UserID;
    return userId ? parseInt(userId, 10) : 0;
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active holiday work announcements (Today & Tomorrow)' })
  @ApiResponse({ status: 200, description: 'Returns list of active announcements' })
  async getActive() {
    return this.holidayWorkService.getActive();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all holiday work announcements (For Management)' })
  @ApiResponse({ status: 200, description: 'Returns list of all announcements' })
  async getAll() {
    return this.holidayWorkService.getAll();
  }

  @Get('by-date')
  @ApiOperation({ summary: 'Get holiday work announcement by specific date' })
  @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Returns the announcement for the date' })
  async getByDate(@Query('date') date: string) {
    return this.holidayWorkService.getByDate(date);
  }

  @Post()
  @ApiOperation({ summary: 'Create holiday work announcement' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async create(@Body() body: ICreateHolidayWorkDto) {
    return this.holidayWorkService.create(body, this.currentUserId.toString());
  }

  @Put(':date')
  @ApiOperation({ summary: 'Update holiday work announcement by date' })
  @ApiResponse({ status: 200, description: 'Updated successfully' })
  async update(
    @Param('date') date: string,
    @Body() body: IUpdateHolidayWorkDto,
  ) {
    return this.holidayWorkService.update(date, body, this.currentUserId.toString());
  }

  @Delete(':date')
  @ApiOperation({ summary: 'Delete holiday work announcement by date' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async delete(@Param('date') date: string) {
    return this.holidayWorkService.delete(date);
  }
}
