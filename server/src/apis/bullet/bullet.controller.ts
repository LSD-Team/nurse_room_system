import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BulletService } from './bullet.service';
import type { IBulletCounts } from '@/shared/bullet.interface';

@ApiTags('bullet')
@Controller('bullet')
export class BulletController {
  constructor(private readonly bulletService: BulletService) {}

  // ─── GET /bullet/counts ───
  @Get('counts')
  @ApiOperation({ summary: 'Get bullet counts from view_bullet_list' })
  @ApiResponse({
    status: 200,
    description: 'Returns bullet counts for menu notifications',
  })
  async getBulletCounts(): Promise<IBulletCounts> {
    return this.bulletService.getBulletCounts();
  }
}
