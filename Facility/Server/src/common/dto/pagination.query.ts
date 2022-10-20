import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { AscendingEnum, SearchType } from 'sgnm-neo4j/dist/constant/pagination.enum';

/**
 * Common Pagination DTO for all  APIs
 */
export class PaginationParams {
  /**
   * Page number
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page = 1;

  /**
   * Skip number(how many items)
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  skip = 0;

  /**
   * Limit number(how many items per page)
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit = 200;

  /**
   * Order by(asc or desc)
   */
  @ApiPropertyOptional({ enum: AscendingEnum })
  @IsOptional()
  @IsString()
  orderBy: AscendingEnum = AscendingEnum.ASCENDING;

  /**
   * Order by Column(for example: createdAt)
   */
  @ApiPropertyOptional()
  @IsOptional()
  orderByColumn?: string[];
}

/**
 * Common Pagination DTO for all  APIs
 */
export class SearchParams {
  /**
   * Which column u wanna search
   */
  @ApiPropertyOptional()
  @IsString()
  searchColumn: string;

  /**
   * Which string u wanna search
   */
  @ApiPropertyOptional()
  @IsString()
  searchString: string;

  /**
   * Order by(asc or desc)
   */
  @ApiPropertyOptional({ enum: SearchType })
  @IsOptional()
  @IsString()
  searchType: SearchType = SearchType.CONTAINS;
}
