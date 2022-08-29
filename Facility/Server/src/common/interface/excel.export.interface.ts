import { ExportExcelDto } from "src/excelExport/dto/excel.export.dto"


export interface ExcelExportInterface<T> {
    getSpacesByBuilding(realm:string,buildingKey:string):any
    getZonesByBuilding(realm:string,buildingKey:string):any
    getJointSpacesByBuilding(realm:string,buildingKey:string):any

    getSpacesAnExcelFile(body:ExportExcelDto )
    getZonesAnExcelFile(body:ExportExcelDto )
    getJointSpacesAnExcelFile(body:ExportExcelDto )
  }
  