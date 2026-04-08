//  ----- 📖 Library 📖 -----
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { AppService } from '@/src/app.service';
import { Public } from './auth/decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  healthCheck() {
    throw new HttpException('OK', HttpStatus.OK);
  }
}
