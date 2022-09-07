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


  async getSpacesAnExcelFile( header ){
    return await this.excelExportRepository.getSpacesAnExcelFile(header)
  }

  async getJointSpacesAnExcelFile(  header ){
    return await this.excelExportRepository.getJointSpacesAnExcelFile(header);
  }

  async getZonesAnExcelFile(  header ){
    return  await this.excelExportRepository.getZonesAnExcelFile(header);
  }
}
