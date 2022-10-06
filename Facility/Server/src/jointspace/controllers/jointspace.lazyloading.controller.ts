import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { UserRoles } from 'src/common/const/keycloak.role.enum';
import { LazyLoadingPathDto } from 'src/common/dto/lazy.loading.path.dto';
import { JointSpaceLazyLoadingService } from '../services/jointspace.lazyloading.service';
import { LazyLoadingPathByKeyDto } from 'src/common/dto/lazy.loading.path.key.dto ';

@ApiTags('JointSpaces')
@ApiBearerAuth('JWT-auth')
@Controller('JointSpaces')
export class JointSpaceLazyLoadingController {
  constructor(private readonly jointSpaceLazyLoadingService: JointSpaceLazyLoadingService) {}

  @Get('')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findRoot(@Headers() header) {
    return this.jointSpaceLazyLoadingService.findRoot(header);
  }

  @Get('lazyLoading/:key/:leafType')
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findStructureFirstLevelNodes(@Param('key') key: string, @Param('leafType') leafType: string, @Headers() header) {
    return this.jointSpaceLazyLoadingService.findChildrensByKey(key, leafType, header);
  }

  @Post('lazyLoading/pathByKey/')
  @ApiBody({
    type: LazyLoadingPathByKeyDto,
    description: 'create  facility structure',
  })
  @Roles({ roles: [UserRoles.ADMIN] })
  findStructureFirstLevelNode(@Body() lazyLoadingPathByKeyDto: LazyLoadingPathByKeyDto, @Headers() header) {
    return this.jointSpaceLazyLoadingService.getPathByKey(lazyLoadingPathByKeyDto, header);
  }

  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: LazyLoadingPathDto,
    description: 'create  facility structure',
  })
  @Post('lazyLoading/path')
  getPath(@Body() lazyLoadingPathDto: LazyLoadingPathDto, @Headers() header) {
    return this.jointSpaceLazyLoadingService.getPath(lazyLoadingPathDto, header);
  }
}
