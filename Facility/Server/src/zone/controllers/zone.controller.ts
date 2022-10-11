import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, Headers } from '@nestjs/common';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { ZoneService } from '../services/zone.service';
import { CreateZoneDto } from '../dto/create.zone.dto';
import { UpdateZoneDto } from '../dto/update.zone.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRoles } from 'src/common/const/keycloak.role.enum';
@ApiTags('Zone')
@ApiBearerAuth('JWT-auth')
@Controller('zone')
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: CreateZoneDto,
    description: 'create  facility structure',
  })
  @Post('')
  create(@Body() createZoneDto: CreateZoneDto, @Headers() header) {
    const {language, realm} = header;
    return this.zoneService.create(createZoneDto, realm, language);
  }

  @ApiBody({
    type: Object,
    description: 'Update  facility structure',
  })
  @Patch(':key')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  update(@Param('key') key: string, @Body() updateFacilityStructureDto: UpdateZoneDto, @Headers() header) {
    const {language, realm} = header;
    return this.zoneService.update(key, updateFacilityStructureDto, realm, language);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Get(':key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    const {language, realm} = header;
    return this.zoneService.findOneNode(key, realm, language);
  }

  @Delete(':key')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  remove(@Param('key') key: string, @Headers() header) {
    const {language, realm} = header;
    return this.zoneService.remove(key, realm, language);
  }

  @Get('zones/:key')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOne(@Param('key') key: string, @Headers() header) {
    const {language, realm} = header;
    return this.zoneService.findOne(key, realm, language);
  }

  @Post('addZoneswithCobie/:buildingKey')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        }
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload all zones with excel file',
  })
  @ApiConsumes('multipart/form-data')
  async addZonesToBuilding(@UploadedFile() file: Express.Multer.File,@Param('buildingKey') buildingKey: string, @Headers() header){
    const {language, realm} = header;
    return this.zoneService.addZonesToBuilding(file, realm, buildingKey, language);
  }
}
