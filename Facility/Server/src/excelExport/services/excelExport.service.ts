import { Inject, Injectable } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { ExcelExportInterface, HeaderInterface } from 'src/common/interface/excel.export.interface';
import { ExportExcelDto } from '../dto/excel.export.dto';


@Injectable()
export class ExcelExportService {
  constructor(
    @Inject(RepositoryEnums.EXCEL_EXPORT)
    private readonly excelExportRepository: ExcelExportInterface<any>,
  ) {}


  async getSpacesAnExcelFile( body:ExportExcelDto,header:HeaderInterface ){
    return await this.excelExportRepository.getSpacesAnExcelFile(body,header)
  }

  async getJointSpacesAnExcelFile(  body:ExportExcelDto,header:HeaderInterface ){
    return await this.excelExportRepository.getJointSpacesAnExcelFile(body,header);
  }

  async getZonesAnExcelFile(  body:ExportExcelDto,header:HeaderInterface ){
    return  await this.excelExportRepository.getZonesAnExcelFile(body,header);
  }
}
