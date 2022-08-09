import { RelationDirection } from "sgnm-neo4j/dist/constant/relation.direction.enum";

export interface FacilityInterface<T> {
  update(key: string, data: T | any): any;
  create(key: string, data: T | any): any;
  findOneNodeByKey(key: string): any;  
  delete(id: string): any;
  changeNodeBranch(id: string, target_parent_id: string): any;
  findOneFirstLevelByRealm(label: string, realm: string): any;
  findChildrenByFacilityTypeNode(language: string,realm: string, typename:string) : any; 

  findOneByRealm(label: string, realm: string): any;

  findStructureFirstLevelNodes(label: string, realm: string): any;
}
