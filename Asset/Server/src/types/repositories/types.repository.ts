import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  AssetNotFoundException,
  FacilityStructureNotFountException,
} from '../../common/notFoundExceptions/not.found.exception';
import { Type } from '../entities/types.entity';
import { NestKafkaService, nodeHasChildException } from 'ifmcommon';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { assignDtoPropToEntity, createDynamicCyperObject, CustomNeo4jError, Neo4jService } from 'sgnm-neo4j/dist';
import { CreateTypesDto } from '../dto/create.types.dto';
import { UpdateTypesDto } from '../dto/update.tpes.dto';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { node_not_found, other_microservice_errors, wrong_parent_error } from 'src/common/const/custom.error.object';
import { CustomAssetError } from 'src/common/const/custom.error.enum';
import { NodeNotFound, WrongIdProvided } from 'src/common/bad.request.exception';
import { HttpService } from '@nestjs/axios';
import { catchError, map, firstValueFrom } from 'rxjs';
import { RelationName } from 'src/common/const/relation.name.enum';
import { VirtualNodeCreator } from 'src/common/class/virtual.node.creator';
import { HttpRequestHandler } from 'src/common/class/http.request.helper.class';

@Injectable()
export class TypesRepository implements GeciciInterface<Type> {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly kafkaService: NestKafkaService,
    private readonly httpService: HttpRequestHandler,
  ) {}
  async findByKey(key: string, header) {
    try {
      const nodes = await this.neo4jService.findByLabelAndFilters(['Type'], { key });
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
        [Neo4jLabelEnum.TYPES],
        {
          realm,
          isDeleted: false,
          isActive: true,
        },
        [Neo4jLabelEnum.TYPE],
        { isDeleted: false },
        'PARENT_OF',
      );
      if (!node.length) {
        throw new HttpException(node_not_found, 400);
      }

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
      const manufacturerKafkaObject = {
        parentKey: createTypesDto.manufacturer,
        referenceKey: typeNode.properties.key,
        url: typeUrl,
        relationName: RelationName.MANUFACTURED_BY,
        virtualNodeLabel: [Neo4jLabelEnum.TYPE, Neo4jLabelEnum.VIRTUAL],
      };

      await this.kafkaService.producerSendMessage('createContactRelation', JSON.stringify(manufacturerKafkaObject));

      const createContactUrl = `${process.env.CONTACT_URL}/${createTypesDto.createdBy}`;
      const virtualContactDto = { referenceKey: createTypesDto.manufacturer, url: createContactUrl };

      virtualNodeCreator.createVirtualNode(
        typeNode['identity'].low,
        [Neo4jLabelEnum.VIRTUAL, Neo4jLabelEnum.CONTACT],
        virtualContactDto,
        RelationName.CREATED_BY,
      );
      const createdByKafkaObject = {
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
      const warrantyGuarantorPartsKafkaObject = {
        parentKey: createTypesDto.warrantyGuarantorParts,
        referenceKey: typeNode.properties.key,
        url: warrantyGuarantorPartsUrl,
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
      const warrantyGuarantorLaborKafkaObject = {
        parentKey: createTypesDto.warrantyGuarantorLabor,
        referenceKey: typeNode.properties.key,
        url: warrantyGuarantorLaborUrl,
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

  async update(_id: string, updateAssetDto: UpdateTypesDto, header) {
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
