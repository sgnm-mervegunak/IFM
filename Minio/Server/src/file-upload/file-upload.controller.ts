import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles, Delete, Body, Get, Param } from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import {  ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileUploadService } from './file-upload.service';
import { BufferedFile } from 'src/minio-client/file.model';
import { PostKafka, KafkaService } from 'ifmcommon/dist';
import { kafkaConf } from 'src/common/const/kafka.conf';


@ApiTags('FileUploadController')
@Controller('file-upload')
export class FileUploadController {
  /**
   * create variable for postKafka Service
   */
  postKafka: PostKafka;

  constructor(private fileUploadService: FileUploadService) {
    this.postKafka = new PostKafka(new KafkaService(kafkaConf));
  }



  @Post('single')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        realmName:{type:'string',description:'realmName'},
        file: {
          type: 'string',
          format: 'binary',
        },
        folderName:{ type: 'string'}
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a single file or file'
  })
  @ApiConsumes('multipart/form-data')
  async uploadSingle(@Body("realmName") realmName:string,@UploadedFile() file: BufferedFile,@Body("folderName") folderName?:string) {
    

    return await this.fileUploadService.uploadSingle(realmName,file,folderName);
  }



  // @Post('many')
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       file1: {
  //         type: 'string',
  //         format: 'binary',
  //       },
  //       file2:{
  //         type: 'string',
  //         format: 'binary',
  //       },
  //       folderName:{ type: 'string'}
  //     },
  //   },
  // })
  // @UseInterceptors(
  //   FileFieldsInterceptor([
  //     { name: 'file1', maxCount: 1 },
  //     { name: 'file2', maxCount: 1 },
  //   ]),
  // )
  // @ApiConsumes('multipart/form-data')
  // @ApiOperation({
  //   summary: 'Upload multiple file or image'
  // })
  // async uploadMany(@UploadedFiles() files: BufferedFile,@Body("folderName") folderName: string) {
  //   return this.fileUploadService.uploadMany(files,folderName);
  // }


  @Delete('removeOne')
  @ApiOperation({
    summary: 'Delete a file or image'
  })
  @ApiBody({
    schema: {
      properties: {
        fileName: {
          type: 'string'
        },
        realmName: {
          type: 'string'
        }
      },
    },
  })
  async remove(@Body("fileName") fileName: string,@Body("realmName") realmName: string) {
    return this.fileUploadService.deleteOne(fileName,realmName);
  }


  @Get('getAllFiles/:realmName')
  @ApiOperation({
    summary: 'Get all files'
  })
  async getAll(@Param('realmName') realmName: string) {
    return this.fileUploadService.getAllFiles(realmName);
  }

  @Get('getAllFilesWithPrefix/:realmName/:prefix')
  @ApiOperation({
    summary: 'Get all files with prefix'
  })
  async getAllWithPrefix(@Param('realmName') realmName: string,@Param("prefix") prefix: string) {
    return this.fileUploadService.getAllFiles(realmName,prefix);
  }

  @Get('getAFile/:realmName/:fileName')
  @ApiOperation({
    summary: 'Get a file'
  })
  async findbyFileName(@Param("fileName") fileName: string,@Param("realmName") realmName: string) {
    return this.fileUploadService.getAFileByFileName(fileName,realmName);
  }


  @Post("createBucket/:realmName")
  @ApiOperation({
    summary: 'Enter a realmName name'
  })
  async createBucket(@Param("realmName") realmName: string) {
    realmName.toLowerCase()
    return this.fileUploadService.createBucket(realmName);
  }
}
