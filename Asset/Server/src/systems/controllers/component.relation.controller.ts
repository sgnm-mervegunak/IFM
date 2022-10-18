import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Header, Query } from '@nestjs/common';
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
  
  @Delete(':parent_key')
  @Roles({ roles: [UserRoles.ADMIN] })
  remove(@Param('parent_key') parent_key: string, @Body() children_keys: string[],@Headers() header) {
    return this.systemComponentService.delete(parent_key, children_keys, header);
  }
}
