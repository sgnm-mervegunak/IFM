import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { dynamicFilterPropertiesAdder, dynamicLabelAdder, dynamicNotLabelAdder, filterArrayForEmptyString, Neo4jService } from 'sgnm-neo4j/dist';
import { SearchType } from 'sgnm-neo4j/dist/constant/pagination.enum';
import { queryObjectType } from 'sgnm-neo4j/dist/dtos/dtos';
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
      const children = await this.findChildrensByIdAndFiltersWithPaginationAndSearcString(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, neo4jQuery, searchString,searchType)

      return children
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
      const children = await this.findChildrensByIdAndFiltersWithPaginationAndSearcStringBySpecificColumn(rootId, rootFilters, childrenLabels, childerenFilters, exclutedLabelsForChildren, relationName, neo4jQuery,searchColumn, searchString,searchType)
  
      return children
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
  async findChildrensByIdAndFiltersBySearcStringBySpecificColumnTotalCount(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    search_column: string,
    search_string: string,
    search_type:SearchType=SearchType.CONTAINS,
    databaseOrTransaction?: string
  ) {
    try {

      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels)
      const childrenExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_exculuded_labels);
      const rootNode = await this.neo4jService.findByIdAndFilters(root_id, root_filters);

      const rootId = rootNode.identity.low;

      const parameters = { rootId, ...children_filters };
      
      parameters['searchString'] = search_string
      let cypher;
      let response;

      const now = Date.now();

      cypher =
        `MATCH p=(n)-[:${relation_name}*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId and `
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher = cypher + dynamicNotLabelAdder(
          "m",
          childrenExcludedLabelsLabelsWithoutEmptyString
        ) + ` and toLower(m.${search_column}) ${search_type} toLower($searchString) ` + `RETURN count(m) as count `;
      } else {
        cypher = cypher + ` toLower(m.${search_column}) ${search_type} toLower($searchString) ` + `RETURN count(m) as count `;
      }
      const responseTime= `${Date.now() - now} ms`
      console.log(responseTime)
      response = await this.neo4jService.read(cypher, parameters, databaseOrTransaction);
      
    
      console.log(response)
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

  async findChildrensByIdAndFiltersWithPaginationAndSearcString(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    queryObject: queryObjectType,
    searchString: string,
    search_type:SearchType=SearchType.CONTAINS,
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
        `  WHERE  id(n) = $rootId and `
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher = cypher + dynamicNotLabelAdder(
          "m",
          childrenExcludedLabelsLabelsWithoutEmptyString
        ) + ` and (any(prop in keys(m) where m[prop] ${search_type}  toLower($searchString))) ` + `RETURN n as parent,m as children `;
      } else {
        cypher = cypher + `(any(prop in keys(m) where m[prop] ${search_type}  toLower($searchString))) ` + `RETURN n as parent,m as children `;
      }
    
        cypher = cypher + ` SKIP $skip LIMIT $limit `
      
      console.log(cypher)

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

  async findChildrensByIdAndFiltersWithPaginationAndSearcStringBySpecificColumn(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    queryObject: queryObjectType,
    searchColumn: string,
    searchString: string,
    search_type:SearchType=SearchType.CONTAINS,
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
        `  WHERE  id(n) = $rootId and `
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher = cypher + dynamicNotLabelAdder(
          "m",
          childrenExcludedLabelsLabelsWithoutEmptyString
        ) + ` and toLower(m.${queryObject.orderByColumn}) ${search_type}  toLower($searchString) ` + `RETURN n as parent,m as children `;
      } else {
        cypher = cypher + ` toLower(m.${searchColumn}) ${search_type}  toLower($searchString) ` + `RETURN n as parent,m as children `;
      }
     
        cypher = cypher + ` SKIP $skip LIMIT $limit `
     

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
}


