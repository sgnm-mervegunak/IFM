import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import {
  ExcelImportExportInterface,
  HeaderInterface,
  MainHeaderInterface,
} from 'src/common/interface/excel.import.export.interface';


@Injectable()
export class ExcelImportExportService {
  constructor(
    @Inject(RepositoryEnums.EXCEL_IMPORT_EXPORT)
    private readonly excelImportExportRepository: ExcelImportExportInterface<any>,
  ) {}

 

  async addTypesWithCobie(file: Express.Multer.File,header:MainHeaderInterface){
    return await this.excelImportExportRepository.addTypesWithCobie(file, header);
  }
  async addComponentsWithCobie(file: Express.Multer.File,header:MainHeaderInterface){
    return await this.excelImportExportRepository.addComponentsWithCobie(file, header);
  }
  async addSystemWithCobie(file: Express.Multer.File,header:MainHeaderInterface){
    return await this.excelImportExportRepository.addSystemWithCobie(file, header);
  }
}
