export interface GeciciInterface<T> {
  update(id: string, data: T | any, realm:string, language:string): any;
  create(data: T | any, realm:string, language:string): any;
  findOneByRealm( realm: string, language: string): any;
  delete(id: string, realm:string, language:string): any;
  changeNodeBranch(id: string, target_parent_id: string, realm:string, language:string): any;
  findOneNodeByKey(key: string, realm:string, language:string): any;
  findOneFirstLevelByRealm(label: string, realm: string, language:string): any;
  findChildrenByFacilityTypeNode(language: string, realm: string, typename: string): any;
}
