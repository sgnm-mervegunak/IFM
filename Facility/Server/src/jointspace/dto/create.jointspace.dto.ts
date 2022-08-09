import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { i18nValidationMessageEnum, IsStringWithI18nMessage, LengthWithI18nMessage } from 'ifmcommon';
import { IsNotEmptyWithI18nMessage } from 'ifmcommon';
import * as moment from 'moment';

export class CreateJointSpaceDto {
  @ApiProperty()
  @IsOptional()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  ArchitecturalName: string;

  @ApiProperty()
  @IsOptional()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  ArchitecturalCode: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  name: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  code: string;

  @ApiProperty()
  @IsOptional()
  tag?: string[];

  @ApiProperty()
  @IsOptional()
  m2?: string;

  @ApiProperty()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  @IsOptional()
  spaceType: string;

  @ApiProperty()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  @IsOptional()
  status: string;

  @ApiProperty()
  @IsOptional()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  jointStartDate: string = moment().format('YYYY-MM-DD HH:mm:ss');

  @ApiProperty()
  @IsOptional()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  jointEndDate: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsArray()
  nodeKeys: [];
}
