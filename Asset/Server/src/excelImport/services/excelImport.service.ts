import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import {
  ExcelImportInterface,
  MainHeaderInterface,
} from 'src/common/interface/excel.import.interface';


@Injectable()
export class ExcelImportService {
  constructor(
    @Inject(RepositoryEnums.EXCEL_IMPORT)
    private readonly excelImportRepository: ExcelImportInterface<any>,
  ) {}

 

  async addTypesWithCobie(file: Express.Multer.File,header:MainHeaderInterface){
    return await this.excelImportRepository.addTypesWithCobie(file, header);
  }
  async addComponentsWithCobie(file: Express.Multer.File,header:MainHeaderInterface){
    return await this.excelImportRepository.addComponentsWithCobie(file, header);
  }
  async addSystemWithCobie(file: Express.Multer.File,header:MainHeaderInterface){
    return await this.excelImportRepository.addSystemWithCobie(file, header);
  }
}
