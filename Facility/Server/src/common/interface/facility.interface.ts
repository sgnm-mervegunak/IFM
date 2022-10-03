import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';

export interface FacilityInterface<T> {
  update(key: string, data: T | any, realm: string, language: string): any;
  create(key: string, data: T | any, realm: string, language: string): any;
  findOneNodeByKey(key: string, realm: string, language: string): any;
  delete(id: string, realm: string, language: string): any;
  changeNodeBranch(id: string, target_parent_id: string, realm: string, language: string): any;
  findOneFirstLevelByRealm(label: string, realm: string, language: string): any;
  findChildrenByFacilityTypeNode(language: string, realm: string, typename: string): any;

  findOneByRealm(realm: string, language: string): any;

  findStructureFirstLevelNodes(key: string, leafType, realm: string, language: string): any;
  addPlanToFloor(key: string, realm: string, language: string): any;
}
