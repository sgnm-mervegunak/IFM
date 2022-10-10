import {  IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AscendingEnum } from 'sgnm-neo4j/dist/constant/pagination.enum';


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

  /**
   * Skip number(how many items)
   */
  skip:number=0 ;

  /**
   * Limit number(how many items per page)
   */
  @ApiPropertyOptional()
  @IsOptional()
  limit:number=100;

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
  @IsString()
  orderByColumn?: string="name";
}
