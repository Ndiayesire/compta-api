import { Module } from '@nestjs/common';
import { OpImportationsService } from './op-importations.service';
import { OpImportationsController } from './op-importations.controller';

@Module({
  controllers: [OpImportationsController],
  providers: [OpImportationsService],
})
export class OpImportationsModule {}
