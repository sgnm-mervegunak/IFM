import { Module } from '@nestjs/common';
import { ZoneService } from './services/zone.service';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { ZoneRepository } from './repositories/zone.repository';
import { ZoneController } from './controllers/zone.controller';
import { HttpModule } from '@nestjs/axios';
import { StructureModule } from 'src/facility-structures/structure.module';
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';
import { ZoneLazyLoadingController } from './controllers/zone.lazyloading.controller';
import { ZoneLazyLoadingService } from './services/zone.lazyloading.service';
import { ZoneLazyLoadingRepository } from './repositories/zone.lazyloading.repository';
import { LazyLoadingRepository } from 'src/common/class/lazyLoading.dealer';

@Module({
  imports: [HttpModule, StructureModule],
  controllers: [ZoneController,ZoneLazyLoadingController],
  providers: [
    ZoneService,
    ZoneLazyLoadingService,

    {
      provide: RepositoryEnums.ZONE,
      useClass: ZoneRepository,
    },
    {
      provide: NodeRelationHandler,
      useClass: NodeRelationHandler,
    },
    {
      provide: LazyLoadingRepository,
      useClass: LazyLoadingRepository,
    },
    {
      provide: RepositoryEnums.ZONE_LAZY_LOADING,
      useClass: ZoneLazyLoadingRepository,
    },
  ],
})
export class ZoneModule {}
