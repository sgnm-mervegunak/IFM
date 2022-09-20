import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { OrganizationController } from './organization.controller';
import { OrganizationRepository } from './organization.repository';
import { OrganizationService } from './organization.service';

@Module({
  imports: [HttpModule],
  providers: [
    OrganizationService,
    {
      provide: RepositoryEnums.ORGANIZATION,
      useClass: OrganizationRepository,
    },
  ],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
