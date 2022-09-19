import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { SystemsInterface } from 'src/common/interface/systems.interface';
import { SystemsDto } from '../dto/systems.dto';


@Injectable()
export class SystemsService {
  constructor(
    @Inject(RepositoryEnums.SYSTEMS)
    private readonly systemsRepository: SystemsInterface<any>,
  ) {}
  async create(systemsDto: SystemsDto, header) {
    return await this.systemsRepository.create(systemsDto, header);
  }

  findOne(header) {
    return this.systemsRepository.findRootByRealm(header);
  }

  update(id: string, systemsDto: SystemsDto, header) {
    return this.systemsRepository.update(id, systemsDto, header);
  }

  remove(id: string, header) {
    return this.systemsRepository.delete(id, header);
  }

  async findOneNode(key: string, header) {
    return await this.systemsRepository.findByKey(key, header);
  }
}
