import {  IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AscendingEnum } from '../const/pagination.enum';



/**
 * Common Pagination DTO for all  APIs
 */
export class PaginationParams {
  /**
   * Page number
   */
  @ApiPropertyOptional()
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  skip:number=0 ;

  /**
   * Limit number(how many items per page)
   */
  @ApiPropertyOptional()
  @IsOptional()
  limit:number=3;

  /**
   * Order by(asc or desc)
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderBy: AscendingEnum;

  /**
   * Order by Column(for example: createdAt)
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderByColumn?: string = 'name';
}
