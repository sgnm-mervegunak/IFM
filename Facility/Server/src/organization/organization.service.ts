import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { Span, OtelMethodCounter } from 'nestjs-otel';
import { OrganizationRepository } from './organization.repository';
import { CreateOrganizationDto } from './dtos/create.organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(RepositoryEnums.ORGANIZATION)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  @Span('create a organization nodes')
  @OtelMethodCounter()
  create(createOrganizationDto: CreateOrganizationDto) {
    return this.organizationRepository.create(createOrganizationDto);
  }
}
