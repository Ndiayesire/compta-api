import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly allowedOrigins: string[] = [];

  constructor() {
    const origins = process.env.ALLOWED_ORIGINS || '';
    this.allowedOrigins = origins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const origin = req.headers.origin as string | undefined;

    if (origin && this.allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (this.allowedOrigins.length === 0) {
      res.header('Access-Control-Allow-Origin', '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  }
}