import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseHistoryRepositoryInterface, PaginationParams } from 'ifmcommon';
import { CreateClassificationHistoryDto } from '../dtos/create.classification.history.dto';
import { ClassificationHistory } from '../entities/classification.history.entity';

@Injectable()
export class ClassificationHistoryRepository implements BaseHistoryRepositoryInterface<ClassificationHistory> {
  constructor(
    @InjectModel(ClassificationHistory.name)
    private readonly classificationHistoryModel: Model<ClassificationHistory>,
  ) {}

  async findOneById(id: string): Promise<ClassificationHistory[]> {
    const page = 0;
    const limit = 100;
    //orderBy = orderBy || 'ascending';

    // orderByColumn = orderByColumn || '';
    const count = parseInt(
      (await this.classificationHistoryModel.find({ 'classification.properties.labelclass': id }).count()).toString(),
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
    const result = await this.classificationHistoryModel
      .find({ 'classification.properties.labelclass': id })
      .skip(skip)
      .limit(lmt)
      .sort({ 'classification.updatedAt': 1 })
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
    const count = parseInt((await this.classificationHistoryModel.find().count()).toString());
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
    const result = await this.classificationHistoryModel
      .find()
      .skip(skip)
      .limit(lmt)
      .sort({ 'classification.updatedAt': 1 })
      .exec();
    const pagination = { count: count, page: pg, limit: lmt };
    const classification = [];
    classification.push(result);
    classification.push(pagination);

    return classification;
  }

  async create(createClassificationDto: CreateClassificationHistoryDto) {
    const classification = new this.classificationHistoryModel(createClassificationDto);

    return await classification.save();
  }
}
