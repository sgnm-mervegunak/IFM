import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { dynamicFilterPropertiesAdder, dynamicLabelAdder, dynamicNotLabelAdder, filterArrayForEmptyString, Neo4jService } from 'sgnm-neo4j/dist';
import { PaginationParams } from '../dto/pagination.query';
import { queryObjectType } from 'sgnm-neo4j/dist/dtos/dtos';

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
      console.log(childerenFilters)
      const children = await this.neo4jService.findChildrensByIdAndFiltersWithPaginationAndSearcString(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, neo4jQuery, searchString)
      console.log(childerenFilters)
      console.log(rootFilters)
      let totalCount = await this.neo4jService.findChildrensByIdAndFiltersWithoutPaginationAndSearcString(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, searchString)

      const finalResult = { totalCount: totalCount.length, children }
      console.log(finalResult)
      return finalResult
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  /*
  async findChildrensByIdAndFiltersWithPaginationAndSearcString(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    queryObject: queryObjectType,
    searchString: string,
    databaseOrTransaction?: string
  ) {
    try {

      const childrenLabelsWithoutEmptyString =
        children_labels
      const childrenExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_exculuded_labels);


      const rootNode = await this.neo4jService.findByIdAndFilters(root_id, root_filters);

      const rootId = rootNode.identity.low;
      const parameters = { rootId, ...children_filters, ...queryObject };

      parameters['searchString'] = searchString
      parameters.skip = this.neo4jService.int(+queryObject.skip) as unknown as number
      parameters.limit = this.neo4jService.int(+queryObject.limit) as unknown as number

      let cypher;
      let response;

      cypher =
        `MATCH p=(n)-[:${relation_name}*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId and ` +
        dynamicNotLabelAdder(
          "m",
          childrenExcludedLabelsLabelsWithoutEmptyString
        ) + `and (any(prop in keys(m) where m[prop] CONTAINS $searchString)) ` + `RETURN n as parent,m as children `;
      if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
        cypher = cypher + `ORDER BY m.` + `${queryObject.orderByColumn} ${queryObject.orderBy} SKIP $skip LIMIT $limit  `
      } else {
        cypher = cypher + `ORDER BY ${queryObject.orderBy} SKIP $skip LIMIT $limit `
      }

      response = await this.neo4jService.write(cypher, parameters, databaseOrTransaction);

      return response["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findChildrensByIdAndFiltersWithoutPaginationAndSearcString(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    search_string: string,
    databaseOrTransaction?: string
  ) {
    try {

      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels)
      const childrenExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_exculuded_labels);
      delete root_filters['id']
      delete children_filters['rootId']
      const rootNode = await this.neo4jService.findByIdAndFilters(root_id, root_filters);

      const rootId = rootNode.identity.low;

      const parameters = { rootId, ...children_filters };
      parameters['searchString'] = search_string
      let cypher;
      let response;


      cypher =
        `MATCH p=(n)-[:${relation_name}*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId and ` +
        dynamicNotLabelAdder(
          "m",
          childrenExcludedLabelsLabelsWithoutEmptyString
        ) + `and (any(prop in keys(m) where m[prop] CONTAINS $searchString)) ` + `RETURN n as parent,m as children `;

      response = await this.neo4jService.read(cypher, parameters, databaseOrTransaction);
      return response["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
*/
}


