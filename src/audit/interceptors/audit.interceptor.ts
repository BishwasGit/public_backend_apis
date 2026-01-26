import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AUDIT_KEY } from '../decorators/audit.decorator';

/**
 * Interceptor for automatic audit logging
 * DRY Principle: Centralized logging logic without code duplication
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(
        private auditService: AuditService,
        private reflector: Reflector,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const auditMetadata = this.reflector.get(AUDIT_KEY, context.getHandler());

        // If no @Audit decorator, skip logging
        if (!auditMetadata) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const { entity, action } = auditMetadata;

        return next.handle().pipe(
            tap((response) => {
                // Extract entity ID from response or request params
                const entityId = this.extractEntityId(request, response);

                if (entityId) {
                    // Async logging - don't wait for completion
                    this.auditService.log({
                        userId: request.user?.id,
                        action,
                        entity,
                        entityId,
                        changes: this.extractChanges(request, response, action),
                        ipAddress: this.extractIpAddress(request),
                        userAgent: request.headers['user-agent'],
                    });
                }
            }),
        );
    }

    /**
     * Extract entity ID from response or request
     */
    private extractEntityId(request: any, response: any): string | null {
        // Try response.id first (for CREATE operations)
        if (response?.id) return response.id;

        // Try request params (for UPDATE/DELETE operations)
        if (request.params?.id) return request.params.id;

        // Try request body (for some operations)
        if (request.body?.id) return request.body.id;

        return null;
    }

    /**
     * Extract changes based on HTTP method
     */
    private extractChanges(request: any, response: any, action: string): any {
        const method = request.method;

        if (method === 'POST') {
            // CREATE: Log the created data
            return { after: this.sanitizeData(response) };
        }

        if (method === 'PATCH' || method === 'PUT') {
            // UPDATE: Log the changes
            return { changes: this.sanitizeData(request.body) };
        }

        if (method === 'DELETE') {
            // DELETE: Log what was deleted
            return { before: this.sanitizeData(response) };
        }

        // For other actions (LOGIN, VERIFY, etc.)
        if (action === 'LOGIN') {
            return { alias: request.body?.alias };
        }

        return null;
    }

    /**
     * Sanitize data to remove sensitive information
     */
    private sanitizeData(data: any): any {
        if (!data) return null;

        const sanitized = { ...data };

        // Remove sensitive fields
        delete sanitized.hashedPin;
        delete sanitized.pin;
        delete sanitized.password;
        delete sanitized.accessToken;
        delete sanitized.refreshToken;

        return sanitized;
    }

    /**
     * Extract IP address from request
     */
    private extractIpAddress(request: any): string {
        return (
            request.headers['x-forwarded-for']?.split(',')[0] ||
            request.headers['x-real-ip'] ||
            request.connection?.remoteAddress ||
            request.ip ||
            'unknown'
        );
    }
}
