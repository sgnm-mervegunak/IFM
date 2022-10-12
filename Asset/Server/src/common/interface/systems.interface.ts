import { PaginationParams } from "../commonDto/pagination.dto";


export interface SystemsInterface<T> {
  update(id: string, data: T | any, header): any;
  create(data: T | any, header): any;
  findRootByRealm(header): any;
  delete(id: string, header): any;
  findByKey(key: string, header): any;
  findTypesIncludedBySystem(key: string, header, params: PaginationParams): any;
  findComponentsIncludedBySystem(key: string, header, params: PaginationParams): any;
}
