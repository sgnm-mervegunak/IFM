import { PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import * as moment from 'moment';
import { CreateTypesDto } from './create.types.dto';

export class UpdateTypesDto extends PartialType(CreateTypesDto) {
  @IsOptional()
  updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
}
