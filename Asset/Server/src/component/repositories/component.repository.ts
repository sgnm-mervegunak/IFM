import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  AssetNotFoundException,
  FacilityStructureNotFountException,
} from '../../common/notFoundExceptions/not.found.exception';
import { Component } from '../entities/component.entity';
import { NestKafkaService, nodeHasChildException } from 'ifmcommon';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { assignDtoPropToEntity, createDynamicCyperObject, CustomNeo4jError, Neo4jService } from 'sgnm-neo4j/dist';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { CreateComponentDto } from '../dto/create.component.dto';
import { UpdateComponentDto } from '../dto/update.component.dto';
import { catchError, firstValueFrom, map } from 'rxjs';
import { WrongIdProvided } from 'src/common/bad.request.exception';
import { VirtualNode } from 'src/common/baseobject/virtual.node';
import { CustomAssetError } from 'src/common/const/custom.error.enum';
import { wrong_parent_error, other_microservice_errors } from 'src/common/const/custom.error.object';
import { RelationName } from 'src/common/const/relation.name.enum';
import { HttpService } from '@nestjs/axios';
import { SpaceType } from 'src/common/const/space.type.enum';
import { getRequest } from 'src/common/func/http.request.func';
import { HttpRequestHandler } from 'src/common/class/http.request.helper.class';
import { VirtualNodeCreator } from 'src/common/class/virtual.node.creator';

@Injectable()
export class ComponentRepository implements GeciciInterface<Component> {
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
      return nodes[0]['_fields'][0];
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findRootByRealm(header) {
    const { realm } = header;
    let node = await this.neo4jService.findByLabelAndFiltersWithTreeStructure([Neo4jLabelEnum.TYPES], {
      realm,
      isDeleted: false,
      isActive: true,
    });
    if (!node) {
      throw new FacilityStructureNotFountException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    return node;
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
        {},
        [Neo4jLabelEnum.TYPE],
        {
          key: createComponentDto.parentKey,
          isDeleted: false,
        },
        'PARENT_OF',
      );

      if (!typeNode.length) {
        throw new HttpException(wrong_parent_error(), 400);
      }

      let structureUrl = '';
      let structure;
      switch (createComponentDto.spaceType) {
        case SpaceType.JOINTSPACE:
          structureUrl = `${process.env.JOINTSPACE}/${createComponentDto.space}`;

          structure = await this.httpService.get(`${process.env.JOINTSPACE_URL}/${createComponentDto.space}`, {
            authorization,
          });

          break;
        case SpaceType.SPACE:
          console.log('space');
          structureUrl = `${process.env.STRUCTURE_URL}/${createComponentDto.space}`;

          structure = await this.httpService.get(`${process.env.STRUCTURE_URL}/${createComponentDto.space}`, {
            authorization,
          });

          break;
        default:
          throw new HttpException(other_microservice_errors('SpaceType must be valid'), 400);
      }

      //check if creater exist exist
      const createdBy = await this.httpService.get(`${process.env.CONTACT_URL}/${createComponentDto.createdBy}`, {
        authorization,
      });

      if (!createComponentDto.name || createComponentDto.name.trim() === '') {
        createComponentDto.name = typeNode[0].get('children').properties.name;
      }

      const component = new Component();
      const componentFinalObject = assignDtoPropToEntity(component, createComponentDto);
      const componentNode = await this.neo4jService.createNode(componentFinalObject, [Neo4jLabelEnum.COMPONENT]);
      const uniqName = componentNode.properties.name + ' ' + componentNode.identity.low;
      await this.neo4jService.updateByIdAndFilter(componentNode.identity.low, {}, [], { name: uniqName });

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
      const virtualNodeCreator = new VirtualNodeCreator(this.neo4jService);
      const createContactUrl = `${process.env.CONTACT_URL}/${createComponentDto.createdBy}`;
      const virtualContactDto = { referenceKey: createComponentDto.createdBy, url: createContactUrl };

      virtualNodeCreator.createVirtualNode(
        componentNode['identity'].low,
        [Neo4jLabelEnum.VIRTUAL, Neo4jLabelEnum.CONTACT],
        virtualContactDto,
        RelationName.CREATED_BY,
      );
      const createdByKafkaObject = {
        parentKey: createComponentDto.createdBy,
        referenceKey: componentNode.properties.key,
        url: componentUrl,
        relationName: RelationName.CREATED_BY,
        virtualNodeLabels: [Neo4jLabelEnum.COMPONENT, Neo4jLabelEnum.VIRTUAL],
      };

      await this.kafkaService.producerSendMessage('createContactRelation', JSON.stringify(createdByKafkaObject));

      const createStructureRelationDto = { referenceKey: createComponentDto.space, url: structureUrl };
      virtualNodeCreator.createVirtualNode(
        componentNode['identity'].low,
        [Neo4jLabelEnum.VIRTUAL, Neo4jLabelEnum.STRUCTURE],
        createStructureRelationDto,
        RelationName.LOCATED_IN,
      );

      const structureKafkaObject = {
        parentKey: createComponentDto.space,
        referenceKey: componentNode.properties.key,
        url: componentUrl,
        relationName: RelationName.HAS,
        virtualNodeLabels: [Neo4jLabelEnum.COMPONENT, Neo4jLabelEnum.VIRTUAL],
      };

      await this.kafkaService.producerSendMessage('createStructureRelation', JSON.stringify(structureKafkaObject));
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
          throw new HttpException(error.response.message, error.status);
        }
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async update(_id: string, updateAssetDto: UpdateComponentDto, header) {
    const updateAssetDtoWithoutLabelsAndParentId = {};
    Object.keys(updateAssetDto).forEach((element) => {
      if (element != 'labels' && element != 'parentId') {
        updateAssetDtoWithoutLabelsAndParentId[element] = updateAssetDto[element];
      }
    });
    const dynamicObject = createDynamicCyperObject(updateAssetDtoWithoutLabelsAndParentId);
    const updatedNode = await this.neo4jService.updateByIdAndFilter(
      +_id,
      { isDeleted: false, isActive: true },
      [],
      dynamicObject,
    );

    if (!updatedNode) {
      throw new FacilityStructureNotFountException(_id);
    }
    const result = {
      id: updatedNode['identity'].low,
      labels: updatedNode['labels'],
      properties: updatedNode['properties'],
    };
    if (updateAssetDto['labels'] && updateAssetDto['labels'].length > 0) {
      await this.neo4jService.removeLabel(_id, result['labels']);
      await this.neo4jService.updateLabel(_id, updateAssetDto['labels']);
    }
    return result;
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
