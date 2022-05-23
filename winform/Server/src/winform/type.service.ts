import { Inject, Injectable } from '@nestjs/common';
import { BaseInterfaceRepository } from '../common/repositories/crud.repository.interface';
import { CreateTypeDto } from './dtos/create.type.dto';
import { CreateTypePropertyDto } from './dtos/create.type.property.dto';
import { UpdateTypeDto } from './dtos/update.type.dto';
import { Type } from './entities/type.entity';
import { Span, OtelMethodCounter } from 'nestjs-otel';

@Injectable()
export class TypeService {
  constructor(
    @Inject('Type')
    private readonly typeRepository: GeciciTypeInterface,
  ) {}
  /*
  findAll() {
    return this.typeRepository.findAll();
  }

  
  async remove(id: string) {
    return await this.typeRepository.delete(id);
  }
  */
  @Span('find a type by id')
  @OtelMethodCounter()
  async findOne(id: string) {
    return this.typeRepository.findOneById(id);
  }

  @Span('create a new type')
  @OtelMethodCounter()
  createType(createTypeDto: CreateTypeDto) {
    return this.typeRepository.createType(createTypeDto);
  }

  @Span('create new type properties')
  @OtelMethodCounter()
  async createTypeProperties(createTypeProperties: CreateTypePropertyDto[]) {
    return this.typeRepository.createTypeProperties(createTypeProperties);
  }

  @Span('find a node by key')
  @OtelMethodCounter()
  async findOneNode(key: string) {
    //checkObjectIddİsValid(id);
    return await this.typeRepository.findOneNodeByKey(key);
  }
  
  @Span('update a node')
  @OtelMethodCounter()
  async updateNode(id: string, updateTypeDto: UpdateTypeDto) {
    return this.typeRepository.updateNode(id, updateTypeDto);
  }

  @Span('find type properties by node id')
  @OtelMethodCounter()
  async findTypePropertiesByNodeId(id: string) {
    return this.typeRepository.findTypePropertiesByNodeId(id);
  }

  @Span('remove a type')
  @OtelMethodCounter()
  async remove(id: string) {
    return this.typeRepository.delete(id);
  }
}

export interface GeciciTypeInterface {
  //ifmcommon  a eklenecek
  findOneById(id: string);
  createType(createTypeDto: CreateTypeDto);
  createTypeProperties(createTypeProperties: CreateTypePropertyDto[]);
  findOneNodeByKey(key: string);
  updateNode(id: string, updateTypeDto: UpdateTypeDto);
  findTypePropertiesByNodeId(id: string);
  delete(id: string);   
}