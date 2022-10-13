import {  IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AscendingEnum } from '../const/pagination.enum';

 export class PaginationParams {
  /**
   * Page number
   */
  @ApiPropertyOptional()
  @IsOptional()
  page: number = 1;

  /**
   * Skip number(how many items)
   */
  skip:number=0 ;

  /**
   * Limit number(how many items per page)
   */
  @ApiPropertyOptional()
  @IsOptional()
  limit:number=200;

  /**
   * Order by(asc or desc)
   */
  @ApiPropertyOptional({enum:AscendingEnum})
  @IsOptional()
  @IsString()
  orderBy: AscendingEnum=AscendingEnum.ASCENDING;

  /**
   * Order by Column(for example: createdAt)
   */
  @ApiPropertyOptional()
  @IsOptional()
  orderByColumn?: string[]=["name"];
}