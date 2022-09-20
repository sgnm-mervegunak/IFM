import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Unprotected } from 'nest-keycloak-connect';
import { CreateOrganizationDto } from './dtos/create.organization.dto';
import { OrganizationService } from './organization.service';

@ApiTags('organization')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @ApiOperation({
    summary: 'create organization  nodes ',
    description: 'create organization  nodes ',
  })
  @Post('')
  @Unprotected()
  createInfraNodes(@Body() createFacilityDto: CreateOrganizationDto) {
    return this.organizationService.create(createFacilityDto);
  }
}
