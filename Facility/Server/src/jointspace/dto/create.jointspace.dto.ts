import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { i18nValidationMessageEnum, IsStringWithI18nMessage, LengthWithI18nMessage } from 'ifmcommon';
import { IsNotEmptyWithI18nMessage } from 'ifmcommon';
import * as moment from 'moment';

export class CreateJointSpaceDto {
  @ApiProperty()
  @IsOptional()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  architecturalName: string;

  @ApiProperty()
  @IsOptional()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  architecturalCode: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  name: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  code: string;

  @ApiProperty()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsOptional()
  tag?: string[];

  @ApiProperty()
  @IsOptional()
  roomTag?: string[];

  @ApiProperty()
  @IsOptional()
  images?: string;

  @ApiProperty()
  @IsOptional()
  usableHeight?: number;

  @ApiProperty()
  @IsOptional()
  grossArea?: number;

  @ApiProperty()
  @IsOptional()
  netArea?: number;

  @ApiProperty()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  category: string;

  @ApiProperty()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  usage: string;

  @ApiProperty()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
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

  @ApiProperty()
  @IsOptional()
  operatorCode?: string;

  @ApiProperty()
  @IsOptional()
  operatorName?: string;
}

