import { OmitType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import * as moment from 'moment';
import { CreateTypesDto } from './create.types.dto';

export class UpdateTypesDto extends OmitType(CreateTypesDto, ['parentId']) {
  @IsOptional()
  updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
}
