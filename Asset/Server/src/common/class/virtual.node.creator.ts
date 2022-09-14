import { HttpException } from '@nestjs/common';
import { Neo4jService, assignDtoPropToEntity } from 'sgnm-neo4j/dist';
import { VirtualNode } from '../baseobject/virtual.node';
import { RelationName } from '../const/relation.name.enum';

export class VirtualNodeCreator {
  constructor(private readonly neo4jService: Neo4jService) {}

  async createVirtualNode(id: number, virtualNodeLabels: string[], virtualNodeObject: object, relationName: string) {
    try {
      const virtualNode = new VirtualNode();
      virtualNodeObject = assignDtoPropToEntity(virtualNode, virtualNodeObject);

      const createdVirtualNode = await this.neo4jService.createNode(virtualNodeObject, virtualNodeLabels);

      await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
        id,
        {},
        createdVirtualNode.identity.low,
        {},
        relationName,
      );
      await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
        id,
        {},
        createdVirtualNode.identity.low,
        {},
        RelationName.HAS_VIRTUAL_RELATION,
      );
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }
}
