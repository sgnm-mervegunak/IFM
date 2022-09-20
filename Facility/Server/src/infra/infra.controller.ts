import { Body, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { InfraService } from './infra.service';

import { NoCache } from 'ifmcommon';
import { FileInterceptor } from '@nestjs/platform-express';
import { Unprotected } from 'nest-keycloak-connect';

@ApiTags('Infra')
@Controller('infra')
export class InfraController {
  constructor(private readonly infraService: InfraService) {}

  @ApiOperation({
    summary: 'Gets all facilities ',
    description:
      'If you want to get all facilities in your organization use this route. It takes no path or query params',
  })
  @ApiOperation({
    summary: 'Gets facility with realm ',
    description:
      'If you want to get specific facility in your organization use this route. It takes  query params which is  realm',
  })
  @Get('')
  @NoCache()
  @Unprotected()
  createConstraints() {
    return this.infraService.createConstraints();
  }

  @ApiOperation({
    summary: 'create facility infra nodes ',
    description: 'create facility infra nodes ',
  })
  @Post('')
  @Unprotected()
  createInfraNodes() {
    return this.infraService.create();
  }

  @Post('createRealmWithExcelFile')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        language: {
          type: 'string',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a single excel file with a language example you can insert "EN" for English',
  })
  @ApiConsumes('multipart/form-data')
  @Unprotected()
  importClassificationFromExcel(@UploadedFile() file: Express.Multer.File, @Body('language') language?: string) {
    return this.infraService.importClassificationFromExcel(file, language);
  }
}
