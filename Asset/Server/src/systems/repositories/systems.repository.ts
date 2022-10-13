import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  AssetNotFoundException,
  FacilityStructureNotFountException,
} from '../../common/notFoundExceptions/not.found.exception';

import { NestKafkaService, nodeHasChildException } from 'ifmcommon';
import { assignDtoPropToEntity, createDynamicCyperObject, CustomNeo4jError, dynamicFilterPropertiesAdder, dynamicLabelAdder, find_with_children_by_realm_as_tree__find_by_realm_error, Neo4jService, required_fields_must_entered } from 'sgnm-neo4j/dist';
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
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';
import { queryObjectType } from "src/common/const/dtos";
import { PaginationParams } from 'src/common/commonDto/pagination.dto';

import  {
  int
} from "neo4j-driver";


@Injectable()
export class SystemsRepository implements SystemsInterface<System> {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly kafkaService: NestKafkaService,
    private readonly httpService: HttpRequestHandler,
    private readonly virtualNodeHandler: VirtualNodeHandler,
    private readonly configService: ConfigService,
    private readonly nodeRelationHandler: NodeRelationHandler,
  ) {}
  async findByKey(key: string, header) {
     const {language} = header;
    try {
      const nodes = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.SYSTEM], { key });
      if (!nodes.length) {
        throw new AssetNotFoundException(key);
      }

      const createdByNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.SYSTEM],
        { key: nodes[0].get('n').properties.key },
        ['Virtual'],
        { isDeleted: false },
        RelationName.CREATED_BY,
      );
      if (createdByNode.length>0) {
      nodes[0].get('n').properties['createdBy'] = createdByNode[0].get('children').properties.referenceKey;
      }
      

      const categoryNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.SYSTEM],
        { key: nodes[0].get('n').properties.key },
        [],
        { isDeleted: false, language: language },
        RelationName.CLASSIFIED_BY
      );
      if (categoryNode.length>0) {
        nodes[0].get('n').properties['category'] =
        categoryNode[0].get('children').properties.code;  
      }
      return nodes[0]['_fields'][0];
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  
  async findRootByRealm(header) {
    try {
      let { realm } = header;
      //realm = 'IFM'; // test için kaldırılacaaaakkkk

      let node = await this.neo4jService.findByLabelAndNotLabelAndFiltersWithTreeStructure(
        [Neo4jLabelEnum.SYSTEMS],
        [],
        { isDeleted: false, realm },
        [],
        ['Virtual'],
        { isDeleted: false },
      );

      if (!node) {
        throw new HttpException(node_not_found({}), 400);
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
        throw new HttpException(wrong_parent_error({}), 400);
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
    let newCategoriesArr = [];
    let relationArr = [];
    let _root_idArr = [];   
    const newCategories = await this.nodeRelationHandler.getNewCategories(realm, systemsDto['category']);


      newCategoriesArr.push(newCategories); 
    relationArr.push(RelationName.CLASSIFIED_BY);
    _root_idArr.push(systemNode.identity.low);
    await this.nodeRelationHandler.manageNodesRelations([], newCategoriesArr,relationArr,_root_idArr);
    
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
      throw new HttpException(node_not_found({}), 400);
    }

    if (node[0]['_fields'][0].properties.realm !== realm) {
      throw new HttpException({ message: 'You dont have permission' }, 403);
    }
    ///////////// update classified_by relations for category //////////////////  
    const category = systemsDto['category'];
    delete systemsDto['category'];
    const newCategories = await this.nodeRelationHandler.getNewCategories(realm, category);
    const oldCategories = await this.nodeRelationHandler.getOldCategories(node[0]['_fields'][1].properties.key, RelationName.CLASSIFIED_BY); 
   
    let categoriesArr = [];
    let newCategoriesArr = [];
    let relationArr = [];
    let _root_idArr = [];

      categoriesArr.push(oldCategories);
      newCategoriesArr.push(newCategories); 
    relationArr.push(RelationName.CLASSIFIED_BY);
    _root_idArr.push(node[0]['_fields'][1].identity.low)
    
    await this.nodeRelationHandler.manageNodesRelations(categoriesArr, newCategoriesArr,relationArr,_root_idArr);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const systemUrl = `${process.env.SYSTEM_URL}/${node[0].get('children').properties.key}`;
    const finalObjectArray = await avaiableUpdateVirtualPropsGetter(systemsDto);
    for (let index = 0; index < finalObjectArray.length; index++) {
      const url =
        (await this.configService.get(finalObjectArray[index].url)) + '/' + finalObjectArray[index].newParentKey;

      await this.httpService.get(url, { authorization });
    }
    await this.virtualNodeHandler.updateVirtualNode(+_id, systemUrl, finalObjectArray);
    delete systemsDto['createdBy'];
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
      const { realm } = header;
      const node = await this.neo4jService.findByIdAndFilters(+_id, { isDeleted: false }, []);

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
         //delete classified_by relations in this database
         let categoriesArr = [];
         let relationArr = [];
         let _root_idArr = [];

         const oldCategories = await this.nodeRelationHandler.getOldCategories(node.properties.key, RelationName.CLASSIFIED_BY);
         
         categoriesArr.push(oldCategories);
         relationArr.push(RelationName.CLASSIFIED_BY);
         _root_idArr.push(node.identity.low);
         await this.nodeRelationHandler.deleteNodesRelations(categoriesArr, relationArr, _root_idArr) 
         //////////////////////////////////////////////
         
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
  async findTypesIncludedBySystem(key: string, header, neo4jQuery: PaginationParams) {
    const systemNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.SYSTEM],
      {"isDeleted": false, "key": key}, [Neo4jLabelEnum.VIRTUAL]);
    if (!systemNode['length']) {
        throw new HttpException(node_not_found({}), 400);
      }  
     
    const types = await this.neo4jService.findChildrensAndParentOfChildrenByIdAndFilter(systemNode[0].get('n').identity.low,
     {"isDeleted": false}, ['Component'], {"isDeleted": false}, 'SYSTEM_OF', ['Type'], {"isDeleted": false}, 'PARENT_OF',neo4jQuery);
     
     let  id = -1;
     let uniqueTypes = [];
     let totalComponent = +0;
     types.forEach(element => {
       totalComponent = totalComponent + +element.get('total');
       if(element.get('parentofchildren').identity.low != id){
         element.get('parentofchildren').properties['leaf'] = false
         uniqueTypes.push(element.get('parentofchildren').properties);
        id = element.get('parentofchildren').identity.low;
       }
     });
     let resultObject =  {"totalCount": totalComponent, "properties": uniqueTypes}
    
     return resultObject;     
  }
  async findComponentsIncludedBySystem(key: string, header, neo4jQuery: PaginationParams) {
    const systemNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.SYSTEM],
      {"isDeleted": false, "key": key}, [Neo4jLabelEnum.VIRTUAL]);
    if (!systemNode['length']) {
        throw new HttpException(node_not_found({}), 400);
      }  
    const systemComponents = await this.neo4jService.findChildrensByIdAndFiltersWithPagination(
      systemNode[0].get('n').identity.low,
      {"isDeleted": false},
      ['Component'],
      {"isDeleted": false},
      RelationName.SYSTEM_OF,
      neo4jQuery
    ); 
    let components = []; 
    systemComponents.forEach((record) => {
      components.push(record.get('children').properties);
    });

     let resultObject =  {"totalCount": systemComponents['length'], "properties": components}
    
     return resultObject;     
  }
}
