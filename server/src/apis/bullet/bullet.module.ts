import { Module } from '@nestjs/common';
import { BulletController } from './bullet.controller';
import { BulletService } from './bullet.service';
import { DatabaseModule } from '@/src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BulletController],
  providers: [BulletService],
})
export class BulletModule {}
