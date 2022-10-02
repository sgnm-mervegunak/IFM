import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpRequestHandler } from 'src/common/class/http.request.helper.class';
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';
import { VirtualNodeHandler } from 'src/common/class/virtual.node.dealer';
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
    {
      provide: VirtualNodeHandler,
      useClass: VirtualNodeHandler,
    },
    {
      provide: NodeRelationHandler,
      useClass: NodeRelationHandler,
    },
  ],
  exports: [SystemsService],
})
export class SystemsModule {}
