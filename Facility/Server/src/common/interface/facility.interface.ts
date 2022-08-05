import { RelationDirection } from "sgnm-neo4j/dist/constant/relation.direction.enum";

export interface FacilityInterface<T> {
  update(id: string, data: T | any): any;
  create(id: string,data: T | any): any;
  findOneByRealm(label: string, realm: string): any;
  delete(id: string): any;
  changeNodeBranch(id: string, target_parent_id: string): any;
  findOneNodeByKey(key: string): any;
  findOneFirstLevelByRealm(label: string, realm: string): any;
  findChildrenByFacilityTypeNode(language: string,realm: string, typename:string) : any; 
}
