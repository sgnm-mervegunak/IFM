import { Inject, Injectable } from '@nestjs/common';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { GeciciInterface } from 'src/common/interface/gecici.interface';

import { CreateFacilityStructureDto } from '../dto/create-facility-structure.dto';
import { UpdateFacilityStructureDto } from '../dto/update-facility-structure.dto';

@Injectable()
export class StructureService {
  constructor(
    @Inject(RepositoryEnums.FACILITY_STRUCTURE)
    private readonly facilityStructureRepository: GeciciInterface<any>,
  ) {}
  async create(createFacilityStructureDto: CreateFacilityStructureDto) {
    return await this.facilityStructureRepository.create(createFacilityStructureDto);
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

  findChildrenByFacilityTypeNode(first_node_label: string, first_node_realm: string, second_child_node_label: string,
    second_child_node_name: string, children_nodes_label: string,relationName: string, relationDirection: RelationDirection) {
      return this.facilityStructureRepository.findChildrenByFacilityTypeNode(first_node_label, first_node_realm, second_child_node_label,
        second_child_node_name, children_nodes_label,relationName, relationDirection);
    }
}
