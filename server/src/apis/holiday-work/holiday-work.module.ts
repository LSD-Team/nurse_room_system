import { Module } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import { HolidayWorkController } from './holiday-work.controller';
import { HolidayWorkService } from './holiday-work.service';

@Module({
  controllers: [HolidayWorkController],
  providers: [HolidayWorkService, DatabaseService],
})
export class HolidayWorkModule {}
