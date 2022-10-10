import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationParams } from 'src/common/commonDto/pagination.query';
import { BaseHistoryRepositoryInterface } from 'ifmcommon';
import { CreateFacilityStructureHistoryDto } from '../dtos/create.facilitystructure.history.dto';
import { FacilityStructureHistory } from '../entities/facilitystructure.history.entity';

@Injectable()
export class FacilityStructureHistoryRepository implements BaseHistoryRepositoryInterface<FacilityStructureHistory> {
  constructor(
    @InjectModel(FacilityStructureHistory.name)
    private readonly facilityStructureHistoryModel: Model<FacilityStructureHistory>,
  ) {}

  async findOneById(id: string): Promise<FacilityStructureHistory[]> {
    const page = 0;
    const limit = 100;
    //orderBy = orderBy || 'ascending';

    // orderByColumn = orderByColumn || '';
    const count = parseInt(
      (
        await this.facilityStructureHistoryModel.find({ 'facilityStructure.properties.labelclass': id }).count()
      ).toString(),
    );
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
    const result = await this.facilityStructureHistoryModel
      .find({ 'facilityStructure.properties.labelclass': id })
      .skip(skip)
      .limit(lmt)
      .sort({ 'facilityStructure.updatedAt': 1 })
      .exec();
    const pagination = { count: count, page: pg, limit: lmt };
    const classification = [];
    classification.push(result);
    classification.push(pagination);

    return classification;
  }

  async findAll(data: PaginationParams) {
    let { page, limit } = data;
    page = page || 0;
    limit = limit || 5;
    //orderBy = orderBy || 'ascending';

    // orderByColumn = orderByColumn || '';
    const count = parseInt((await this.facilityStructureHistoryModel.find().count()).toString());
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
    const result = await this.facilityStructureHistoryModel
      .find()
      .skip(skip)
      .limit(lmt)
      .sort({ 'facilityStructure.updatedAt': 1 })
      .exec();
    const pagination = { count: count, page: pg, limit: lmt };
    const facility = [];
    facility.push(result);
    facility.push(pagination);

    return facility;
  }

  async create(createFacilityStructureHistoryDto: CreateFacilityStructureHistoryDto) {
    const facility = new this.facilityStructureHistoryModel(createFacilityStructureHistoryDto);

    return await facility.save();
  }
}
