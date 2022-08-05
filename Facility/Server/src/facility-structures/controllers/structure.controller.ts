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

  @Get(':label/:realm')
  @Unprotected()
  @NoCache()
  findOne(@Param('label') label: string, @Param('realm') realm: string) {
    return this.facilityStructuresService.findOne(label, realm);
  }

  @Patch(':id')
  @Unprotected()
  update(@Param('id') id: string, @Body() updateFacilityStructureDto: UpdateFacilityStructureDto) {
    return this.facilityStructuresService.update(id, updateFacilityStructureDto);
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

  @Unprotected()
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string) {
    return this.facilityStructuresService.findOneNode(key);
  }

  @Get('/structuretypes/:label/:realm')
  @Unprotected()
  @NoCache()
  findOneFirstLevel(@Param('label') label: string, @Param('realm') realm: string) {
    return this.facilityStructuresService.findOneFirstLevel(label, realm);
  }

  // @Get('/structuretypes/properties/:first_node_label/:first_node_realm/:second_child_node_label/:second_child_node_name/:children_nodes_label/:relationName/:relationDirection')
  // @Unprotected()
  // @NoCache()
  // findChildrenByFacilityTypeNode(@Param('first_node_label') first_node_label: string, @Param('first_node_realm') first_node_realm: string,
  //             @Param('second_child_node_label') second_child_node_label: string, @Param('second_child_node_name') second_child_node_name: string,
  //             @Param('children_nodes_label') children_nodes_label: string, @Param('relationName') relationName: string , 
  //             @Param('relationDirection') relationDirection: RelationDirection ) {
  //         return this.facilityStructuresService.findChildrenByFacilityTypeNode(first_node_label, first_node_realm, second_child_node_label,
  //           second_child_node_name, children_nodes_label,relationName, relationDirection);
  // }

  @Get('/structuretypes/properties/:language/:realm/:typename')
  @Unprotected()
  @NoCache()
  findChildrenByFacilityTypeNode(@Param('language') language: string, @Param('realm') realm: string, @Param('typename') typename: string) {
          return this.facilityStructuresService.findChildrenByFacilityTypeNode(language,realm, typename);
  }
}
