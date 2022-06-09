import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject } from 'class-validator';

/**
 * Create User  History Dto
 */
export class CreateAssetHistoryDto {
  /**
   * User f
   */
  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  @Type(() => Object)
  user: object;

  /**
   * User from Incoming Request who (create,update,delete) this user
   */
  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  @Type(() => Object)
  asset: object;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  @Type(() => Object)
  requestInformation: object;
}
