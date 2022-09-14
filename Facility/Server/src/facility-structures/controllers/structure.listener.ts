import { HttpService } from '@nestjs/axios';
import { Controller, HttpException } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { catchError, firstValueFrom, map } from 'rxjs';
import { assignDtoPropToEntity, Neo4jService } from 'sgnm-neo4j/dist';
import { VirtualNode } from 'src/common/baseobject/virtual.node';
import { AssetNotFoundException } from 'src/common/notFoundExceptions/not.found.exception';

@Controller('structureListener')
export class StructureListenerController {
  constructor(private readonly neo4jService: Neo4jService, private readonly httpService: HttpService) {}
  @EventPattern('createStructureRelation')
  async createAssetListener(@Payload() message) {
    if (!message.value?.referenceKey || !message.value?.parentKey) {
      throw new HttpException('key is not available on kafka object', 400);
    }

    const virtualFacilityStructureObject = message.value;

    const { parentKey } = virtualFacilityStructureObject;

    let virtualNode = new VirtualNode();

    virtualNode = assignDtoPropToEntity(virtualNode, virtualFacilityStructureObject);

    const value = await this.neo4jService.createNode(virtualNode, ['Virtual', 'Structure']);

    await this.neo4jService.addRelationByLabelsAndFiltersAndRelationName(
      [],
      { key: parentKey },
      [],
      { key: value.properties.key },
      'INSIDE_IN',
    );

    await this.neo4jService.addRelationByLabelsAndFiltersAndRelationName(
      [],
      { key: parentKey },
      [],
      { key: value.properties.key },
      'HAS_VIRTUAL_RELATION',
    );
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
