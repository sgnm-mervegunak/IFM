import { BadRequestException, Injectable, UseFilters } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpExceptionFilter } from 'src/common/exceptionFilters/exception.filter';
import { BaseInterfaceRepository } from 'src/common/repositories/crud.repository.interface';

import { FacilityNotFountException } from '../commonExceptions/facility.not.found.exception';
import { CreateFacilityDto } from '../dtos/create.facility.dto';
import { Facility } from '../entities/facility.entity';


@Injectable()
@UseFilters(new HttpExceptionFilter())
export class FacilityRepository implements BaseInterfaceRepository<Facility> {
  constructor(
    @InjectModel(Facility.name) private readonly facilityModel: Model<Facility>,
  ) {}

  remove(id: string): Promise<Facility> {
    throw new Error('Method not implemented.');
  }
  findWithRelations(relations: any): Promise<Facility[]> {
    throw new Error('Method not implemented.');
  }
  async findOneById(_id: string): Promise<Facility> {
    try {
      const facility = await this.facilityModel.findById({ _id }).exec();
      if (!facility) {
       throw  new  BadRequestException(_id);
      }
      return facility;
    } catch (err) {
      console.log(err);
    }
  }
  async findAll() {
    return await this.facilityModel.find().exec();
  }
  async create(createFacilityDto: CreateFacilityDto) {
    const facility = new this.facilityModel(createFacilityDto);

    return await facility.save();
  }
  update() {
    throw new Error('Method not implemented.');
  }
  delete() {
    throw new Error('Method not implemented.');
  }
}
