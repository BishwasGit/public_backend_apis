import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { logger } from '../common/logger/logger';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: Redis;

    async onModuleInit() {
        try {
            this.client = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
            });

            this.client.on('connect', () => {
                logger.info('✅ Redis connected successfully');
            });

            this.client.on('error', (err) => {
                logger.error('❌ Redis connection error:', err);
            });
        } catch (error) {
            logger.error('Failed to initialize Redis:', error);
        }
    }

    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
        }
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Redis GET error for key ${key}:`, error);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        try {
            const stringValue = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, stringValue);
            } else {
                await this.client.set(key, stringValue);
            }
        } catch (error) {
            logger.error(`Redis SET error for key ${key}:`, error);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            logger.error(`Redis DEL error for key ${key}:`, error);
        }
    }

    async flushAll(): Promise<void> {
        try {
            await this.client.flushall();
        } catch (error) {
            logger.error('Redis FLUSHALL error:', error);
        }
    }

    // Helper method to wrap function with caching
    async wrap<T>(key: string, fn: () => Promise<T>, ttlSeconds?: number): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached) {
            return cached;
        }

        const result = await fn();
        await this.set(key, result, ttlSeconds);
        return result;
    }

    // Check if Redis is connected
    isConnected(): boolean {
        return this.client && this.client.status === 'ready';
    }
}
