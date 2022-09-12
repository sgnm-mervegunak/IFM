import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Header } from '@nestjs/common';
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
    return this.typesService.create(createTypesDto, header);
  }

  @Get('')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOne(@Headers('realm') realm) {
    return this.typesService.findOne(realm);
  }

  @Patch(':id')
  @Roles({ roles: [UserRoles.ADMIN] })
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateTypesDto, @Headers() header) {
    return this.typesService.update(id, updateAssetDto, header);
  }

  @Delete(':id')
  @Roles({ roles: [UserRoles.ADMIN] })
  remove(@Param('id') id: string, @Headers() header) {
    return this.typesService.remove(id, header);
  }

  @Roles({ roles: [UserRoles.ADMIN] })
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    return this.typesService.findOneNode(key, header);
  }
}
