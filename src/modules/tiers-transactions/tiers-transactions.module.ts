import { Module } from '@nestjs/common';
import { TiersTransactionsService } from './tiers-transactions.service';
import { TiersTransactionsController } from './tiers-transactions.controller';

@Module({
  controllers: [TiersTransactionsController],
  providers: [TiersTransactionsService],
})
export class TiersTransactionsModule {}
