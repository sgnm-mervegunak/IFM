import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ClassificationPathDto {
  @ApiProperty()
  @IsString({ each: true })
  // @IsOptional()
  path: string[];
}
