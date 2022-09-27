import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  AssetNotFoundException,
  FacilityStructureNotFountException,
} from '../../common/notFoundExceptions/not.found.exception';
import { Component } from '../entities/component.entity';
import { NestKafkaService, nodeHasChildException } from 'ifmcommon';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import {
  assignDtoPropToEntity,
  changeObjectKeyName,
  createDynamicCyperObject,
  CustomNeo4jError,
  dynamicFilterPropertiesAdder,
  dynamicFilterPropertiesAdderAndAddParameterKey,
  dynamicLabelAdder,
  dynamicNotLabelAdder,
  filterArrayForEmptyString,
  Neo4jService,
  tree_structure_not_found_by_realm_name_error,
} from 'sgnm-neo4j/dist';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { CreateComponentDto } from '../dto/create.component.dto';
import { UpdateComponentDto } from '../dto/update.component.dto';
import { NodeNotFound, WrongIdProvided } from 'src/common/bad.request.exception';
import { CustomAssetError } from 'src/common/const/custom.error.enum';
import {
  wrong_parent_error,
  other_microservice_errors,
  node_not_found,
  has_children_error,
} from 'src/common/const/custom.error.object';
import { RelationName } from 'src/common/const/relation.name.enum';
import { SpaceType } from 'src/common/const/space.type.enum';
import { HttpRequestHandler } from 'src/common/class/http.request.helper.class';
import { VirtualNodeCreator } from 'src/common/class/virtual.node.creator';
import { ComponentInterface } from 'src/common/interface/component.interface';
import * as moment from 'moment';
import {
  avaiableCreateVirtualPropsGetter,
  avaiableUpdateVirtualPropsGetter,
} from 'src/common/func/virtual.node.props.functions';
import { VirtualNodeHandler } from 'src/common/class/virtual.node.dealer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ComponentRepository implements ComponentInterface<Component> {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly kafkaService: NestKafkaService,
    private readonly httpService: HttpRequestHandler,
    private readonly virtualNodeHandler: VirtualNodeHandler,
    private readonly configService: ConfigService,
  ) {}
  async findByKey(key: string, header) {
    try {
      const nodes = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.COMPONENT], { key });
      if (!nodes.length) {
        throw new AssetNotFoundException(key);
      }

      const createdByNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.COMPONENT],
        { key: nodes[0].get('n').properties.key },
        [],
        { isDeleted: false },
        RelationName.CREATED_BY,
      );
      nodes[0].get('n').properties['createdBy'] = createdByNode[0].get('children').properties.referenceKey;

      const spaceNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.COMPONENT],
        { key: nodes[0].get('n').properties.key },
        [],
        { isDeleted: false },
        RelationName.LOCATED_IN,
      );
      nodes[0].get('n').properties['space'] = spaceNode[0].get('children').properties.referenceKey;
      const warrantyGuaranorLaborNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.COMPONENT],
        { key: nodes[0].get('n').properties.key },
        [],
        { isDeleted: false },
        RelationName.WARRANTY_GUARANTOR_LABOR,
      );
      nodes[0].get('n').properties['warrantyGuarantorLabor'] =
        warrantyGuaranorLaborNode[0].get('children').properties.referenceKey;
      const warrantyGuaranorPartsNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.COMPONENT],
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

  async findRootByRealm(key, header) {
    console.log(key);

    const { realm } = header;
    console.log(realm);
    const typeNode = await this.neo4jService.findChildrensByLabelsOneLevel(
      [Neo4jLabelEnum.TYPES],
      { realm },
      [Neo4jLabelEnum.TYPE],
      { key },
    );

    if (!typeNode.length) {
      throw new HttpException(wrong_parent_error(), 400);
    }

    const node = await this.neo4jService.findChildrensByLabelsAndFilters(
      [Neo4jLabelEnum.TYPE],
      {
        key,
        isDeleted: false,
        isActive: true,
      },
      [Neo4jLabelEnum.COMPONENT],
      { isDeleted: false, isActive: true },
    );

    if (!node.length) {
      return node;
    } else {
      const componentArray = node.map((element) => {
        element.get('children').properties['id'] = element.get('children').identity.low;
        return element.get('children').properties;
      });
      return componentArray;
    }
  }
  async create(createComponentDto: CreateComponentDto, header) {
    try {
      const { realm, authorization } = header;
      const typesNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.TYPES], {
        isDeleted: false,
        realm,
      });
      if (!typesNode.length) {
        throw new HttpException(wrong_parent_error(), 400);
      }

      const typeNode = await this.neo4jService.findChildrensByIdAndFilters(
        typesNode[0].get('n').identity.low,
        { isDeleted: false },
        [Neo4jLabelEnum.TYPE],
        {
          key: createComponentDto.parentKey,
          isDeleted: false,
        },
        RelationName.PARENT_OF,
      );

      if (!typeNode.length) {
        throw new HttpException(wrong_parent_error(), 400);
      }

      const component = new Component();
      const componentFinalObject = assignDtoPropToEntity(component, createComponentDto);
      delete componentFinalObject['space'];
      delete componentFinalObject['spaceType'];
      delete componentFinalObject['createdBy'];
      delete componentFinalObject['warrantyGuarantorParts'];
      delete componentFinalObject['warrantyGuarantorLabor'];

      const componentNode = await this.neo4jService.createNode(componentFinalObject, [Neo4jLabelEnum.COMPONENT]);
      const uniqName = componentNode.properties.name + ' ' + componentNode.identity.low;
      await this.neo4jService.updateByIdAndFilter(componentNode.identity.low, {}, [], { name: uniqName });
      componentNode.properties.name = uniqName;
      componentNode['properties']['id'] = componentNode['identity'].low;
      const componentUrl = `${process.env.COMPONENT_URL}/${componentNode.properties.key}`;
      const result = {
        id: componentNode['identity'].low,
        labels: componentNode['labels'],
        properties: componentNode['properties'],
      };
      await this.neo4jService.addParentRelationByIdAndFilters(
        result['id'],
        {},
        typeNode[0].get('children').identity.low,
        {},
      );

      const finalObjectArray = avaiableCreateVirtualPropsGetter(createComponentDto);

      for (let index = 0; index < finalObjectArray.length; index++) {
        const url =
          (await this.configService.get(finalObjectArray[index].url)) + '/' + finalObjectArray[index].referenceKey;

        const contact = await this.httpService.get(url, { authorization });
      }

      await this.virtualNodeHandler.createVirtualNode(componentNode['identity'].low, componentUrl, finalObjectArray);

      return result;

      // let structureUrl = '';
      // let structure;
      // switch (createComponentDto.spaceType) {
      //   case SpaceType.JOINTSPACE:
      //     structureUrl = `${process.env.JOINTSPACE_URL}/${createComponentDto.space}`;

      //     structure = await this.httpService.get(`${process.env.JOINTSPACE_URL}/${createComponentDto.space}`, {
      //       authorization,
      //     });

      //     break;
      //   case SpaceType.SPACE:
      //     console.log('space');
      //     structureUrl = `${process.env.STRUCTURE_URL}/${createComponentDto.space}`;

      //     structure = await this.httpService.get(`${process.env.STRUCTURE_URL}/${createComponentDto.space}`, {
      //       authorization,
      //     });

      //     break;
      //   default:
      //     throw new HttpException(other_microservice_errors('SpaceType must be valid'), 400);
      // }

      // //check if creater exist exist
      // await this.httpService.get(`${process.env.CONTACT_URL}/${createComponentDto.createdBy}`, {
      //   authorization,
      // });

      // //check if warrantyGuarantorParts exist exist
      // await this.httpService.get(`${process.env.CONTACT_URL}/${createComponentDto.warrantyGuarantorParts}`, {
      //   authorization,
      // });

      // //check if warrantyGuarantorLabor exist exist
      // await this.httpService.get(`${process.env.CONTACT_URL}/${createComponentDto.warrantyGuarantorLabor}`, {
      //   authorization,
      // });

      // if (!createComponentDto.name || createComponentDto.name.trim() === '') {
      //   createComponentDto.name = typeNode[0].get('children').properties.name;
      // }

      // const component = new Component();
      // const componentFinalObject = assignDtoPropToEntity(component, createComponentDto);
      // delete componentFinalObject['space'];
      // delete componentFinalObject['spaceType'];
      // delete componentFinalObject['createdBy'];
      // delete componentFinalObject['warrantyGuarantorParts'];
      // delete componentFinalObject['warrantyGuarantorLabor'];
      // const componentNode = await this.neo4jService.createNode(componentFinalObject, [Neo4jLabelEnum.COMPONENT]);
      // const uniqName = componentNode.properties.name + ' ' + componentNode.identity.low;
      // await this.neo4jService.updateByIdAndFilter(componentNode.identity.low, {}, [], { name: uniqName });

      // componentNode['properties']['id'] = componentNode['identity'].low;
      // const componentUrl = `${process.env.COMPONENT_URL}/${componentNode.properties.key}`;
      // const result = {
      //   id: componentNode['identity'].low,
      //   labels: componentNode['labels'],
      //   properties: componentNode['properties'],
      // };

      // await this.neo4jService.addParentRelationByIdAndFilters(
      //   result['id'],
      //   {},
      //   typeNode[0].get('children').identity.low,
      //   {},
      // );
      // const virtualNodeCreator = new VirtualNodeCreator(this.neo4jService);
      // const createContactUrl = `${process.env.CONTACT_URL}/${createComponentDto.createdBy}`;
      // const virtualContactDto = { referenceKey: createComponentDto.createdBy, url: createContactUrl };

      // virtualNodeCreator.createVirtualNode(
      //   componentNode['identity'].low,
      //   [Neo4jLabelEnum.VIRTUAL, Neo4jLabelEnum.CONTACT],
      //   virtualContactDto,
      //   RelationName.CREATED_BY,
      // );
      // const createdByKafkaObject = {
      //   parentKey: createComponentDto.createdBy,
      //   referenceKey: componentNode.properties.key,
      //   url: componentUrl,
      //   relationName: RelationName.CREATED_BY,
      //   virtualNodeLabels: [Neo4jLabelEnum.COMPONENT, Neo4jLabelEnum.VIRTUAL],
      // };

      // await this.kafkaService.producerSendMessage('createContactRelation', JSON.stringify(createdByKafkaObject));

      // const createStructureRelationDto = { referenceKey: createComponentDto.space, url: structureUrl };
      // virtualNodeCreator.createVirtualNode(
      //   componentNode['identity'].low,
      //   [Neo4jLabelEnum.VIRTUAL, Neo4jLabelEnum.STRUCTURE],
      //   createStructureRelationDto,
      //   RelationName.LOCATED_IN,
      // );

      // const structureKafkaObject = {
      //   parentKey: createComponentDto.space,
      //   referenceKey: componentNode.properties.key,
      //   url: componentUrl,
      //   relationName: RelationName.HAS,
      //   virtualNodeLabels: [Neo4jLabelEnum.COMPONENT, Neo4jLabelEnum.VIRTUAL],
      // };

      // await this.kafkaService.producerSendMessage('createStructureRelation', JSON.stringify(structureKafkaObject));
      // const warrantyGuarantorPartsUrl = `${process.env.CONTACT_URL}/${createComponentDto.warrantyGuarantorParts}`;
      // const virtualwarrantyGuarantorPartsDto = {
      //   referenceKey: createComponentDto.warrantyGuarantorParts,
      //   url: warrantyGuarantorPartsUrl,
      // };

      // virtualNodeCreator.createVirtualNode(
      //   componentNode['identity'].low,
      //   [Neo4jLabelEnum.VIRTUAL, Neo4jLabelEnum.CONTACT],
      //   virtualwarrantyGuarantorPartsDto,
      //   RelationName.WARRANTY_GUARANTOR_PARTS,
      // );
      // const warrantyGuarantorPartsKafkaObject = {
      //   parentKey: createComponentDto.warrantyGuarantorParts,
      //   referenceKey: componentNode.properties.key,
      //   url: warrantyGuarantorPartsUrl,
      //   relationName: RelationName.WARRANTY_GUARANTOR_PARTS,
      //   virtualNodeLabels: [Neo4jLabelEnum.COMPONENT, Neo4jLabelEnum.VIRTUAL],
      // };

      // await this.kafkaService.producerSendMessage(
      //   'createContactRelation',
      //   JSON.stringify(warrantyGuarantorPartsKafkaObject),
      // );

      // const warrantyGuarantorLaborUrl = `${process.env.CONTACT_URL}/${createComponentDto.warrantyGuarantorLabor}`;
      // const virtualwarrantyGuarantorLaborDto = {
      //   referenceKey: createComponentDto.warrantyGuarantorLabor,
      //   url: warrantyGuarantorLaborUrl,
      // };

      // virtualNodeCreator.createVirtualNode(
      //   componentNode['identity'].low,
      //   [Neo4jLabelEnum.VIRTUAL, Neo4jLabelEnum.CONTACT],
      //   virtualwarrantyGuarantorLaborDto,
      //   RelationName.WARRANTY_GUARANTOR_LABOR,
      // );
      // const warrantyGuarantorLaborKafkaObject = {
      //   parentKey: createComponentDto.warrantyGuarantorLabor,
      //   referenceKey: componentNode.properties.key,
      //   url: warrantyGuarantorLaborUrl,
      //   relationName: RelationName.WARRANTY_GUARANTOR_LABOR,
      //   virtualNodeLabels: [Neo4jLabelEnum.COMPONENT, Neo4jLabelEnum.VIRTUAL],
      // };

      // await this.kafkaService.producerSendMessage(
      //   'createContactRelation',
      //   JSON.stringify(warrantyGuarantorLaborKafkaObject),
      // );
      // return result;
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

  async update(_id: string, updateComponentDto: UpdateComponentDto, header) {
    try {
      const { realm, authorization, language } = header;

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
      const componentUrl = `${process.env.COMPONENT_URL}/${node[0].get('children').properties.key}`;
      const finalObjectArray = await avaiableUpdateVirtualPropsGetter(updateComponentDto);
      for (let index = 0; index < finalObjectArray.length; index++) {
        const url =
          (await this.configService.get(finalObjectArray[index].url)) + '/' + finalObjectArray[index].newParentKey;

        await this.httpService.get(url, { authorization });
      }

      await this.virtualNodeHandler.updateVirtualNode(+_id, componentUrl, finalObjectArray);
      delete updateComponentDto['space'];
      delete updateComponentDto['spaceType'];
      delete updateComponentDto['createdBy'];
      delete updateComponentDto['warrantyGuarantorParts'];
      delete updateComponentDto['warrantyGuarantorLabor'];

      const updatedNode = await this.neo4jService.updateById(_id, updateComponentDto);
      if (!updatedNode) {
        throw new FacilityStructureNotFountException(_id);
      }
      return updatedNode;

      // let structureUrl = '';
      // let structure;
      // if (updateComponentDto.spaceType && updateComponentDto.spaceType) {
      //   switch (updateComponentDto.spaceType) {
      //     case SpaceType.JOINTSPACE:
      //       structureUrl = `${process.env.JOINTSPACE_URL}/${updateComponentDto.space}`;

      //       structure = await this.httpService.get(`${process.env.JOINTSPACE_URL}/${updateComponentDto.space}`, {
      //         authorization,
      //       });

      //       break;
      //     case SpaceType.SPACE:
      //       structureUrl = `${process.env.STRUCTURE_URL}/${updateComponentDto.space}`;

      //       structure = await this.httpService.get(`${process.env.STRUCTURE_URL}/${updateComponentDto.space}`, {
      //         authorization,
      //       });

      //       break;
      //     default:
      //       throw new HttpException(other_microservice_errors('SpaceType must be valid'), 400);
      //   }
      // }

      // if (updateComponentDto.createdBy) {
      //   await this.httpService.get(`${process.env.CONTACT_URL}/${updateComponentDto.createdBy}`, {
      //     authorization,
      //   });
      // }
      // if (updateComponentDto.warrantyGuarantorLabor) {
      //   await this.httpService.get(`${process.env.CONTACT_URL}/${updateComponentDto.warrantyGuarantorLabor}`, {
      //     authorization,
      //   });
      // }
      // if (updateComponentDto.warrantyGuarantorParts) {
      //   await this.httpService.get(`${process.env.CONTACT_URL}/${updateComponentDto.warrantyGuarantorParts}`, {
      //     authorization,
      //   });
      // }

      // if (updateComponentDto.space && updateComponentDto.spaceType) {
      //   const virtualNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
      //     [Neo4jLabelEnum.COMPONENT],
      //     { key: node[0].get('children').properties.key },
      //     [],
      //     { isDeleted: false },
      //     RelationName.LOCATED_IN,
      //   );
      //   if (virtualNode[0].get('children').properties.referenceKey !== updateComponentDto.space) {
      //     const spaceKafkaObject = {
      //       exParentKey: virtualNode[0].get('children').properties.referenceKey,
      //       newParentKey: updateComponentDto.space,
      //       referenceKey: virtualNode[0].get('parent').properties.key,
      //       url: componentUrl,
      //       relationName: RelationName.HAS,
      //       virtualNodeLabels: [Neo4jLabelEnum.COMPONENT, Neo4jLabelEnum.VIRTUAL],
      //     };

      //     await this.kafkaService.producerSendMessage('updateStructureRelation', JSON.stringify(spaceKafkaObject));
      //     await this.neo4jService.updateByIdAndFilter(virtualNode[0].get('children').identity.low, {}, [], {
      //       url: structureUrl,
      //       referenceKey: updateComponentDto.space,
      //       updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
      //     });
      //   }
      // }

      // if (updateComponentDto.createdBy) {
      //   const virtualNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
      //     [Neo4jLabelEnum.COMPONENT],
      //     { key: node[0].get('children').properties.key },
      //     [],
      //     { isDeleted: false },
      //     RelationName.CREATED_BY,
      //   );
      //   if (virtualNode[0].get('children').properties.referenceKey !== updateComponentDto.createdBy) {
      //     const createContactUrl = `${process.env.CONTACT_URL}/${updateComponentDto.createdBy}`;

      //     const createdByKafkaObject = {
      //       exParentKey: virtualNode[0].get('children').properties.referenceKey,
      //       newParentKey: updateComponentDto.createdBy,
      //       referenceKey: virtualNode[0].get('parent').properties.key,
      //       url: componentUrl,
      //       relationName: RelationName.CREATED_BY,
      //       virtualNodeLabels: [Neo4jLabelEnum.COMPONENT, Neo4jLabelEnum.VIRTUAL],
      //     };

      //     await this.kafkaService.producerSendMessage('updateContactRelation', JSON.stringify(createdByKafkaObject));
      //     await this.neo4jService.updateByIdAndFilter(virtualNode[0].get('children').identity.low, {}, [], {
      //       url: createContactUrl,
      //       referenceKey: updateComponentDto.createdBy,
      //       updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
      //     });
      //   }
      // }

      // if (updateComponentDto.warrantyGuarantorLabor) {
      //   const virtualNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
      //     [Neo4jLabelEnum.COMPONENT],
      //     { key: node[0].get('children').properties.key },
      //     [],
      //     { isDeleted: false },
      //     RelationName.WARRANTY_GUARANTOR_LABOR,
      //   );
      //   if (virtualNode[0].get('children').properties.referenceKey !== updateComponentDto.warrantyGuarantorLabor) {
      //     const warrantyGuarantorLaborUrl = `${process.env.CONTACT_URL}/${updateComponentDto.warrantyGuarantorLabor}`;

      //     const warrantyGuarantorLaborKafkaObject = {
      //       exParentKey: virtualNode[0].get('children').properties.referenceKey,
      //       newParentKey: updateComponentDto.warrantyGuarantorLabor,
      //       referenceKey: virtualNode[0].get('parent').properties.key,
      //       url: componentUrl,
      //       relationName: RelationName.WARRANTY_GUARANTOR_LABOR,
      //       virtualNodeLabels: [Neo4jLabelEnum.COMPONENT, Neo4jLabelEnum.VIRTUAL],
      //     };

      //     await this.kafkaService.producerSendMessage(
      //       'updateContactRelation',
      //       JSON.stringify(warrantyGuarantorLaborKafkaObject),
      //     );
      //     await this.neo4jService.updateByIdAndFilter(virtualNode[0].get('children').identity.low, {}, [], {
      //       url: warrantyGuarantorLaborUrl,
      //       referenceKey: updateComponentDto.warrantyGuarantorLabor,
      //       updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
      //     });
      //   }
      // }
      // if (updateComponentDto.warrantyGuarantorParts) {
      //   const virtualNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
      //     [Neo4jLabelEnum.COMPONENT],
      //     { key: node[0].get('children').properties.key },
      //     [],
      //     { isDeleted: false },
      //     RelationName.WARRANTY_GUARANTOR_PARTS,
      //   );
      //   if (virtualNode[0].get('children').properties.referenceKey !== updateComponentDto.warrantyGuarantorParts) {
      //     const warrantyGuarantorPartsUrl = `${process.env.CONTACT_URL}/${updateComponentDto.warrantyGuarantorParts}`;

      //     const warrantyGuarantorPartsKafkaObject = {
      //       exParentKey: virtualNode[0].get('children').properties.referenceKey,
      //       newParentKey: updateComponentDto.warrantyGuarantorParts,
      //       referenceKey: virtualNode[0].get('parent').properties.key,
      //       url: componentUrl,
      //       relationName: RelationName.WARRANTY_GUARANTOR_PARTS,
      //       virtualNodeLabels: [Neo4jLabelEnum.COMPONENT, Neo4jLabelEnum.VIRTUAL],
      //     };

      //     await this.kafkaService.producerSendMessage(
      //       'updateContactRelation',
      //       JSON.stringify(warrantyGuarantorPartsKafkaObject),
      //     );
      //     await this.neo4jService.updateByIdAndFilter(virtualNode[0].get('children').identity.low, {}, [], {
      //       url: warrantyGuarantorPartsUrl,
      //       referenceKey: updateComponentDto.warrantyGuarantorParts,
      //       updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
      //     });
      //   }
      // }
      // delete updateComponentDto['space'];
      // delete updateComponentDto['spaceType'];
      // delete updateComponentDto['createdBy'];
      // delete updateComponentDto['warrantyGuarantorParts'];
      // delete updateComponentDto['warrantyGuarantorLabor'];

      // const updatedNode = await this.neo4jService.updateByIdAndFilter(
      //   +_id,
      //   { isDeleted: false, isActive: true },
      //   [],
      //   updateComponentDto,
      // );
      // if (!updatedNode) {
      //   throw new FacilityStructureNotFountException(_id);
      // }
      // return updatedNode;
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
      let deletedVirtualNode;

      const hasChildrenArray = await this.neo4jService.findChildrensByIdAndFilters(+_id, {}, [], {}, 'PARENT_OF');

      if (hasChildrenArray.length === 0) {
        deletedNode = await this.neo4jService.updateByIdAndFilter(+_id, {}, [], { isDeleted: true, isActive: false });
        const virtualNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
          [Neo4jLabelEnum.COMPONENT],
          { key: typeNode[0].get('n').properties.key },
          ['Virtual'],
          { isDeleted: false },
          RelationName.CREATED_BY,
        );
        deletedVirtualNode = await this.neo4jService.updateByIdAndFilter(
          +virtualNode[0].get('children').identity.low,
          {},
          [],
          { isDeleted: true },
        );
        await this.kafkaService.producerSendMessage(
          'deleteVirtualNodeRelations',
          JSON.stringify({ referenceKey: typeNode.properties.key }),
        );
      } else {
        throw new HttpException(has_children_error({ id: _id }), 400);
      }

      return deletedNode;
    } catch (error) {
      const { code, message } = error.response;
      if (code === CustomAssetError.HAS_CHILDREN) {
        throw new HttpException({ message: error.response.message }, 400);
      } else if (code === 5005) {
        AssetNotFoundException(_id);
      } else {
        throw new HttpException(message, code);
      }
    }
  }

  async findChildrenOfRootByRealm(header) {
    try {
      let { realm } = header;

      let node = await this.neo4jService.findByLabelAndNotLabelAndFiltersWithTreeStructure(
        [Neo4jLabelEnum.TYPES],
        [],
        { isDeleted: false, realm },
        [],
        ['Virtual'],
        { isDeleted: false },
      );

      if (!node) {
        throw new HttpException(node_not_found(), 400);
      }

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
}
