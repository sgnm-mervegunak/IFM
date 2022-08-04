import { RelationDirection } from "sgnm-neo4j/dist/constant/relation.direction.enum";

export interface GeciciInterface<T> {
  update(id: string, data: T | any): any;
  create(data: T | any): any;
  findOneByRealm(label: string, realm: string): any;
  delete(id: string): any;
  changeNodeBranch(id: string, target_parent_id: string): any;
  findOneNodeByKey(key: string): any;
  findOneFirstLevelByRealm(label: string, realm: string): any;
  findChildrenByFacilityTypeNode(first_node_label: string, first_node_realm: string, second_child_node_label: string,
    second_child_node_name: string, children_nodes_label: string,relationName: string, relationDirection: RelationDirection) : any; 
}
