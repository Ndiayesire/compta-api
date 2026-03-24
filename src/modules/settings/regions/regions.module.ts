import { Module } from '@nestjs/common';
import { RegionsService } from './region.service';
import { RegionsController } from './regions.controller';

@Module({
  controllers: [RegionsController],
  providers: [RegionsService],
  exports: [RegionsService],
})
export class RegionsModule {}