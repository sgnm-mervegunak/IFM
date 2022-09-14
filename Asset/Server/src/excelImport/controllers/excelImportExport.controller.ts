import { Controller, Get, Post, Body, Patch, Param, Delete,Headers, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { ExcelImportExportService } from '../services/excelImportExport.service';
import { UserRoles } from 'src/common/const/keycloak.role.enum';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('ExcelImportExport')
@Controller('ExcelImportExport')
export class ExcelImportExportController { 
  constructor(private readonly excelImportExport: ExcelImportExportService) {}

  
  @Unprotected()
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

  @Unprotected()
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


  @Unprotected()
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
