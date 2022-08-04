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
        image_url: uploaded_image.url,
        message: 'Successfully uploaded to MinIO S3',
      };
    } catch (error) {
      throw new HttpException({message:error.message,statusCode:HttpStatus.BAD_REQUEST},HttpStatus.BAD_REQUEST)
    }
  }

  // async uploadMany(files: BufferedFile,folderName?: string) {
  //   let image1 = files['image1'][0];
  //   let uploaded_image1 = await this.minioClientService.upload(image1,folderName);

  //   let image2 = files['image2'][0];
  //   let uploaded_image2 = await this.minioClientService.upload(image2,folderName);

  //   return {
  //     image1_url: uploaded_image1.url,
  //     image2_url: uploaded_image2.url,
  //     message: 'Successfully uploaded mutiple image on MinioS3',
  //   };
  // }

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
