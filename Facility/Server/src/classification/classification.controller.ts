import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles, Unprotected } from 'nest-keycloak-connect';
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
    const {language, realm} = header;
    return this.classificationService.create(createClassificationDto, realm, language);
  }
  
  // @Unprotected()
  // @Get(':label/')
  // @NoCache()
  // findOne(@Param('label') label: string, @Headers() header) {
  //   const {language, realm} = header;
  //   return this.classificationService.findOne(label, realm, language);
  // }
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClassificationDto: UpdateClassificationDto, @Headers() header) {
    const {language, realm} = header;
    return this.classificationService.update(id, updateClassificationDto, realm, language);
  }
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Delete(':id')
  remove(@Param('id') id: string, @Headers() header) {
    const {language, realm} = header;
    return this.classificationService.remove(id,realm, language);
  }
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Post('/relation/:id/:target_parent_id')
  changeNodeBranch(@Param('id') id: string, @Param('target_parent_id') target_parent_id: string, @Headers() header) {
    const {language, realm} = header;
    return this.classificationService.changeNodeBranch(id, target_parent_id, realm, language);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Get(':key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    const {language, realm} = header;
    return this.classificationService.findOneNode(key, realm,language);
  }


  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Patch("setIsActiveFalseOfClassificationAndItsChild/:id")
  async setIsActiveFalseOfClassificationAndItsChild(@Param('id') id:string, @Headers() header) {
    const {language, realm} = header;
    return this.classificationService.setIsActiveFalseOfClassificationAndItsChild(id, realm, language);

  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Patch("setIsActiveTrueOfClassificationAndItsChild/:id")
  async setIsActiveTrueOfClassificationAndItsChild(@Param('id') id:string, @Headers() header) {
    const {language, realm} = header;
    return this.classificationService.setIsActiveTrueOfClassificationAndItsChild(id, realm, language);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN, UserRoles.USER] })
  @NoCache()
  @Get("getClassificationByIsActiveStatus/active")
  @NoCache()
  async getClassificationByIsActiveStatus(@Headers() header){
    const {language, realm} = header;
    return this.classificationService.getClassificationByIsActiveStatus(realm,language);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  @Get('')
  @NoCache()
  async getClassificationsByLanguage(@Headers() header){
    const {language, realm} = header;
    return this.classificationService.getClassificationsByLanguage(realm, language);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  @Get('getAClassificationByRealmAndLabelNameAndLanguage/info/:labelName')
  @NoCache()
  async getAClassificationByRealmAndLabelNameAndLanguage(@Param('labelName') labelName:string,@Headers() header){
    const {language, realm} = header;
    return this.classificationService.getAClassificationByRealmAndLabelNameAndLanguage(realm,labelName, language);
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
  const {language, realm} = header;
  return this.classificationService.addAClassificationFromExcel(file, realm, language);
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
  const {language, realm} = header;
  return this.classificationService.addAClassificationWithCodeFromExcel(file, realm, language);
 }

 //@Unprotected()
 @Roles({ roles: [UserRoles.ADMIN] })
 @NoCache()
 @Get('getAClassificationNode/info/:classificationName/:code')
 async getNodeByClassificationLanguageRealmAndCode(@Param('classificationName') classificationName:string, @Param('code') code:string, @Headers() header){
  const {language, realm} = header;
  return this.classificationService.getNodeByClassificationLanguageRealmAndCode(classificationName, language,realm, code);

 }
  
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  @Get('getAClassificationNodeByCode/info/:code')
  async getNodeByLanguageRealmAndCode(@Param('code') code: string, @Headers() header) {
    const { language, realm } = header;
    return this.classificationService.getNodeByLanguageRealmAndCode(language, realm, code);

  }
  
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  @Post('checkExcelFile')
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
    summary: 'check a excel file',
  })
  @ApiConsumes('multipart/form-data')
  async checkExcelFile(@UploadedFile() file: Express.Multer.File) {
    return this.classificationService.checkExcelFile(file);

  }
  @Get('/structuretypes/all/list/get/by/:label')
  @Roles({ roles: [UserRoles.ADMIN] })
  //@Unprotected()
  @NoCache()
  findOneFirstLevel(@Param('label') label: string, @Headers() header) {
    const { language, realm } = header;
    return this.classificationService.findOneFirstLevel(label, realm, language);
  }
}
