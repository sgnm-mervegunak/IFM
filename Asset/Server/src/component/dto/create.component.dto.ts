import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  i18nValidationMessageEnum,
  IsEnumWithI18nMessage,
  IsStringWithI18nMessage,
  LengthWithI18nMessage,
} from 'ifmcommon';
import { IsNotEmptyWithI18nMessage } from 'ifmcommon';
import * as moment from 'moment';
import { SpaceType } from 'src/common/const/space.type.enum';

export class CreateComponentDto {
  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  name: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  space: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  createdBy: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsEnumWithI18nMessage(SpaceType, i18nValidationMessageEnum.IS_ENUM)
  spaceType: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsUUID('4')
  parentKey: string;

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  description: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  serialNo: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  installationDate: string = moment().format('YYYY-MM-DD HH:mm:ss');

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  warrantyStartDate: string = moment().format('YYYY-MM-DD HH:mm:ss');

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  tagNumber: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 13)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  barCode: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 13)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  assetIdentifier: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  warrantyGuarantorParts: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsNumber()
  @Min(0)
  @Max(20)
  warrantyDurationParts: number;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  warrantyGuarantorLabor: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsNumber()
  @Min(0)
  @Max(20)
  warrantyDurationLabor: number;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  warrantyDurationUnit: string;

  @ApiProperty()
  @IsOptional()
  tag?: string[];
}
