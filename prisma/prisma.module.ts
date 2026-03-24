import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // ← Très important : rend PrismaService injectable partout sans ré-importer
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Permet aux autres modules d'utiliser PrismaService
})
export class PrismaModule {}
