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
      let totalCount = await this.searchByStringTotalCount(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, searchString,searchType)

      const finalResult = { totalCount, children }
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
      let totalCount = await this.neo4jService.findChildrensByIdAndFiltersAndSearcStringsTotalCount(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, searchString,searchType)
      totalCount=totalCount[0].get('count').low
    
      return totalCount
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
      let totalCount = await this.searchByStringBySpecificColumnTotalCount(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, searchColumn, searchString,searchType)
      
      const finalResult = { totalCount, children }
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
  
      let totalCount = await this.neo4jService.findChildrensByIdAndFiltersBySearcStringBySpecificColumnTotalCount(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, searchColumn, searchString,searchType)
      totalCount=totalCount[0].get('count').low
  
      return totalCount
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}


