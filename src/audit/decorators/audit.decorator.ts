import { SetMetadata } from '@nestjs/common';
import { AuditAction, AuditEntity } from '../audit.service';

export const AUDIT_KEY = 'audit';

/**
 * Decorator to mark endpoints for automatic audit logging
 * DRY Principle: Declarative audit logging without code duplication
 * 
 * @example
 * @Audit(AuditEntity.USER, AuditAction.CREATE)
 * async createUser(@Body() dto: CreateUserDto) { ... }
 */
export const Audit = (entity: AuditEntity, action: AuditAction) =>
    SetMetadata(AUDIT_KEY, { entity, action });
