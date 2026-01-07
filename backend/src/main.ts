import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable CORS - allow multiple localhost ports in development
  app.enableCors({
    origin: (origin, callback) => {
      const frontendUrl = configService.get('FRONTEND_URL', 'http://localhost:5173');
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        callback(null, true);
        return;
      }
      // Allow configured frontend URL
      if (origin === frontendUrl) {
        callback(null, true);
        return;
      }
      // In development, allow any localhost port
      if (configService.get('NODE_ENV') !== 'production' && origin.startsWith('http://localhost:')) {
        callback(null, true);
        return;
      }
      // Allow Chrome extension origins
      if (origin.startsWith('chrome-extension://')) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Auto-transform payloads to DTO types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger/OpenAPI configuration
  if (configService.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('GramGrab API')
      .setDescription(
        `
## GramGrab Recipe Management API

A comprehensive API for managing recipes, meal planning, and social sharing.

### Authentication
All endpoints (except login/register) require Bearer token authentication.
Use the Authorize button to set your JWT token.

### Rate Limits
- General API: 100 requests/minute
- Auth endpoints: 5 requests/15 minutes
- AI Generation: 20 requests/hour

### Response Codes
- 200: Success
- 201: Created
- 204: No Content (successful delete)
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Rate Limit Exceeded
- 500: Internal Server Error
      `.trim(),
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter your JWT access token',
          in: 'header',
        },
        'access-token',
      )
      .addTag('Authentication', 'User authentication and session management')
      .addTag('Recipes', 'Recipe CRUD operations')
      .addTag('Groups', 'Recipe collections/groups management')
      .addTag('Sharing', 'Recipe and group sharing')
      .addTag('Meal Planning', 'Meal plan and shopping list management')
      .addTag('Users', 'User profile and preferences')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
      customSiteTitle: 'GramGrab API Documentation',
    });

    console.log(`📚 Swagger docs available at http://localhost:${configService.get('PORT', 3000)}/docs`);
  }

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 GramGrab API running on http://localhost:${port}`);
  console.log(`📍 Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap();
