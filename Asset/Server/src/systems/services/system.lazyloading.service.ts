import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { LazyLoadingPathDto } from 'src/common/dto/lazy.loading.path.dto';
import { LazyLoadingPathByKeyDto } from 'src/common/dto/lazy.loading.path.key.dto ';
import { SystemLazyLoadingInterface } from 'src/common/interface/system.lazyloading.interface';

@Injectable()
export class SystemLazyLoadingService {
  constructor(
    @Inject(RepositoryEnums.SYSTEM_LAZY_LOADING)
    private readonly systemRepository: SystemLazyLoadingInterface,
  ) {}

  async getPath(lazyLoadingPathDto: LazyLoadingPathDto, header) {
    return await this.systemRepository.getPath(lazyLoadingPathDto, header);
  }

  async getPathByKey(lazyLoadingPathByKeyDto: LazyLoadingPathByKeyDto, header) {
    return await this.systemRepository.getPathByKey(lazyLoadingPathByKeyDto, header);
  }

  findRoot(header) {
    return this.systemRepository.findRootByRealm(header);
  }
  findChildrensByKey(key: string, leafType: string, header) {
    return this.systemRepository.findChildrensByKey(key, leafType, header);
  }
}
