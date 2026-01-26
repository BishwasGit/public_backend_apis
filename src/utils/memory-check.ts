import { Logger } from '@nestjs/common';

export const checkMemoryUsage = () => {
    const logger = new Logger('MemoryMonitor');
    const used = process.memoryUsage();
    
    // Log if heap usage exceeds 500MB
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024 * 100) / 100;
    if (heapUsedMB > 500) {
        logger.warn(`High Memory Usage: ${heapUsedMB} MB`);
    } else {
        logger.debug(`Memory Usage: ${heapUsedMB} MB`);
    }
    
    return {
        rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
        heapUsed: `${heapUsedMB} MB`,
        external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`,
    };
};
