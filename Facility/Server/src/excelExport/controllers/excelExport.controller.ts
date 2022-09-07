import { Controller, Get, Post, Body, Patch, Param, Delete,Headers } from '@nestjs/common';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { ExcelExportService } from '../services/excelExport.service';
import { ExportExcelDto } from '../dto/excel.export.dto';
import { UserRoles } from 'src/common/const/keycloak.role.enum';

@ApiTags('ExcelExport')
@Controller('ExcelExport')
export class ExcelExportController {
  constructor(private readonly excelExportService: ExcelExportService) {}

  // @Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: ExportExcelDto,
    description: 'export spaces',
  })
  @Post('exportSpaces')
  getSpacesAnExcelFile(@Body() body,@Headers() header) {
    return this.excelExportService.getSpacesAnExcelFile(body,header);
  }

  // @Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Post('exportJointSpaces')
  @ApiBody({
    type: ExportExcelDto,
    description: 'export jointspaces',
  })
  async getJointSpacesAnExcelFile(@Body() body,@Headers() header){
    return this.excelExportService.getJointSpacesAnExcelFile(body,header);
  }

  // @Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Post('exportZones')
  @ApiBody({
    type: ExportExcelDto,
    description: 'export zones',
  })
  async getZonesAnExcelFile(@Body() body,@Headers() header){
    return this.excelExportService.getZonesAnExcelFile(body,header);
  }
}
