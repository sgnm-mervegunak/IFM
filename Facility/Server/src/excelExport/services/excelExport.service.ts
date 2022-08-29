import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { ExcelExportInterface } from 'src/common/interface/excel.export.interface';
import { ExportExcelDto } from '../dto/excel.export.dto';


@Injectable()
export class ExcelExportService {
  constructor(
    @Inject(RepositoryEnums.EXCEL_EXPORT)
    private readonly excelExportRepository: ExcelExportInterface<any>,
  ) {}


  async getSpacesAnExcelFile( body:ExportExcelDto ){
    return await this.excelExportRepository.getSpacesAnExcelFile(body)
  }

  async getJointSpacesAnExcelFile(  body:ExportExcelDto ){
    return await this.excelExportRepository.getJointSpacesAnExcelFile(body);
  }

  async getZonesAnExcelFile(  body:ExportExcelDto ){
    return  await this.excelExportRepository.getZonesAnExcelFile(body);
  }
}
