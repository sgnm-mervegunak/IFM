import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { PaginationNeo4jParams } from 'src/common/commonDto/pagination.neo4j.dto';
import { NoCache } from 'ifmcommon';
import { ClassificationService } from './classification.service';
import { CreateClassificationDto } from './dto/create-classification.dto';
import { UpdateClassificationDto } from './dto/update-classification.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Classification')
@ApiBearerAuth('JWT-auth')
@Controller('classification')
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  @Post()
  //@Roles({ roles: [FacilityUserRoles.ADMIN] })
  @Unprotected()
  create(@Body() createClassificationDto: CreateClassificationDto) {
    return this.classificationService.create(createClassificationDto);
  }
  
  @Unprotected()
  @Get(':label/:realm')
  @NoCache()
  findOne(@Param('label') label: string, @Param('realm') realm: string) {
    
    return this.classificationService.findOne(label, realm);
  }
  @Unprotected()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClassificationDto: UpdateClassificationDto) {
    return this.classificationService.update(id, updateClassificationDto);
  }
  @Unprotected()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classificationService.remove(id);
  }
  @Unprotected()
  @Post('/relation/:id/:target_parent_id')
  changeNodeBranch(@Param('id') id: string, @Param('target_parent_id') target_parent_id: string) {
    return this.classificationService.changeNodeBranch(id, target_parent_id);
  }

  @Unprotected()
  @Get(':key')
  @NoCache()
  findOneNode(@Param('key') key: string) {
    return this.classificationService.findOneNode(key);
  }


  @Unprotected()
  @Patch("setIsActiveFalseOfClassificationAndItsChild/:id")
  async setIsActiveFalseOfClassificationAndItsChild(@Param('id') id:string) {
    return this.classificationService.setIsActiveFalseOfClassificationAndItsChild(id);

  }

  @Unprotected()
  @Patch("setIsActiveTrueOfClassificationAndItsChild/:id")
  async setIsActiveTrueOfClassificationAndItsChild(@Param('id') id:string) {
    return this.classificationService.setIsActiveTrueOfClassificationAndItsChild(id);
  }

  @Unprotected()
  @Get("getClassificationByIsActiveStatus/:realm/:language")
  async getClassificationByIsActiveStatus(@Param('realm') realm:string,@Param('language') language:string){
    return this.classificationService.getClassificationByIsActiveStatus(realm,language);
  }

  @Unprotected()
  @Get('getClassificationsByLanguage/:realm/:language')
  async getClassificationsByLanguage(@Param('realm') realm:string,@Param('language') language:string){
    return this.classificationService.getClassificationsByLanguage(realm, language);
  }

  @Unprotected()
  @Get('getAClassificationByRealmAndLabelNameAndLanguage/:realm/:labelName/:language')
  async getAClassificationByRealmAndLabelNameAndLanguage(@Param('realm') realm:string,@Param('labelName') labelName:string,@Param('language') language:string){
    return this.classificationService.getAClassificationByRealmAndLabelNameAndLanguage(realm,labelName, language);
  }

  @Unprotected()
  @Post('addAClassificationFromExcel/:realm/:language')
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
 async addAClassificationFromExcel(@UploadedFile() file: Express.Multer.File, @Param('realm') realm: string, @Param('language') language: string){
  return this.classificationService.addAClassificationFromExcel(file, realm, language);
 }


 @Unprotected()
  @Post('addAClassificationWithCodeFromExcel/:realm/:language')
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
 async addAClassificationWithCodeFromExcel(@UploadedFile() file: Express.Multer.File, @Param('realm') realm: string, @Param('language') language: string){
  return this.classificationService.addAClassificationWithCodeFromExcel(file, realm, language);
 }
}
