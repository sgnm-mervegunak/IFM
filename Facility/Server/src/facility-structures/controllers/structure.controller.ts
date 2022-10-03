import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { StructureService } from '../services/structure.service';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';

import { UserRoles } from 'src/common/const/keycloak.role.enum';

@ApiTags('structure')
@ApiBearerAuth('JWT-auth')
@Controller('structure')
export class StructureController {
  constructor(private readonly facilityStructuresService: StructureService) {}

  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: Object,
    description: 'create  facility structure',
  })
  @Post(':parent_key')
  create(@Param('parent_key') key: string, @Body() createFacilityStructureDto: object, @Headers() header) {
    const { language, realm } = header;
    return this.facilityStructuresService.create(key, createFacilityStructureDto, realm, language);
  }

  @ApiBody({
    type: Object,
    description: 'Update  facility structure',
  })
  @Patch(':key')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  update(@Param('key') key: string, @Body() updateFacilityStructureDto: object, @Headers() header) {
    const { language, realm } = header;
    return this.facilityStructuresService.update(key, updateFacilityStructureDto, realm, language);
  }
  @Get('')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOne(@Headers() header) {
    const { language, realm } = header;
    return this.facilityStructuresService.findOne(realm, language);
  }

  @Roles({ roles: [UserRoles.ADMIN] })
  //@Unprotected()
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    const { language, realm } = header;
    return this.facilityStructuresService.findOneNode(key, realm, language);
  }

  @Get('/structuretypes/:label')
  @Roles({ roles: [UserRoles.ADMIN] })
  //@Unprotected()
  @NoCache()
  findOneFirstLevel(@Param('label') label: string, @Headers() header) {
    const { language, realm } = header;
    return this.facilityStructuresService.findOneFirstLevel(label, realm, language);
  }

  @Get('/lazyloading/:key/:leafType')
  @Roles({ roles: [UserRoles.ADMIN] })
  //@Unprotected()
  @NoCache()
  findStructureFirstLevelNodes(@Param('key') key: string, @Param('leafType') leafType: string, @Headers() header) {
    const { language, realm } = header;
    return this.facilityStructuresService.findStructureFirstLevelNodes(key, leafType, realm, language);
  }

  @Get('/structuretypes/properties/all/:typename')
  @Roles({ roles: [UserRoles.ADMIN] })
  //@Unprotected()
  @NoCache()
  findChildrenByFacilityTypeNode(@Param('typename') typename: string, @Headers() header) {
    const { language, realm } = header;
    return this.facilityStructuresService.findChildrenByFacilityTypeNode(typename, realm, language);
  }

  @Delete(':id')
  @Roles({ roles: [UserRoles.ADMIN] })
  remove(@Param('id') id: string, @Headers() header) {
    const { language, realm } = header;
    return this.facilityStructuresService.remove(id, realm, language);
  }

  @Unprotected()
  @Post('/relation/:id/:target_parent_id')
  changeNodeBranch(@Param('id') id: string, @Param('target_parent_id') target_parent_id: string, @Headers() header) {
    const { language, realm } = header;
    return this.facilityStructuresService.changeNodeBranch(id, target_parent_id, realm, language);
  }

  // @Unprotected()
  @Patch('/addPlanToFloor/:key')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  addPlanToFloor(@Param('key') key: string, @Headers() header) {
    const { language, realm } = header;
    return this.facilityStructuresService.addPlanToFloor(key, realm, language);
  }
}
