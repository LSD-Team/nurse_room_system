import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/src/database/database.module';
import { GrService } from './gr.service';
import { GrController } from './gr.controller';

@Module({
  imports: [DatabaseModule],
  providers: [GrService],
  controllers: [GrController],
  exports: [GrService],
})
export class GrModule {}
