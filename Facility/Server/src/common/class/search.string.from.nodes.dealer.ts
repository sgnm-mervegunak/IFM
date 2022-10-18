import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { SearchType } from 'sgnm-neo4j/dist/constant/pagination.enum';
import { PaginationParams } from '../dto/pagination.query';


@Injectable()
export class SearchStringRepository {
  constructor(private readonly neo4jService: Neo4jService) { }
  async searchByString(
    rootId: number,
    rootFilters: object = {},
    childrenLabels: string[] = [''],
    childerenFilters: object = {},
    exclutedLabelsForChildren: string[] = [''],
    relationName: string,
    neo4jQuery: PaginationParams,
    searchString: string = '',
    searchType:SearchType=SearchType.CONTAINS

  ) {
    try {
      const children = await this.neo4jService.findChildrensByIdAndFiltersWithPaginationAndSearcString(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, neo4jQuery, searchString,searchType)
      let totalCount = await this.neo4jService.findChildrensByIdAndFiltersWithoutPaginationAndSearcString(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, searchString,searchType)

      const finalResult = { totalCount: totalCount.length, children }
      console.log(finalResult)
      return finalResult
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async searchByStringTotalCount(
    rootId: number,
    rootFilters: object = {},
    childrenLabels: string[] = [''],
    childerenFilters: object = {},
    exclutedLabelsForChildren: string[] = [''],
    relationName: string,
    searchString: string = '',
    searchType:SearchType=SearchType.CONTAINS

  ) {
    try {
      let totalCount = await this.neo4jService.findChildrensByIdAndFiltersWithoutPaginationAndSearcString(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, searchString,searchType)

      const finalResult = { totalCount: totalCount.length }
      return finalResult
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async searchByStringBySpecificColumn(
    rootId: number,
    rootFilters: object = {},
    childrenLabels: string[] = [''],
    childerenFilters: object = {},
    exclutedLabelsForChildren: string[] = [''],
    relationName: string,
    neo4jQuery: PaginationParams,
    searchColumn: string = '',
    searchString: string = '',
    searchType:SearchType=SearchType.CONTAINS
  ) {
    try {
      const children = await this.neo4jService.findChildrensByIdAndFiltersWithPaginationAndSearcStringBySpecificColumn(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, neo4jQuery, searchColumn, searchString,searchType)
      let totalCount = await this.neo4jService.findChildrensByIdAndFiltersWithoutPaginationAndSearcStringBySpecificColumn(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, searchColumn, searchString,searchType)
      
      const finalResult = { totalCount: totalCount.length, children }
      console.log(finalResult)
      return finalResult
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async searchByStringBySpecificColumnTotalCount(
    rootId: number,
    rootFilters: object = {},
    childrenLabels: string[] = [''],
    childerenFilters: object = {},
    exclutedLabelsForChildren: string[] = [''],
    relationName: string,
    searchColumn: string = '',
    searchString: string = '',
    searchType:SearchType=SearchType.CONTAINS
  ) {
    try {
  
      let totalCount = await this.neo4jService.findChildrensByIdAndFiltersWithoutPaginationAndSearcStringBySpecificColumn(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, searchColumn, searchString,searchType)
      
      const finalResult = { totalCount: totalCount.length }
      console.log(finalResult)
      return finalResult
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}


