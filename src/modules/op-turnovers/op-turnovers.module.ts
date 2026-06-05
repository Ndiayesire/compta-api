import { Module } from '@nestjs/common';
import { OpTurnoversService } from './op-turnovers.service';
import { OpTurnoversController } from './op-turnovers.controller';
import { OpTurnoverStampsController } from './op-turnover-stamps.controller';

@Module({
  controllers: [OpTurnoversController, OpTurnoverStampsController],
  providers: [OpTurnoversService],
})
export class OpTurnoversModule {}
