import { node_not_found } from "sgnm-neo4j/dist";

export enum CustomTreeError {
  HAS_CHILDREN = 9000,
  WRONG_PARENT = 9001,
  NODE_NOT_FOUND = 9002,
  NULL_VALUE = 9003
}
