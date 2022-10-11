import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { LazyLoadingPathDto } from 'src/common/dto/lazy.loading.path.dto';
import { LazyLoadingPathByKeyDto } from 'src/common/dto/lazy.loading.path.key.dto ';
import { FacilityLazyLoadingInterface } from 'src/common/interface/facility.lazyloading.interface';

@Injectable()
export class ZoneLazyLoadingService {
  constructor(
    @Inject(RepositoryEnums.ZONE_LAZY_LOADING)
    private readonly zoneLazyLoadingRepository: FacilityLazyLoadingInterface,
  ) {}

  async getPath(lazyLoadingPathDto: LazyLoadingPathDto, header) {
    return await this.zoneLazyLoadingRepository.getPath(lazyLoadingPathDto, header);
  }

  async getPathByKey(lazyLoadingPathByKeyDto: LazyLoadingPathByKeyDto, header) {
    return await this.zoneLazyLoadingRepository.getPathByKey(lazyLoadingPathByKeyDto, header);
  }

  findRoot(header) {
    return this.zoneLazyLoadingRepository.findRootByRealm(header);
  }
  findChildrensByKey(key: string, leafType: string, header) {
    return this.zoneLazyLoadingRepository.findChildrensByKey(key, leafType, header);
  }
}
