import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StructureService } from '../services/structure.service';
import { CreateFacilityStructureDto } from '../dto/create-facility-structure.dto';
import { UpdateFacilityStructureDto } from '../dto/update-facility-structure.dto';
import { Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
@ApiTags('structure')
@ApiBearerAuth('JWT-auth')
@Controller('structure')
export class StructureController {
  constructor(private readonly facilityStructuresService: StructureService) {}

  @Unprotected()
  //@Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: Object,
    description: 'create  facility structure',
  })
  @Post(':parent_key')
  create(@Param('parent_key') key: string, @Body() createFacilityStructureDto: Object) {
    return this.facilityStructuresService.create(key, createFacilityStructureDto);
  }
  
  @ApiBody({
    type: Object,
    description: 'Update  facility structure',
  })
  @Patch(':key')
  @Unprotected()
  update(@Param('key') key: string, @Body() updateFacilityStructureDto: Object) {
    return this.facilityStructuresService.update(key, updateFacilityStructureDto);
  }

  @Unprotected()
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string) {
    return this.facilityStructuresService.findOneNode(key);
  }
 
  @Delete(':id')
  @Unprotected()
  remove(@Param('id') id: string) {
    return this.facilityStructuresService.remove(id);
  }
  @Unprotected()
  @Post('/relation/:id/:target_parent_id')
  changeNodeBranch(@Param('id') id: string, @Param('target_parent_id') target_parent_id: string) {
    return this.facilityStructuresService.changeNodeBranch(id, target_parent_id);
  }


  @Get('/structuretypes/:label/:realm')
  @Unprotected()
  @NoCache()
  findOneFirstLevel(@Param('language') language: string, @Param('label') label: string, @Param('realm') realm: string) {
    return this.facilityStructuresService.findOneFirstLevel(language, label, realm);
  }

  @Get('/structuretypes/properties/:language/:realm/:typename')
  @Unprotected()
  @NoCache()
  findChildrenByFacilityTypeNode(@Param('language') language: string, @Param('realm') realm: string, @Param('typename') typename: string) {
          return this.facilityStructuresService.findChildrenByFacilityTypeNode(language,realm, typename);
  }

  @Get(':label/:realm')
  @Unprotected()
  @NoCache()
  findOne(@Param('label') label: string, @Param('realm') realm: string) {
    return this.facilityStructuresService.findOne(label, realm);
  }

  @Get('/structurefirstlevel/nodes/:label/:realm')
  @Unprotected()
  @NoCache()
  findStructureFirstLevelNodes(@Param('label') label: string, @Param('realm') realm: string) {
    return this.facilityStructuresService.findStructureFirstLevelNodes(label, realm);
  }
}
