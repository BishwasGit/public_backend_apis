import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { CACHE_KEY_METADATA } from '../decorators/cache-key.decorator';

@Injectable()
export class CustomCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    // If we have a custom key set via decorator, use it
    const cacheKey = this.reflector.get(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (cacheKey) {
      const request = context.switchToHttp().getRequest();
      return `${cacheKey}-${request._parsedUrl.pathname}`;
    }

    // Otherwise fall back to default behavior (URL based)
    return super.trackBy(context);
  }
}
