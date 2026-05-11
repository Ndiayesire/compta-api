import { Module } from '@nestjs/common';
import { ExcelReportsModule } from '../excel-reports/excel-reports.module';
import { TiersService } from './tiers.service';
import { TiersController } from './tiers.controller';
import { TiersExportJobsService } from './tiers-export-jobs.service';

@Module({
  imports: [ExcelReportsModule],
  controllers: [TiersController],
  providers: [TiersService, TiersExportJobsService],
})
export class TiersModule {}
