import { Module } from '@nestjs/common';
import { AccountingYearsService } from './accounting-years.service';
import { AccountingYearsController } from './accounting-years.controller';

@Module({
  controllers: [AccountingYearsController],
  providers: [AccountingYearsService],
})
export class AccountingYearsModule {}
