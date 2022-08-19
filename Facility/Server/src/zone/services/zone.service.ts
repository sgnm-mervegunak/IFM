import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { CreateZoneDto } from '../dto/create.zone.dto';
import { UpdateZoneDto } from '../dto/update.zone.dto';

@Injectable()
export class ZoneService {
  constructor(
    @Inject(RepositoryEnums.ZONE)
    private readonly jointSpaceRepository: GeciciInterface<any>,
  ) {}
  async create(createZoneDto: CreateZoneDto) {
    return await this.jointSpaceRepository.create(createZoneDto);
  }

  update(key, updateFacilityStructureDto: UpdateZoneDto) {
    return this.jointSpaceRepository.update(key, updateFacilityStructureDto);
  }

  async findOneNode(key: string) {
    //checkObjectIddİsValid(id);
    return await this.jointSpaceRepository.findOneNodeByKey(key);
  }

  remove(id: string) {
    return this.jointSpaceRepository.delete(id);
  }

  findOneFirstLevel(label: string, realm: string) {
    return this.jointSpaceRepository.findOneFirstLevelByRealm(label, realm);
  }

  findOne(key: string, realm: string) {
    return this.jointSpaceRepository.findOneByRealm(key, realm);
  }
}
