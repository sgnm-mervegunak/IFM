import { Controller, Get, Post, Body, Patch, Param, Delete,Headers } from '@nestjs/common';
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
  getSpacesAnExcelFile(@Headers() header) {
    return this.excelExportService.getSpacesAnExcelFile(header);
  }

  @Unprotected()
  @Post('exportJointSpaces')
  @ApiBody({
    type: ExportExcelDto,
    description: 'export jointspaces',
  })
  async getJointSpacesAnExcelFile(@Headers() header){
    return this.excelExportService.getJointSpacesAnExcelFile(header);
  }

  @Unprotected()
  @Post('exportZones')
  @ApiBody({
    type: ExportExcelDto,
    description: 'export zones',
  })
  async getZonesAnExcelFile(@Headers() header){
    return this.excelExportService.getZonesAnExcelFile(header);
  }
}
