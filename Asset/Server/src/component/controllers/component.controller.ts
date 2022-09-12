import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
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

  @Get('')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOne(@Headers('realm') realm) {
    return this.componentService.findOne(realm);
  }

  @Patch(':id')
  @Unprotected()
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateComponentDto, @Headers() header) {
    return this.componentService.update(id, updateAssetDto, header);
  }

  @Delete(':id')
  @Unprotected()
  remove(@Param('id') id: string, @Headers() header) {
    return this.componentService.remove(id, header);
  }

  @Unprotected()
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    return this.componentService.findOneNode(key, header);
  }
}
