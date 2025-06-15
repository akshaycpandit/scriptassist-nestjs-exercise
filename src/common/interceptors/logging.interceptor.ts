import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // TODO: Implement comprehensive request/response logging
    // This interceptor should:
    // 1. Log incoming requests with relevant details
    // 2. Measure and log response time
    // 3. Log outgoing responses
    // 4. Include contextual information like user IDs when available
    // 5. Avoid logging sensitive information

    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const now = Date.now();
    const userId = req.user?.id || 'anonymous';

    
    // Basic implementation (to be enhanced by candidates)
    // this.logger.log(`Request: ${method} ${url}`);
    this.logger.log(`User Request: ${JSON.stringify(req.user)}`);
    this.logger.log(`Request: ${method} ${url} User: ${userId}`);
    this.logger.debug(`Headers: ${JSON.stringify(req.headers)}`);
    this.logger.debug(`Query: ${JSON.stringify(req.query)}`);
    this.logger.debug(`Body: ${JSON.stringify(this.sanitize(req.body))}`);

    return next.handle().pipe(
      tap({
        next: (val) => {
          this.logger.log(`Response: ${method} ${url} User: ${userId} ${Date.now() - now}ms`);
          this.logger.debug(`Response Payload: ${JSON.stringify(this.sanitize(val))}`);
        },
        error: (err) => {
          this.logger.error(`Error in ${method} ${url} User: ${userId} ${Date.now() - now}ms: ${err.message}`);
        },
      }),
    );
  }

  private sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const clone = { ...obj };
    for (const key of Object.keys(clone)) {
      if (['password', 'token', 'accessToken', 'refreshToken'].includes(key)) {
        clone[key] = '***';
      }
    }
    return clone;
  }
} 