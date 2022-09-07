import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { JointSpaceAndZoneInterface } from 'src/common/interface/joint.space.zone.interface';
import { CreateJointSpaceDto } from '../dto/create.jointspace.dto';
import { UpdateJointSpaceDto } from '../dto/update.jointspace.dto';

@Injectable()
export class JointSpaceService {
  constructor(
    @Inject(RepositoryEnums.JOINT_SPACE)
    private readonly jointSpaceRepository: JointSpaceAndZoneInterface<any>,
  ) {}
  async create(createJointSpaceDto: CreateJointSpaceDto, realm: string, language: string) {
    return await this.jointSpaceRepository.create(createJointSpaceDto, realm, language);
  }

  update(key, updateFacilityStructureDto: UpdateJointSpaceDto, realm: string, language: string) {
    return this.jointSpaceRepository.update(key, updateFacilityStructureDto, realm, language);
  }

  async findOneNode(key: string, realm: string, language: string) {
    //checkObjectIddİsValid(id);
    return await this.jointSpaceRepository.findOneNodeByKey(key, realm, language);
  }

  remove(id: string, realm: string, language: string) {
    return this.jointSpaceRepository.delete(id, realm, language);
  }

  findOne(key: string, realm: string, language: string) {
    return this.jointSpaceRepository.findOneByRealm(key, realm, language);
  }
}
