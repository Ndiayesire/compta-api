import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

@Injectable()
export class MorganMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    morgan(
      ':method :url :status :res[content-length] - :response-time ms',
      {
        stream: {
          write: (message: string) => {
            const status = parseInt(message.split(' ')[2]);

            if (status >= 500) {
              this.logger.error(message.trim());
            } else if (status >= 400) {
              this.logger.warn(message.trim());
            } else {
              this.logger.log(message.trim());
            }
          },
        },
      },
    )(req, res, next);
  }
}