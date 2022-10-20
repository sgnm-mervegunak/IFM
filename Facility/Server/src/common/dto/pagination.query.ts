import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AscendingEnum, SearchType } from 'sgnm-neo4j/dist/constant/pagination.enum';

/**
 * Common Pagination DTO for all  APIs
 */
export class PaginationParams {
  /**
   * Page number
   */
  @ApiProperty({
    minimum: 0,
    maximum: 10000,
    title: 'Page',
    exclusiveMaximum: true,
    exclusiveMinimum: true,
    format: 'int32',
    default: 1,
  })
  page: number;

  /**
   * Skip number(how many items)
   */
  @ApiProperty({
    minimum: 0,
    maximum: 5000,
    title: 'Skip',
    exclusiveMaximum: true,
    exclusiveMinimum: true,
    format: 'int32',
    default: 0,
  })
  skip: number;

  /**
   * Limit number(how many items per page)
   */
  @ApiProperty({
    minimum: 0,
    maximum: 5000,
    title: 'Limit',
    exclusiveMaximum: true,
    exclusiveMinimum: true,
    format: 'int32',
    default: 200,
  })
  limit: number;

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
