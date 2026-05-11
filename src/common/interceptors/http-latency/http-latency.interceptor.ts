import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpLatencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLatencyInterceptor.name);
  private readonly slowRequestMs = Number(process.env.HTTP_SLOW_REQUEST_MS ?? 1000);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { method?: string; url?: string }>();
    const res = context
      .switchToHttp()
      .getResponse<{ statusCode?: number }>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsedMs = Date.now() - startedAt;
          if (elapsedMs >= this.slowRequestMs) {
            this.logger.warn(
              `[SLOW_HTTP] ${req.method} ${req.url} -> ${res.statusCode ?? 200} in ${elapsedMs}ms`,
            );
          }
        },
        error: () => {
          const elapsedMs = Date.now() - startedAt;
          if (elapsedMs >= this.slowRequestMs) {
            this.logger.warn(
              `[SLOW_HTTP] ${req.method} ${req.url} (error) in ${elapsedMs}ms`,
            );
          }
        },
      }),
    );
  }
}
