import { SearchType } from "sgnm-neo4j/dist/constant/pagination.enum";
import { PaginationParams } from "../dto/pagination.query";


export interface ContactInterface<T> {
  update(id: string, data: T | any, realm: string, language: string): any;
  create(data: T | any, realm: string, language: string): any;
  findOneByRealm(realm: string, language: string, neo4jQuery): any;
  findOneByRealmTotalCount(realm: string, language: string, ): any;
  findWithSearchString(realm: string, language: string, neo4jQuery: PaginationParams, searchString: string): any;
  findWithSearchStringTotalCount(realm: string, language: string, searchString: string): any;
  findWithSearchStringByColumn(realm: string, language: string, neo4jQuery: PaginationParams, searchColumn:string, searchString: string,searchType:SearchType): any;
  findWithSearchStringByColumnTotalCount(realm: string, language: string,  searchColumn:string, searchString: string,searchType:SearchType): any;
  delete(id: string, realm: string, language: string): any;
  changeNodeBranch(id: string, target_parent_id: string, realm: string, language: string): any;
  findOneNodeByKey(key: string, realm: string, language: string): any;
  findOneFirstLevelByRealm(label: string, realm: string, language: string): any;
  findChildrenByFacilityTypeNode(language: string, realm: string, typename: string): any;
}
