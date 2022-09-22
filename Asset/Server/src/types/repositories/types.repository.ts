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
      const { realm } = header;
      let node = await this.neo4jService.findChildrensByLabelsAsTree(
        [Neo4jLabelEnum.TYPES],
        {
          realm,
          isDeleted: false,
        },
        [Neo4jLabelEnum.TYPE],
        { isDeleted: false },
      );
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
      node = { root: node };
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
      console.log(finalObjectArray);

      for (let index = 0; index < finalObjectArray.length; index++) {
        const url =
          (await this.configService.get(finalObjectArray[index].url)) + '/' + finalObjectArray[index].referenceKey;

        await this.httpService.get(url, { authorization });
      }

      const typeNode = await this.neo4jService.createNode(typeObject, [Neo4jLabelEnum.TYPE]);

      typeNode['properties']['id'] = typeNode['identity'].low;
      const result = { id: typeNode['identity'].low, labels: typeNode['labels'], properties: typeNode['properties'] };
      await this.neo4jService.addParentRelationByIdAndFilters(result['id'], {}, rootNode[0].get('n').identity.low, {});

      const typeUrl = `${process.env.TYPE_URL}/${typeNode.properties.key}`;

      this.virtualNodeHandler.createVirtualNode(typeNode.identity.low, typeUrl, finalObjectArray);

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

      const finalObjectArray = avaiableUpdateVirtualPropsGetter(updateTypeDto);

      for (let index = 0; index < finalObjectArray.length; index++) {
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
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async delete(_id: string, header) {
    try {
      const typeNode = await this.neo4jService.findByIdAndFilters(+_id, { isDeleted: false });

      let deletedNode;

      const hasChildrenArray = await this.neo4jService.findChildrensByIdAndFilters(
        +_id,
        {},
        [],
        { isDeleted: false, isActive: true },
        'PARENT_OF',
      );

      if (hasChildrenArray.length === 0) {
        deletedNode = await this.neo4jService.updateByIdAndFilter(+_id, {}, [], {
          isDeleted: true,
          isActive: false,
          updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        });
        await this.kafkaService.producerSendMessage(
          'deleteVirtualNodeRelations',
          JSON.stringify({ referenceKey: typeNode.properties.key }),
        );
      } else {
        throw new HttpException('node has parent relation ', 400);
      }

      return deletedNode;
    } catch (error) {
      const code = error.response?.code;
      if (code === CustomNeo4jError.HAS_CHILDREN) {
        nodeHasChildException(_id);
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
