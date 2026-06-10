import { Module } from '@nestjs/common';
import { OpExportationsService } from './op-exportations.service';
import { OpExportationsController } from './op-exportations.controller';

@Module({
  controllers: [OpExportationsController],
  providers: [OpExportationsService],
})
export class OpExportationsModule {}
