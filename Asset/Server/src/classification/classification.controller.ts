import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { PaginationNeo4jParams } from 'src/common/commonDto/pagination.neo4j.dto';
import { NoCache } from 'ifmcommon';
import { ClassificationService } from './classification.service';
import { CreateClassificationDto } from './dto/create-classification.dto';
import { UpdateClassificationDto } from './dto/update-classification.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRoles } from 'src/common/const/keycloak.role.enum';

@ApiTags('Classification')
@ApiBearerAuth('JWT-auth')
@Controller('classification')
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  @Post()
  @Roles({ roles: [UserRoles.ADMIN] })
  //@Unprotected()
  create(@Body() createClassificationDto: CreateClassificationDto, @Headers() header) {
    return this.classificationService.create(createClassificationDto, header);
  }

  @Roles({ roles: [UserRoles.ADMIN] })
  @Get(':key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    const {language, realm} = header;
    return this.classificationService.findOneNode(key, header);
  }

  @Roles({ roles: [UserRoles.ADMIN] })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClassificationDto: UpdateClassificationDto, @Headers() header) {

    return this.classificationService.update(id, updateClassificationDto,header);
  }
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Delete(':id')
  remove(@Param('id') id: string, @Headers() header) {
    return this.classificationService.remove(id,header);
  }
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Post('/relation/:id/:target_parent_id')
  changeNodeBranch(@Param('id') id: string, @Param('target_parent_id') target_parent_id: string, @Headers() header) {
  
    return this.classificationService.changeNodeBranch(id, target_parent_id, header);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Patch("setIsActiveFalseOfClassificationAndItsChild/:id")
  async setIsActiveFalseOfClassificationAndItsChild(@Param('id') id:string, @Headers() header) {

    return this.classificationService.setIsActiveFalseOfClassificationAndItsChild(id, header);

  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Patch("setIsActiveTrueOfClassificationAndItsChild/:id")
  async setIsActiveTrueOfClassificationAndItsChild(@Param('id') id:string, @Headers() header) {
    return this.classificationService.setIsActiveTrueOfClassificationAndItsChild(id, header);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN, UserRoles.USER] })
  @NoCache()
  @Get("getClassificationByIsActiveStatus/active")
  @NoCache()
  async getClassificationByIsActiveStatus(@Headers() header){
    return this.classificationService.getClassificationByIsActiveStatus(header);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  @Get('')
  @NoCache()
  async getClassificationsByLanguage(@Headers() header){
    return this.classificationService.getClassificationsByLanguage(header);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  @Get('getAClassificationByRealmAndLabelNameAndLanguage/info/:labelName')
  @NoCache()
  async getAClassificationByRealmAndLabelNameAndLanguage(@Param('labelName') labelName:string,@Headers() header){
    const {language, realm} = header;
    return this.classificationService.getAClassificationByRealmAndLabelNameAndLanguage(labelName,header);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Post('addAClassificationFromExcel')
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
 async addAClassificationFromExcel(@UploadedFile() file: Express.Multer.File, @Headers() header){
  return this.classificationService.addAClassificationFromExcel(file, header);
 }


 //@Unprotected()
 @Roles({ roles: [UserRoles.ADMIN] })
  @Post('addAClassificationWithCodeFromExcel')
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
 async addAClassificationWithCodeFromExcel(@UploadedFile() file: Express.Multer.File, @Headers() header){
  return this.classificationService.addAClassificationWithCodeFromExcel(file, header);
 }

 //@Unprotected()
 @Roles({ roles: [UserRoles.ADMIN] })
 @NoCache()
 @Get('getAClassificationNode/info/:classificationName/:code')
 async getNodeByClassificationLanguageRealmAndCode(@Param('classificationName') classificationName:string, @Param('code') code:string, @Headers() header){
  return this.classificationService.getNodeByClassificationLanguageRealmAndCode(classificationName, header, code);

 }
  
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  @Get('getAClassificationNodeByCode/info/:code')
  async getNodeByLanguageRealmAndCode(@Param('code') code: string, @Headers() header) {
    return this.classificationService.getNodeByLanguageRealmAndCode( code,header);

  }
  
}
