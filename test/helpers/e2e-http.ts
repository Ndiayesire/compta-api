import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

export function assertSuccessEnvelope(
  res: request.Response,
  status: number = 200,
): void {
  expect(res.status).toBe(status);
  expect(res.body?.success).toBe(true);
}

/** Attend la fin du traitement async des jobs d’export tiers (évite fuites setImmediate en e2e). */
export async function awaitTierExportJobDone(
  app: INestApplication,
  headers: { Authorization: string },
  jobId: string,
  timeoutMs: number = 120_000,
): Promise<request.Response> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await request(app.getHttpServer())
      .get(`/tiers/jobs/${jobId}`)
      .set(headers)
      .expect(200);
    const status = res.body?.data?.status as string | undefined;
    if (status === 'completed' || status === 'failed') {
      return res;
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  throw new Error(`Export job ${jobId} timeout après ${timeoutMs}ms`);
}

export async function loginSeedAdmin(app: INestApplication): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!dev';
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      email: 'admin@localhost.dev',
      password,
    })
    .expect(200);

  const accessToken = res.body?.data?.accessToken as string | undefined;
  const refreshToken = res.body?.data?.refreshToken as string | undefined;
  expect(accessToken).toBeTruthy();
  expect(refreshToken).toBeTruthy();
  return { accessToken: accessToken!, refreshToken: refreshToken! };
}
