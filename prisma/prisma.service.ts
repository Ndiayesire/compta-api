import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host:     parsed.hostname,
    port:     parseInt(parsed.port, 10) || 3306,
    user:     parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace('/', ''),

    connectionLimit: 5,
    idleTimeout: 60,
    connectTimeout: 30000, 

  };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const config = parseDatabaseUrl(process.env.DATABASE_URL!);
    const adapter = new PrismaMariaDb(config);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Base de données connectée avec succès ✅ ');
    } catch (error) {
      this.logger.error('Échec de la connexion à la base de données ❌ ', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}