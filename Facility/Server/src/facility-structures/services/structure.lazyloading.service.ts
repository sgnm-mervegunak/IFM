import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { LazyLoadingPathDto } from 'src/common/dto/lazy.loading.path.dto';
import { LazyLoadingPathByKeyDto } from 'src/common/dto/lazy.loading.path.key.dto ';
import { FacilityLazyLoadingInterface } from 'src/common/interface/facility.lazyloading.interface';

@Injectable()
export class StructureLazyLoadingService {
  constructor(
    @Inject(RepositoryEnums.FACILITY_STRUCTURE_LAZY_LOADING)
    private readonly facilityStructureRepository: FacilityLazyLoadingInterface,
  ) {}

  async getPath(lazyLoadingPathDto: LazyLoadingPathDto, header) {
    return await this.facilityStructureRepository.getPath(lazyLoadingPathDto, header);
  }

  async getPathByKey(lazyLoadingPathByKeyDto: LazyLoadingPathByKeyDto, header) {
    return await this.facilityStructureRepository.getPathByKey(lazyLoadingPathByKeyDto, header);
  }

  findRoot(header) {
    return this.facilityStructureRepository.findRootByRealm(header);
  }
  findChildrensByKey(key: string, leafType: string, header) {
    return this.facilityStructureRepository.findChildrensByKey(key, leafType, header);
  }
}
