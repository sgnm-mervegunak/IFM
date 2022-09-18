import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Header } from '@nestjs/common';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { CreateComponentDto } from '../dto/create.component.dto';
import { UpdateComponentDto } from '../dto/update.component.dto';
import { ComponentService } from '../services/component.service';
import { UserRoles } from 'src/common/const/keycloak.role.enum';

@ApiTags('component')
@ApiBearerAuth('JWT-auth')
@Controller('component')
export class ComponentController {
  constructor(private readonly componentService: ComponentService) {}

  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: CreateComponentDto,
    description: 'create  Types ',
  })
  @Post()
  create(@Body() createComponentDto: CreateComponentDto, @Headers() header) {
    return this.componentService.create(createComponentDto, header);
  }

  @Get('/type/:key')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOne(@Param('key') key: string, @Headers() header) {
    return this.componentService.findOne(key, header);
  }

  @Patch(':id')
  @Roles({ roles: [UserRoles.ADMIN] })
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateComponentDto, @Headers() header) {
    return this.componentService.update(id, updateAssetDto, header);
  }

  @Delete(':id')
  @Roles({ roles: [UserRoles.ADMIN] })
  remove(@Param('id') id: string, @Headers() header) {
    return this.componentService.remove(id, header);
  }

  @Roles({ roles: [UserRoles.ADMIN] })
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    return this.componentService.findOneNode(key, header);
  }
}
