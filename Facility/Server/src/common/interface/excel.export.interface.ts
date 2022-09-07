import { ExportExcelDto } from "src/excelExport/dto/excel.export.dto"

export interface HeaderInterface{
  language: string;
  realm:string;
}
export interface ExcelExportInterface<T> {
    getSpacesByBuilding(realm:string,buildingKey:string,language: string):any
    getZonesByBuilding(realm:string,buildingKey:string,language: string):any
    getJointSpacesByBuilding(realm:string,buildingKey:string,language: string):any

    getSpacesAnExcelFile(body:ExportExcelDto ,header:HeaderInterface)
    getZonesAnExcelFile(body:ExportExcelDto ,header:HeaderInterface)
    getJointSpacesAnExcelFile(body:ExportExcelDto ,header:HeaderInterface)
  }
  