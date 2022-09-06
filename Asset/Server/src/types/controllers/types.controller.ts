import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { TypesService } from '../services/types.service';
import { CreateTypesDto } from '../dto/create.types.dto';
import { UpdateTypesDto } from '../dto/update.tpes.dto';
import { ChangeBranchDto } from '../dto/change.branch.dto';

@ApiTags('types')
@ApiBearerAuth('JWT-auth')
@Controller('types')
export class TypesController {
  constructor(private readonly typesService: TypesService) {}

  @Unprotected()
  //@Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: CreateTypesDto,
    description: 'create  Types ',
  })
  @Post()
  create(@Body() createTypesDto: CreateTypesDto) {
    return this.typesService.create(createTypesDto);
  }

  @Get('')
  @Unprotected()
  @NoCache()
  findOne(@Headers('realm') realm) {
    return this.typesService.findOne(realm);
  }

  @Patch(':id')
  @Unprotected()
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateTypesDto) {
    return this.typesService.update(id, updateAssetDto);
  }

  @Delete(':id')
  @Unprotected()
  remove(@Param('id') id: string) {
    return this.typesService.remove(id);
  }
  @Unprotected()
  @Post('/changeBranch')
  changeNodeBranch(@Body() changeNodeBranch: ChangeBranchDto) {
    const { id, targetParentId } = changeNodeBranch;
    return this.typesService.changeNodeBranch(id, targetParentId);
  }

  @Unprotected()
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string) {
    return this.typesService.findOneNode(key);
  }
}
