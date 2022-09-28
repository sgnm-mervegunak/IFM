import { Controller, Get, Post, Body, Patch, Param, Delete,Headers, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { ExcelImportExportService } from '../services/excelImportExport.service';
import { ExportExcelDto } from '../dto/excel.export.dto';
import { UserRoles } from 'src/common/const/keycloak.role.enum';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('ExcelImportExport')
@ApiBearerAuth('JWT-auth')
@Controller('ExcelImportExport')
export class ExcelImportExportController { 
  constructor(private readonly excelImportExport: ExcelImportExportService) {}

  // @Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: ExportExcelDto,
    description: 'export spaces',
  })
  @Post('exportSpaces')
  getSpacesAnExcelFile(@Body() body,@Headers() header) {
    return this.excelImportExport.getSpacesAnExcelFile(body,header);
  }

  // @Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Post('exportJointSpaces')
  @ApiBody({
    type: ExportExcelDto,
    description: 'export jointspaces',
  })
  async getJointSpacesAnExcelFile(@Body() body,@Headers() header){
    return this.excelImportExport.getJointSpacesAnExcelFile(body,header);
  }

  // @Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Post('exportZones')
  @ApiBody({
    type: ExportExcelDto,
    description: 'export zones',
  })
  async getZonesAnExcelFile(@Body() body,@Headers() header){
    return this.excelImportExport.getZonesAnExcelFile(body,header);
  }

  // @Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Post('addBuildingwithCobie')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        }
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a single excel file',
  })
  @ApiConsumes('multipart/form-data')
  async addBuildingWithCobie(@UploadedFile() file: Express.Multer.File, @Headers() header){
    return this.excelImportExport.addBuildingWithCobie(file,header);
  }

  // @Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Post('addFloorwithCobie/:buildingKey')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        }
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a single excel file',
  })
  @ApiConsumes('multipart/form-data')
  async addFloorsToBuilding(@UploadedFile() file: Express.Multer.File, @Headers() header,@Param('buildingKey') buildingKey: string){
    return this.excelImportExport.addFloorsToBuilding(file, header, buildingKey);
  }



  // @Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Post('addSpaceswithCobie/:buildingKey')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        }
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a single excel file',
  })
  @ApiConsumes('multipart/form-data')
  
  async addSpacesToBuilding(@UploadedFile() file: Express.Multer.File,@Headers() header,@Param('buildingKey') buildingKey: string){
    return this.excelImportExport.addSpacesToBuilding(file,header,buildingKey);
  }


  // @Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Post('addZoneswithCobie/:buildingKey')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        }
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a single excel file',
  })
  @ApiConsumes('multipart/form-data')
  async addZonesToBuilding(@UploadedFile() file: Express.Multer.File,@Headers() header,@Param('buildingKey') buildingKey: string){
    return this.excelImportExport.addZonesToBuilding(file,header,buildingKey);
  }

  //@Unprotected()
  //@Roles({ roles: [UserRoles.ADMIN] })
  @Post('addContacts')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        }
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a single excel file',
  })
  @ApiConsumes('multipart/form-data')
  async addContacts(@UploadedFile() file: Express.Multer.File, @Headers() header){
    console.log(header);
    return this.excelImportExport.addContacts(file,header);
  }

  //@Unprotected()
  //@Roles({ roles: [UserRoles.ADMIN] })
  @Post('addTypesWithCobie')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        }
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a single excel file',
  })
  @ApiConsumes('multipart/form-data')
  async addTypesWithCobie(@UploadedFile() file: Express.Multer.File, @Headers() header){
    return this.excelImportExport.addTypesWithCobie(file,header);
  }

  //@Unprotected()
  //@Roles({ roles: [UserRoles.ADMIN] })
  @Post('addComponentsWithCobie')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        }
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a single excel file',
  })
  @ApiConsumes('multipart/form-data')
  async addComponentsWithCobie(@UploadedFile() file: Express.Multer.File, @Headers() header){
    return this.excelImportExport.addComponentsWithCobie(file,header);
  }


  //@Unprotected()
  //@Roles({ roles: [UserRoles.ADMIN] })
  @Post('addSystemWithCobie')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        }
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a single excel file',
  })
  @ApiConsumes('multipart/form-data')
  async addSystemWithCobie(@UploadedFile() file: Express.Multer.File, @Headers() header){
    return this.excelImportExport.addSystemWithCobie(file,header);
  }



}
