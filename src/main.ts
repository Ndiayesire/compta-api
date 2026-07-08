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
  app.use('/docs', express.static(join(__dirname, '..', '..', 'public', 'docs'), { index: 'index.html' }));

  const httpAdapter = app.getHttpAdapter().getInstance();

  const redirectToDocsApi = (_req: express.Request, res: express.Response) => {
    res.redirect('/docs/api');
  };

  httpAdapter.get('/', (_req: express.Request, res: express.Response) => {
    res.redirect('/docs');
  });
  httpAdapter.get('/api', redirectToDocsApi);
  httpAdapter.get('/api/', redirectToDocsApi);
  httpAdapter.get('/api-internal', redirectToDocsApi);
  httpAdapter.get('/api-internal/', redirectToDocsApi);

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
    .addTag('deduction-types', 'Types de déduction — référentiel ; création auto à l’import Excel **op-importations** si libellé inconnu')
    .addTag('property-nature-types', 'Natures de biens / services — référentiel ; création auto à l’import **op-importations** (code incrémenté)')
    .addTag('op-turnovers', 'Chiffres d’affaires par client — CRUD JSON et **POST /import** Excel (.xlsx, query clientId)')
    .addTag('op-turnover-stamps', 'Timbres / versions de CA — CRUD JSON et **POST /import** Excel (.xlsx, query clientId)')
    .addTag('op-local-purchases', 'Achats locaux — CRUD JSON et **POST /import** Excel (.xlsx, query clientId)')
    .addTag('op-suspensions', 'Suspensions fiscales par tiers — CRUD JSON et **POST /import** Excel (.xlsx, query clientId)')
    .addTag('op-importations', 'Importations fiscales par fournisseur — CRUD JSON et **POST /import** Excel (.xlsx, query clientId)')
    .addTag('op-exportations', 'Exportations par tiers — CRUD JSON et **POST /import** Excel (.xlsx, query clientId)')
    .addTag('op-retains', 'Retenues à la source par tiers — CRUD JSON et **POST /import** Excel (.xlsx, query clientId)')
    .addTag('op-royalties', 'Redevances par tiers — CRUD JSON et **POST /import** Excel (.xlsx, query clientId)')
    .addTag('op-exemptions', 'Exonérations par tiers — CRUD JSON et **POST /import** Excel (query clientId + year)')
    .addTag(
      'tva-annexes',
      'Annexe fiscale TVA — **GET /tva-annexes/compute** (agrégation mensuelle L5–L115 à partir des opérations `op_*`)',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-internal', app, document, {
    customSiteTitle: 'Insta Compta · API Reference',
    customfavIcon: '/public/favicon.ico',
    customCssUrl: '/public/swagger-custom.css',
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      docExpansion: 'none',
      tagsSorter: 'alpha',
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();