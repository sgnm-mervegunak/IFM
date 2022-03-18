import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationParams } from 'src/common/commonDto/pagination.dto';
import { ClassificationNotFountException } from 'src/common/notFoundExceptions/facility.not.found.exception';
import { BaseInterfaceRepository } from 'src/common/repositories/crud.repository.interface';
import { CreateClassificationHistoryDto } from '../dtos/create.classification.history.dto';
import { ClassificationHistory } from '../entities/classification.history.entity';

@Injectable()
export class ClassificationHistoryRepository implements BaseInterfaceRepository<ClassificationHistory> {
  constructor(
    @InjectModel(ClassificationHistory.name)
    private readonly classificationHistoryModel: Model<ClassificationHistory>,
  ) {}
  findWithRelations(relations: any): Promise<ClassificationHistory[]> {
    throw new Error(relations);
  }
  async findOneById(id: string): Promise<ClassificationHistory> {
    const classification = await this.classificationHistoryModel.findById({ _id: id }).exec();
    if (!classification) {
      throw new ClassificationNotFountException(id);
    }

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
      // .sort([[orderByColumn, orderBy]])
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
  async update(_id: string, updateClassificationto) {
    throw new Error(updateClassificationto);
  }
  async delete(_id: string) {
    return null;
  }
}
