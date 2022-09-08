import { Module } from '@nestjs/common';
import { ExcelImportExportService } from './services/excelImportExport.service';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { ExcelImportExportRepository } from './repositories/excelImportExport.repository';
import { ExcelImportExportController } from './controllers/excelImportExport.controller';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [HttpModule],
  controllers: [ExcelImportExportController],
  providers: [
    ExcelImportExportService,

    {
      provide: RepositoryEnums.EXCEL_IMPORT_EXPORT,
      useClass: ExcelImportExportRepository,
    },
  ],
})
export class ExcelImportExportModule {}
