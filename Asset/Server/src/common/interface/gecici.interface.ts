export interface GeciciInterface<T> {
  update(id: string, data: T | any, header): any;
  create(data: T | any, header): any;
  findRootByRealm(header): any;
  delete(id: string, header): any;
  findByKey(key: string, rheader): any;
}
