import { Module } from '@nestjs/common';
import { AccountingQuartersService } from './accounting-quarters.service';
import { AccountingQuartersController } from './accounting-quarters.controller';

@Module({
  controllers: [AccountingQuartersController],
  providers: [AccountingQuartersService],
})
export class AccountingQuartersModule {}
