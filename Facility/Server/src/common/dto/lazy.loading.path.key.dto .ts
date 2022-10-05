import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, isNotEmpty } from 'class-validator';

export class LazyLoadingPathByKeyDto {
  @ApiProperty()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsNotEmpty()
  leafType: string;
}
