import { PaginationParams } from "../commonDto/pagination.dto";

export interface SystemComponentInterface<T> {
  create(data: T | any, header): any;
  delete(_parent_id: string, _children_ids: string[], header): any;
  findOneByRealmTotalCount(systemId: string, realm: string, language: string):any; 
  findComponentsIncludedBySystem(key: string, header, params: PaginationParams): any;
}
