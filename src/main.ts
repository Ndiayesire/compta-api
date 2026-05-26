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
    .setDescription(
      'Comptabilité InstaHR — Documentation API pour la gestion métier (CRUD), la comptabilité et les rapports DGID (exports directs et jobs asynchrones).'
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token from POST /auth/login',
      },
      'JWT',
    )
    .addTag('App', 'Health and API status')
    .addTag('auth', 'Authentication and authorization')
    .addTag('users', 'User management')
    .addTag('companies', 'Company management')
    .addTag('legal-forms', 'Company Legal Form Settings')
    .addTag('document-categories', 'Document categories')
    .addTag('documents', 'Company documents')
    .addTag('activities', 'User activities')
    .addTag('notifications', 'User notifications')
    .addTag('countries', 'Country settings')
    .addTag('regions', 'Region settings')
    .addTag('genders', 'Gender settings')
    .addTag('languages', 'Language settings')
    .addTag('currencies', 'Currency settings')
    .addTag('payment-methods', 'Payment method settings')
    .addTag('permissions', 'Permission management')
    .addTag('roles', 'Role management')
    .addTag('clients', 'Client management')
    .addTag(
      'employees',
      'Employés : CRUD et import Excel (.xlsx).',
    )
    .addTag('employee-contracts', 'Employee contracts')
    .addTag('contract-types', 'Contract Type management')
    .addTag('identification-types', 'Identification type settings')
    .addTag('tier-types', 'Tier type settings')
    .addTag('tiers', 'Tiers per client')
    .addTag('Etats', 'Rapports Excel DGID (sommes versées)')
    .addTag('accounting-years', 'Accounting years')
    .addTag('accounting-quarters', 'Accounting quarters')
    .addTag('app-meta', 'Key/value meta table')
    .addTag('tiers-transactions', 'Tier transaction lines')
    .addTag('rental-usages', 'Catalogue `rental_usages`')
    .addTag('rentals', 'Locations')
    .addTag('balances', 'Balances par client et exercice. Import lignes.')
    .addTag('balance-lines', 'Lecture / mise à jour / suppression de lignes. Création en masse via import sous le tag **balances**.')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('/', app, document, {
    customSiteTitle: 'Insta Compta · API Docs',
    customfavIcon: '/public/favicon.ico',
    customCssUrl: '/public/swagger-custom.css',
    customJs: ['/public/swagger-dark.js'],
    swaggerOptions: {
      persistAuthorization: true,
      // displayRequestDuration: true,
      filter: true,
      // deepLinking: true,
      docExpansion: 'none',
      // defaultModelsExpandDepth: 1,
      tagsSorter: 'alpha',
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();