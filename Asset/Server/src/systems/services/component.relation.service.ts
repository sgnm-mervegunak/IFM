import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { SystemComponentInterface } from 'src/common/interface/system-component.interface';
import { SystemComponentRelationDto } from '../dto/component.relation.dto';


@Injectable()
export class SystemComponentService {
  constructor(
    @Inject(RepositoryEnums.SYSTEM_COMPONENT)
    private readonly systemComponentRepository: SystemComponentInterface<any>,
  ) {}
  async create(systemComponentDto: SystemComponentRelationDto, header) {
    return await this.systemComponentRepository.create(systemComponentDto, header);
  }

}
