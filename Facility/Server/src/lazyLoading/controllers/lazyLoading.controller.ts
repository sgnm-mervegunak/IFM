import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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
  @Get('/:key')
  @NoCache()
  load(@Param('key') key: string) {
    return this.lazyLoadingService.load(key);
  }
}
