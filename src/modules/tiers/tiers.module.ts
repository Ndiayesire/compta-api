import { Module } from '@nestjs/common';
import { TiersService } from './tiers.service';
import { TiersController } from './tiers.controller';
import { TiersExcelTemplateService } from './tiers-excel-template.service';

@Module({
  controllers: [TiersController],
  providers: [TiersService, TiersExcelTemplateService],
})
export class TiersModule {}
