import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { TypesService } from '../services/types.service';
import { CreateTypesDto } from '../dto/create.types.dto';
import { UpdateTypesDto } from '../dto/update.tpes.dto';
import { UserRoles } from 'src/common/const/keycloak.role.enum';

@ApiTags('types')
@ApiBearerAuth('JWT-auth')
@Controller('types')
export class TypesController {
  constructor(private readonly typesService: TypesService) {}

  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: CreateTypesDto,
    description: 'create  Types ',
  })
  @Post()
  create(@Body() createTypesDto: CreateTypesDto, @Headers() header) {
    const { realm, language, authorization } = header;

    return this.typesService.create(createTypesDto, realm, language, authorization);
  }

  @Get('')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOne(@Headers('realm') realm) {
    return this.typesService.findOne(realm);
  }

  @Patch(':id')
  @Roles({ roles: [UserRoles.ADMIN] })
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateTypesDto, @Headers('realm') realm) {
    return this.typesService.update(id, updateAssetDto, realm);
  }

  @Delete(':id')
  @Roles({ roles: [UserRoles.ADMIN] })
  remove(@Param('id') id: string, @Headers('realm') realm) {
    return this.typesService.remove(id, realm);
  }

  @Roles({ roles: [UserRoles.ADMIN] })
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers('realm') realm) {
    return this.typesService.findOneNode(key, realm);
  }
}
