import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpRequestHandler } from 'src/common/class/http.request.helper.class';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { SystemsController } from './controllers/systems.controller';
import { SystemsRepository } from './repositories/systems.repository';
import { SystemsService } from './services/systems.service';


@Module({
  imports: [HttpModule],
  controllers: [SystemsController],
  providers: [
    SystemsService,
    {
      provide: RepositoryEnums.SYSTEMS,
      useClass: SystemsRepository,
    },
    {
      provide: HttpRequestHandler,
      useClass: HttpRequestHandler,
    },
  ],
  exports: [SystemsService],
})
export class SystemsModule {}
