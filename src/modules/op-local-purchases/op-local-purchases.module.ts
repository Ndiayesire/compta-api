import { Module } from '@nestjs/common';
import { OpLocalPurchasesService } from './op-local-purchases.service';
import { OpLocalPurchasesController } from './op-local-purchases.controller';

@Module({
  controllers: [OpLocalPurchasesController],
  providers: [OpLocalPurchasesService],
})
export class OpLocalPurchasesModule {}
