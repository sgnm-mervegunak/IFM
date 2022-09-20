import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { i18nValidationMessageEnum, IsStringWithI18nMessage } from 'ifmcommon';

export class ChangeBranchDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsStringWithI18nMessage(i18nValidationMessageEnum.IS_STRING)
  targetParentId: string;
}
