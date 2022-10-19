import { Inject, Injectable } from '@nestjs/common';
import { PaginationParams } from 'src/common/commonDto/pagination.dto';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { SystemComponentInterface } from 'src/common/interface/system-component.interface';
import { SystemComponentRelationDto } from '../dto/component.relation.dto';
import { System } from '../entities/systems.entity';


@Injectable()
export class SystemComponentService {
  constructor(
    @Inject(RepositoryEnums.SYSTEM_COMPONENT)
    private readonly systemComponentRepository: SystemComponentInterface<System>,
  ) {}

  async findOneTotalCount(systemId: string, realm: string, language: string) {
    return this.systemComponentRepository.findOneByRealmTotalCount(systemId, realm, language);
  }
  async create(systemComponentDto: SystemComponentRelationDto, header) {
    return await this.systemComponentRepository.create(systemComponentDto, header);
  }
  async delete(_parent_key: string, _children_keys: string[], header) {
    return await this.systemComponentRepository.delete(_parent_key, _children_keys, header);
  }
  async findComponentsIncludedBySystem(key: string, header, neo4jQuery: PaginationParams) {
    return await this.systemComponentRepository.findComponentsIncludedBySystem(key, header, neo4jQuery); 
  }  
}
