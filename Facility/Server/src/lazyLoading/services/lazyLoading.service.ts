import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { LazyLoadingInterface } from 'src/common/interface/lazyLoading.interface';

@Injectable()
export class LazyLoadingService {
  constructor(
    @Inject(RepositoryEnums.LAZY_LOADING)
    private readonly lazyLoadingRepository: LazyLoadingInterface,
  ) {}

  async load(key: string) {
    return await this.lazyLoadingRepository.load(key);
  }
}
