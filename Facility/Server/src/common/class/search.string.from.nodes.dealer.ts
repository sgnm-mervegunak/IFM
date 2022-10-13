import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Neo4jService } from 'sgnm-neo4j/dist';
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

  ) {
    try {
      const children = await this.neo4jService.findChildrensByIdAndFiltersWithPaginationAndSearcString(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, neo4jQuery, searchString)
      let totalCount = await this.neo4jService.findChildrensByIdAndFiltersWithoutPaginationAndSearcString(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, searchString)

      const finalResult = { totalCount: totalCount.length, children }
      console.log(finalResult)
      return finalResult
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

 

}


