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
  async create(createAssetDto: CreateComponentDto, realm: string) {
    return await this.componentRepository.create(createAssetDto, realm);
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

  async changeNodeBranch(id: string, target_parent_id: string) {
    return await this.componentRepository.changeNodeBranch(id, target_parent_id);
  }

  async findOneNode(key: string, realm: string) {
    return await this.componentRepository.findByKey(key, realm);
  }
}
