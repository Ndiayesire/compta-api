import { Module } from '@nestjs/common';
import { ClientTypesController } from './client-types.controller';
import { ClientTypesService } from './client-types.service';

@Module({
  controllers: [ClientTypesController],
  providers: [ClientTypesService]
})
export class ClientTypesModule {}
