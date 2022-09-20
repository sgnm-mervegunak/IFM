import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';

import { Span, OtelMethodCounter } from 'nestjs-otel';
import { InfraInterface } from 'src/common/interface/infra.interface';

@Injectable()
export class InfraService {
  constructor(
    @Inject(RepositoryEnums.INFRA)
    private readonly infraRepository: InfraInterface,
  ) {}

  @Span('find a facility by realm')
  @OtelMethodCounter()
  createConstraints() {
    return this.infraRepository.createConstraints();
  }

  @Span('create a infra nodes')
  @OtelMethodCounter()
  create() {
    return this.infraRepository.create();
  }

  importClassificationFromExcel(file: Express.Multer.File, language: string) {
    return this.infraRepository.importClassificationFromExcel(file, language);
  }
}
