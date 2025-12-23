import * as crypto from 'crypto';
(global as any).crypto = crypto;

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cors({allowedHeaders: '*', origin: '*'}));
  app.setGlobalPrefix('api');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Doctor Appointment API')
    .setDescription('API documentation for Doctor Appointment booking system')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('doctors', 'Doctor management endpoints')
    .addTag('appointments', 'Appointment booking endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`✅ Server running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Swagger docs available at http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();
