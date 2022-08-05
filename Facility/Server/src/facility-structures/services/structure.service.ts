import { Inject, Injectable } from '@nestjs/common';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { FacilityInterface } from 'src/common/interface/facility.interface';
import { GeciciInterface } from 'src/common/interface/gecici.interface';

import { CreateFacilityStructureDto } from '../dto/create-facility-structure.dto';
import { UpdateFacilityStructureDto } from '../dto/update-facility-structure.dto';

@Injectable()
export class StructureService {
  constructor(
    @Inject(RepositoryEnums.FACILITY_STRUCTURE)
    private readonly facilityStructureRepository: FacilityInterface<any>,
  ) {}
  async create(id:string, createFacilityStructureDto: Object) {
    return await this.facilityStructureRepository.create(id, createFacilityStructureDto);
  }

  findOne(label: string, realm: string) {
    return this.facilityStructureRepository.findOneByRealm(label, realm);
  }

  update(id: string, updateFacilityStructureDto: UpdateFacilityStructureDto) {
    return this.facilityStructureRepository.update(id, updateFacilityStructureDto);
  }

  remove(id: string) {
    return this.facilityStructureRepository.delete(id);
  }

  async changeNodeBranch(id: string, target_parent_id: string) {
    return await this.facilityStructureRepository.changeNodeBranch(id, target_parent_id);
  }

  async findOneNode(key: string) {
    //checkObjectIddİsValid(id);
    return await this.facilityStructureRepository.findOneNodeByKey(key);
  }

  findOneFirstLevel(label: string, realm: string) {
    return this.facilityStructureRepository.findOneFirstLevelByRealm(label, realm);
  }

  findChildrenByFacilityTypeNode(language: string,realm: string, typename:string) {
      return this.facilityStructureRepository.findChildrenByFacilityTypeNode(language,realm, typename);
    }
}
