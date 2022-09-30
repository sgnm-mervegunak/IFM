import { Controller, Get, Param, Headers } from '@nestjs/common';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { LazyLoadingService } from '../services/lazyLoading.service';
import { UserRoles } from 'src/common/const/keycloak.role.enum';

@ApiTags('LazyLoading')
@ApiBearerAuth('JWT-auth')
@Controller('lazyLoading')
export class LazyLoadingController {
  constructor(private readonly lazyLoadingService: LazyLoadingService) {}

  @Roles({ roles: [UserRoles.ADMIN, UserRoles.USER] })
  // @Unprotected()
  @Get('/loadClassification/:key')
  @NoCache()
  loadClassification(@Param('key') key: string, @Headers() header) {
    return this.lazyLoadingService.loadClassification(key, header);
  }

  @Roles({ roles: [UserRoles.ADMIN, UserRoles.USER] })
  // @Unprotected()
  @Get('/getClassificationRootAndChildrenByLanguageAndRealm')
  @NoCache()
  getClassificationRootAndChildrenByLanguageAndRealm(@Param('label') label: string, @Headers() header) {
    const { language, realm } = header;
    return this.lazyLoadingService.getClassificationRootAndChildrenByLanguageAndRealm(realm, language);
  }

  @Unprotected()
  @Get('/:key/:leafType')
  @NoCache()
  loadByKey(@Param('key') key: string, @Param('leafType') leafType: string, @Headers() header) {
    return this.lazyLoadingService.loadByKey(key, leafType, header);
  }

  @Unprotected()
  @Get('/:label')
  @NoCache()
  loadByLabel(@Param('label') label: string, @Headers() header) {
    return this.lazyLoadingService.loadByLabel(label, header);
  }
}
