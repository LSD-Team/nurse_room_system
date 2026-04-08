import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';

import { AdminGuard } from '@/src/auth/guard';

/**
 * how to use guard
 * Global AppGuard is applied to all routes by default
 * @UseGuards(UserGuard) // User access
 * @UseGuards(AdminGuard) // Admin access
 */

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all employees from the view' })
  @ApiResponse({ status: 200, description: 'Returns all employees' })
  @UseGuards(AdminGuard)
  async findAll() {
    return this.employeesService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my employee information' })
  @ApiResponse({ status: 200, description: 'Returns my employee information' })
  async findMyInfo() {
    return this.employeesService.findMyInfo();
  }
}
