import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { ZoneInterface } from 'src/common/interface/zone.interface';
import { CreateZoneDto } from '../dto/create.zone.dto';
import { UpdateZoneDto } from '../dto/update.zone.dto';

@Injectable()
export class ZoneService {
  constructor(
    @Inject(RepositoryEnums.ZONE)
    private readonly jointSpaceRepository: ZoneInterface<any>,
  ) {}
  async create(createZoneDto: CreateZoneDto, realm: string, language: string) {
    return await this.jointSpaceRepository.create(createZoneDto, realm, language);
  }

  update(key, updateFacilityStructureDto: UpdateZoneDto, realm: string, language: string) {
    return this.jointSpaceRepository.update(key, updateFacilityStructureDto, realm, language);
  }

  async findOneNode(key: string, realm: string, language: string) {
    //checkObjectIddİsValid(id);
    return await this.jointSpaceRepository.findOneNodeByKey(key, realm, language);
  }

  remove(id: string, realm:string, language: string) {
    return this.jointSpaceRepository.delete(id, realm, language);
  }

  findOneFirstLevel(label: string, realm: string, language: string) {
    return this.jointSpaceRepository.findOneFirstLevelByRealm(label, realm, language);
  }

  findOne(key: string, realm: string, language: string) {
    return this.jointSpaceRepository.findOneByRealm(key, realm, language);
  }

  async addZonesToBuilding( file: Express.Multer.File, realm: string,buildingKey: string,language: string){
    return this.jointSpaceRepository.addZonesToBuilding(file, realm,buildingKey,language);
  }
}
