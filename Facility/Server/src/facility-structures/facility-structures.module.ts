import { Module } from '@nestjs/common';
import { FacilityStructuresService } from './facility-structures.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConnectionEnums } from 'src/common/const/connection.enum';
import { FacilityStructure} from './entities/facility-structure.entity';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { FacilityStructureRepository } from './repositories/facility.structure.repository';
import { FacilityStructuresController } from './facility-structures.controller';

@Module({
  imports: [
  ],
  controllers: [FacilityStructuresController],
  providers: [
    FacilityStructuresService,
    {
      provide: RepositoryEnums.FACILITY_STRUCTURE,
      useClass: FacilityStructureRepository,
    },
  ],
  exports: [FacilityStructuresService],
})
export class FacilityStructuresModule {}
