import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { ZoneService } from '../services/zone.service';
import { CreateZoneDto } from '../dto/create.zone.dto';
import { UpdateZoneDto } from '../dto/update.zone.dto';
@ApiTags('Zone')
@ApiBearerAuth('JWT-auth')
@Controller('Zone')
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @Unprotected()
  //@Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: CreateZoneDto,
    description: 'create  facility structure',
  })
  @Post('')
  create(@Body() createZoneDto: CreateZoneDto) {
    return this.zoneService.create(createZoneDto);
  }

  @ApiBody({
    type: Object,
    description: 'Update  facility structure',
  })
  @Patch(':key')
  @Unprotected()
  update(@Param('key') key: string, @Body() updateFacilityStructureDto: UpdateZoneDto) {
    return this.zoneService.update(key, updateFacilityStructureDto);
  }

  @Unprotected()
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string) {
    return this.zoneService.findOneNode(key);
  }

  @Delete(':key')
  @Unprotected()
  remove(@Param('key') key: string) {
    return this.zoneService.remove(key);
  }

  @Get(':key/:realm')
  @Unprotected()
  @NoCache()
  findOne(@Param('key') label: string, @Param('realm') realm: string) {
    return this.zoneService.findOne(label, realm);
  }
}
