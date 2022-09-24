import { GeciciInterface } from "./gecici.interface";

export interface classificationInterface<T>  {
  update(id: string, data: T | any, header): any;
  create(data: T | any, header): any;
  delete(id: string, header): any;
  changeNodeBranch(id: string, target_parent_id: string, header): any;
  setIsActiveTrueOfClassificationAndItsChild(id:string, header):any;
  setIsActiveFalseOfClassificationAndItsChild(id:string, header):any;
  getClassificationByIsActiveStatus(header): any;
  getClassificationsByLanguage(header): any;
  getAClassificationByRealmAndLabelNameAndLanguage(labelName: string,header): any;
  addAClassificationFromExcel(file: Express.Multer.File, header):any
  addAClassificationWithCodeFromExcel(file: Express.Multer.File,header):any
  getNodeByClassificationLanguageRealmAndCode( classificationName:string, code:string,header): any;
  getNodeByLanguageRealmAndCode( code: string,header): any;

}