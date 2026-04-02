import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    Credentials: false,
  });

  app.use('/public', express.static(join(__dirname, '..', '..', 'public')));

  const config = new DocumentBuilder()
    .setTitle('Insta Compta API')
    .setDescription('Comptabilité InstaHR API documentation')
    .setVersion('1.0.0')
    .addTag('auth', 'Authentication and authorization')
    .addTag('users', 'User management')
    .addTag('companies', 'Company management')
    .addTag('legal-forms', 'Company Legal Form Settings')
    .addTag('countries', 'Country settings')
    .addTag('regions', 'Region settings')
    .addTag('currencies', 'Currency settings')
    .addTag('payment-methods', 'Payment method settings')
    .addTag('permissions', 'Permission management')
    .addTag('roles', 'Role management')
    .addTag('client-types', 'Client type management')
    .addTag('client-flags', 'Client flag management')
    .addTag('clients', 'Client management')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('/', app, document, {
    customSiteTitle: 'Insta Compta · API Docs',
    customfavIcon: '/public/favicon.ico',
    customCssUrl: '/public/swagger-custom.css',
    customJs: ['/public/swagger-dark.js'],
    swaggerOptions: {
      // persistAuthorization: true,
      // displayRequestDuration: true,
      filter: true,
      // deepLinking: true,
      docExpansion: 'none',
      // defaultModelsExpandDepth: 1,
      tagsSorter: 'alpha',
      tryItOutEnabled: false
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();