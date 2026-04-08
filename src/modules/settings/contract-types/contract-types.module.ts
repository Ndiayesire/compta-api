import { Module } from '@nestjs/common';
import { ContractTypesService } from './contract-types.service';
import { ContractTypesController } from './contract-types.controller';

@Module({
  controllers: [ContractTypesController],
  providers: [ContractTypesService],
})
export class ContractTypesModule {}
