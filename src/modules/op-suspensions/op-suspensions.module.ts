import { Module } from '@nestjs/common';
import { OpSuspensionsService } from './op-suspensions.service';
import { OpSuspensionsController } from './op-suspensions.controller';

@Module({
  controllers: [OpSuspensionsController],
  providers: [OpSuspensionsService],
})
export class OpSuspensionsModule {}
