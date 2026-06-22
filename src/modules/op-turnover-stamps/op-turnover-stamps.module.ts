import { Module } from '@nestjs/common';
import { OpTurnoverStampsService } from './op-turnover-stamps.service';
import { OpTurnoverStampsController } from './op-turnover-stamps.controller';

@Module({
  controllers: [OpTurnoverStampsController],
  providers: [OpTurnoverStampsService],
})
export class OpTurnoverStampsModule {}
