import { Module } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { BalancesController } from './balances.controller';
import { BalanceLinesController } from './balance-lines.controller';

@Module({
  controllers: [BalancesController, BalanceLinesController],
  providers: [BalancesService],
})
export class BalancesModule {}
