import { Module } from '@nestjs/common';
import { OpExemptionsService } from './op-exemptions.service';
import { OpExemptionsController } from './op-exemptions.controller';

@Module({
  controllers: [OpExemptionsController],
  providers: [OpExemptionsService],
})
export class OpExemptionsModule {}
