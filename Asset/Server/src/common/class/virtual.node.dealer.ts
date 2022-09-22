import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestKafkaService } from 'ifmcommon/dist';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { HttpRequestHandler } from './http.request.helper.class';
import * as moment from 'moment';
import { CreateKafka, CreateKafkaObject, UpdateKafka } from '../const/kafka.object.type';
import { RelationName } from '../const/relation.name.enum';
import { VirtualNode } from '../baseobject/virtual.node';
import { isNotEmpty } from 'class-validator';
import { Neo4jLabelEnum } from '../const/neo4j.label.enum';

@Injectable()
export class VirtualNodeHandler {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly kafkaService: NestKafkaService,
    private readonly configService: ConfigService,
  ) {}

  async createVirtualNode(id: number, parentUrl: string, virtualNodeObjectArray: CreateKafka[]) {
    try {
      const parentNode = await this.neo4jService.findByIdAndFilters(id, {});
      virtualNodeObjectArray.forEach(async (item) => {
        const virtualNode = new VirtualNode();
        const url = (await this.configService.get(item.url)) + '/' + item.referenceKey;
        virtualNode['url'] = url;
        virtualNode['referenceKey'] = item.referenceKey;

        const createdVirtualNode = await this.neo4jService.createNode(virtualNode, item.labels);

        await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
          id,
          {},
          createdVirtualNode.identity.low,
          {},
          item.relationNameForThisDatabase,
        );
        await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
          id,
          {},
          createdVirtualNode.identity.low,
          {},
          RelationName.HAS_VIRTUAL_RELATION,
        );
        const parentLabels = parentNode.labels;
        parentLabels.push(Neo4jLabelEnum.VIRTUAL);
        const itemKafkaObject: CreateKafkaObject = {
          parentKey: item.referenceKey,
          referenceKey: parentNode.properties.key,
          url: parentUrl,
          relationName: item.relationNameForTargetDatabase,
          virtualNodeLabels: parentLabels,
        };

        await this.kafkaService.producerSendMessage('createContactRelation', JSON.stringify(itemKafkaObject));
      });
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }

  async updateVirtualNode(id: number, parentUrl, props: UpdateKafka[]) {
    try {
      props.map(async (item) => {
        const virtualNode = await this.neo4jService.findChildrensByIdAndFilters(
          id,
          {},
          [],
          { isDeleted: false },
          item.relationNameForThisDatabase,
        );
        const virtualNodeLabels = virtualNode[0].get('parent').labels;
        virtualNodeLabels.push(Neo4jLabelEnum.VIRTUAL);
        if (virtualNode[0].get('children').properties.referenceKey !== item.newParentKey) {
          const url = this.configService.get(item.url) + '/' + item.newParentKey;

          const updatedByKafkaObject = {
            exParentKey: virtualNode[0].get('children').properties.referenceKey,
            newParentKey: item.newParentKey,
            referenceKey: virtualNode[0].get('parent').properties.key,
            url: parentUrl,
            relationName: item.relationNameForTargetDatabase,
            virtualNodeLabels,
          };
          await this.kafkaService.producerSendMessage('updateContactRelation', JSON.stringify(updatedByKafkaObject));
          const updatedVirtualNode = await this.neo4jService.updateByIdAndFilter(
            virtualNode[0].get('children').identity.low,
            {},
            [],
            {
              url,
              referenceKey: item.newParentKey,
              updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
            },
          );
        }
      });
    } catch (error) {
      console.log(error);
      const code = error.response?.code;
      if (code) {
        throw new HttpException(error.response, error.status);
      }
      throw new HttpException(error.response, error.status);
    }
  }
}
