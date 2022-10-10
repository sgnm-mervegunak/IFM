import { Module } from '@nestjs/common';
import { JointSpaceService } from './services/jointspace.service';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { JointSpaceRepository } from './repositories/jointspace.repository';
import { JointSpaceController } from './controllers/jointspace.controller';
import { HttpModule } from '@nestjs/axios';
import { StructureModule } from 'src/facility-structures/structure.module';
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';
import { JointSpaceLazyLoadingRepository } from './repositories/jointspace.lazyloading.repository';
import { LazyLoadingRepository } from 'src/common/class/lazyLoading.dealer';
import { JointSpaceLazyLoadingController } from './controllers/jointspace.lazyloading.controller';
import { JointSpaceLazyLoadingService } from './services/jointspace.lazyloading.service';

@Module({
  imports: [HttpModule, StructureModule],
  controllers: [JointSpaceController, JointSpaceLazyLoadingController],
  providers: [
    JointSpaceService,
    JointSpaceLazyLoadingService,

    {
      provide: RepositoryEnums.JOINT_SPACE,
      useClass: JointSpaceRepository,
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
      provide: RepositoryEnums.JOINT_SPACE_LAZY_LOADING,
      useClass: JointSpaceLazyLoadingRepository,
    },
  ],
})
export class JointSpaceModule {}
