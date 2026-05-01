import { Module } from '@nestjs/common';
import { ExcelReportsModule } from '../excel-reports/excel-reports.module';
import { TiersService } from './tiers.service';
import { TiersController } from './tiers.controller';

@Module({
  imports: [ExcelReportsModule],
  controllers: [TiersController],
  providers: [TiersService],
})
export class TiersModule {}
