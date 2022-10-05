import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, isNotEmpty, IsOptional } from 'class-validator';

export class LazyLoadingPathDto {
  @ApiProperty()
  @IsArray()
  path: string[];

  @ApiProperty()
  @IsOptional()
  leafType: string = '';
}
