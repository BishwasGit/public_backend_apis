import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { logger } from './common/logger/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], // Use NestJS logger for startup
  });

  // Security Headers - disable CSP for Swagger docs
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/docs')) {
      // Skip helmet for Swagger UI
      return next();
    }
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http://localhost:3000'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })(req, res, next);
  });

  // CSRF Protection
  // app.use(csurf({ cookie: true })); // Enabled later when frontend is ready to handle tokens

  // CORS (Allow Mobile & Frontend)
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? [
            'https://medical.local',
            'https://medical.local:5173',
            'http://192.168.1.94:5173',
            'http://localhost:5173',
          ]
        : true, // Allow all origins in development for network testing
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global Logging Interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global Transform Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Mental Health Platform API')
    .setDescription('Secure anonymous mental health support platform API')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('profile', 'Psychologist profiles')
    .addTag('wallet', 'Wallet and transactions')
    .addTag('sessions', 'Therapy sessions')
    .addTag('service-options', 'Service pricing options')
    .addTag('media-manager', 'Media folder management')
    .addTag('video', 'Video call tokens')
    .addTag('calendar', 'Calendar events management')
    .addTag('notifications', 'User notifications')
    .addTag('withdrawal-requests', 'Withdrawal requests and payments')
    .addTag('analytics', 'Platform analytics (Admin only)')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  const host = process.env.HOST ?? '0.0.0.0';
  const publicHost = process.env.PUBLIC_HOST ?? host;
  const protocol = process.env.PROTOCOL ?? 'http';

  await app.listen(port, host);

  logger.info(
    `🚀 Application is running on: ${protocol}://${publicHost}:${port}`,
  );
  logger.info(
    `📚 Swagger documentation: ${protocol}://${publicHost}:${port}/api/docs`,
  );

  logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 API Version: v1`);
  logger.info(`🛡️  Rate Limiting: 100 requests/minute`);
}
bootstrap().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});
