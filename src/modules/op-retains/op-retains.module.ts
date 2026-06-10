import { Module } from '@nestjs/common';
import { OpRetainsService } from './op-retains.service';
import { OpRetainsController } from './op-retains.controller';

@Module({
  controllers: [OpRetainsController],
  providers: [OpRetainsService],
})
export class OpRetainsModule {}
