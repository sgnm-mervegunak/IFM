import { SearchType } from 'sgnm-neo4j/dist/constant/pagination.enum';
import { PaginationParams } from '../dto/pagination.query';

export interface ContactInterface<T> {
  update(id: string, data: T | any, header): any;
  create(data: T | any, header): any;
  findOneByRealm(header, neo4jQuery): any;
  findOneByRealmTotalCount(header): any;
  findWithSearchString(header, neo4jQuery: PaginationParams, searchString: string): any;
  findWithSearchStringWithSearchedStringTotalCount(
    header,
    neo4jQuery: PaginationParams,
    searchString: string,
    searchedStringTotalCount: number,
  ): any;
  findWithSearchStringTotalCount(header, searchString: string): any;
  findWithSearchStringByColumn(
    header,
    neo4jQuery: PaginationParams,
    searchColumn: string,
    searchString: string,
    searchType: SearchType,
  ): any;
  findWithSearchStringByColumnWithSearchedStringTotalCount(
    header,
    neo4jQuery: PaginationParams,
    searchColumn: string,
    searchString: string,
    searchType: SearchType,
    searchedStringTotalCount: number,
  ): any;
  findWithSearchStringByColumnTotalCount(
    header,
    searchColumn: string,
    searchString: string,
    searchType: SearchType,
  ): any;
  delete(id: string, header): any;
  findOneNodeByKey(key: string, header): any;
}
