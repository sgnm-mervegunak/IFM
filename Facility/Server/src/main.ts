import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { kafkaOptions } from './common/configs/message.broker.options';
import { Topics, LoggingInterceptor, TimeoutInterceptor, HttpExceptionFilter, MongoExceptionFilter } from 'ifmcommon';
import trial from './tracing';
import { i18nValidationErrorFactory, I18nValidationExceptionFilter } from 'nestjs-i18n';
import { kafkaConf } from './common/const/kafka.conf';
import { Neo4jErrorFilter } from 'sgnm-neo4j';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  try {
    await trial.start();
    const app = await NestFactory.create(AppModule, { abortOnError: false });
    const configService = app.get<ConfigService>(ConfigService);
    app.connectMicroservice(kafkaOptions);

    const config = new DocumentBuilder()
      .setTitle('Facility Microservice Endpoints')
      .setDescription('Facility Transactions')
      .setVersion('1.0')
      .addTag('facility')
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
      new HttpExceptionFilter(kafkaConf, Topics.FACILITY_EXCEPTIONS),
      new MongoExceptionFilter(kafkaConf, Topics.FACILITY_EXCEPTIONS),
      new Neo4jErrorFilter(),
      new I18nValidationExceptionFilter(),
    );
    app.useGlobalInterceptors(
      new LoggingInterceptor(kafkaConf, Topics.FACILITY_LOGGER, Topics.FACILITY_OPERATION),
      //new TimeoutInterceptor(),
    );
    app.enableCors();
    await app.startAllMicroservices();
    await app.listen( configService.get('FACILITY_APP_PORT') );
  } catch (error) {
    console.log(error);
  }
}
bootstrap();
