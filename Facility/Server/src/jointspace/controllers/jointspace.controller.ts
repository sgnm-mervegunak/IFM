import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { JointSpaceService } from '../services/jointspace.service';
import { CreateJointSpaceDto } from '../dto/create.jointspace.dto';
import { UpdateJointSpaceDto } from '../dto/update.jointspace.dto';
@ApiTags('JointSpace')
@ApiBearerAuth('JWT-auth')
@Controller('JointSpace')
export class JointSpaceController {
  constructor(private readonly jointSpaceService: JointSpaceService) {}

  @Unprotected()
  //@Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: CreateJointSpaceDto,
    description: 'create  facility structure',
  })
  @Post('')
  create(@Body() createJointSpaceDto: CreateJointSpaceDto) {
    return this.jointSpaceService.create(createJointSpaceDto);
  }

  @ApiBody({
    type: Object,
    description: 'Update  facility structure',
  })
  @Patch(':key')
  @Unprotected()
  update(@Param('key') key: string, @Body() updateFacilityStructureDto: UpdateJointSpaceDto) {
    return this.jointSpaceService.update(key, updateFacilityStructureDto);
  }

  @Unprotected()
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string) {
    return this.jointSpaceService.findOneNode(key);
  }

  @Delete(':key')
  @Unprotected()
  remove(@Param('key') key: string) {
    return this.jointSpaceService.remove(key);
  }
  @Unprotected()
  @Post('/relation/:id/:target_parent_id')
  changeNodeBranch(@Param('id') id: string, @Param('target_parent_id') target_parent_id: string) {
    return this.jointSpaceService.changeNodeBranch(id, target_parent_id);
  }

  @Get('/structuretypes/:label/:realm')
  @Unprotected()
  @NoCache()
  findOneFirstLevel(@Param('label') label: string, @Param('realm') realm: string) {
    return this.jointSpaceService.findOneFirstLevel(label, realm);
  }

  @Get('/structuretypes/properties/:language/:realm/:typename')
  @Unprotected()
  @NoCache()
  findChildrenByFacilityTypeNode(
    @Param('language') language: string,
    @Param('realm') realm: string,
    @Param('typename') typename: string,
  ) {
    return this.jointSpaceService.findChildrenByFacilityTypeNode(language, realm, typename);
  }

  @Get(':key/:realm')
  @Unprotected()
  @NoCache()
  findOne(@Param('key') label: string, @Param('realm') realm: string) {
    return this.jointSpaceService.findOne(label, realm);
  }
}
