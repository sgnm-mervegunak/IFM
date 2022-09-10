import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
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
import { VirtualNode } from 'src/common/baseobject/virtual.node';
import { RelationName } from 'src/common/const/relation.name.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TypesRepository implements GeciciInterface<Type> {
  @Inject(ConfigService)
  private config: ConfigService
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly kafkaService: NestKafkaService,
    private readonly httpService: HttpService,

  ) {}
  async findByKey(key: string) {
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

  async findRootByRealm(realm: string) {
    try {
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
  async create(createTypesDto: CreateTypesDto, realm: string, language: string, authorization: string) {
    try {
      const rootNode = await this.neo4jService.findByIdAndOrLabelsAndFilters(
        createTypesDto.parentId,
        [Neo4jLabelEnum.TYPES],
        {
          isDeleted: false,
          realm,
        },
      );
      if (!rootNode.length) {
        throw new HttpException(wrong_parent_error(), 400);
      }

      //check if manufacturer exist
     let manufacturer= await this.httpService
        .get(`${this.config.get('CONTACT_URL')}/${createTypesDto.manufacturer}`, { headers: { authorization,language } })
        .pipe(
          catchError((error) => {
           const {status,message}=error.response?.data
            throw new HttpException(other_microservice_errors(message), status);
          }),
        )
        .pipe(map((response) => response.data));

         manufacturer = await firstValueFrom(manufacturer);
        


      const type = new Type();
      const typeObject = assignDtoPropToEntity(type, createTypesDto);
      const typeNode = await this.neo4jService.createNode(typeObject, [Neo4jLabelEnum.TYPE]);

      typeNode['properties']['id'] = typeNode['identity'].low;
      const result = { id: typeNode['identity'].low, labels: typeNode['labels'], properties: typeNode['properties'] };
      if (createTypesDto['parentId']) {
        await this.neo4jService.addParentRelationByIdAndFilters(result['id'], {}, createTypesDto['parentId'], {});
      }

      let virtualNode = new VirtualNode();
      const createContactRelationDto = { referenceKey: createTypesDto.manufacturer };
      virtualNode = assignDtoPropToEntity(virtualNode, createContactRelationDto);
      const contactUrl = `${process.env.CONTACT_URL}/${createTypesDto.manufacturer}`;

      virtualNode.url = contactUrl;
      const virtualContactNode = await this.neo4jService.createNode(virtualNode, [
        Neo4jLabelEnum.VIRTUAL,
        Neo4jLabelEnum.CONTACT,
      ]);

      await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
        typeNode.identity.low,
        {},
        virtualContactNode.identity.low,
        {},
        RelationName.MANUFACTURED_BY,
      );
      await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
        typeNode.identity.low,
        {},
        virtualContactNode.identity.low,
        {},
        RelationName.HAS_VIRTUAL_RELATION,
      );

      const typeUrl = `${process.env.TYPE_URL}/${typeNode.properties.key}`;
      const kafkaObject = {
        referenceKey: typeNode.properties.key,
        parentKey: createTypesDto.manufacturer,
        url: typeUrl,
      };
      await this.kafkaService.producerSendMessage('createTypeContactRelation', JSON.stringify(kafkaObject));
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
          console.log('here')
          throw new WrongIdProvided();
        }
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async update(_id: string, updateAssetDto: UpdateTypesDto) {
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

  async delete(_id: string) {
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
