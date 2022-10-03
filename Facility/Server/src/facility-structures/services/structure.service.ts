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
  async create(key: string, createFacilityStructureDto: Object, realm: string, language: string) {
    return await this.facilityStructureRepository.create(key, createFacilityStructureDto, realm, language);
  }

  update(key: string, updateFacilityStructureDto: Object, realm: string, language: string) {
    return this.facilityStructureRepository.update(key, updateFacilityStructureDto, realm, language);
  }

  async findOneNode(key: string, realm: string, language: string) {
    //checkObjectIddİsValid(id);
    return await this.facilityStructureRepository.findOneNodeByKey(key, realm, language);
  }

  remove(id: string, realm: string, language: string) {
    return this.facilityStructureRepository.delete(id, realm, language);
  }

  async changeNodeBranch(id: string, target_parent_id: string, realm: string, language: string) {
    return await this.facilityStructureRepository.changeNodeBranch(id, target_parent_id, realm, language);
  }

  findOneFirstLevel(label: string, realm: string, language: string) {
    return this.facilityStructureRepository.findOneFirstLevelByRealm(label, realm, language);
  }

  findChildrenByFacilityTypeNode(typename: string, realm: string, language: string) {
    return this.facilityStructureRepository.findChildrenByFacilityTypeNode(typename, realm, language);
  }

  findOne(realm: string, language: string) {
    return this.facilityStructureRepository.findOneByRealm(realm, language);
  }
  findStructureFirstLevelNodes(key: string, leafType, realm: string, language: string) {
    return this.facilityStructureRepository.findStructureFirstLevelNodes(key, leafType, realm, language);
  }
  addPlanToFloor(key: string, realm: string, language: string) {
    return this.facilityStructureRepository.addPlanToFloor(key, realm, language);
  }
}
