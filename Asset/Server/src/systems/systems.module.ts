import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpRequestHandler } from 'src/common/class/http.request.helper.class';
import { LazyLoadingRepository } from 'src/common/class/lazyLoading.dealer';
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';
import { VirtualNodeHandler } from 'src/common/class/virtual.node.dealer';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { SystemComponentRelationController } from './controllers/component.relation.controller';
import { StructureLazyLoadingController } from './controllers/system.lazyloading.controller';
import { SystemsController } from './controllers/systems.controller';
import { SystemComponentRepository } from './repositories/component.repository';
import { SystemLazyLoadingRepository } from './repositories/system.lazyloading.repository';
import { SystemsRepository } from './repositories/systems.repository';
import { SystemComponentService } from './services/component.relation.service';
import { SystemLazyLoadingService } from './services/system.lazyloading.service';
import { SystemsService } from './services/systems.service';


@Module({
  imports: [HttpModule],
  controllers: [SystemsController, StructureLazyLoadingController, SystemComponentRelationController],
  providers: [
    SystemsService, SystemLazyLoadingService, SystemComponentService,
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
    {
      provide: RepositoryEnums.SYSTEM_LAZY_LOADING,
      useClass: SystemLazyLoadingRepository,
    },
    {
      provide: LazyLoadingRepository,
      useClass: LazyLoadingRepository,
    },
    {
      provide: RepositoryEnums.SYSTEM_COMPONENT,
      useClass: SystemComponentRepository,
    },
  ],
  exports: [SystemsService],
})
export class SystemsModule {}
