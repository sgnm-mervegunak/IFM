import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { CreateClassificationDto } from './dto/create-classification.dto';
import { UpdateClassificationDto } from './dto/update-classification.dto';
import { Span, OtelMethodCounter } from 'nestjs-otel';
import { BaseGraphDatabaseInterfaceRepository } from 'ifmcommon';

import { classificationInterface } from 'src/common/interface/classification.interface';

@Injectable()
export class ClassificationService {
  constructor(
    @Inject(RepositoryEnums.CLASSIFICATION)
    private readonly classificationRepository: classificationInterface<any>,
  ) {}

  @Span('create a classification')
  @OtelMethodCounter()
  async create(createClassificationDto: CreateClassificationDto, header) {
    return await this.classificationRepository.create(createClassificationDto, header);
  }

  
  @Span('find a classification node by key')
  @OtelMethodCounter()
  async findOneNode(key: string, header) {
    //checkObjectIddİsValid(id);
    return await this.classificationRepository.findOneNodeByKey(key, header);
  }

  @Span('update a classification')
  @OtelMethodCounter()
  async update(id: string, updateClassificationDto: UpdateClassificationDto, header) {
    //checkObjectIddİsValid(id);
    return await this.classificationRepository.update(id, updateClassificationDto, header);
  }

  @Span('remove a classification')
  @OtelMethodCounter()
  async remove(id: string, header) {
    return await this.classificationRepository.delete(id, header);
  }
  @Span('change none branch')
  @OtelMethodCounter()
  async changeNodeBranch(id: string, target_parent_id: string, header) {
    return await this.classificationRepository.changeNodeBranch(id, target_parent_id, header);
  }


  @Span('change isActive status a node and if its has children change isActive status of children')
  @OtelMethodCounter()
  async setIsActiveTrueOfClassificationAndItsChild(id:string, header){
    return await this.classificationRepository.setIsActiveTrueOfClassificationAndItsChild(id, header);
  }


  @Span('change isActive status a node and if its has children change isActive status of children')
  @OtelMethodCounter()
  async setIsActiveFalseOfClassificationAndItsChild(id:string, header){
    return await this.classificationRepository.setIsActiveFalseOfClassificationAndItsChild(id, header);
  }
   
  @Span('get all classifications by realm, isActive ')
  @OtelMethodCounter()
  async getClassificationByIsActiveStatus(header){
    return await this.classificationRepository.getClassificationByIsActiveStatus(header);
  }

  @Span('get all classifications by realm and language')
  @OtelMethodCounter()
  async getClassificationsByLanguage(header){
    return await this.classificationRepository.getClassificationsByLanguage(header);
  }
  
  @Span('get a classification by labelName, realm and language')
  @OtelMethodCounter()
  async getAClassificationByRealmAndLabelNameAndLanguage( labelName: string,header){
    return await this.classificationRepository.getAClassificationByRealmAndLabelNameAndLanguage(labelName, header);
  }
  
  @Span('add a classification list from a excel file as name')
  @OtelMethodCounter()
  async addAClassificationFromExcel(file: Express.Multer.File, header){
    return await this.classificationRepository.addAClassificationFromExcel(file, header);
  }

  @Span('add a classification list from a excel file as code-name')
  @OtelMethodCounter()
  async addAClassificationWithCodeFromExcel(file: Express.Multer.File, header){
    return await this.classificationRepository.addAClassificationWithCodeFromExcel(file, header);
  }

  @Span('get a classification with these fields')
  @OtelMethodCounter()
  async getNodeByClassificationLanguageRealmAndCode( classificationName:string, code:string,header){
    return await this.classificationRepository.getNodeByClassificationLanguageRealmAndCode( classificationName, code,header);
  }

  @Span('get a classification with language, realm and code')
  @OtelMethodCounter()
  async getNodeByLanguageRealmAndCode(code: string,header) {
    return await this.classificationRepository.getNodeByLanguageRealmAndCode( code,header);
  }

  @Span('check excel file for it is valid or not')
  @OtelMethodCounter()
  async checkExcelFile(file: Express.Multer.File) {
    return await this.classificationRepository.checkExcelFile(file);
  }

}
