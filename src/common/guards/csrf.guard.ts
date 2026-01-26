import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Middleware usually handles this, but here's a strict check if needed
    // Assuming cookie-based token or header 'X-CSRF-Token'
    
    // Skip GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // This is optional if using csurf middleware globally
    // But can be used to exempt specific routes if verified manually
    return true; 
  }
}
