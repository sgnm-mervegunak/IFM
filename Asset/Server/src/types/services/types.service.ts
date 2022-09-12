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
  async create(createAssetDto: CreateTypesDto, header) {
    return await this.assetRepository.create(createAssetDto, header);
  }

  findOne(header) {
    return this.assetRepository.findRootByRealm(header);
  }

  update(id: string, updateAssetDto: UpdateTypesDto, header) {
    return this.assetRepository.update(id, updateAssetDto, header);
  }

  remove(id: string, header) {
    return this.assetRepository.delete(id, header);
  }

  async findOneNode(key: string, header) {
    return await this.assetRepository.findByKey(key, header);
  }
}
