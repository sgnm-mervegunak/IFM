import { ApiProperty } from '@nestjs/swagger';
import { IsArray, isNotEmpty } from 'class-validator';

export class LazyLoadingPathDto {
  @ApiProperty()
  @IsArray()
  path: string[];
}
