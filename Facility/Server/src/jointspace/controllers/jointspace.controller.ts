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

  @Get(':key/:realm')
  @Unprotected()
  @NoCache()
  findOne(@Param('key') key: string, @Param('realm') realm: string) {
    return this.jointSpaceService.findOne(key, realm);
  }
}
