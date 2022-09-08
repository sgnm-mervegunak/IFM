import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { kafkaOptions } from './common/configs/message.broker.options';
import { LoggingInterceptor, HttpExceptionFilter, MongoExceptionFilter } from 'ifmcommon';
import trial from './tracing';
import { i18nValidationErrorFactory, I18nValidationExceptionFilter } from 'nestjs-i18n';

import { Neo4jErrorFilter } from 'sgnm-neo4j';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  try {
    await trial.start();
    const app = await NestFactory.create(AppModule, { abortOnError: false });
    const configService = app.get<ConfigService>(ConfigService);
    app.connectMicroservice(kafkaOptions);

    const config = new DocumentBuilder()
      .setTitle('Asset Microservice Endpoints')
      .setDescription('Asset Transactions')
      .setVersion('1.0')
      .addTag('asset')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, exceptionFactory: i18nValidationErrorFactory }));
    app.useGlobalFilters(
      new HttpExceptionFilter(
        { brokers: [configService.get('KAFKA_BROKER')], clientId: configService.get('KAFKA_CLIENT_ID') },
        'ASSET_EXCEPTIONS',
      ),
      new MongoExceptionFilter(
        { brokers: [configService.get('KAFKA_BROKER')], clientId: configService.get('KAFKA_CLIENT_ID') },
        'ASSET_EXCEPTIONS',
      ),
      new Neo4jErrorFilter(),
      new I18nValidationExceptionFilter(),
    );
    app.useGlobalInterceptors(
      new LoggingInterceptor(
        { brokers: [configService.get('KAFKA_BROKER')], clientId: configService.get('KAFKA_CLIENT_ID') },
        'ASSET_LOGGER',
        'ASSET_OPERATION',
      ),
      //new TimeoutInterceptor(),
    );
    app.enableCors();
    await app.startAllMicroservices();
    await app.listen(3014);
  } catch (error) {
    console.log(error);
  }
}
bootstrap();
