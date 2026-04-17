import { Module } from '@nestjs/common';
import { AppMetaService } from './app-meta.service';
import { AppMetaController } from './app-meta.controller';

@Module({
  controllers: [AppMetaController],
  providers: [AppMetaService],
})
export class AppMetaModule {}
