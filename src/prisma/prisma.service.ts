import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  // Force reload for schema update

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    // @ts-ignore
    this.$on('query', (e: any) => {
      if (e.duration > 1000) { // Log slow queries > 1s
        this.logger.warn(`Slow Query (${e.duration}ms): ${e.query}`);
      }
    });
    await this.$connect();

    // Soft Delete Middleware - Automatically filter deleted records
    this.$use(async (params, next) => {
      // Models that support soft delete
      const softDeleteModels = ['User'];

      if (params.model && softDeleteModels.includes(params.model)) {
        // Initialize args if it doesn't exist
        if (!params.args) {
          params.args = {};
        }

        // Modify findMany, findFirst, findUnique to exclude deleted
        if (params.action === 'findMany' || params.action === 'findFirst') {
          params.args.where = {
            ...(params.args.where || {}),
            deletedAt: null,
          };
        }

        if (params.action === 'findUnique') {
          params.action = 'findFirst';
          params.args.where = {
            ...(params.args.where || {}),
            deletedAt: null,
          };
        }

        // Convert delete to update (soft delete)
        if (params.action === 'delete') {
          params.action = 'update';
          params.args.data = { deletedAt: new Date() };
        }

        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (params.args.data !== undefined) {
            params.args.data.deletedAt = new Date();
          } else {
            params.args.data = { deletedAt: new Date() };
          }
        }
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Method to find deleted records (admin only)
  async findDeleted(model: string, where?: any) {
    return this[model.toLowerCase()].findMany({
      where: {
        ...where,
        deletedAt: { not: null },
      },
    });
  }

  // Method to restore deleted record
  async restore(model: string, id: string) {
    return this[model.toLowerCase()].update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  // Method to permanently delete
  async forceDelete(model: string, id: string) {
    // Bypass middleware by using raw query or specific method
    return this[model.toLowerCase()].delete({
      where: { id },
    });
  }
}
