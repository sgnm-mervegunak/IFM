import { Module } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { InfraController } from './infra.controller';
import { InfraService } from './infra.service';
import { InfraRepository } from './repositories/infra.repository';

@Module({
  imports: [],
  controllers: [InfraController],
  providers: [
    InfraService,
    {
      provide: RepositoryEnums.INFRA,
      useClass: InfraRepository,
    },
  ],
})
export class InfraModule {}
