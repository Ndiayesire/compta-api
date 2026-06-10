import { Module } from '@nestjs/common';
import { OpRoyaltiesService } from './op-royalties.service';
import { OpRoyaltiesController } from './op-royalties.controller';

@Module({
  controllers: [OpRoyaltiesController],
  providers: [OpRoyaltiesService],
})
export class OpRoyaltiesModule {}
