import { Module } from '@nestjs/common';
import { ExcelImportService } from './services/excelImport.service';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { ExcelImportRepository } from './repositories/excelImport.repository';
import { ExcelImportController } from './controllers/excelImport.controller';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [HttpModule],
  controllers: [ExcelImportController],
  providers: [
    ExcelImportService,

    {
      provide: RepositoryEnums.EXCEL_IMPORT,
      useClass: ExcelImportRepository,
    },
  ],
})
export class ExcelImportModule {}
