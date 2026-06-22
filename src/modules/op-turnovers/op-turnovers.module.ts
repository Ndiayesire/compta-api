import { Module } from '@nestjs/common';
import { OpTurnoversService } from './op-turnovers.service';
import { OpTurnoversController } from './op-turnovers.controller';

@Module({
  controllers: [OpTurnoversController],
  providers: [OpTurnoversService],
})
export class OpTurnoversModule {}
