export interface GeciciInterface<T> {
  update(id: string, data: T | any, realm: string): any;
  create(data: T | any, realm: string): any;
  findRootByRealm(realm: string): any;
  delete(id: string, realm: string): any;
  changeNodeBranch(id: string, target_parent_id: string): any;
  findByKey(key: string, realm: string): any;
}
