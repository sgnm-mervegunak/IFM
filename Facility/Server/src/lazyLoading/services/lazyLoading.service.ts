import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { LazyLoadingInterface } from 'src/common/interface/lazyLoading.interface';

@Injectable()
export class LazyLoadingService {
  constructor(
    @Inject(RepositoryEnums.LAZY_LOADING)
    private readonly lazyLoadingRepository: LazyLoadingInterface,
  ) {}

  async loadByKey(key: string, leafType: string, header) {
    return await this.lazyLoadingRepository.loadByKey(key, leafType, header);
  }

  async loadByLabel(label: string, header) {
    return await this.lazyLoadingRepository.loadByLabel(label, header);
  }

  async loadClassification(key: string, header) {
    return await this.lazyLoadingRepository.loadClassification(key, header);
  }
  async getClassificationRootAndChildrenByLanguageAndRealm(realm: string, language: string) {
    return await this.lazyLoadingRepository.getClassificationRootAndChildrenByLanguageAndRealm(realm, language);
  }
  async loadClassificationWithPath(path: string[], realm: string, language: string) {
    return await this.lazyLoadingRepository.loadClassificationWithPath(path, realm, language);
  }

  async loadClassificationByIsActive(key: string, header, isActive: boolean) {
    return await this.lazyLoadingRepository.loadClassificationByIsActive(key, header, isActive);
  }
  async getClassificationRootAndChildrenByLanguageAndRealmAndIsActive(
    realm: string,
    language: string,
    isActive: boolean,
  ) {
    return await this.lazyLoadingRepository.getClassificationRootAndChildrenByLanguageAndRealmAndIsActive(
      realm,
      language,
      isActive,
    );
  }
  async loadClassificationWithPathByIsActive(path: string[], realm: string, language: string, isActive: boolean) {
    return await this.lazyLoadingRepository.loadClassificationWithPathByIsActive(path, realm, language, isActive);
  }
}
