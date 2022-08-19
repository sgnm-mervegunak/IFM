import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CreateZoneDto } from './create.zone.dto';
import * as moment from 'moment';

export class UpdateZoneDto extends OmitType(CreateZoneDto, ['code']) {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');

  @ApiProperty()
  @IsOptional()
  parentId: string;
}
