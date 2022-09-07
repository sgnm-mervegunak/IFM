export interface JointSpaceAndZoneInterface<T> {
  update(id: string, data: T | any, realm:string, language:string): any;
  create(data: T | any, realm:string, language:string): any;
  findOneByRealm(key: string, realm: string, language: string): any;
  delete(id: string, realm:string, language:string): any;
  findOneNodeByKey(key: string, realm:string, language:string): any;
  findOneFirstLevelByRealm(label: string, realm: string, language:string): any;
}
