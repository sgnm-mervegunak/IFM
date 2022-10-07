import { IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Common Pagination DTO for all  APIs
 */
export class PaginationParams {
  /**
   * Page number
   */
  @ApiPropertyOptional()
  @IsOptional()
  page?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  skip?: number = 0;

  /**
   * Limit number(how many items per page)
   */
  @ApiPropertyOptional()
  @IsOptional()
  limit?: number = 20;

  /**
   * Order by(asc or desc)
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderBy?: string;

  /**
   * Order by Column(for example: createdAt)
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderByColumn?: string;
}
