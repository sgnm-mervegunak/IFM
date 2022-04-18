import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { checkObjectIddİsValid } from 'src/common/func/objectId.check';
import { BaseHistoryRepositoryInterface } from 'src/common/repositories/history.repository.interface';

import { Span, OtelMethodCounter } from 'nestjs-otel';
import { CreateUserHistoryDto } from './dtos/create.user.history.dto';
import { UserHistory } from './entities/user.history.entity';

/**
 *  User  History Service
 */
@Injectable()
export class UserHistoryService {
  constructor(
    @Inject(RepositoryEnums.USER_HISTORY)
    private readonly userHistoryRepository: BaseHistoryRepositoryInterface<UserHistory>,
  ) {}

  /**
   * Create User  History
   */
  async create(createFacilityHistoryDto: CreateUserHistoryDto) {
    return await this.userHistoryRepository.create(createFacilityHistoryDto);
  }

  /**
   * Get All User  History
   */
  @Span('find all histories of the user')
  @OtelMethodCounter()
  async findAll(query) {
    return await this.userHistoryRepository.findAll(query);
  }

  /**
   * find specific User  History
   */
  @Span('find one a history of the user by id')
  @OtelMethodCounter()
  async findOne(id: string) {
    checkObjectIddİsValid(id);
    return await this.userHistoryRepository.findOneById(id);
  }
}
