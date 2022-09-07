import { PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import * as moment from 'moment';
import { CreateComponentDto } from './create.component.dto';

export class UpdateComponentDto extends PartialType(CreateComponentDto) {
  @IsOptional()
  updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
}
