import { Controller, Get, Post, Body, Param, Delete, Headers } from '@nestjs/common';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { AssetRelationService } from '../services/asset.relation.service';
import { CreateAssetRelationDto } from '../dto/asset.relation.dto';
import { UserRoles } from 'src/common/const/keycloak.role.enum';

@ApiTags('structureAssetRelation')
@ApiBearerAuth('JWT-auth')
@Controller('structureAssetRelation')
export class AssetRelationController {
  constructor(private readonly structureRelationService: AssetRelationService) {}

  // //@Roles({ roles: [UserRoles.ADMIN] })
  // @ApiBody({
  //   type: CreateAssetRelationDto,
  //   description: 'create  structure-asset relation',
  // })
  // @Post('/:key')
  // createAssetVirtualRelation(@Param('key') key: string, @Body() createAssetRelationDto: CreateAssetRelationDto) {
  //   return this.structureRelationService.create(key, createAssetRelationDto);
  // }

  // @Delete('/:key/:referenceKey')
  // @Unprotected()
  // remove(@Param('key') key: string, @Param('referenceKey') referenceKey: string) {
  //   return this.structureRelationService.remove(key, referenceKey);
  // }
  @Roles({ roles: [UserRoles.ADMIN] })
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    return this.structureRelationService.findOneNode(key, header);
  }
}
