import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpRequestHandler } from 'src/common/class/http.request.helper.class';
import { LazyLoadingRepository } from 'src/common/class/lazyLoading.dealer';
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';
import { VirtualNodeHandler } from 'src/common/class/virtual.node.dealer';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { StructureLazyLoadingController } from './controllers/system.lazyloading.controller';
import { SystemsController } from './controllers/systems.controller';
import { SystemLazyLoadingRepository } from './repositories/system.lazyloading.repository';
import { SystemsRepository } from './repositories/systems.repository';
import { SystemLazyLoadingService } from './services/system.lazyloading.service';
import { SystemsService } from './services/systems.service';


@Module({
  imports: [HttpModule],
  controllers: [SystemsController, StructureLazyLoadingController],
  providers: [
    SystemsService, SystemLazyLoadingService,
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
  ],
  exports: [SystemsService],
})
export class SystemsModule {}
