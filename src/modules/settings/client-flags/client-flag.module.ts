import { Module } from '@nestjs/common';
import { ClientFlagService } from './client-flag.service';
import { ClientFlagController } from './client-flag.controller';

@Module({
  providers: [ClientFlagService],
  controllers: [ClientFlagController]
})
export class ClientFlagModule {}
