import { Module } from '@nestjs/common';
import { JointSpaceService } from './services/jointspace.service';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { JointSpaceRepository } from './repositories/jointspace.repository';
import { JointSpaceController } from './controllers/jointspace.controller';
import { HttpModule } from '@nestjs/axios';
import { StructureModule } from 'src/facility-structures/structure.module';
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';

@Module({
  imports: [HttpModule, StructureModule],
  controllers: [JointSpaceController],
  providers: [
    JointSpaceService,

    {
      provide: RepositoryEnums.JOINT_SPACE,
      useClass: JointSpaceRepository,
    },
    {
      provide: NodeRelationHandler,
      useClass: NodeRelationHandler,
    },
  ],
})
export class JointSpaceModule {}
