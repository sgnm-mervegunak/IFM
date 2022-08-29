import { ApiProperty } from '@nestjs/swagger';

export class ExportExcelDto {

  @ApiProperty()
  buildingKeys: string[];

  @ApiProperty()
  realm: string;
}