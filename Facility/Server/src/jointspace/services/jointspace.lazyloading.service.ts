import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { LazyLoadingPathDto } from 'src/common/dto/lazy.loading.path.dto';
import { LazyLoadingPathByKeyDto } from 'src/common/dto/lazy.loading.path.key.dto ';
import { FacilityLazyLoadingInterface } from 'src/common/interface/facility.lazyloading.interface';

@Injectable()
export class JointSpaceLazyLoadingService {
  constructor(
    @Inject(RepositoryEnums.JOINT_SPACE_LAZY_LOADING)
    private readonly jointSpaceLazyLoadingRepository: FacilityLazyLoadingInterface,
  ) {}

  async getPath(lazyLoadingPathDto: LazyLoadingPathDto, header) {
    return await this.jointSpaceLazyLoadingRepository.getPath(lazyLoadingPathDto, header);
  }

  async getPathByKey(lazyLoadingPathByKeyDto: LazyLoadingPathByKeyDto, header) {
    return await this.jointSpaceLazyLoadingRepository.getPathByKey(lazyLoadingPathByKeyDto, header);
  }

  findRoot(header) {
    return this.jointSpaceLazyLoadingRepository.findRootByRealm(header);
  }
  findChildrensByKey(key: string, leafType: string, header) {
    return this.jointSpaceLazyLoadingRepository.findChildrensByKey(key, leafType, header);
  }
}
