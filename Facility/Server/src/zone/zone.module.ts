import { Module } from '@nestjs/common';
import { ZoneService } from './services/zone.service';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { ZoneRepository } from './repositories/zone.repository';
import { ZoneController } from './controllers/zone.controller';
import { HttpModule } from '@nestjs/axios';
import { StructureModule } from 'src/facility-structures/structure.module';

@Module({
  imports: [HttpModule, StructureModule],
  controllers: [ZoneController],
  providers: [
    ZoneService,

    {
      provide: RepositoryEnums.ZONE,
      useClass: ZoneRepository,
    },
  ],
})
export class ZoneModule {}
