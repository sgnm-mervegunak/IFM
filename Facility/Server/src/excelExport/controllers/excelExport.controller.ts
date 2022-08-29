import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { ExcelExportService } from '../services/excelExport.service';
import { ExportExcelDto } from '../dto/excel.export.dto';

@ApiTags('ExcelExport')
@Controller('ExcelExport')
export class ExcelExportController {
  constructor(private readonly excelExportService: ExcelExportService) {}

  @Post('exportSpaces')
  @ApiBody({
    type: ExportExcelDto,
    description: 'export spaces',
  })
  @Unprotected()
  getSpacesAnExcelFile(@Body() body:ExportExcelDto ){
  //console.log(body,"DATAAAA");
  let data ={
    buildingKeys: [
      "a4eb027b-c62c-4af7-9a6f-5a755bfe22fd","bdc577c2-8505-4626-8db2-2ab9254388dc"
    ],
    realm: "IFM"
  }
  return this.excelExportService.getSpacesAnExcelFile(data);
}  


// @Patch('exportJointSpaces')
// @ApiBody({
//   type: ExportExcelDto,
//   description: 'export jointspaces',
// })
// async getJointSpacesAnExcelFile(@Body() body:ExportExcelDto ){
//   return this.excelExportService.getJointSpacesAnExcelFile(body);
// }  

// @Patch('exportZones')
// @ApiBody({
//   type: ExportExcelDto,
//   description: 'export zones',
// })
// async getZonesAnExcelFile(@Body() body:ExportExcelDto ){
//   return this.excelExportService.getZonesAnExcelFile(body);
// }  
}
