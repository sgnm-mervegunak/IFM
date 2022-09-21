import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  AssetNotFoundException,
  FacilityStructureNotFountException,
} from '../../common/notFoundExceptions/not.found.exception';
import { Type } from '../entities/types.entity';
import { NestKafkaService, nodeHasChildException } from 'ifmcommon';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { assignDtoPropToEntity, CustomNeo4jError, Neo4jService } from 'sgnm-neo4j/dist';
import { CreateTypesDto } from '../dto/create.types.dto';
import { UpdateTypesDto } from '../dto/update.tpes.dto';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { node_not_found, wrong_parent_error } from 'src/common/const/custom.error.object';
import { CustomAssetError } from 'src/common/const/custom.error.enum';
import { NodeNotFound, WrongIdProvided } from 'src/common/bad.request.exception';
import * as moment from 'moment';
import { RelationName } from 'src/common/const/relation.name.enum';
import { VirtualNodeCreator } from 'src/common/class/virtual.node.creator';
import { HttpRequestHandler } from 'src/common/class/http.request.helper.class';
import { CreateKafkaObject } from 'src/common/const/kafka.object.type';

@Injectable()
export class TypesRepository implements GeciciInterface<Type> {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly kafkaService: NestKafkaService,
    private readonly httpService: HttpRequestHandler,
  ) {}
  async findByKey(key: string, header) {
    try {
      const nodes = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.TYPE], { key });
      if (!nodes.length) {
        throw new AssetNotFoundException(key);
      }

      const createtByNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.TYPE],
        { key: nodes[0].get('n').properties.key },
        [],
        { isDeleted: false },
        RelationName.CREATED_BY,
      );
      nodes[0].get('n').properties['createdBy'] = createtByNode[0].get('children').properties.referenceKey;

      const manufacturedByNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.TYPE],
        { key: nodes[0].get('n').properties.key },
        [],
        { isDeleted: false },
        RelationName.MANUFACTURED_BY,
      );
      nodes[0].get('n').properties['manufacturer'] = manufacturedByNode[0].get('children').properties.referenceKey;
      const warrantyGuaranorLaborNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.TYPE],
        { key: nodes[0].get('n').properties.key },
        [],
        { isDeleted: false },
        RelationName.WARRANTY_GUARANTOR_LABOR,
      );
      nodes[0].get('n').properties['warrantyGuarantorLabor'] =
        warrantyGuaranorLaborNode[0].get('children').properties.referenceKey;
      const warrantyGuaranorPartsNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.TYPE],
        { key: nodes[0].get('n').properties.key },
        [],
        { isDeleted: false },
        RelationName.WARRANTY_GUARANTOR_PARTS,
      );
      nodes[0].get('n').properties['warrantyGuarantorParts'] =
        warrantyGuaranorPartsNode[0].get('children').properties.referenceKey;

      return nodes[0]['_fields'][0];
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findRootByRealm(header) {
    try {
      let { realm } = header;
      realm = 'IFM'
      let node = await this.neo4jService.findChildrensByLabelsAsTree(
        [Neo4jLabelEnum.TYPES],
        {
          realm,
          isDeleted: false,
          isActive: true,
        },
        [Neo4jLabelEnum.TYPE],
        { isDeleted: false }
      )
      // const node = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
      //   [Neo4jLabelEnum.TYPES],
      //   {
      //     realm,
      //     isDeleted: false,
      //     isActive: true,
      //   },
      //   [Neo4jLabelEnum.TYPE],
      //   { isDeleted: false },
      //   'PARENT_OF',
      // );
      if (!node) {
        throw new HttpException(node_not_found(), 400);
      }
      // const typeArray = node.map((element) => {
      //   element.get('children').properties['id'] = element.get('children').identity.low;
      //   return element.get('children').properties;
      // });
      // return typeArray;
      node = {"root":node};
      node = await this.neo4jService.changeObjectChildOfPropToChildren(node);
      return node;
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
  async create(createTypesDto: CreateTypesDto, header) {
    try {
      const { realm, authorization } = header;
      const rootNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.TYPES], {
        isDeleted: false,
        realm,
      });
      if (!rootNode.length) {
        throw new HttpException(wrong_parent_error(), 400);
      }

      //check if manufacturer exist
      const manufacturer = await this.httpService.get(`${process.env.CONTACT_URL}/${createTypesDto.manufacturer}`, {
        authorization,
      });

      if (!createTypesDto.name || createTypesDto.name.trim() === '') {
        createTypesDto['name'] = manufacturer.properties.company + ' ' + createTypesDto.modelNo;
      }

      const uniqnessCheck = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.TYPE], {
        name: createTypesDto.name,
      });

      if (uniqnessCheck.length) {
        throw new HttpException('name musb be uniq', 400);
      }

      //check if creater exist exist
      await this.httpService.get(`${process.env.CONTACT_URL}/${createTypesDto.createdBy}`, {
        authorization,
      });

      //check if warrantyGuarantorParts exist exist
      await this.httpService.get(`${process.env.CONTACT_URL}/${createTypesDto.warrantyGuarantorParts}`, {
        authorization,
      });

      //check if warrantyGuarantorLabor exist exist
      await this.httpService.get(`${process.env.CONTACT_URL}/${createTypesDto.warrantyGuarantorLabor}`, {
        authorization,
      });
      const virtualNodeCreator = new VirtualNodeCreator(this.neo4jService);
      const type = new Type();
      const typeObject = assignDtoPropToEntity(type, createTypesDto);
      delete typeObject['manufacturer'];
      delete typeObject['createdBy'];
      delete typeObject['warrantyGuarantorParts'];
      delete typeObject['warrantyGuarantorLabor'];
      const typeNode = await this.neo4jService.createNode(typeObject, [Neo4jLabelEnum.TYPE]);

      typeNode['properties']['id'] = typeNode['identity'].low;
      const result = { id: typeNode['identity'].low, labels: typeNode['labels'], properties: typeNode['properties'] };
      await this.neo4jService.addParentRelationByIdAndFilters(result['id'], {}, rootNode[0].get('n').identity.low, {});

      const typeUrl = `${process.env.TYPE_URL}/${typeNode.properties.key}`;

      const manufacturerContactUrl = `${process.env.CONTACT_URL}/${createTypesDto.manufacturer}`;
      const virtualManufacturerNodeDto = { referenceKey: createTypesDto.manufacturer, url: manufacturerContactUrl };

      virtualNodeCreator.createVirtualNode(
        typeNode['identity'].low,
        [Neo4jLabelEnum.VIRTUAL, Neo4jLabelEnum.CONTACT],
        virtualManufacturerNodeDto,
        RelationName.MANUFACTURED_BY,
      );
      const manufacturerKafkaObject: CreateKafkaObject = {
        parentKey: createTypesDto.manufacturer,
        referenceKey: typeNode.properties.key,
        url: typeUrl,
        relationName: RelationName.MANUFACTURED_BY,
        virtualNodeLabels: [Neo4jLabelEnum.TYPE, Neo4jLabelEnum.VIRTUAL],
      };

      await this.kafkaService.producerSendMessage('createContactRelation', JSON.stringify(manufacturerKafkaObject));

      const createContactUrl = `${process.env.CONTACT_URL}/${createTypesDto.createdBy}`;
      const virtualContactDto = { referenceKey: createTypesDto.createdBy, url: createContactUrl };

      virtualNodeCreator.createVirtualNode(
        typeNode['identity'].low,
        [Neo4jLabelEnum.VIRTUAL, Neo4jLabelEnum.CONTACT],
        virtualContactDto,
        RelationName.CREATED_BY,
      );
      const createdByKafkaObject: CreateKafkaObject = {
        parentKey: createTypesDto.createdBy,
        referenceKey: typeNode.properties.key,
        url: typeUrl,
        relationName: RelationName.CREATED_BY,
        virtualNodeLabels: [Neo4jLabelEnum.TYPE, Neo4jLabelEnum.VIRTUAL],
      };

      await this.kafkaService.producerSendMessage('createContactRelation', JSON.stringify(createdByKafkaObject));

      const warrantyGuarantorPartsUrl = `${process.env.CONTACT_URL}/${createTypesDto.warrantyGuarantorParts}`;
      const virtualwarrantyGuarantorPartsDto = {
        referenceKey: createTypesDto.warrantyGuarantorParts,
        url: warrantyGuarantorPartsUrl,
      };

      virtualNodeCreator.createVirtualNode(
        typeNode['identity'].low,
        [Neo4jLabelEnum.VIRTUAL, Neo4jLabelEnum.CONTACT],
        virtualwarrantyGuarantorPartsDto,
        RelationName.WARRANTY_GUARANTOR_PARTS,
      );
      const warrantyGuarantorPartsKafkaObject: CreateKafkaObject = {
        parentKey: createTypesDto.warrantyGuarantorParts,
        referenceKey: typeNode.properties.key,
        url: typeUrl,
        relationName: RelationName.WARRANTY_GUARANTOR_PARTS,
        virtualNodeLabels: [Neo4jLabelEnum.TYPE, Neo4jLabelEnum.VIRTUAL],
      };

      await this.kafkaService.producerSendMessage(
        'createContactRelation',
        JSON.stringify(warrantyGuarantorPartsKafkaObject),
      );

      const warrantyGuarantorLaborUrl = `${process.env.CONTACT_URL}/${createTypesDto.warrantyGuarantorLabor}`;
      const virtualwarrantyGuarantorLaborDto = {
        referenceKey: createTypesDto.warrantyGuarantorLabor,
        url: warrantyGuarantorLaborUrl,
      };

      virtualNodeCreator.createVirtualNode(
        typeNode['identity'].low,
        [Neo4jLabelEnum.VIRTUAL, Neo4jLabelEnum.CONTACT],
        virtualwarrantyGuarantorLaborDto,
        RelationName.WARRANTY_GUARANTOR_LABOR,
      );
      const warrantyGuarantorLaborKafkaObject: CreateKafkaObject = {
        parentKey: createTypesDto.warrantyGuarantorLabor,
        referenceKey: typeNode.properties.key,
        url: typeUrl,
        relationName: RelationName.WARRANTY_GUARANTOR_LABOR,
        virtualNodeLabels: [Neo4jLabelEnum.TYPE, Neo4jLabelEnum.VIRTUAL],
      };

      await this.kafkaService.producerSendMessage(
        'createContactRelation',
        JSON.stringify(warrantyGuarantorLaborKafkaObject),
      );

      return result;
    } catch (error) {
      const code = error.response?.code;
      console.log(error.response);

      if (code >= 1000 && code <= 1999) {
      } else if (code >= 5000 && code <= 5999) {
        if (error.response?.code == CustomNeo4jError.ADD_CHILDREN_RELATION_BY_ID_ERROR) {
        }
      } else if (code >= 9500 && code <= 9750) {
        if (error.response?.code == CustomAssetError.WRONG_PARENT) {
          throw new WrongIdProvided();
        }
        if (error.response?.code == CustomAssetError.OTHER_MICROSERVICE_ERROR) {
          throw new HttpException(error.response.message, error.status);
        }
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async update(_id: string, updateTypeDto: UpdateTypesDto, header) {
    try {
      const { realm, authorization } = header;

      const node = await this.neo4jService.findChildrensByChildIdAndFilters(
        [Neo4jLabelEnum.TYPES],
        { realm },
        +_id,
        { isDeleted: false, isActive: true },
        RelationName.PARENT_OF,
      );
      if (!node.length) {
        throw new HttpException(node_not_found(), 400);
      }
      const typeUrl = `${process.env.TYPE_URL}/${node[0].get('children').properties.key}`;
      if (updateTypeDto.createdBy) {
        await this.httpService.get(`${process.env.CONTACT_URL}/${updateTypeDto.createdBy}`, {
          authorization,
        });
      }
      if (updateTypeDto.manufacturer) {
        await this.httpService.get(`${process.env.CONTACT_URL}/${updateTypeDto.manufacturer}`, {
          authorization,
        });
      }
      if (updateTypeDto.warrantyGuarantorLabor) {
        await this.httpService.get(`${process.env.CONTACT_URL}/${updateTypeDto.warrantyGuarantorLabor}`, {
          authorization,
        });
      }
      if (updateTypeDto.warrantyGuarantorParts) {
        await this.httpService.get(`${process.env.CONTACT_URL}/${updateTypeDto.warrantyGuarantorParts}`, {
          authorization,
        });
      }

      const virtualNodeCreator = new VirtualNodeCreator(this.neo4jService);

      if (updateTypeDto.createdBy) {
        const virtualNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
          [Neo4jLabelEnum.TYPE],
          { key: node[0].get('children').properties.key },
          [],
          { isDeleted: false },
          RelationName.CREATED_BY,
        );
        if (virtualNode[0].get('children').properties.referenceKey !== updateTypeDto.createdBy) {
          const createContactUrl = `${process.env.CONTACT_URL}/${updateTypeDto.createdBy}`;

          const createdByKafkaObject = {
            exParentKey: virtualNode[0].get('children').properties.referenceKey,
            newParentKey: updateTypeDto.createdBy,
            referenceKey: virtualNode[0].get('parent').properties.key,
            url: typeUrl,
            relationName: RelationName.CREATED_BY,
            virtualNodeLabels: [Neo4jLabelEnum.TYPE, Neo4jLabelEnum.VIRTUAL],
          };

          await this.kafkaService.producerSendMessage('updateContactRelation', JSON.stringify(createdByKafkaObject));
          await this.neo4jService.updateByIdAndFilter(virtualNode[0].get('children').identity.low, {}, [], {
            url: createContactUrl,
            referenceKey: updateTypeDto.createdBy,
            updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
          });
        }
      }
      if (updateTypeDto.manufacturer) {
        const virtualNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
          [Neo4jLabelEnum.TYPE],
          { key: node[0].get('children').properties.key },
          [],
          { isDeleted: false },
          RelationName.MANUFACTURED_BY,
        );
        if (virtualNode[0].get('children').properties.referenceKey !== updateTypeDto.manufacturer) {
          const manufacturerUrl = `${process.env.CONTACT_URL}/${updateTypeDto.manufacturer}`;

          const createdByKafkaObject = {
            exParentKey: virtualNode[0].get('children').properties.referenceKey,
            newParentKey: updateTypeDto.manufacturer,
            referenceKey: virtualNode[0].get('parent').properties.key,
            url: typeUrl,
            relationName: RelationName.MANUFACTURED_BY,
            virtualNodeLabels: [Neo4jLabelEnum.TYPE, Neo4jLabelEnum.VIRTUAL],
          };

          await this.kafkaService.producerSendMessage('updateContactRelation', JSON.stringify(createdByKafkaObject));
          await this.neo4jService.updateByIdAndFilter(virtualNode[0].get('children').identity.low, {}, [], {
            url: manufacturerUrl,
            referenceKey: updateTypeDto.manufacturer,
            updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
          });
        }
      }
      if (updateTypeDto.warrantyGuarantorLabor) {
        const virtualNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
          [Neo4jLabelEnum.TYPE],
          { key: node[0].get('children').properties.key },
          [],
          { isDeleted: false },
          RelationName.WARRANTY_GUARANTOR_LABOR,
        );
        if (virtualNode[0].get('children').properties.referenceKey !== updateTypeDto.warrantyGuarantorLabor) {
          const warrantyGuarantorLaborUrl = `${process.env.CONTACT_URL}/${updateTypeDto.warrantyGuarantorLabor}`;

          const createdByKafkaObject = {
            exParentKey: virtualNode[0].get('children').properties.referenceKey,
            newParentKey: updateTypeDto.warrantyGuarantorLabor,
            referenceKey: virtualNode[0].get('parent').properties.key,
            url: typeUrl,
            relationName: RelationName.WARRANTY_GUARANTOR_LABOR,
            virtualNodeLabels: [Neo4jLabelEnum.TYPE, Neo4jLabelEnum.VIRTUAL],
          };

          await this.kafkaService.producerSendMessage('updateContactRelation', JSON.stringify(createdByKafkaObject));
          await this.neo4jService.updateByIdAndFilter(virtualNode[0].get('children').identity.low, {}, [], {
            url: warrantyGuarantorLaborUrl,
            referenceKey: updateTypeDto.warrantyGuarantorLabor,
            updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
          });
        }
      }
      if (updateTypeDto.warrantyGuarantorParts) {
        const virtualNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
          [Neo4jLabelEnum.TYPE],
          { key: node[0].get('children').properties.key },
          [],
          { isDeleted: false },
          RelationName.WARRANTY_GUARANTOR_PARTS,
        );
        if (virtualNode[0].get('children').properties.referenceKey !== updateTypeDto.warrantyGuarantorParts) {
          const warrantyGuarantorPartsUrl = `${process.env.CONTACT_URL}/${updateTypeDto.warrantyGuarantorParts}`;

          const createdByKafkaObject = {
            exParentKey: virtualNode[0].get('children').properties.referenceKey,
            newParentKey: updateTypeDto.warrantyGuarantorParts,
            referenceKey: virtualNode[0].get('parent').properties.key,
            url: typeUrl,
            relationName: RelationName.WARRANTY_GUARANTOR_PARTS,
            virtualNodeLabels: [Neo4jLabelEnum.TYPE, Neo4jLabelEnum.VIRTUAL],
          };

          await this.kafkaService.producerSendMessage('updateContactRelation', JSON.stringify(createdByKafkaObject));
          await this.neo4jService.updateByIdAndFilter(virtualNode[0].get('children').identity.low, {}, [], {
            url: warrantyGuarantorPartsUrl,
            referenceKey: updateTypeDto.warrantyGuarantorParts,
            updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
          });
        }
      }

      delete updateTypeDto['manufacturer'];
      delete updateTypeDto['createdBy'];
      delete updateTypeDto['warrantyGuarantorParts'];
      delete updateTypeDto['warrantyGuarantorLabor'];
      const updatedNode = await this.neo4jService.updateByIdAndFilter(
        +_id,
        { isDeleted: false, isActive: true },
        [],
        updateTypeDto,
      );
      if (!updatedNode) {
        throw new FacilityStructureNotFountException(_id);
      }
      return updatedNode;
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
          throw new HttpException(error.response.message, error.status);
        }
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async delete(_id: string, header) {
    try {
      const typeNode = await this.neo4jService.findByIdAndFilters(+_id, { isDeleted: false });

      let deletedNode;

      const hasChildrenArray = await this.neo4jService.findChildrensByIdAndFilters(+_id, {}, [], {}, 'PARENT_OF');

      if (hasChildrenArray.length === 0) {
        deletedNode = await this.neo4jService.updateByIdAndFilter(+_id, {}, [], { isDeleted: true, isActive: false });
        await this.kafkaService.producerSendMessage(
          'deleteRelation',
          JSON.stringify({ referenceKey: typeNode.properties.key }),
        );
      } else {
        throw new HttpException('node has parent relation ', 400);
      }

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
