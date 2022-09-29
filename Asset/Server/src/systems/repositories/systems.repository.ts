import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  AssetNotFoundException,
  FacilityStructureNotFountException,
} from '../../common/notFoundExceptions/not.found.exception';

import { NestKafkaService, nodeHasChildException } from 'ifmcommon';
import { assignDtoPropToEntity, createDynamicCyperObject, CustomNeo4jError, Neo4jService } from 'sgnm-neo4j/dist';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import {
  has_children_error,
  node_not_found,
  other_microservice_errors,
  wrong_parent_error,
} from 'src/common/const/custom.error.object';
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
import {
  avaiableCreateVirtualPropsGetter,
  avaiableUpdateVirtualPropsGetter,
} from 'src/common/func/virtual.node.props.functions';
import { VirtualNodeHandler } from 'src/common/class/virtual.node.dealer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SystemsRepository implements SystemsInterface<System> {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly kafkaService: NestKafkaService,
    private readonly httpService: HttpRequestHandler,
    private readonly virtualNodeHandler: VirtualNodeHandler,
    private readonly configService: ConfigService,
  ) {}
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
      let { realm } = header;
      realm = 'IFM'; // test için kaldırılacaaaakkkk

      let node = await this.neo4jService.findByLabelAndNotLabelAndFiltersWithTreeStructure(
        [Neo4jLabelEnum.SYSTEMS],
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
  async create(systemsDto: SystemsDto, header) {
    try {
      const { realm, authorization, language } = header;
      const rootNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.SYSTEMS], {
        isDeleted: false,
        realm,
      });
      if (!rootNode.length) {
        throw new HttpException(wrong_parent_error(), 400);
      }

      const uniqnessCheck = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        [Neo4jLabelEnum.SYSTEMS],
        { isDeleted: false, realm },
        [Neo4jLabelEnum.SYSTEM],
        { isDeleted: false, name: systemsDto.name },
        RelationName.PARENT_OF,
        RelationDirection.RIGHT,
      );

      if (uniqnessCheck.length) {
        throw new HttpException('name must be uniq', 400);
      }

      const virtualNodeCreator = new VirtualNodeCreator(this.neo4jService);
      const system = new System();
      const systemObject = assignDtoPropToEntity(system, systemsDto);
      delete systemObject['createdBy'];
      delete systemObject['category'];
      const systemNode = await this.neo4jService.createNode(systemObject, [Neo4jLabelEnum.SYSTEM]);

      systemNode['properties']['id'] = systemNode['identity'].low;
      const result = {
        id: systemNode['identity'].low,
        labels: systemNode['labels'],
        properties: systemNode['properties'],
      };
      const systemUrl = `${process.env.SYSTEM_URL}/${systemNode.properties.key}`;
      await this.neo4jService.addParentRelationByIdAndFilters(result['id'], {}, rootNode[0].get('n').identity.low, {});

      //CREATED BY relation with CONTACT module / CREATED_BY relation from contact to system relation
      const finalObjectArray = avaiableCreateVirtualPropsGetter(systemsDto);
      for (let index = 0; index < finalObjectArray.length; index++) {
        const url =
          (await this.configService.get(finalObjectArray[index].url)) + '/' + finalObjectArray[index].referenceKey;
        const contact = await this.httpService.get(url, { authorization });
      }
      await this.virtualNodeHandler.createVirtualNode(systemNode['identity'].low, systemUrl, finalObjectArray);


      // CLASSIFIED_BY relation creation
      const languages = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        ['Language_Config'],
        { isDeleted: false, realm: realm },
        [],
        { isDeleted: false },
        RelationName.PARENT_OF,
      );
      let classificationRootNone = 'OmniClass21';
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
    const { realm, authorization, language } = header;

    const node = await this.neo4jService.findChildrensByChildIdAndFilters(
      [Neo4jLabelEnum.SYSTEMS],
      { realm },
      +_id,
      { isDeleted: false, isActive: true },
      RelationName.PARENT_OF,
    );
    if (!node.length) {
      throw new HttpException(node_not_found(), 400);
    }

    if (node[0]['_fields'][0].properties.realm !== realm) {
      throw new HttpException({ message: 'You dont have permission' }, 403);
    }

    const systemUrl = `${process.env.SYSTEM_URL}/${node[0].get('children').properties.key}`;

    const finalObjectArray = await avaiableUpdateVirtualPropsGetter(systemsDto);
    for (let index = 0; index < finalObjectArray.length; index++) {
      const url =
        (await this.configService.get(finalObjectArray[index].url)) + '/' + finalObjectArray[index].newParentKey;

      await this.httpService.get(url, { authorization });
    }

    await this.virtualNodeHandler.updateVirtualNode(+_id, systemUrl, finalObjectArray);
    delete systemsDto['createdBy'];
    const category = systemsDto['category'];
    delete systemsDto['category'];

    const updatedNode = await this.neo4jService.updateByIdAndFilter(
      +_id,
      { isDeleted: false, isActive: true },
      [],
      systemsDto,
    );
    if (!updatedNode) {
      throw new FacilityStructureNotFountException(_id);
    }

    ////////////////////////////// update classified_by  relation, if category changed //////////////////////////////////
    const categories = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
      [],
      { isDeleted: false, key: node[0]['_fields'][1].properties.key },
      [],
      { isDeleted: false },
      RelationName.CLASSIFIED_BY,
      RelationDirection.RIGHT,
    );
    const newCategories = await this.neo4jService.findChildrensByLabelsAndFilters(
      ['Classification'],
      { isDeleted: false, realm: node[0]['_fields'][0].properties.realm },
      [],
      { isDeleted: false, code: category },
    );
    if (categories && categories.length > 0) {
      if (categories[0]['_fields'][1]['properties'].code != category) {
        for (let i = 0; i < categories.length; i++) {
          await this.neo4jService.deleteRelationByIdAndRelationNameWithoutFilters(
            node[0]['_fields'][1].identity.low,
            categories[i]['_fields'][1].identity.low,
            RelationName.CLASSIFIED_BY,
            RelationDirection.RIGHT,
          );
        }
        for (let i = 0; i < newCategories.length; i++) {
          await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
            node[0]['_fields'][1].identity.low,
            { isDeleted: false },
            newCategories[i]['_fields'][1].identity.low,
            { isDeleted: false },
            RelationName.CLASSIFIED_BY,
            RelationDirection.RIGHT,
          );
        }
      }
    } else {
      for (let i = 0; i < newCategories.length; i++) {
        await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
          node[0]['_fields'][1].identity.low,
          { isDeleted: false },
          newCategories[i]['_fields'][1].identity.low,
          { isDeleted: false },
          RelationName.CLASSIFIED_BY,
          RelationDirection.RIGHT,
        );
      }
    }

    return updatedNode;

  }

  async delete(_id: string, header) {
    try {
      const { realm } = header;
      //const node = await this.neo4jService.read(`match(n) where id(n)=$id return n`, { id: parseInt(_id) });
      const node = await this.neo4jService.findByIdAndFilters(+_id, { isDeleted: false }, []);
      // if (!node.records[0]) {
      //   throw new HttpException({ code: 5005 }, 404);
      // }

      //await this.neo4jService.getParentById(_id);
      const parentNode = await this.neo4jService.findChildrensByChildIdAndFilters(
        [Neo4jLabelEnum.SYSTEMS],
        { realm },
        +_id,
        { isDeleted: false, isActive: true },
        RelationName.PARENT_OF,
      );
      if (!parentNode || parentNode.length == 0) {
        // hata fırlatılacak (??)
      }

      let deletedNode;
      let deletedVirtualNode;

      // const hasChildren = await this.neo4jService.findChildrenById(_id);
      const hasChildren = await this.neo4jService.findChildrensByIdOneLevel(
        +_id,
        { isDeleted: false },
        ['Component'],
        { isDeleted: false },
        RelationName.CONTAINS_COMPONENT,
      );

      if (hasChildren['length'] == 0) {
        ////////////////////////////// update classified_by  relation, if category changed //////////////////////////////////
        const categories = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        [],
        { isDeleted: false, key: node[0]['_fields'][1].properties.key },
        [],
        { isDeleted: false },
        RelationName.CLASSIFIED_BY,
        RelationDirection.RIGHT,
        );
        
        for (let i = 0; i < categories.length; i++) {
          await this.neo4jService.deleteRelationByIdAndRelationNameWithoutFilters(
            node[0]['_fields'][1].identity.low,
            categories[i]['_fields'][1].identity.low,
            RelationName.CLASSIFIED_BY,
            RelationDirection.RIGHT,
          );
        }



        deletedNode = await this.neo4jService.updateByIdAndFilter(+_id, {}, [], { isDeleted: true, isActive: false });

        const virtualNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
          [Neo4jLabelEnum.SYSTEM],
          { key: node.properties.key },
          ['Virtual'],
          { isDeleted: false },
          RelationName.CREATED_BY,
        );
        if (virtualNode && virtualNode.length > 0) {
          deletedVirtualNode = await this.neo4jService.updateByIdAndFilter(
            +virtualNode[0].get('children').identity.low,
            {},
            [],
            { isDeleted: true },
          );
        }
        
        await this.kafkaService.producerSendMessage(
          'deleteVirtualNodeRelations',
          JSON.stringify({ referenceKey: node.properties.key }),
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
}
