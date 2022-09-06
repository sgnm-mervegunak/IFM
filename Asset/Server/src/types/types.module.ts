import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { TypesController } from './controllers/types.controller';
import { TypesRepository } from './repositories/types.repository';
import { TypesService } from './services/types.service';

@Module({
  imports: [HttpModule],
  controllers: [TypesController],
  providers: [
    TypesService,
    {
      provide: RepositoryEnums.TYPES,
      useClass: TypesRepository,
    },
  ],
  exports: [TypesService],
})
export class TypesModule {}
