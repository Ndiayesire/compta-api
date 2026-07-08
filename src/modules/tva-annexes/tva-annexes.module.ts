import { Module } from '@nestjs/common';
import { TvaAnnexesController } from './tva-annexes.controller';
import { TvaAnnexesService } from './tva-annexes.service';

@Module({
  controllers: [TvaAnnexesController],
  providers: [TvaAnnexesService],
  exports: [TvaAnnexesService],
})
export class TvaAnnexesModule {}
