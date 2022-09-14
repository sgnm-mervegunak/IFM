import { ExportExcelDto } from "src/excelExport/dto/excel.export.dto"


export interface MainHeaderInterface {
  realm:string;
}
export interface HeaderInterface extends MainHeaderInterface {
  language: string;
  
}
export interface ExcelImportExportInterface<T> {

   

    addTypesWithCobie(file: Express.Multer.File,header:MainHeaderInterface)
    addComponentsWithCobie(file: Express.Multer.File,header:MainHeaderInterface)
    addSystemWithCobie(file: Express.Multer.File,header:MainHeaderInterface)


    createCypherForClassification(realm:string,classificationLabel:string,categoryCode:string,nodeName:string)
    keyGenerate();
  }
  