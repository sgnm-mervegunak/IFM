import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { CreateComponentDto } from '../dto/create.component.dto';
import { UpdateComponentDto } from '../dto/update.component.dto';

@Injectable()
export class ComponentService {
  constructor(
    @Inject(RepositoryEnums.COMPONENTS)
    private readonly componentRepository: GeciciInterface<any>,
  ) {}
  async create(createAssetDto: CreateComponentDto, realm: string, language, authorization) {
    return await this.componentRepository.create(createAssetDto, realm, language, authorization);
  }

  findOne(realm: string) {
    return this.componentRepository.findRootByRealm(realm);
  }

  update(id: string, updateAssetDto: UpdateComponentDto, realm: string) {
    return this.componentRepository.update(id, updateAssetDto, realm);
  }

  remove(id: string, realm: string) {
    return this.componentRepository.delete(id, realm);
  }

  async findOneNode(key: string, realm: string) {
    return await this.componentRepository.findByKey(key, realm);
  }
}
