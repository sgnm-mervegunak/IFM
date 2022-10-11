import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { UserRoles } from 'src/common/const/keycloak.role.enum';
import { LazyLoadingPathDto } from 'src/common/dto/lazy.loading.path.dto';
import { ZoneLazyLoadingService } from '../services/zone.lazyloading.service';
import { LazyLoadingPathByKeyDto } from 'src/common/dto/lazy.loading.path.key.dto ';

@ApiTags('Zones')
@ApiBearerAuth('JWT-auth')
@Controller('zones')
export class ZoneLazyLoadingController {
  constructor(private readonly zoneLazyLoadingService: ZoneLazyLoadingService) { }

  @Get('')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findRoot(@Headers() header) {
    return this.zoneLazyLoadingService.findRoot(header);
  }

  @Get('lazyLoading/:key/:leafType')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findStructureFirstLevelNodes(@Param('key') key: string, @Param('leafType') leafType: string, @Headers() header) {
    return this.zoneLazyLoadingService.findChildrensByKey(key, leafType, header);
  }

  @Post('lazyLoading/pathByKey/')
  @ApiBody({
    type: LazyLoadingPathByKeyDto,
    description: 'create  facility structure',
  })
  @Roles({ roles: [UserRoles.ADMIN] })
  findStructureFirstLevelNode(@Body() lazyLoadingPathByKeyDto: LazyLoadingPathByKeyDto, @Headers() header) {
    return this.zoneLazyLoadingService.getPathByKey(lazyLoadingPathByKeyDto, header);
  }

  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: LazyLoadingPathDto,
    description: 'create  facility structure',
  })
  @Post('lazyLoading/path')
  getPath(@Body() lazyLoadingPathDto: LazyLoadingPathDto, @Headers() header) {
    return this.zoneLazyLoadingService.getPath(lazyLoadingPathDto, header);
  }
}
