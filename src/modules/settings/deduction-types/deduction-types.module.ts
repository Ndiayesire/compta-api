import { Module } from '@nestjs/common';
import { DeductionTypesService } from './deduction-types.service';
import { DeductionTypesController } from './deduction-types.controller';

@Module({
  controllers: [DeductionTypesController],
  providers: [DeductionTypesService],
  exports: [DeductionTypesService],
})
export class DeductionTypesModule {}
