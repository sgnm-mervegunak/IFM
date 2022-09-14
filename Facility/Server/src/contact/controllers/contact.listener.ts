import { HttpService } from '@nestjs/axios';
import { Controller, HttpException, Headers } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Unprotected } from 'nest-keycloak-connect';
import { catchError, firstValueFrom, map } from 'rxjs';
import { assignDtoPropToEntity, Neo4jService } from 'sgnm-neo4j/dist';
import { VirtualNode } from 'src/common/baseobject/virtual.node';
import { KafkaObject } from 'src/common/const/kafka.object.type';

@Controller('contactListener')
@Unprotected()
export class ContactListenerController {
  constructor(private readonly neo4jService: Neo4jService, private readonly httpService: HttpService) {}

  @EventPattern('createContactRelation')
  async createAssetListener(@Payload() message) {
    console.log(message);
    if (!message.value?.referenceKey || !message.value?.parentKey) {
      throw new HttpException('key is not available on kafka object', 400);
    }

    const virtualObject: KafkaObject = message.value;

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
  }

  @EventPattern('deleteStructure')
  async deleteAssetListener(@Payload() message, @Headers('realm') realm) {
    if (!message.value?.referenceKey) {
      throw new HttpException('key is not provided by service', 400);
    }
    // const component = await this.componentService.findOneNode(message.value?.key, realm);
    //check if asset exist
    const structurePromise = await this.httpService
      .get(`${process.env.STRUCTURE_URL}/${message.value?.referenceKey}`)
      .pipe(
        catchError(() => {
          throw new HttpException('connection refused due to connection lost or wrong data provided', 502);
        }),
      )
      .pipe(map((response) => response.data));

    const structure = await firstValueFrom(structurePromise);

    if (!structure) {
      return 'structure not found';
    }

    await this.neo4jService.write(`match (n:Virtual ) where n.referenceKey=$key set n.isDeleted=true return n`, {
      key: message.value.referenceKey,
    });
  }

  @EventPattern('deleteAssetFromStructure')
  async deleteAssetFromStructureListener(@Payload() message, @Headers('realm') realm) {
    if (!message.value?.referenceKey || !message.value?.key) {
      throw new HttpException('key is not available on kafka object', 400);
    }

    //const component = await this.componentService.findOneNode(message.value?.key, realm);

    //check if asset exist
    const structurePromise = await this.httpService
      .get(`${process.env.STRUCTURE_URL}/${message.value?.referenceKey}`)
      .pipe(
        catchError(() => {
          throw new HttpException('connection refused due to connection lost or wrong data provided', 502);
        }),
      )
      .pipe(map((response) => response.data));

    const relationExistanceBetweenVirtualNodeAndNodeByKey = await this.neo4jService.findNodeByKeysAndRelationName(
      message.value.key,
      message.value.referenceKey,
      'INSIDE_IN',
    );
    const virtualNodeId = relationExistanceBetweenVirtualNodeAndNodeByKey[0]['_fields'][1].identity.low;
    console.log(relationExistanceBetweenVirtualNodeAndNodeByKey[0]['_fields'][1].identity.low);

    await this.neo4jService.deleteVirtualNode(virtualNodeId);
  }
}
