import { Module } from '@nestjs/common';
import { EmployeeContractsService } from './employee-contracts.service';
import { EmployeeContractsController } from './employee-contracts.controller';

@Module({
  controllers: [EmployeeContractsController],
  providers: [EmployeeContractsService],
})
export class EmployeeContractsModule {}
