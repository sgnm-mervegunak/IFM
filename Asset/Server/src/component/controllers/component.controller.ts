import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { ChangeBranchDto } from '../dto/change.branch.dto';
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
  create(@Body() createComponentDto: CreateComponentDto, @Headers('realm') realm) {
    return this.componentService.create(createComponentDto, realm);
  }

  @Get('')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOne(@Headers('realm') realm) {
    return this.componentService.findOne(realm);
  }

  @Patch(':id')
  @Unprotected()
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateComponentDto, @Headers('realm') realm) {
    return this.componentService.update(id, updateAssetDto, realm);
  }

  @Delete(':id')
  @Unprotected()
  remove(@Param('id') id: string, @Headers('realm') realm) {
    return this.componentService.remove(id, realm);
  }
  @Unprotected()
  @Post('/changeBranch')
  changeNodeBranch(@Body() changeNodeBranch: ChangeBranchDto) {
    const { id, targetParentId } = changeNodeBranch;
    return this.componentService.changeNodeBranch(id, targetParentId);
  }

  @Unprotected()
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers('realm') realm) {
    return this.componentService.findOneNode(key, realm);
  }
}
