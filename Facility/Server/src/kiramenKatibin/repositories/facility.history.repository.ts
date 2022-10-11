import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FacilityNotFountException } from 'src/common/notFoundExceptions/not.found.exception';
import { BaseHistoryRepositoryInterface } from 'ifmcommon';
import { PaginationParams } from 'src/common/dto/pagination.query';
import { CreateFacilityHistoryDto } from '../dtos/create.facility.history.dto';

import { FacilityHistory } from '../entities/facility.history.entity';

@Injectable()
export class FacilityHistoryRepository implements BaseHistoryRepositoryInterface<FacilityHistory> {
  constructor(
    @InjectModel(FacilityHistory.name)
    private readonly facilityHistoryModel: Model<FacilityHistory>,
  ) {}

  async findOneById(id: string): Promise<FacilityHistory[]> {
    const facilityHistory = await this.facilityHistoryModel.find({ 'facility._id': id }).exec();
    if (!facilityHistory) {
      throw new FacilityNotFountException(id);
    }

    return facilityHistory;
  }

  async findAll(data: PaginationParams) {
    let { page, limit } = data;
    page = page || 0;
    limit = limit || 5;
    //orderBy = orderBy || 'ascending';

    // orderByColumn = orderByColumn || '';
    const count = parseInt((await this.facilityHistoryModel.find().count()).toString());
    const pagecount = Math.ceil(count / limit);
    let pg = parseInt(page.toString());
    const lmt = parseInt(limit.toString());
    if (pg > pagecount) {
      pg = pagecount;
    }
    let skip = pg * lmt;
    if (skip >= count) {
      skip = count - lmt;
      if (skip < 0) {
        skip = 0;
      }
    }
    const result = await this.facilityHistoryModel
      .find()
      .skip(skip)
      .limit(lmt)
      .sort({ 'facility.updatedAt': 1 })
      .exec();
    const pagination = { count: count, page: pg, limit: lmt };
    const facility = [];
    facility.push(result);
    facility.push(pagination);

    return facility;
  }

  async create(createFacilityHistoryDto: CreateFacilityHistoryDto) {
    const facility = new this.facilityHistoryModel(createFacilityHistoryDto);

    return await facility.save();
  }
}
