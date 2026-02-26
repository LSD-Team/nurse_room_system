//  ----- 📖 Library 📖 -----
import { ConfigService } from '@nestjs/config';

const databaseName = (): string => {
  const configService = new ConfigService();
  return (
    configService.get<string>('DATABASE_NAME') || 'TEMPLATE_WEB_STACK_2025'
  );
};
export { databaseName };
