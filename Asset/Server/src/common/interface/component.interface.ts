export interface ComponentInterface<T> {
  update(id: string, data: T | any, header): any;
  create(data: T | any, header): any;
  findRootByRealm(key: string, header): any;
  delete(id: string, header): any;
  findByKey(key: string, header): any;
  findChildrenOfRootByRealm(header): any;
}
