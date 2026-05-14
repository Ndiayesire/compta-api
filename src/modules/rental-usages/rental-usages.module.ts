import { Module } from '@nestjs/common';
import { RentalUsagesService } from './rental-usages.service';
import { RentalUsagesController } from './rental-usages.controller';

@Module({
  controllers: [RentalUsagesController],
  providers: [RentalUsagesService],
})
export class RentalUsagesModule {}
