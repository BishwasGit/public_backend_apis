import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Soft Delete Middleware
 * Automatically filters out soft-deleted records from queries
 */
@Injectable()
export class SoftDeleteMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // This middleware can be used to add soft delete filtering
        // For now, we'll handle it in Prisma middleware
        next();
    }
}
