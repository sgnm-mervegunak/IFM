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

  findOneFirstLevel(label: string, realm: string) {
    return this.jointSpaceRepository.findOneFirstLevelByRealm(label, realm);
  }

  findOne(key: string, realm: string) {
    return this.jointSpaceRepository.findOneByRealm(key, realm);
  }
}
