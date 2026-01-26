import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    // Custom tracking logic, e.g., by User ID instead of IP
    if (req.user && req.user.id) {
      return Promise.resolve(req.user.id);
    }
    return Promise.resolve(req.ip); // Fallback to IP
  }

  protected getErrorMessage(context: ExecutionContext, throttlerLimitDetail: ThrottlerLimitDetail): Promise<string> {
    return Promise.resolve('Rate limit exceeded. Please try again later.');
  }
}
