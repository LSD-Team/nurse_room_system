/* eslint-disable @typescript-eslint/no-floating-promises */
//  ----- 📖 Library 📖 -----
import { AppModule } from '@/src/app.module';
import { NestFactory } from '@nestjs/core';

//  ----- ⚙️ Providers & Services ⚙️ -----
import { Logger } from '@nestjs/common/services/logger.service';

//  ----- swagger -----
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';

async function bootstrap() {
  const app_name: string = process.env.APP_NAME || 'unknown';
  const app_version: string = process.env.APP_VERSION || 'unknown';
  const port: number = parseInt(process.env.APP_PORT || '3000'); // 3000 is default port
  const databaseserver = process.env.DATABASE_SERVER;
  const mode = process.env.NODE_ENV;
  const database = process.env.DATABASE_NAME;

  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle(app_name)
    .setDescription(`${app_name} API description`)
    .setVersion(app_version)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors({
    origin: '*', // ให้ทุก domain สามารถเข้าถึง API ได้
  });

  await app.listen(port).then(() => {
    const logger = new Logger();
    logger.verbose(`Version :: ${app_version}`);
    logger.verbose(`Port :: ${port}`);
    logger.verbose(`Database :: ${databaseserver}`);
    logger.verbose(`Database Name :: ${database}`);
    logger.verbose(`MODE :: ${mode}`);
  });
}
bootstrap();
