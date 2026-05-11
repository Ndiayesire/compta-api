import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TiersExportJobsService } from './tiers-export-jobs.service';
import { TiersService } from './tiers.service';

async function flushAsyncJobs(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
  await new Promise<void>((resolve) => setImmediate(resolve));
}

describe('TiersExportJobsService', () => {
  let service: TiersExportJobsService;
  const tiersService = {
    renderTierExcel: jest.fn(),
    renderTierAnnualExcel: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiersExportJobsService,
        { provide: TiersService, useValue: tiersService },
      ],
    }).compile();

    service = module.get<TiersExportJobsService>(TiersExportJobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getJob: NotFoundException si job inconnu', () => {
    expect(() => service.getJob('00000000-0000-0000-0000-000000000000')).toThrow(
      NotFoundException,
    );
  });

  it('enqueueQuarterly: passe à completed après génération', async () => {
    tiersService.renderTierExcel.mockResolvedValue({
      buffer: Buffer.from('xlsx'),
      filenameBase: 'etat-test',
    });

    const job = service.enqueueQuarterly({
      clientId: 'c1',
      companyId: 'co1',
      accountingYearId: 'y1',
      accountingQuarterId: 'q1',
    });

    expect(job.status).toBe('pending');
    expect(job.buffer).toBeNull();

    await flushAsyncJobs();

    const done = service.getJob(job.id);
    expect(done.status).toBe('completed');
    expect(done.error).toBeNull();
  });

  it('enqueueAnnual: passe à failed si render lève', async () => {
    tiersService.renderTierAnnualExcel.mockRejectedValue(new Error('boom'));

    const job = service.enqueueAnnual({
      clientId: 'c1',
      companyId: 'co1',
      accountingYearId: 'y1',
    });

    await flushAsyncJobs();

    const failed = service.getJob(job.id);
    expect(failed.status).toBe('failed');
    expect(failed.error).toContain('boom');
  });
});
