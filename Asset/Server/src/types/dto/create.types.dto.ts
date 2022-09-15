import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { i18nValidationMessageEnum, IsStringWithI18nMessage, LengthWithI18nMessage } from 'ifmcommon';
import { IsNotEmptyWithI18nMessage } from 'ifmcommon';

export class CreateTypesDto {
  @ApiProperty()
  @IsOptional()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  name: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  assetType: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  category: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  createdBy: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  manufacturer: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 50)
  modelNo: string;

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
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsNumber()
  replacementCost: number;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsNumber()
  expectedLife: number;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  durationUnit: string;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsNumber()
  nominalLength: number;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsNumber()
  nominalWidth: number;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @IsNumber()
  nominalHeight: number;

  @ApiProperty()
  @IsNotEmptyWithI18nMessage(i18nValidationMessageEnum.NOT_FOUND)
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  modelReference: string;

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  warranty?: string;

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  description?: string;

  @ApiProperty()
  @IsOptional()
  tag?: string[];

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  shape: string;

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  size: string;

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  color: string;

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  finish: string;

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  material: string;

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  constituents: string;

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  features: string;

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  accessibilityPerformance: string;

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  codePerformance: string;

  @ApiProperty()
  @IsOptional()
  @LengthWithI18nMessage(i18nValidationMessageEnum.LENGTH, 0, 256)
  sustainabilityPerformance: string;

  @ApiProperty()
  @IsOptional()
  documents: string;

  @ApiProperty()
  @IsOptional()
  images: string;
}
