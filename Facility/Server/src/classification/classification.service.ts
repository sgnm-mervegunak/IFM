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
  async create(createClassificationDto: CreateClassificationDto, realm, language) {
    return await this.classificationRepository.create(createClassificationDto, realm, language);
  }

  @Span('find a classification by id')
  @OtelMethodCounter()
  async findOne(label: string, realm: string, language: string) {
    //checkObjectIddİsValid(id);
    
    return await this.classificationRepository.findOneByRealm(label, realm, language);
  }

  @Span('update a classification')
  @OtelMethodCounter()
  async update(id: string, updateClassificationDto: UpdateClassificationDto, realm:string, language:string) {
    //checkObjectIddİsValid(id);
    return await this.classificationRepository.update(id, updateClassificationDto, realm, language);
  }

  @Span('remove a classification')
  @OtelMethodCounter()
  async remove(id: string, realm: string, language: string) {
    return await this.classificationRepository.delete(id, realm, language);
  }
  @Span('change none branch')
  @OtelMethodCounter()
  async changeNodeBranch(id: string, target_parent_id: string, realm: string, language: string) {
    return await this.classificationRepository.changeNodeBranch(id, target_parent_id, realm, language);
  }

  @Span('find a classification node by key')
  @OtelMethodCounter()
  async findOneNode(key: string, realm: string, language: string) {
    //checkObjectIddİsValid(id);
    return await this.classificationRepository.findOneNodeByKey(key, realm, language);
  }

  @Span('change isActive status a node and if its has children change isActive status of children')
  @OtelMethodCounter()
  async setIsActiveTrueOfClassificationAndItsChild(id:string, realm: string, language: string){
    return await this.classificationRepository.setIsActiveTrueOfClassificationAndItsChild(id, realm, language);
  }


  @Span('change isActive status a node and if its has children change isActive status of children')
  @OtelMethodCounter()
  async setIsActiveFalseOfClassificationAndItsChild(id:string, realm: string, language: string){
    return await this.classificationRepository.setIsActiveFalseOfClassificationAndItsChild(id, realm, language);
  }
   
  @Span('get all classifications by realm, isActive ')
  @OtelMethodCounter()
  async getClassificationByIsActiveStatus(realm: string,language: string){
    return await this.classificationRepository.getClassificationByIsActiveStatus(realm,language);
  }

  @Span('get all classifications by realm and language')
  @OtelMethodCounter()
  async getClassificationsByLanguage(realm:string, language:string){
    return await this.classificationRepository.getClassificationsByLanguage(realm, language);
  }
  
  @Span('get a classification by labelName, realm and language')
  @OtelMethodCounter()
  async getAClassificationByRealmAndLabelNameAndLanguage(realm: string, labelName: string,language: string){
    return await this.classificationRepository.getAClassificationByRealmAndLabelNameAndLanguage(realm,labelName, language);
  }
  
  @Span('add a classification list from a excel file as name')
  @OtelMethodCounter()
  async addAClassificationFromExcel(file: Express.Multer.File, realm: string, language: string){
    return await this.classificationRepository.addAClassificationFromExcel(file, realm, language);
  }

  @Span('add a classification list from a excel file as code-name')
  @OtelMethodCounter()
  async addAClassificationWithCodeFromExcel(file: Express.Multer.File, realm: string, language: string){
    return await this.classificationRepository.addAClassificationWithCodeFromExcel(file, realm, language);
  }

  @Span('get a classification with these fields')
  @OtelMethodCounter()
  async getNodeByClassificationLanguageRealmAndCode( classificationName:string, language:string,realm:string,code:string){
    return await this.classificationRepository.getNodeByClassificationLanguageRealmAndCode( classificationName, language,realm,code);
  }
}
