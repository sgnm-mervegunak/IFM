import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  AssetNotFoundException,
  FacilityStructureNotFountException,
} from '../../common/notFoundExceptions/not.found.exception';

import { NestKafkaService, nodeHasChildException } from 'ifmcommon';
import { assignDtoPropToEntity, createDynamicCyperObject, CustomNeo4jError, Neo4jService } from 'sgnm-neo4j/dist';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { node_not_found, other_microservice_errors, wrong_parent_error } from 'src/common/const/custom.error.object';
import { CustomAssetError } from 'src/common/const/custom.error.enum';
import { NodeNotFound, WrongIdProvided } from 'src/common/bad.request.exception';
import * as moment from 'moment';
import { RelationName } from 'src/common/const/relation.name.enum';
import { VirtualNodeCreator } from 'src/common/class/virtual.node.creator';
import { HttpRequestHandler } from 'src/common/class/http.request.helper.class';
import { CreateKafkaObject } from 'src/common/const/kafka.object.type';
import { SystemsInterface } from 'src/common/interface/systems.interface';
import { System } from '../entities/systems.entity';
import { SystemsDto } from '../dto/systems.dto';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';

@Injectable()
export class SystemsRepository implements SystemsInterface<System> {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly kafkaService: NestKafkaService,
    private readonly httpService: HttpRequestHandler,
  ) { }
  async findByKey(key: string, header) {
    try {
      const nodes = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.SYSTEM], { key });
      if (!nodes.length) {
        throw new AssetNotFoundException(key);
      }
      return nodes[0]['_fields'][0];
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findRootByRealm(header) {
    try {
      const { realm } = header;
      const node = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        [Neo4jLabelEnum.SYSTEMS],
        {
          realm,
          isDeleted: false,
          isActive: true,
        },
        [Neo4jLabelEnum.SYSTEM],
        { isDeleted: false },
        'PARENT_OF',
      );
      if (!node.length) {
        throw new HttpException(node_not_found(), 400);
      }
      const systemArray = node.map(element => {
        element.get('children').properties['id'] = element.get('children').identity.low
        return element.get('children').properties
      })
      return systemArray;
    } catch (error) {
      const code = error.response?.code;

      if (code >= 1000 && code <= 1999) {
      } else if (code >= 5000 && code <= 5999) {
        if (error.response?.code == CustomNeo4jError.ADD_CHILDREN_RELATION_BY_ID_ERROR) {
        }
      } else if (code >= 9500 && code <= 9750) {
        if (error.response?.code == CustomAssetError.NODE_NOT_FOUND) {
          NodeNotFound();
        }
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  async create(systemsDto: SystemsDto, header) {
    try {
      const { realm, authorization } = header;
      const rootNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.SYSTEMS], {
        isDeleted: false,
        realm,
      });
      if (!rootNode.length) {
        throw new HttpException(wrong_parent_error(), 400);
      }

      const uniqnessCheck = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.TYPE], {
        name: systemsDto.name,
      });

      if (uniqnessCheck.length) {
        throw new HttpException('name must be uniq', 400);
      }

      //check if creator exist
      await this.httpService.get(`${process.env.CONTACT_URL}/${systemsDto.createdBy}`, {
        authorization,
      });

      const virtualNodeCreator = new VirtualNodeCreator(this.neo4jService);
      const system = new System();
      const systemObject = assignDtoPropToEntity(system, systemsDto);
      delete systemObject['createdBy'];
      delete systemObject['category'];
      const systemNode = await this.neo4jService.createNode(systemObject, [Neo4jLabelEnum.SYSTEM]);

      systemNode['properties']['id'] = systemNode['identity'].low;
      const result = { id: systemNode['identity'].low, labels: systemNode['labels'], properties: systemNode['properties'] };
      await this.neo4jService.addParentRelationByIdAndFilters(result['id'], {}, rootNode[0].get('n').identity.low, {});

      const systemUrl = `${process.env.SYSTEM_URL}/${systemNode.properties.key}`;
      
       //CREATED BY relation with CONTACT module / CREATED_OF relation from contact to system relation
      const createContactUrl = `${process.env.CONTACT_URL}/${systemsDto.createdBy}`;
      const virtualContactDto = { referenceKey: systemsDto.createdBy, url: createContactUrl };

      virtualNodeCreator.createVirtualNode(
        systemNode['identity'].low,
        [Neo4jLabelEnum.VIRTUAL, Neo4jLabelEnum.CONTACT],
        virtualContactDto,
        RelationName.CREATED_BY,
      );
      const createdByKafkaObject: CreateKafkaObject = {
        parentKey: systemsDto.createdBy,
        referenceKey: systemNode.properties.key,
        url: systemUrl,
        relationName: RelationName.CREATED_OF,
        virtualNodeLabels: [Neo4jLabelEnum.SYSTEM, Neo4jLabelEnum.VIRTUAL],
      };
      await this.kafkaService.producerSendMessage('createContactRelation', JSON.stringify(createdByKafkaObject));
      
      // CLASSIFIED_BY relation creation
      const languages = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        ['Language_Config'],
        { isDeleted: false, realm: realm },
        [],
        { isDeleted: false },
        'PARENT_OF',
      );
      let classificationRootNone =  'OmniClass21';;

      languages.map(async (record) => {
        let lang = record['_fields'][1].properties.name;

        let nodeClass = await this.neo4jService.findChildrensByLabelsAndFilters(
          [classificationRootNone + '_' + lang],
          { isDeleted: false, realm: realm },
          [],
          { language: lang, code: systemsDto['category'] },
        );
        if (nodeClass && nodeClass.length && nodeClass.length == 1) {
          await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
            systemNode['identity'].low,
            { isDeleted: false },
            nodeClass[0]['_fields'][1].identity.low,
            { isDeleted: false },
            RelationName.CLASSIFIED_BY,
            RelationDirection.RIGHT,
          );
        }
      });
      return result;
    } catch (error) {
      const code = error.response?.code;

      if (code >= 1000 && code <= 1999) {
      } else if (code >= 5000 && code <= 5999) {
        if (error.response?.code == CustomNeo4jError.ADD_CHILDREN_RELATION_BY_ID_ERROR) {
        }
      } else if (code >= 9500 && code <= 9750) {
        if (error.response?.code == CustomAssetError.WRONG_PARENT) {
          throw new WrongIdProvided();
        }
        if (error.response?.code == CustomAssetError.OTHER_MICROSERVICE_ERROR) {
          throw new HttpException(error.response.message, error.response.status);
        }
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async update(_id: string, systemsDto: SystemsDto, header) {
    const { realm, authorization } = header;

    const node = await this.neo4jService.findChildrensByChildIdAndFilters([Neo4jLabelEnum.SYSTEMS], { realm },
                                                +_id, { isDeleted: false, isActive: true }, RelationName.PARENT_OF)
    if (!node.length) {
      throw new HttpException(node_not_found(), 400);
    }
    const systemUrl = `${process.env.SYSTEM_URL}/${node[0].get('children').properties.key}`;
    if (systemsDto.createdBy) {
      await this.httpService.get(`${process.env.CONTACT_URL}/${systemsDto.createdBy}`, {
        authorization,
      })
    }
   
    const virtualNodeCreator = new VirtualNodeCreator(this.neo4jService);

    if (systemsDto.createdBy) {
      const virtualNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName([Neo4jLabelEnum.SYSTEM], 
                                            { key: node[0].get('children').properties.key }, [], { isDeleted: false }, RelationName.CREATED_BY)
      if (virtualNode[0].get('children').properties.referenceKey !== systemsDto.createdBy) {
        const createContactUrl = `${process.env.CONTACT_URL}/${systemsDto.createdBy}`;



        const createdByKafkaObject = {
          exParentKey: virtualNode[0].get('children').properties.referenceKey,
          newParentKey: systemsDto.createdBy,
          referenceKey: virtualNode[0].get('parent').properties.key,
          url: systemUrl,
          relationName: RelationName.CREATED_OF,
          virtualNodeLabels: [Neo4jLabelEnum.TYPE, Neo4jLabelEnum.VIRTUAL],
        };

        await this.kafkaService.producerSendMessage('updateContactRelation', JSON.stringify(createdByKafkaObject));
        await this.neo4jService.updateByIdAndFilter(virtualNode[0].get('children').identity.low, {}, [],
         { url: createContactUrl, referenceKey: systemsDto.createdBy, updatedOn: moment().format('YYYY-MM-DD HH:mm:ss') })

      }
    }

    const updatedNode = await this.neo4jService.updateByIdAndFilter(
      +_id,
      { isDeleted: false, isActive: true },
      [],
      systemsDto,
    );
    if (!updatedNode) {
      throw new FacilityStructureNotFountException(_id);
    }
    return updatedNode;
  }

  async delete(_id: string, header) {
    try {
      const node = await this.neo4jService.read(`match(n) where id(n)=$id return n`, { id: parseInt(_id) });
      if (!node.records[0]) {
        throw new HttpException({ code: 5005 }, 404);
      }
      await this.neo4jService.getParentById(_id);
      let deletedNode;

      const hasChildren = await this.neo4jService.findChildrenById(_id);

      if (hasChildren['records'].length == 0) {
        await this.kafkaService.producerSendMessage(
          'deleteAsset',
          JSON.stringify({ referenceKey: node.records[0]['_fields'][0].properties.key }),
        );
        deletedNode = await this.neo4jService.delete(_id);
        if (!deletedNode) {
          throw new AssetNotFoundException(_id);
        }
      }
      await this.kafkaService.producerSendMessage(
        'deleteAsset',
        JSON.stringify({ referenceKey: deletedNode.properties.key }),
      );
      return deletedNode;
    } catch (error) {
      const { code, message } = error.response;
      if (code === CustomNeo4jError.HAS_CHILDREN) {
        nodeHasChildException(_id);
      } else if (code === 5005) {
        AssetNotFoundException(_id);
      } else {
        throw new HttpException(message, code);
      }
    }
  }
}
