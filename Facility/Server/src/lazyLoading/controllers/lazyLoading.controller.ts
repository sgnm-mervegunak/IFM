import { Controller, Get, Param, Headers } from '@nestjs/common';
import { Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { LazyLoadingService } from '../services/lazyLoading.service';

@ApiTags('LazyLoading')
@ApiBearerAuth('JWT-auth')
@Controller('lazyLoading')
export class LazyLoadingController {
  constructor(private readonly lazyLoadingService: LazyLoadingService) {}
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
