import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestKafkaService } from 'ifmcommon/dist';
import { Neo4jService, assignDtoPropToEntity } from 'sgnm-neo4j/dist';
import { VirtualNode } from '../baseobject/virtual.node';
import { RelationName } from '../const/relation.name.enum';
import { HttpRequestHandler } from './http.request.helper.class';
import * as moment from 'moment';
import { UpdateKafka } from '../const/kafka.object.type';

@Injectable()
export class VirtualNodeHandler {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly httpService: HttpRequestHandler,
    private readonly kafkaService: NestKafkaService,
    private readonly configService: ConfigService,
  ) {}

  async createVirtualNode(id: number, virtualNodeLabels: string[], virtualNodeObject: object, relationName: string) {
    try {
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }

  async updateVirtualNode(id: number, typeUrl, props: UpdateKafka[], labels: string[], header) {
    try {
      props.map(async (item) => {
        const virtualNode = await this.neo4jService.findChildrensByIdAndFilters(
          id,
          {},
          [],
          { isDeleted: false },
          item.relationNameForThisDatabase,
        );
        if (virtualNode[0].get('children').properties.referenceKey !== item.newParentKey) {
          const url = this.configService.get(item.url) + '/' + item.newParentKey;

        //   const x = await this.httpService.get(url, header);
          const updatedByKafkaObject = {
            exParentKey: virtualNode[0].get('children').properties.referenceKey,
            newParentKey: item.newParentKey,
            referenceKey: virtualNode[0].get('parent').properties.key,
            url: typeUrl,
            relationName: item.relationNameForTargetDatabase,
            virtualNodeLabels: labels,
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
