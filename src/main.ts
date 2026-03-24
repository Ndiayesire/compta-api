import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Insta Compta API')
    .setDescription('Comptabilité InstaHR API documentation')
    .setVersion('1.0')
    .addTag('companies', 'Company management')
    .addTag('countries', 'Country settings')
    .addTag('payment-methods', 'Payment method settings')
    .addTag('regions', 'Region settings')
    .addTag('permissions', 'Permission management')
    .addTag('roles', 'Role management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();