import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Header } from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { UserRoles } from 'src/common/const/keycloak.role.enum';
import { SystemsService } from '../services/systems.service';
import { SystemsDto } from '../dto/systems.dto';
import { SystemComponentRelationDto } from '../dto/component.relation.dto';
import { SystemComponentService } from '../services/component.relation.service';

@ApiTags('System-Components')
@ApiBearerAuth('JWT-auth')
@Controller('systemComponents')
export class SystemComponentRelationController {
  constructor(private readonly systemComponentService: SystemComponentService) {}

  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: SystemComponentRelationDto,
    description: 'create  System/Components realtions ',
  })
  @Post()
  create(@Body() systemComponentRelationDto: SystemComponentRelationDto, @Headers() header) {
    return this.systemComponentService.create(systemComponentRelationDto, header);
  }

}
