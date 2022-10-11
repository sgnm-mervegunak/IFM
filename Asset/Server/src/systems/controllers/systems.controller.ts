import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Header, Query } from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { UserRoles } from 'src/common/const/keycloak.role.enum';
import { SystemsService } from '../services/systems.service';
import { SystemsDto } from '../dto/systems.dto';
import { PaginationParams } from 'src/common/commonDto/pagination.dto';

@ApiTags('systems')
@ApiBearerAuth('JWT-auth')
@Controller('systems')
export class SystemsController {
  constructor(private readonly systemsService: SystemsService) {}

  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: SystemsDto,
    description: 'create  System ',
  })
  @Post()
  create(@Body() systemsDto: SystemsDto, @Headers() header) {
    return this.systemsService.create(systemsDto, header);
  }

  @Get('')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOne(@Headers() header) {
    return this.systemsService.findOne(header);
  }

  @Patch(':id')
  @Roles({ roles: [UserRoles.ADMIN] })
  update(@Param('id') id: string, @Body() systemDto: SystemsDto, @Headers() header) {
    return this.systemsService.update(id, systemDto, header);
  }

  @Delete(':id')
  @Roles({ roles: [UserRoles.ADMIN] })
  remove(@Param('id') id: string, @Headers() header) {
    return this.systemsService.remove(id, header);
  }

  @Roles({ roles: [UserRoles.ADMIN] })
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    return this.systemsService.findOneNode(key, header);
  }
 
  @Roles({ roles: [UserRoles.ADMIN] })
  @Get('types/:key')
  @NoCache()
  async findTypesIncludedBySystem(@Param('key') key: string, @Headers() header,@Query()neo4jQuery: PaginationParams) {
    return await this.systemsService.findTypesIncludedBySystem(key, header, neo4jQuery);
  }
}
