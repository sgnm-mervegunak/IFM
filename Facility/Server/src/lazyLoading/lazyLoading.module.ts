import { Module } from '@nestjs/common';
import { LazyLoadingService } from './services/lazyLoading.service';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { LazyLoadingRepository } from './repositories/lazyLoading.repository';
import { LazyLoadingController } from './controllers/lazyLoading.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [LazyLoadingController],
  providers: [
    LazyLoadingService,

    {
      provide: RepositoryEnums.LAZY_LOADING,
      useClass: LazyLoadingRepository,
    },
  ],
})
export class LazyLoadingModule {}
