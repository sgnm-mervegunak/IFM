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
import {
  has_children_error,
  invalid_classification,
  node_not_found,
  wrong_parent_error,
} from 'src/common/const/custom.error.object';
import { CustomAssetError } from 'src/common/const/custom.error.enum';
import { NodeNotFound, WrongIdProvided } from 'src/common/bad.request.exception';
import { RelationName } from 'src/common/const/relation.name.enum';
import { HttpRequestHandler } from 'src/common/class/http.request.helper.class';
import { VirtualNodeHandler } from 'src/common/class/virtual.node.dealer';
import { ConfigService } from '@nestjs/config';
import {
  avaiableCreateVirtualPropsGetter,
  avaiableUpdateVirtualPropsGetter,
} from 'src/common/func/virtual.node.props.functions';
import * as moment from 'moment';
@Injectable()
export class TypesRepository implements GeciciInterface<Type> {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly kafkaService: NestKafkaService,
    private readonly httpService: HttpRequestHandler,
    private readonly virtualNodeHandler: VirtualNodeHandler,
    private readonly configService: ConfigService,
  ) {}
  async findByKey(key: string, header) {
    try {
      const nodes = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.TYPE],
        { key, isDeleted: false },
        [],
        { isDeleted: false },
        RelationName.HAS_VIRTUAL_RELATION,
      );
      if (!nodes.length) {
        throw new AssetNotFoundException(key);
      }

      nodes.map((record) => {
        record.get('children').properties.type;
        nodes[0].get('parent').properties[record.get('children').properties.type] =
          record.get('children').properties.referenceKey;
      });

      return nodes[0].get('parent');
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findRootByRealm(header) {
    try {
      const { realm } = header;
      let node = await this.neo4jService.findByLabelAndNotLabelAndFiltersWithTreeStructure(
        [Neo4jLabelEnum.TYPES],
        [],
        { isDeleted: false, realm },
        ['Type'],
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
  async create(createTypesDto: CreateTypesDto, header) {
    try {
      const { realm, authorization, language } = header;
      const rootNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.TYPES], {
        isDeleted: false,
        realm,
      });
      if (!rootNode.length) {
        throw new HttpException(wrong_parent_error(), 400);
      }

      const assetTypesLabel = 'AssetTypes' + '_' + language;
      const assetTypes = await this.neo4jService.findChildrensByLabelsAndFilters([assetTypesLabel], { realm }, [], {
        code: createTypesDto.assetType,
      });
      if (assetTypes.length === 0) {
        throw new HttpException(invalid_classification(), 400);
      }

      //check if manufacturer exist
      const manufacturer = await this.httpService.get(`${process.env.CONTACT_URL}/${createTypesDto.manufacturer}`, {
        authorization,
      });

      if (!createTypesDto.name || createTypesDto.name.trim() === '') {
        createTypesDto['name'] = manufacturer.properties.company + ' ' + createTypesDto.modelNo;
      }

      const uniqnessCheck = await this.neo4jService.findChildrensByLabelsAndFilters(
        [Neo4jLabelEnum.TYPES],
        { realm },
        [Neo4jLabelEnum.TYPE],
        {
          name: createTypesDto.name,
        },
      );

      if (uniqnessCheck.length) {
        throw new HttpException('name musb be uniq', 400);
      }

      const type = new Type();
      const typeObject = assignDtoPropToEntity(type, createTypesDto);
      delete typeObject['manufacturer'];
      delete typeObject['createdBy'];
      delete typeObject['warrantyGuarantorParts'];
      delete typeObject['warrantyGuarantorLabor'];

      const finalObjectArray = avaiableCreateVirtualPropsGetter(createTypesDto);

      for (let index = 0; index < finalObjectArray.length; index++) {
        const url =
          (await this.configService.get(finalObjectArray[index].url)) + '/' + finalObjectArray[index].referenceKey;

        const contact = await this.httpService.get(url, { authorization });
      }

      const typeNode = await this.neo4jService.createNode(typeObject, [Neo4jLabelEnum.TYPE]);

      typeNode['properties']['id'] = typeNode['identity'].low;
      const result = { id: typeNode['identity'].low, labels: typeNode['labels'], properties: typeNode['properties'] };
      await this.neo4jService.addParentRelationByIdAndFilters(result['id'], {}, rootNode[0].get('n').identity.low, {});

      const typeUrl = `${process.env.TYPE_URL}/${typeNode.properties.key}`;

      await this.virtualNodeHandler.createVirtualNode(typeNode.identity.low, typeUrl, finalObjectArray);

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
          throw new HttpException({ message: error.response.message }, error.status);
        }
        if (error.response?.code == CustomAssetError.INVALID_CLASSIFICATION) {
          throw new HttpException({ message: error.response.message }, error.status);
        }
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async update(_id: string, updateTypeDto: UpdateTypesDto, header) {
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

      if (updateTypeDto.assetType) {
        const assetTypesLabel = 'AssetTypes' + '_' + language;
        const assetTypes = await this.neo4jService.findChildrensByLabelsAndFilters([assetTypesLabel], { realm }, [], {
          code: updateTypeDto.assetType,
        });
        if (assetTypes.length === 0) {
          throw new HttpException(invalid_classification(), 400);
        }
      }

      const typeUrl = `${process.env.TYPE_URL}/${node[0].get('children').properties.key}`;

      const finalObjectArray = await avaiableUpdateVirtualPropsGetter(updateTypeDto);

      for (let index = 0; index < finalObjectArray.length; index++) {
        console.log(finalObjectArray[index].newParentKey);
        const url =
          (await this.configService.get(finalObjectArray[index].url)) + '/' + finalObjectArray[index].newParentKey;

        await this.httpService.get(url, { authorization });
      }

      await this.virtualNodeHandler.updateVirtualNode(+_id, typeUrl, finalObjectArray);
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
          throw new HttpException({ message: error.response.message, status: error.status }, 400);
        }
        if (error.response?.code == CustomAssetError.INVALID_CLASSIFICATION) {
          throw new HttpException({ message: error.response.message }, error.status);
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

      const hasChildrenArray = await this.neo4jService.findChildrensByIdAndFilters(
        +_id,
        {},
        [],
        { isDeleted: false, isActive: true },
        'PARENT_OF',
      );

      if (hasChildrenArray.length === 0) {
        deletedNode = await this.neo4jService.updateByIdAndFilter(+_id, {}, [], { isDeleted: true, isActive: false });

        const virtualNodes = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
          [Neo4jLabelEnum.TYPE],
          { key: typeNode.properties.key },
          ['Virtual'],
          { isDeleted: false },
          RelationName.HAS_VIRTUAL_RELATION,
        );
        Object.keys(virtualNodes).forEach(async (element) => {
          deletedVirtualNode = await this.neo4jService.updateByIdAndFilter(
            +virtualNodes[element]['_fields'][1].identity.low,
            {},
            [],
            { isDeleted: true },
          );
        });

        await this.kafkaService.producerSendMessage(
          'deleteVirtualNodeRelations',
          JSON.stringify({ referenceKey: typeNode.properties.key }),
        );
      } else {
        throw new HttpException(has_children_error({ id: _id }), 400);
      }

      return deletedNode;
    } catch (error) {
      const code = error.response?.code;
      if (code === CustomAssetError.HAS_CHILDREN) {
        throw new HttpException({ message: error.response.message }, 400);
      } else if (code === 5005) {
        AssetNotFoundException(_id);
      } else if (code === 5001) {
        AssetNotFoundException(_id);
      } else {
        throw new HttpException(error, code);
      }
    }
  }
}
