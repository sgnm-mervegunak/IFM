import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CreateJointSpaceDto } from './create.jointspace.dto';
import * as moment from 'moment';

export class UpdateJointSpaceDto extends OmitType(CreateJointSpaceDto, ['code']) {
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
