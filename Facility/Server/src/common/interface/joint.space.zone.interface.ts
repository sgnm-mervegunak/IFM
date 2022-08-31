export interface JointSpaceAndZoneInterface<T> {
  update(id: string, data: T | any): any;
  create(data: T | any): any;
  findOneByRealm(key: string, realm: string): any;
  delete(id: string): any;
  findOneNodeByKey(key: string): any;
  findOneFirstLevelByRealm(label: string, realm: string): any;
}
