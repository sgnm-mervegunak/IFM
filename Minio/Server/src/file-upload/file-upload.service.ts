import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MinioClientService } from 'src/minio-client/minio-client.service';
import { BufferedFile } from 'src/minio-client/file.model';

@Injectable()
export class FileUploadService {
  constructor(private minioClientService: MinioClientService) {}

  async uploadSingle(realmName: string,image: BufferedFile,folderName?: string) {
    try {
      let uploaded_image = await this.minioClientService.upload(realmName ,image,folderName);
      if(!uploaded_image.url){
        throw new HttpException("Error, Check the file type is jpeg or png or excel",HttpStatus.BAD_REQUEST)
      }
      return {
        name: image.originalname.split(".")[0],
        image_url: uploaded_image.url,
        message: 'Successfully uploaded to MinIO S3',
      };
    } catch (error) {
      throw new HttpException({message:error.message,statusCode:HttpStatus.BAD_REQUEST},HttpStatus.BAD_REQUEST)
    }
  }

  async uploadMany(realmName: string,files: BufferedFile,folderName?: string) {
    let file1 = files['file1'][0];
    let uploaded_file1 = await this.minioClientService.upload(realmName,file1,folderName);

    let file2 = files['file2'][0];
    let uploaded_file2 = await this.minioClientService.upload(realmName,file2,folderName);
    
    let file3 = files['file3'][0];
    let uploaded_file3 = await this.minioClientService.upload(realmName,file3,folderName);

    return {
      file1: uploaded_file1.url,
      file2: uploaded_file2.url,
      file3: uploaded_file3.url,
      message: 'Successfully uploaded multiple image on MinioS3',
    };
  }

  async deleteOne(fileName: string,realmName: string){
    let res=await this.minioClientService.delete(fileName,realmName);
    return res;
  }

  async getAllFiles(bucketName: string,prefix?:string){
    interface deneme{
      name:string;
      lastModified:string;
      etag:string;
      size:number;
    }
    if (prefix !=null) {let res=await this.minioClientService.getAllObjectsWithPrefix(bucketName,prefix);return res}
    let res= await this.minioClientService.getAllObjects(bucketName);
    
       // console.log(res[0].name);
    return res;
  }

  async getAFileByFileName(fileName:string,realmName:string){
    let res= await this.minioClientService.getAObject(fileName,realmName);
   return res;
  }

  async createBucket(bucketName:string){
    let res=await this.minioClientService.createBucket(bucketName);
    return res;
  }
}
