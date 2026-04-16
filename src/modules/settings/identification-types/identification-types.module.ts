import { Module } from '@nestjs/common';
import { IdentificationTypesController } from './identification-types.controller';
import { IdentificationTypesService } from './identification-types.service';

@Module({
  controllers: [IdentificationTypesController],
  providers: [IdentificationTypesService],
})
export class IdentificationTypesModule {}
