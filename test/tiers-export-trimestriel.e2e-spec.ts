import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/**
 * UUID stables : `prisma/seed.cjs` — client démo, exercice 2025, trimestre T1.
 * Prérequis : `npm run seed` et `DATABASE_URL` valide.
 */
const SEED = {
  clientDemo: 'a0000021-0000-4000-8000-000000000001',
  accountingYearDemo: 'a000002b-0000-4000-8000-000000000001',
  accountingQuarterT1: 'a000002c-0000-4000-8000-000000000001',
} as const;

const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!dev';

describe('GET /tiers/:clientId/xlsx (état trimestriel, e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('retourne un XLSX avec accountingYearId + accountingQuarterId (seed)', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@localhost.dev',
        password: SEED_ADMIN_PASSWORD,
      })
      .expect(200);

    const token = loginRes.body?.data?.accessToken as string | undefined;
    expect(token).toBeTruthy();

    const q = new URLSearchParams({
      accountingYearId: SEED.accountingYearDemo,
      accountingQuarterId: SEED.accountingQuarterT1,
    });
    const url = `/tiers/${SEED.clientDemo}/xlsx?${q.toString()}`;

    const res = await request(app.getHttpServer())
      .get(url)
      .set('Authorization', `Bearer ${token}`)
      .responseType('blob')
      .expect(200)
      .expect(
        'Content-Type',
        /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/,
      );

    const raw = res.body as Buffer | Record<string, unknown>;
    const buf = Buffer.isBuffer(raw)
      ? raw
      : Buffer.from(typeof raw === 'string' ? raw : JSON.stringify(raw));

    expect(buf.length).toBeGreaterThan(3000);
    expect(buf.subarray(0, 2).toString('ascii')).toBe('PK');
  });
});
