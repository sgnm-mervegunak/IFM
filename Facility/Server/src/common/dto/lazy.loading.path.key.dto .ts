import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, isNotEmpty, IsOptional } from 'class-validator';

export class LazyLoadingPathByKeyDto {
  @ApiProperty()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsNotEmpty()
  label: string;

  @ApiProperty()
  @IsOptional()
  leafType: string = '';
}
