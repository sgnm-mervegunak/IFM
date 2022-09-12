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
  async create(createAssetDto: CreateComponentDto, header) {
    return await this.componentRepository.create(createAssetDto, header);
  }

  findOne(header) {
    return this.componentRepository.findRootByRealm(header);
  }

  update(id: string, updateAssetDto: UpdateComponentDto, header) {
    return this.componentRepository.update(id, updateAssetDto, header);
  }

  remove(id: string, header) {
    return this.componentRepository.delete(id, header);
  }

  async findOneNode(key: string, header) {
    return await this.componentRepository.findByKey(key, header);
  }
}
