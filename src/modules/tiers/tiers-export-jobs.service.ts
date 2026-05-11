import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TiersService } from './tiers.service';

type ExportJobStatus = 'pending' | 'running' | 'completed' | 'failed';
type ExportJobType = 'quarterly' | 'annual';

type ExportJobRecord = {
  id: string;
  type: ExportJobType;
  status: ExportJobStatus;
  createdAt: string;
  updatedAt: string;
  error: string | null;
  filename: string | null;
  mimeType: string | null;
  buffer: Buffer | null;
};

@Injectable()
export class TiersExportJobsService {
  private readonly jobs = new Map<string, ExportJobRecord>();

  constructor(private readonly tiersService: TiersService) {}

  enqueueQuarterly(input: {
    clientId: string;
    companyId: string;
    accountingYearId: string;
    accountingQuarterId: string;
  }): ExportJobRecord {
    const job = this.createJob('quarterly');
    this.runQuarterlyJob(job.id, input);
    return this.toPublicJob(job);
  }

  enqueueAnnual(input: {
    clientId: string;
    companyId: string;
    accountingYearId: string;
  }): ExportJobRecord {
    const job = this.createJob('annual');
    this.runAnnualJob(job.id, input);
    return this.toPublicJob(job);
  }

  getJob(jobId: string): ExportJobRecord {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException('Export job not found');
    }
    return this.toPublicJob(job);
  }

  getCompletedFile(jobId: string): {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  } {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException('Export job not found');
    }
    if (job.status !== 'completed' || !job.buffer || !job.filename || !job.mimeType) {
      throw new NotFoundException('Export file not ready');
    }
    return {
      buffer: job.buffer,
      filename: job.filename,
      mimeType: job.mimeType,
    };
  }

  private createJob(type: ExportJobType): ExportJobRecord {
    const now = new Date().toISOString();
    const job: ExportJobRecord = {
      id: randomUUID(),
      type,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      error: null,
      filename: null,
      mimeType: null,
      buffer: null,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  private runQuarterlyJob(
    jobId: string,
    input: {
      clientId: string;
      companyId: string;
      accountingYearId: string;
      accountingQuarterId: string;
    },
  ) {
    setImmediate(async () => {
      const job = this.jobs.get(jobId);
      if (!job) return;
      this.markRunning(job);
      try {
        const result = await this.tiersService.renderTierExcel(
          input.clientId,
          input.companyId,
          input.accountingYearId,
          input.accountingQuarterId,
        );
        this.markCompleted(job, result.buffer, `${result.filenameBase}.xlsx`);
      } catch (error) {
        this.markFailed(job, error);
      }
    });
  }

  private runAnnualJob(
    jobId: string,
    input: {
      clientId: string;
      companyId: string;
      accountingYearId: string;
    },
  ) {
    setImmediate(async () => {
      const job = this.jobs.get(jobId);
      if (!job) return;
      this.markRunning(job);
      try {
        const result = await this.tiersService.renderTierAnnualExcel(
          input.clientId,
          input.companyId,
          input.accountingYearId,
        );
        this.markCompleted(job, result.buffer, `${result.filenameBase}.xlsx`);
      } catch (error) {
        this.markFailed(job, error);
      }
    });
  }

  private markRunning(job: ExportJobRecord) {
    job.status = 'running';
    job.updatedAt = new Date().toISOString();
    this.jobs.set(job.id, job);
  }

  private markCompleted(job: ExportJobRecord, buffer: Buffer, filename: string) {
    job.status = 'completed';
    job.buffer = buffer;
    job.filename = filename;
    job.mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    job.updatedAt = new Date().toISOString();
    this.jobs.set(job.id, job);
  }

  private markFailed(job: ExportJobRecord, error: unknown) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : String(error);
    job.updatedAt = new Date().toISOString();
    this.jobs.set(job.id, job);
  }

  private toPublicJob(job: ExportJobRecord): ExportJobRecord {
    return {
      ...job,
      buffer: null,
    };
  }
}
