import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpRequestHandler } from 'src/common/class/http.request.helper.class';
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';
import { VirtualNodeHandler } from 'src/common/class/virtual.node.dealer';
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
  exports: [TypesService],
})
export class TypesModule {}
