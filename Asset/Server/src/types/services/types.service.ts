import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { CreateTypesDto } from '../dto/create.types.dto';
import { UpdateTypesDto } from '../dto/update.tpes.dto';

@Injectable()
export class TypesService {
  constructor(
    @Inject(RepositoryEnums.TYPES)
    private readonly assetRepository: GeciciInterface<any>,
  ) {}
  async create(createAssetDto: CreateTypesDto) {
    return await this.assetRepository.create(createAssetDto);
  }

  findOne(realm: string) {
    return this.assetRepository.findRootByRealm(realm);
  }

  update(id: string, updateAssetDto: UpdateTypesDto) {
    return this.assetRepository.update(id, updateAssetDto);
  }

  remove(id: string) {
    return this.assetRepository.delete(id);
  }

  async changeNodeBranch(id: string, target_parent_id: string) {
    return await this.assetRepository.changeNodeBranch(id, target_parent_id);
  }

  async findOneNode(key: string) {
    return await this.assetRepository.findByKey(key);
  }
}
