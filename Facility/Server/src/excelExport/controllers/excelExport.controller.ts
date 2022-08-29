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

  @Unprotected()
  @ApiBody({
    type: ExportExcelDto,
    description: 'export spaces',
  })
  @Post('exportSpaces')
  getSpacesAnExcelFile(@Body() exportExcelDto: ExportExcelDto) {
    return this.excelExportService.getSpacesAnExcelFile(exportExcelDto);
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
