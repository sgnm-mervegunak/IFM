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
  create(
    @Param('parent_key') key: string,
    @Body() createFacilityStructureDto: object,
    @Headers('realm') realm: string,
  ) {
    return this.facilityStructuresService.create(key, createFacilityStructureDto, realm);
  }

  // Yenisi böyle olacak...........
  // @Post(':parent_key')
  // create(
  //   @Param('parent_key') key: string,
  //   @Body() createFacilityStructureDto: object,
  //   @Headers() header,
  // ) {
  //   const {language, realm} = header;
  //   return this.facilityStructuresService.create(key, createFacilityStructureDto, realm, language);
  // }

  @ApiBody({
    type: Object,
    description: 'Update  facility structure',
  })
  @Patch(':key')
  @Unprotected()
  update(@Param('key') key: string, @Body() updateFacilityStructureDto: object) {
    return this.facilityStructuresService.update(key, updateFacilityStructureDto);
  }

 // @Roles({ roles: [UserRoles.ADMIN] })
  @Unprotected()
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string) {
    return this.facilityStructuresService.findOneNode(key);
  }

  @Delete(':id')
  @Roles({ roles: [UserRoles.ADMIN] })
  remove(@Param('id') id: string, @Headers('') realm) {
    console.log(realm);
    return this.facilityStructuresService.remove(id);
  }

  @Unprotected()
  @Post('/relation/:id/:target_parent_id')
  changeNodeBranch(@Param('id') id: string, @Param('target_parent_id') target_parent_id: string) {
    return this.facilityStructuresService.changeNodeBranch(id, target_parent_id);
  }

  @Get('/structuretypes/:language/:label/:realm')
  @Roles({ roles: [UserRoles.ADMIN] })
  //@Unprotected()
  @NoCache()
  findOneFirstLevel(@Param('language') language: string, @Param('label') label: string, @Param('realm') realm: string) {
    return this.facilityStructuresService.findOneFirstLevel(language, label, realm);
  }

  @Get('/structuretypes/properties/:language/:realm/:typename')
  @Roles({ roles: [UserRoles.ADMIN] })
  //@Unprotected()
  @NoCache()
  findChildrenByFacilityTypeNode(
    @Param('language') language: string,
    @Param('realm') realm: string,
    @Param('typename') typename: string,
  ) {
    return this.facilityStructuresService.findChildrenByFacilityTypeNode(language, realm, typename);
  }

  @Get(':label/:realm')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOne(@Param('label') label: string, @Param('realm') realm: string) {
    return this.facilityStructuresService.findOne(label, realm);
  }

  @Get('/structurefirstlevel/nodes/:label/:realm')
  @Roles({ roles: [UserRoles.ADMIN] })
  //@Unprotected()
  @NoCache()
  findStructureFirstLevelNodes(@Param('label') label: string, @Param('realm') realm: string) {
    return this.facilityStructuresService.findStructureFirstLevelNodes(label, realm);
  }
}
