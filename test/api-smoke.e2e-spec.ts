import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { E2E_SEED } from './helpers/e2e-seed';
import { assertSuccessEnvelope, awaitTierExportJobDone, loginSeedAdmin } from './helpers/e2e-http';

/**
 * Smoke e2e : une requête nominale par ressource (liste ou détail seed).
 * Prérequis : base seedée (`npm run seed`), `DATABASE_URL`, compte admin seed.
 */
jest.setTimeout(180000);

describe('API smoke e2e (tous modules)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let refreshToken: string;

  const authHeader = () => ({
    Authorization: `Bearer ${accessToken}`,
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    const tokens = await loginSeedAdmin(app);
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('public & auth', () => {
    it('GET /health', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      expect(res.body?.success).toBe(true);
    });

    it('POST /auth/login', async () => {
      const tokens = await loginSeedAdmin(app);
      expect(tokens.accessToken).toBeTruthy();
    });

    it('GET /auth/me', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('POST /auth/refresh', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set(authHeader())
        .send({ refreshToken })
        .expect(200);
      assertSuccessEnvelope(res);
      const nextRefresh = res.body?.data?.refreshToken as string | undefined;
      expect(nextRefresh).toBeTruthy();
      refreshToken = nextRefresh!;
    });
  });

  describe('settings & référentiels', () => {
    it('GET /countries', async () => {
      const res = await request(app.getHttpServer())
        .get('/countries')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /countries/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/countries/${E2E_SEED.countrySn}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /regions', async () => {
      const res = await request(app.getHttpServer())
        .get('/regions')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /regions/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/regions/${E2E_SEED.regionDakar}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /currencies', async () => {
      const res = await request(app.getHttpServer())
        .get('/currencies')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /currencies/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/currencies/${E2E_SEED.currencyXof}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /legal-forms', async () => {
      const res = await request(app.getHttpServer())
        .get('/legal-forms')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /legal-forms/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/legal-forms/${E2E_SEED.legalSarl}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /genders', async () => {
      const res = await request(app.getHttpServer())
        .get('/genders')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /genders/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/genders/${E2E_SEED.genderM}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /languages', async () => {
      const res = await request(app.getHttpServer())
        .get('/languages')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /languages/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/languages/${E2E_SEED.langFr}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /tier-types', async () => {
      const res = await request(app.getHttpServer())
        .get('/tier-types')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /tier-types/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tier-types/${E2E_SEED.tierTypeCustomer}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /contract-types', async () => {
      const res = await request(app.getHttpServer())
        .get('/contract-types')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /contract-types/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/contract-types/${E2E_SEED.contractCdi}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /document-categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/document-categories')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /document-categories/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/document-categories/${E2E_SEED.docCatInvoice}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /identification-types', async () => {
      const res = await request(app.getHttpServer())
        .get('/identification-types')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /identification-types/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/identification-types/${E2E_SEED.idTypeCni}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /payment-methods/types', async () => {
      const res = await request(app.getHttpServer())
        .get('/payment-methods/types')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /payment-methods', async () => {
      const res = await request(app.getHttpServer())
        .get('/payment-methods')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /payment-methods/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/payment-methods/${E2E_SEED.pmOm}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /permissions', async () => {
      const res = await request(app.getHttpServer())
        .get('/permissions')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /permissions/type/:typeId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/permissions/type/${E2E_SEED.permTypeCore}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /permissions/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/permissions/${E2E_SEED.permAll}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /roles', async () => {
      const res = await request(app.getHttpServer())
        .get('/roles')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /roles/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/roles/${E2E_SEED.roleAdmin}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });
  });

  describe('comptabilité & meta', () => {
    it('GET /accounting-years', async () => {
      const res = await request(app.getHttpServer())
        .get('/accounting-years')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /accounting-years/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/accounting-years/${E2E_SEED.accountingYearDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /accounting-quarters', async () => {
      const res = await request(app.getHttpServer())
        .get('/accounting-quarters')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /accounting-quarters (filtre exercice)', async () => {
      const res = await request(app.getHttpServer())
        .get('/accounting-quarters')
        .query({ accountingYearId: E2E_SEED.accountingYearDemo })
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /accounting-quarters/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/accounting-quarters/${E2E_SEED.accountingQuarterT1}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /app-meta', async () => {
      const res = await request(app.getHttpServer())
        .get('/app-meta')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /app-meta/by-key/:key', async () => {
      const res = await request(app.getHttpServer())
        .get('/app-meta/by-key/accounting_year')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });
  });

  describe('société & utilisateurs', () => {
    it('GET /company', async () => {
      const res = await request(app.getHttpServer())
        .get('/company')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /company/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/company/${E2E_SEED.companyDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /users', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /users/me', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /users/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${E2E_SEED.adminUserId}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });
  });

  describe('clients, salariés, contrats, documents', () => {
    it('GET /clients', async () => {
      const res = await request(app.getHttpServer())
        .get('/clients')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /clients/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/clients/${E2E_SEED.clientDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /employees/client/:clientId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/employees/client/${E2E_SEED.clientDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /employees/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/employees/${E2E_SEED.employeeDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /employee-contracts', async () => {
      const res = await request(app.getHttpServer())
        .get('/employee-contracts')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /employee-contracts/employee/:employeeId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/employee-contracts/employee/${E2E_SEED.employeeDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /employee-contracts/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/employee-contracts/${E2E_SEED.empContractDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /documents', async () => {
      const res = await request(app.getHttpServer())
        .get('/documents')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /documents/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/documents/${E2E_SEED.documentDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });
  });

  describe('activités & notifications', () => {
    it('GET /activities', async () => {
      const res = await request(app.getHttpServer())
        .get('/activities')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /activities/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/activities/${E2E_SEED.activityDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /notifications/unread', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications/unread')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /notifications', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /notifications/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/notifications/${E2E_SEED.notificationDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });
  });

  describe('tiers & transactions', () => {
    it('GET /tiers', async () => {
      const res = await request(app.getHttpServer())
        .get('/tiers')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /tiers/client/:clientId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tiers/client/${E2E_SEED.clientDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /tiers/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tiers/${E2E_SEED.tierDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /tiers-transactions', async () => {
      const res = await request(app.getHttpServer())
        .get('/tiers-transactions')
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /tiers-transactions?tierId=', async () => {
      const res = await request(app.getHttpServer())
        .get('/tiers-transactions')
        .query({ tierId: E2E_SEED.tierDemo })
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('GET /tiers-transactions/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tiers-transactions/${E2E_SEED.tiersTxDemo}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('POST /tiers/:clientId/xlsx/jobs + polling jusqu’à completed', async () => {
      const q = new URLSearchParams({
        accountingYearId: E2E_SEED.accountingYearDemo,
        accountingQuarterId: E2E_SEED.accountingQuarterT1,
      });
      const created = await request(app.getHttpServer())
        .post(`/tiers/${E2E_SEED.clientDemo}/xlsx/jobs?${q.toString()}`)
        .set(authHeader())
        .expect(201);
      assertSuccessEnvelope(created, 201);
      const jobId = created.body?.data?.id as string;
      expect(jobId).toBeTruthy();

      const finalRes = await awaitTierExportJobDone(
        app,
        authHeader(),
        jobId,
      );
      assertSuccessEnvelope(finalRes);
      expect(finalRes.body?.data?.status).toBe('completed');
    });

    it('POST /tiers/:clientId/xlsx/annual/jobs + polling jusqu’à completed', async () => {
      const created = await request(app.getHttpServer())
        .post(
          `/tiers/${E2E_SEED.clientDemo}/xlsx/annual/jobs?accountingYearId=${E2E_SEED.accountingYearDemo}`,
        )
        .set(authHeader())
        .expect(201);
      assertSuccessEnvelope(created, 201);
      const jobId = created.body?.data?.id as string;
      expect(jobId).toBeTruthy();

      const finalRes = await awaitTierExportJobDone(
        app,
        authHeader(),
        jobId,
      );
      assertSuccessEnvelope(finalRes);
      expect(finalRes.body?.data?.status).toBe('completed');
    });
  });

  describe('balances & lignes (import Excel)', () => {
    const exampleXlsx = path.join(
      __dirname,
      '..',
      'src',
      'assets',
      'xlsx',
      'balance-lines-import-example.xlsx',
    );

    it('GET /balances', async () => {
      const res = await request(app.getHttpServer())
        .get('/balances')
        .query({ clientId: E2E_SEED.clientDemo })
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(res);
    });

    it('POST /balances + import .xlsx + GET/PATCH balance-lines + DELETE', async () => {
      const create = await request(app.getHttpServer())
        .post('/balances')
        .set(authHeader())
        .send({
          accountingYearId: E2E_SEED.accountingYearDemo,
          clientId: E2E_SEED.clientDemo,
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-03-31T00:00:00.000Z',
          isActive: true,
        })
        .expect(201);
      assertSuccessEnvelope(create, 201);
      const balanceId = create.body?.data?.id as string;
      expect(balanceId).toBeTruthy();

      const oneBal = await request(app.getHttpServer())
        .get(`/balances/${balanceId}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(oneBal);

      const xlsxBuf = fs.readFileSync(exampleXlsx);
      const imp = await request(app.getHttpServer())
        .post(`/balances/${balanceId}/balance-lines/import`)
        .set(authHeader())
        .attach(
          'file',
          xlsxBuf,
          'balance-lines-import-example.xlsx',
        )
        .expect(201);
      assertSuccessEnvelope(imp, 201);
      expect(imp.body?.data?.createdCount).toBeGreaterThan(0);

      const lines = await request(app.getHttpServer())
        .get('/balance-lines')
        .query({ balanceId })
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(lines);
      const firstLine = lines.body?.data?.[0];
      expect(firstLine?.id).toBeTruthy();

      const lineDetail = await request(app.getHttpServer())
        .get(`/balance-lines/${firstLine.id}`)
        .set(authHeader())
        .expect(200);
      assertSuccessEnvelope(lineDetail);

      const patched = await request(app.getHttpServer())
        .patch(`/balance-lines/${firstLine.id}`)
        .set(authHeader())
        .send({ name: String(firstLine.name) })
        .expect(200);
      assertSuccessEnvelope(patched);

      await request(app.getHttpServer())
        .delete(`/balances/${balanceId}`)
        .set(authHeader())
        .expect(200);
    });
  });
});
