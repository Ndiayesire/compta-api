import { Module } from '@nestjs/common';
import { TierTypesService } from './tier-types.service';
import { TierTypesController } from './tier-types.controller';

@Module({
  controllers: [TierTypesController],
  providers: [TierTypesService],
})
export class TierTypesModule {}
