import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { CreateJointSpaceDto } from '../dto/create.jointspace.dto';
import { UpdateJointSpaceDto } from '../dto/update.jointspace.dto';

@Injectable()
export class JointSpaceService {
  constructor(
    @Inject(RepositoryEnums.JOINT_SPACE)
    private readonly jointSpaceRepository: GeciciInterface<any>,
  ) {}
  async create(createJointSpaceDto: CreateJointSpaceDto) {
    return await this.jointSpaceRepository.create(createJointSpaceDto);
  }

  update(key, updateFacilityStructureDto: UpdateJointSpaceDto) {
    return this.jointSpaceRepository.update(key, updateFacilityStructureDto);
  }

  async findOneNode(key: string) {
    //checkObjectIddİsValid(id);
    return await this.jointSpaceRepository.findOneNodeByKey(key);
  }

  remove(id: string) {
    return this.jointSpaceRepository.delete(id);
  }

  async changeNodeBranch(id: string, target_parent_id: string) {
    return await this.jointSpaceRepository.changeNodeBranch(id, target_parent_id);
  }

  findOneFirstLevel(label: string, realm: string) {
    return this.jointSpaceRepository.findOneFirstLevelByRealm(label, realm);
  }

  findChildrenByFacilityTypeNode(language: string, realm: string, typename: string) {
    return this.jointSpaceRepository.findChildrenByFacilityTypeNode(language, realm, typename);
  }

  findOne(label: string, realm: string) {
    return this.jointSpaceRepository.findOneByRealm(label, realm);
  }
}
