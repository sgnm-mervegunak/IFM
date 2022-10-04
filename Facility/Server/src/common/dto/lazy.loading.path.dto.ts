import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, isNotEmpty } from 'class-validator';

export class LazyLoadingPathDto {
  @ApiProperty()
  @IsArray()
  path: string[];

  @ApiProperty()
  @IsNotEmpty()
  leafType: string;
}
