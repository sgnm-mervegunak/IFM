import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ExportExcelDto {
  @ApiProperty()
  @IsString({ each: true })
  buildingKeys: string[];
}
