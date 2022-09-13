import { ExportExcelDto } from "src/excelExport/dto/excel.export.dto"


export interface MainHeaderInterface {
  realm:string;
}
export interface HeaderInterface extends MainHeaderInterface {
  language: string;
  
}
export interface ExcelImportExportInterface<T> {

    getSpacesByBuilding(realm:string,buildingKey:string,language: string):any
    getZonesByBuilding(realm:string,buildingKey:string,language: string):any
    getJointSpacesByBuilding(realm:string,buildingKey:string,language: string):any

    
    getSpacesAnExcelFile(body:ExportExcelDto ,header:HeaderInterface)
    getZonesAnExcelFile(body:ExportExcelDto ,header:HeaderInterface)
    getJointSpacesAnExcelFile(body:ExportExcelDto ,header:HeaderInterface)


    addBuildingwithCobie(file: Express.Multer.File,header:MainHeaderInterface)
    addFloorsToBuilding(file: Express.Multer.File, header:MainHeaderInterface ,buildingKey: string)
    addSpacesToBuilding( file: Express.Multer.File, header:MainHeaderInterface, buildingKey: string)
    addZonesToBuilding( file: Express.Multer.File,header:MainHeaderInterface,buildingKey: string)

    addContacts( file: Express.Multer.File,header:MainHeaderInterface);

    createCypherForClassification(realm:string,classificationLabel:string,categoryCode:string,nodeName:string)
    keyGenerate();
  }
  