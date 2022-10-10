import { GeciciInterface } from "./gecici.interface";

export interface classificationInterface<T> extends GeciciInterface<T> {

  setIsActiveTrueOfClassificationAndItsChild(id:string, realm:string, language:string):any;
  setIsActiveFalseOfClassificationAndItsChild(id:string, realm:string, language:string):any;
  getClassificationByIsActiveStatus(realm: string,language: string): any;
  getClassificationsByLanguage(realm: string,language: string): any;
  getAClassificationByRealmAndLabelNameAndLanguage(realm: string,labelName: string,language: string): any;
  addAClassificationFromExcel(file: Express.Multer.File, realm: string, language: string):any
  addAClassificationWithCodeFromExcel(file: Express.Multer.File, realm: string, language: string):any
  getNodeByClassificationLanguageRealmAndCode( classificationName:string, language:string,realm:string,code:string): any;
  getNodeByLanguageRealmAndCode(language: string, realm: string, code: string): any;
  checkExcelFile(file: Express.Multer.File):any
  findOneFirstLevelByRealm(label: string, realm: string, language: string): any;
}