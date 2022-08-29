import { Module } from '@nestjs/common';
import { ExcelExportService } from './services/excelExport.service';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { ExcelExportRepository } from './repositories/excelExport.repository';
import { ExcelExportController } from './controllers/excelExport.controller';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [HttpModule],
  controllers: [ExcelExportController],
  providers: [
    ExcelExportService,

    {
      provide: RepositoryEnums.EXCEL_EXPORT,
      useClass: ExcelExportRepository,
    },
  ],
})
export class ExcelExportModule {}
