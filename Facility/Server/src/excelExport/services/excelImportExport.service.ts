import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import {
  ExcelImportExportInterface,
  HeaderInterface,
  MainHeaderInterface,
} from 'src/common/interface/excel.import.export.interface';
import { ExportExcelDto } from '../dto/excel.export.dto';

@Injectable()
export class ExcelImportExportService {
  constructor(
    @Inject(RepositoryEnums.EXCEL_IMPORT_EXPORT)
    private readonly excelImportExportRepository: ExcelImportExportInterface<any>,
  ) {}

  async getSpacesAnExcelFile(body: ExportExcelDto, header: HeaderInterface) {
    return await this.excelImportExportRepository.getSpacesAnExcelFile(body, header);
  }

  async getJointSpacesAnExcelFile(body: ExportExcelDto, header: HeaderInterface) {
    return await this.excelImportExportRepository.getJointSpacesAnExcelFile(body, header);
  }

  async getZonesAnExcelFile(body: ExportExcelDto, header: HeaderInterface) {
    return await this.excelImportExportRepository.getZonesAnExcelFile(body, header);
  }

  async addBuildingwithCobie(file: Express.Multer.File, header: MainHeaderInterface) {
    return await this.excelImportExportRepository.addBuildingwithCobie(file, header);
  }
  async addFloorsToBuilding(file: Express.Multer.File, header: MainHeaderInterface, buildingKey: string) {
    return await this.excelImportExportRepository.addFloorsToBuilding(file, header, buildingKey);
  }
  async addSpacesToBuilding(file: Express.Multer.File, header: MainHeaderInterface, buildingKey: string) {
    return await this.excelImportExportRepository.addSpacesToBuilding(file, header, buildingKey);
  }
  async addZonesToBuilding(file: Express.Multer.File, header: MainHeaderInterface, buildingKey: string) {
    return await this.excelImportExportRepository.addZonesToBuilding(file, header, buildingKey);
  }
}
