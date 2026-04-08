//  ----- 📖 Library 📖 -----
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { DatabaseService } from '@/src/database/database.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
class DatabaseModule {}

export { DatabaseModule };
