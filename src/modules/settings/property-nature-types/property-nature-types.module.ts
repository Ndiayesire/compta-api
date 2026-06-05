import { Module } from '@nestjs/common';
import { PropertyNatureTypesService } from './property-nature-types.service';
import { PropertyNatureTypesController } from './property-nature-types.controller';

@Module({
  controllers: [PropertyNatureTypesController],
  providers: [PropertyNatureTypesService],
  exports: [PropertyNatureTypesService],
})
export class PropertyNatureTypesModule {}
