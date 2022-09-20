import { HttpService } from '@nestjs/axios';
import { Controller, HttpException } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { catchError, firstValueFrom, map } from 'rxjs';
import { assignDtoPropToEntity, Neo4jService } from 'sgnm-neo4j/dist';
import { VirtualNode } from 'src/common/baseobject/virtual.node';
import { CreateKafkaObject } from 'src/common/const/kafka.object.type';
import { AssetNotFoundException } from 'src/common/notFoundExceptions/not.found.exception';

@Controller('structureListener')
export class StructureListenerController {
  constructor(private readonly neo4jService: Neo4jService, private readonly httpService: HttpService) {}
  @EventPattern('createStructureRelation')
  async createAssetListener(@Payload() message) {
    try {
      if (!message.value?.referenceKey || !message.value?.parentKey) {
        throw new HttpException('key is not available on kafka object', 400);
      }

      const parentNode = await this.neo4jService.findByLabelAndFilters([], { key: message.value.parentKey });

      if (parentNode.length === 0) {
        throw new HttpException('node_not_found()', 400);
      }
      const virtualObject: CreateKafkaObject = message.value;

      const { parentKey } = virtualObject;

      let virtualNodeObject = new VirtualNode();

      virtualNodeObject = assignDtoPropToEntity(virtualNodeObject, virtualObject);
      delete virtualNodeObject['relationName'];
      delete virtualNodeObject['virtualNodeLabel'];

      const value = await this.neo4jService.createNode(virtualNodeObject, virtualObject.virtualNodeLabels);

      await this.neo4jService.addRelationWithRelationNameByKey(
        parentKey,
        value.properties.key,
        virtualObject.relationName,
      );

      await this.neo4jService.addRelationWithRelationNameByKey(parentKey, value.properties.key, 'HAS_VIRTUAL_RELATION');
    } catch (error) {
      throw new HttpException(error, 400);
    }
  }

  @EventPattern('deleteAsset')
  async deleteAssetListener(@Payload() message) {
    if (!message.value?.referenceKey) {
      throw new HttpException('key is not provided by service', 400);
    }

    //check if asset exist
    const assetPromise = await this.httpService
      .get(`${process.env.ASSET_URL}/${message.value?.referenceKey}`)
      .pipe(
        catchError(() => {
          throw new HttpException('connection refused due to connection lost or wrong data provided', 502);
        }),
      )
      .pipe(map((response) => response.data));

    const asset = await firstValueFrom(assetPromise);

    if (!asset) {
      throw new AssetNotFoundException(message.value?.referenceKey);
    }

    await this.neo4jService.write(`match (n:Virtual ) where n.referenceKey=$key set n.isDeleted=true return n`, {
      key: message.value.referenceKey,
    });
  }
}
