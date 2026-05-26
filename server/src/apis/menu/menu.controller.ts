import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';

@ApiTags('menus')
@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'Get active menus' })
  @ApiResponse({ status: 200, description: 'Returns menus' })
  async findAll() {
    return this.menuService.findAll();
  }
}
