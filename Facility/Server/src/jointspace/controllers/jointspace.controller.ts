import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { JointSpaceService } from '../services/jointspace.service';
import { CreateJointSpaceDto } from '../dto/create.jointspace.dto';
import { UpdateJointSpaceDto } from '../dto/update.jointspace.dto';
import { UserRoles } from 'src/common/const/keycloak.role.enum';
@ApiTags('JointSpace')
@ApiBearerAuth('JWT-auth')
@Controller('JointSpace')
export class JointSpaceController {
  constructor(private readonly jointSpaceService: JointSpaceService) {}

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: CreateJointSpaceDto,
    description: 'create  facility structure',
  })
  @Post('')
  create(@Body() createJointSpaceDto: CreateJointSpaceDto, @Headers() header) {
    const {language, realm} = header;
    return this.jointSpaceService.create(createJointSpaceDto, realm, language);
  }

  @ApiBody({
    type: Object,
    description: 'Update  facility structure',
  })
  @Patch(':key')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  update(@Param('key') key: string, @Body() updateFacilityStructureDto: UpdateJointSpaceDto, @Headers() header) {
    const {language, realm} = header;
    return this.jointSpaceService.update(key, updateFacilityStructureDto, realm, language);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    const {language, realm} = header;
    return this.jointSpaceService.findOneNode(key, realm, language);
  }

  @Delete(':key')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  remove(@Param('key') key: string, @Headers() header) {
    const {language, realm} = header;
    return this.jointSpaceService.remove(key, realm, language);
  }

  @Get('children/:key')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOne(@Param('key') key: string, @Headers() header) {
    const {language, realm} = header;
    return this.jointSpaceService.findOne(key, realm, language);
  }
}
