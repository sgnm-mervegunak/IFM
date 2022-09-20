import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { SetupNode } from '../entities/setupnode.entity';

export class CreateOrganizationDto {


  @ApiProperty()
  @IsString()
  realm: string;
}
