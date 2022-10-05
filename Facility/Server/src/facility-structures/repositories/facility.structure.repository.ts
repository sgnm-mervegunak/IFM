import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  FacilityStructureNotFountException,
  FindWithChildrenByRealmAsTreeException,
  ParentFacilityStructureNotFountException,
} from '../../common/notFoundExceptions/not.found.exception';
import { NestKafkaService } from 'ifmcommon';
import { Neo4jService, assignDtoPropToEntity, createDynamicCyperObject, CustomNeo4jError } from 'sgnm-neo4j/dist';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { RelationName } from 'src/common/const/relation.name.enum';

import { BaseFacilityObject } from 'src/common/baseobject/base.facility.object ';
import { FacilityInterface } from 'src/common/interface/facility.interface';
import * as moment from 'moment';
import { JointSpaces } from '../entities/joint-spaces.entity';
import { Zones } from '../entities/zones.entity';
import {
  FacilityNodeNotFoundException,
  FacilityStructureCanNotDeleteExceptions,
  FacilityStructureDeleteExceptions,
  NotUniqueException,
  ValueNotNullException,
  WrongClassificationParentExceptions,
  WrongFacilityStructurePropsExceptions,
  WrongFacilityStructurePropsRulesExceptions,
} from 'src/common/badRequestExceptions/bad.request.exception';
import {
  has_children_error,
  node_not_found,
  not_unique,
  null_value,
  wrong_parent_error,
} from 'src/common/const/custom.error.object';
import { CustomTreeError } from 'src/common/const/custom.error.enum';
import { CustomIfmCommonError } from 'src/common/const/custom-ifmcommon.error.enum';
import { BaseFacilitySpaceObject } from 'src/common/baseobject/base.facility.space.object';
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';
import { LazyLoadingRepository } from 'src/common/class/lazyLoading.dealer';
import { LazyLoadingPathDto } from 'src/common/dto/lazy.loading.path.dto';
import { Translation } from '../const/translation.enum';

@Injectable()
export class FacilityStructureRepository implements FacilityInterface<any> {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly kafkaService: NestKafkaService,
    private readonly lazyLoadingDealer: LazyLoadingRepository,
    private readonly nodeRelationHandler: NodeRelationHandler,
  ) {}

  //REVISED FOR NEW NEO4J
  async findOneByRealm(realm: string, language: string) {
    const tree = await this.lazyLoadingDealer.loadByLabel(
      'FacilityStructure',
      { realm, isDeleted: false },
      { isDeleted: false },
      { isDeleted: false, canDisplay: true },
    );
    return tree;
  }

  //////////////////////////  Dynamic DTO  /////////////////////////////////////////////////////////////////////////////////////////
  async update(key: string, structureData: Object, realm: string, language: string) {
    //is there facility-structure node
    try {
      const node = await this.neo4jService.findByLabelAndFilters([], { isDeleted: false, key: key }, ['Virtual']);
      const structureRootNode = await this.neo4jService.findChildrensByLabelsAndFilters(
        ['FacilityStructure'],
        { isDeleted: false },
        [],
        { isDeleted: false, key: node[0]['_fields'][0].properties.key },
      );
      //check if rootNode realm equal to keyclock token realm
      if (structureRootNode[0]['_fields'][0].properties.realm !== realm) {
        throw new HttpException({ message: 'You dont have permission' }, 403);
      }

      //name property uniqueness  control
      if (
        node[0]['_fields'][0].labels[0] == 'Space' ||
        node[0]['_fields'][0].labels[0] == 'Block' ||
        node[0]['_fields'][0].labels[0] == 'Floor'
      ) {
        let building;

        building = await this.neo4jService.findChildrensByChildIdAndFilters(
          ['Building'],
          { isDeleted: false },
          node[0]['_fields'][0].identity.low,
          { isDeleted: false },
          RelationName.PARENT_OF,
        );

        let sameNameNode = await this.neo4jService.findChildrensByIdAndFilters(
          building[0]['_fields'][0].identity.low,
          { isDeleted: false },
          [structureData['nodeType']],
          { isDeleted: false, name: structureData['name'] },
          RelationName.PARENT_OF,
        );
        if (sameNameNode && sameNameNode.length > 0) {
          if (sameNameNode[0]['_fields'][1].properties.key != key) {
            throw new HttpException(not_unique({ val: structureData['name'] }), 400);
          }
        }
      } else {
        let sameNameNode = await this.neo4jService.findChildrensByIdAndFilters(
          structureRootNode[0]['_fields'][0].identity.low,
          { isDeleted: false },
          [structureData['nodeType']],
          { isDeleted: false, name: structureData['name'] },
          RelationName.PARENT_OF,
        );
        if (sameNameNode && sameNameNode.length > 0) {
          if (sameNameNode[0]['_fields'][1].properties.key != key) {
            throw new HttpException(not_unique({ val: structureData['name'] }), 400);
          }
        }
      }

      const properties = await this.findChildrenByFacilityTypeNode(
        structureData['nodeType'],
        structureRootNode[0]['_fields'][0].properties.realm,
        'en',
      );
      let proper = {};
      Object.keys(properties).forEach((element) => {
        let prop = properties[element]['label'].split(' ');
        let pro = '';
        Object.keys(prop).forEach((element) => {
          pro = pro + prop[element];
        });
        properties[element]['label'] = pro;
      });
      Object.keys(structureData).forEach((property) => {
        if (property != 'nodeType') {
          let i = 0;
          Object.keys(properties).forEach((element) => {
            if (property == properties[element]['label']) {
              i = 1;
            }
          });
          if (i == 0) {
            throw new WrongFacilityStructurePropsExceptions(structureData['nodeType']);
          }
        }
      });

      //update facility structure node
      const updatedOn = moment().format('YYYY-MM-DD HH:mm:ss');
      structureData['updatedOn'] = updatedOn;
      Object.entries(structureData).forEach((element) => {
        if (element[1] === null || element[1] === undefined) {
          structureData[element[0]] = 0;
        }
      });
      const dynamicObject = createDynamicCyperObject(structureData);
      delete dynamicObject['usage'];
      delete dynamicObject['status'];
      delete dynamicObject['category'];
      delete dynamicObject['createdBy'];

      //const updatedNode = await this.neo4jService.updateById(node[0]["_fields"][0].identity.low, dynamicObject);
      const updatedNode = await this.neo4jService.updateByIdAndFilter(
        node[0]['_fields'][0].identity.low,
        { isDeleted: false },
        [],
        dynamicObject,
      );

      const category = structureData['category'];
      const usage = structureData['usage'];
      const status = structureData['status'];

      //////////////////////////////////// update CLASSIFIED_BY //////////////////
      if (structureData['nodeType'] != 'Block') {
        const newCategories = await this.nodeRelationHandler.getNewCategories(realm, category);
        const oldCategories = await this.nodeRelationHandler.getOldCategories(
          updatedNode.properties.key,
          RelationName.CLASSIFIED_BY,
        );
        let categoriesArr = [];
        let newCategoriesArr = [];
        let relationArr = [];
        let _root_idArr = [];

        categoriesArr.push(oldCategories);
        newCategoriesArr.push(newCategories);
        relationArr.push(RelationName.CLASSIFIED_BY);
        _root_idArr.push(updatedNode.identity.low);

        await this.nodeRelationHandler.manageNodesRelations(categoriesArr, newCategoriesArr, relationArr, _root_idArr);
      }
      //////////////////////////////////// update STATUS_BY //////////////////
      if (structureData['nodeType'] == 'Space' || structureData['nodeType'] == 'Building') {
        const newStatus = await this.nodeRelationHandler.getNewCategories(realm, status);
        const oldStatus = await this.nodeRelationHandler.getOldCategories(
          updatedNode.properties.key,
          RelationName.STATUS_BY,
        );

        let categoriesArr = [];
        let newCategoriesArr = [];
        let relationArr = [];
        let _root_idArr = [];

        categoriesArr.push(oldStatus);
        newCategoriesArr.push(newStatus);
        relationArr.push(RelationName.STATUS_BY);
        _root_idArr.push(updatedNode.identity.low);

        await this.nodeRelationHandler.manageNodesRelations(categoriesArr, newCategoriesArr, relationArr, _root_idArr);
      }

      //////////////////////////////////// update USAGE_BY ///////////////////////////////////
      if (structureData['nodeType'] == 'Space') {
        const newUsages = await this.nodeRelationHandler.getNewCategories(realm, usage);
        const oldUsages = await this.nodeRelationHandler.getOldCategories(
          updatedNode.properties.key,
          RelationName.USAGE_BY,
        );

        let categoriesArr = [];
        let newCategoriesArr = [];
        let relationArr = [];
        let _root_idArr = [];

        categoriesArr.push(oldUsages);
        newCategoriesArr.push(newUsages);
        relationArr.push(RelationName.USAGE_BY);
        _root_idArr.push(updatedNode.identity.low);
        await this.nodeRelationHandler.manageNodesRelations(categoriesArr, newCategoriesArr, relationArr, _root_idArr);
      }
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      const response = {
        id: updatedNode['identity'].low,
        labels: updatedNode['labels'],
        properties: updatedNode['properties'],
      };
      return response;
    } catch (error) {
      let code = error.response?.code;
      if (code >= 1000 && code <= 1999) {
        if (error.response?.code == CustomIfmCommonError.EXAMPLE1) {
        }
      } else if (code >= 5000 && code <= 5999) {
      } else if (code >= 9000 && code <= 9999) {
        if (error.response?.code == CustomTreeError.WRONG_PARENT) {
          throw new WrongClassificationParentExceptions(
            error.response?.params['node1'],
            error.response?.params['node2'],
          );
        }
        if (error.response?.code == CustomTreeError.NULL_VALUE) {
          throw new ValueNotNullException(error.response?.params['val']);
        }
        if (error.response?.code == CustomTreeError.NOT_UNIQUE) {
          throw new NotUniqueException(error.response?.params['val']);
        }
      } else {
        throw new HttpException('', 500);
      }
    }
  }
  //REVISED FOR NEW NEO4J
  async delete(_id: string, realm: string, language: string) {
    try {
      const node = await this.neo4jService.findByIdAndFilters(+_id, { isDeleted: false }, ['Virtual']);
      await this.neo4jService.getParentByIdAndFilters(+_id, { isDeleted: false }, { isDeleted: false });
      const hasChildren = await this.neo4jService.findChildrensByIdOneLevel(
        +_id,
        { isDeleted: false },
        [],
        { isDeleted: false },
        'PARENT_OF',
      );
      let canDelete = false;
      if (hasChildren.length == 0) {
        canDelete = true;
      } else if (
        node['properties']['nodeType'] == 'Building' &&
        hasChildren.length == 1 &&
        hasChildren[0]['_fields'][1]['labels'][0] == 'JointSpaces'
      ) {
        canDelete = true;
      } else if (
        node['properties']['nodeType'] == 'Building' &&
        hasChildren.length == 1 &&
        hasChildren[0]['_fields'][1]['labels'][0] == 'Zones'
      ) {
        canDelete = true;
      } else if (
        node['properties']['nodeType'] == 'Building' &&
        hasChildren.length == 2 &&
        (hasChildren[0]['_fields'][1]['labels'][0] == 'JointSpaces' ||
          hasChildren[0]['_fields'][1]['labels'][0] == 'Zones') &&
        (hasChildren[1]['_fields'][1]['labels'][0] == 'JointSpaces' ||
          hasChildren[1]['_fields'][1]['labels'][0] == 'Zones')
      ) {
        canDelete = true;
      }
      if (!canDelete) {
        throw new HttpException(has_children_error({ node1: node['properties']['name'], node2: '' }), 400);
      } else {
        //delete CLASSIFIED_BY , CREATED_BY /////////////////////////////////////////////////////
        if (!node.labels.includes('Block')) {
          let categoriesArr = [];
          let relationArr = [];
          let _root_idArr = [];

          const oldCategories = await this.nodeRelationHandler.getOldCategories(
            node.properties.key,
            RelationName.CLASSIFIED_BY,
          );
          const oldCreatedBy = await this.nodeRelationHandler.getOldCategories(
            node.properties.key,
            RelationName.CREATED_BY,
          );

          categoriesArr.push(oldCategories, oldCreatedBy);
          relationArr.push(RelationName.CLASSIFIED_BY, RelationName.CREATED_BY);
          _root_idArr.push(node.identity.low, node.identity.low);
          await this.nodeRelationHandler.deleteNodesRelations(categoriesArr, relationArr, _root_idArr);
        }
        //delete STATUS_BY relations in this database /////////////////////////////////////////////////////
        if (node.labels.includes('Space') || node.labels.includes('Building')) {
          let categoriesArr = [];
          let relationArr = [];
          let _root_idArr = [];
          const oldStatus = await this.nodeRelationHandler.getOldCategories(
            node.properties.key,
            RelationName.STATUS_BY,
          );
          categoriesArr.push(oldStatus);
          relationArr.push(RelationName.STATUS_BY);
          _root_idArr.push(node.identity.low);
          await this.nodeRelationHandler.deleteNodesRelations(categoriesArr, relationArr, _root_idArr);
        }
        //delete USAGE_BY relations in this database /////////////////////////////////////////////////////
        if (node.labels.includes('Space')) {
          let categoriesArr = [];
          let relationArr = [];
          let _root_idArr = [];

          const oldUsages = await this.nodeRelationHandler.getOldCategories(node.properties.key, RelationName.USAGE_BY);

          categoriesArr.push(oldUsages);
          relationArr.push(RelationName.USAGE_BY);
          _root_idArr.push(node.identity.low);
          await this.nodeRelationHandler.deleteNodesRelations(categoriesArr, relationArr, _root_idArr);
        }

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        let deletedNode = await this.neo4jService.updateByIdAndFilter(+_id, { isDeleted: false, canDelete: true }, [], {
          isDeleted: true,
        });
        if (!deletedNode) {
          throw new FacilityStructureNotFountException(_id);
        }

        const hasAssetRelation = await this.neo4jService.findChildrensByIdOneLevel(
          +_id,
          { isDeleted: true }, // yukarıda silindi
          [],
          { isDeleted: false },
          'HAS',
        );

        if (hasAssetRelation.length > 0) {
          await this.kafkaService.producerSendMessage(
            'deleteStructure',
            JSON.stringify({ referenceKey: node.properties.key }),
          );
        }

        return deletedNode;
      }
    } catch (error) {
      const { code, message } = error.response;
      if (code === CustomNeo4jError.NOT_FOUND) {
        throw new FacilityStructureNotFountException(_id);
      } else if (code === CustomNeo4jError.PARENT_NOT_FOUND) {
        throw new ParentFacilityStructureNotFountException(_id);
      } else if (code === CustomTreeError.HAS_CHILDREN) {
        throw new FacilityStructureDeleteExceptions(error.response?.params['node1']);
      } else if (code === CustomNeo4jError.NODE_CANNOT_DELETE) {
        throw new FacilityStructureCanNotDeleteExceptions(_id);
      } else {
        throw new HttpException(message, code);
      }
    }
  }

  //REVISED FOR NEW NEO4J
  async changeNodeBranch(_id: string, target_parent_id: string, realm: string, language: string) {
    try {
      const new_parent = await this.neo4jService.findByIdAndFilters(+target_parent_id, { isDeleted: false }, []);
      const node = await this.neo4jService.findByIdAndFilters(+_id, { isDeleted: false }, []);
      const nodeChilds = await this.neo4jService.findChildrensByIdAndFilters(
        +_id,
        { isDeleted: false },
        [],
        { isDeleted: false },
        'PARENT_OF',
      );
      const parent_of_new_parent = await this.neo4jService.getParentByIdAndFilters(
        new_parent['identity'].low,
        { isDeleted: false },
        {},
      );

      if (parent_of_new_parent && parent_of_new_parent['_fields'][0]['identity'].low == _id) {
        if (language == 'tr') {
          node['properties'].nodeType = Translation[node['properties'].nodeType];
          new_parent['properties'].nodeType = Translation[new_parent['properties'].nodeType];
        }
        throw new HttpException(
          wrong_parent_error({ node1: node['properties'].nodeType, node2: new_parent['properties'].nodeType }),
          400,
        );
      }
      for (let i = 0; i < nodeChilds['length']; i++) {
        if (
          parent_of_new_parent &&
          parent_of_new_parent['_fields'][0]['identity'].low == nodeChilds[i]['_fields'][1]['identity'].low
        ) {
          if (language == 'tr') {
            node['properties'].nodeType = Translation[node['properties'].nodeType];
            new_parent['properties'].nodeType = Translation[new_parent['properties'].nodeType];
          }
          throw new HttpException(
            wrong_parent_error({ node1: node['properties'].nodeType, node2: new_parent['properties'].nodeType }),
            400,
          );
        }
      }

      if (new_parent['labels'] && new_parent['labels'][0] == 'FacilityStructure') {
        if (!node['labels'] || node['labels'].length == 0 || node['labels'][0] != 'Building') {
          if (language == 'tr') {
            node['properties'].nodeType = Translation[node['properties'].nodeType];
            new_parent['properties'].nodeType = Translation[new_parent['properties'].nodeType];
          }

          throw new HttpException(
            wrong_parent_error({ node1: node['properties'].nodeType, node2: new_parent['properties'].nodeType }),
            400,
          );
        }
      }

      //Control of moving  between facility type nodes ////////////////////////////////////////////
      let structureRootNode;
      if (new_parent.labels[0] === 'FacilityStructure') {
        structureRootNode = node;
      } else {
        structureRootNode = await this.neo4jService.findChildrensByLabelsAndFilters(
          ['FacilityStructure'],
          { isDeleted: false },
          [],
          { isDeleted: false, key: new_parent.properties.key },
        );
      }
      const allowedStructureTypeNode = await this.neo4jService.findChildrensByLabelsOneLevel(
        ['FacilityTypes_en'],
        { isDeleted: false, realm: structureRootNode[0]['_fields'][0].properties.realm },
        [],
        { isDeleted: false, name: new_parent.labels[0] },
      );

      const allowedStructures = await this.neo4jService.findChildrensByLabelsOneLevel(
        [],
        { isDeleted: false, key: allowedStructureTypeNode[0]['_fields'][1].properties.key },
        ['AllowedStructure'],
        { isDeleted: false },
      );

      const isExist = allowedStructures.filter((allowedStructure) => {
        if (allowedStructure['_fields'][1].properties.name === node.properties.nodeType) {
          return allowedStructure;
        }
      });
      if (!isExist.length) {
        if (language == 'tr') {
          node['properties'].nodeType = Translation[node['properties'].nodeType];
          new_parent['properties'].nodeType = Translation[new_parent['properties'].nodeType];
        }
        throw new HttpException(
          wrong_parent_error({ node1: node.properties.nodeType, node2: new_parent.properties.nodeType }),
          400,
        );
      }

      const old_parent = await this.neo4jService.getParentByIdAndFilters(
        +_id,
        { isDeleted: false },
        { isDeleted: false },
      );
      if (old_parent != undefined) {
        await this.neo4jService.deleteRelationByIdAndRelationNameWithFilters(
          old_parent['_fields'][0]['identity'].low,
          {},
          +_id,
          {},
          'PARENT_OF',
          RelationDirection.RIGHT,
        );
      }
      await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
        +target_parent_id,
        { isDeleted: false, isActive: true },
        +_id,
        { isDeleted: false },
        'PARENT_OF',
        RelationDirection.RIGHT,
      );
    } catch (error) {
      let code = error.response?.code;
      if (code >= 1000 && code <= 1999) {
        if (error.response?.code == CustomIfmCommonError.EXAMPLE1) {
        }
      } else if (code >= 5000 && code <= 5999) {
        if (error.response?.code == CustomNeo4jError.ADD_CHILDREN_RELATION_BY_ID_ERROR) {
          // örnek değişecek
          throw new WrongClassificationParentExceptions(_id, target_parent_id);
        }
      } else if (code >= 9000 && code <= 9999) {
        if (error.response?.code == CustomTreeError.WRONG_PARENT) {
          throw new WrongClassificationParentExceptions(
            error.response?.params['node1'],
            error.response?.params['node2'],
          );
        }
      } else {
        throw new HttpException('', 500);
      }
    }
  }

  //REVISED FOR NEW NEO4J
  async findOneNodeByKey(key: string, realm: string, language: string) {
    try {
      let node = await this.neo4jService.findByLabelAndFilters([], { isDeleted: false, key: key }, ['Virtual']);
      if (!node || node.length == 0) {
        throw new HttpException(node_not_found({ node1: '', node2: '' }), 404);
      }
      node = node[0]['_fields'][0];

      const classNode = await this.neo4jService.findChildrensByIdOneLevel(
        node['identity'].low,
        { isDeleted: false },
        [],
        { isDeleted: false, language: language },
        RelationName.CLASSIFIED_BY,
      );
      if (classNode && classNode.length) {
        node['properties']['category'] = classNode[0]['_fields'][1]['properties'].code;
      }

      const usageNode = await this.neo4jService.findChildrensByIdOneLevel(
        node['identity'].low,
        { isDeleted: false },
        [],
        { isDeleted: false, language: language },
        RelationName.USAGE_BY,
      );
      if (usageNode && usageNode.length) {
        node['properties']['usage'] = usageNode[0]['_fields'][1]['properties'].code;
      }

      const statusNode = await this.neo4jService.findChildrensByIdOneLevel(
        node['identity'].low,
        { isDeleted: false },
        [],
        { isDeleted: false, language: language },
        RelationName.STATUS_BY,
      );
      if (statusNode && statusNode.length) {
        node['properties']['status'] = statusNode[0]['_fields'][1]['properties'].code;
      }

      const categoryByNode = await this.neo4jService.findChildrensByIdOneLevel(
        node['identity'].low,
        { isDeleted: false },
        [],
        { isDeleted: false },
        RelationName.CREATED_BY,
      );
      if (categoryByNode && categoryByNode.length) {
        node['properties']['createdBy'] = categoryByNode[0]['_fields'][1]['properties'].key;
      }

      const result = {
        id: node['identity'].low,
        labels: node['labels'],
        properties: node['properties'],
      };

      return result;
    } catch (error) {
      let code = error.response?.code;
      if (code >= 1000 && code <= 1999) {
        if (error.response?.code == CustomIfmCommonError.EXAMPLE1) {
        }
      } else if (code >= 5000 && code <= 5999) {
      } else if (code >= 9000 && code <= 9999) {
        if (error.response?.code == CustomTreeError.NODE_NOT_FOUND) {
          throw new FacilityNodeNotFoundException();
        }
      } else {
        throw new HttpException('', 500);
      }
    }
  }

  //REVISED FOR NEW NEO4J
  async findOneFirstLevelByRealm(label: string, realm: string, language: string) {
    if (label == 'FacilityTypes') {
      language = 'en';
    }
    let node = await this.neo4jService.findByLabelAndNotLabelAndFiltersWithTreeStructureOneLevel(
      [label + '_' + language],
      ['Virtual'],
      { isDeleted: false, realm: realm },
      [],
      ['Virtual'],
      { isDeleted: false, canDisplay: true }, //parent ve child filter objelerde aynı
      //properti ler kullanılırsa değerleri aynı
      // olmalıdır.
    );
    if (!node) {
      throw new FacilityStructureNotFountException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);
    return node['root']['children'];
  }

  //REVISED FOR NEW NEO4J
  async findChildrenByFacilityTypeNode(typename: string, realm: string, language: string) {
    let parent_node = await this.neo4jService.findByLabelAndFilters(
      ['FacilityTypes_'+language],
      { isDeleted: false, realm: realm },
      [],
    );
    let type_node = await this.neo4jService.findChildrensByIdOneLevel(
      parent_node[0]['_fields'][0]['identity'].low,
      { isDeleted: false },
      ['FacilityType'],
      { isDeleted: false, name: typename },
      RelationName.PARENT_OF,
    );
    let node = await this.neo4jService.findChildrensByIdOneLevel(
      type_node[0]['_fields'][1]['identity'].low,
      { isDeleted: false },
      ['FacilityTypeProperty'],
      { isDeleted: false, isActive: true, canDisplay: true },
      RelationName.PARENT_OF,
    );

    if (!node) {
      throw new FacilityStructureNotFountException(realm); //DEĞİŞECEK
    }
    if (node && node[0]) {
      let propertyList = [];
      for (let i = 0; i < node.length; i++) {
        let property = node[i];
        property['_fields'][1]['properties']._id = property['_fields'][1]['identity']['low'];
        propertyList.push(property['_fields'][1]['properties']);
      }
      return propertyList;
    }
    return [];
  }

  //////////////////////////  Dynamic DTO  /////////////////////////////////////////////////////////////////////////////////////////
  async create(key: string, structureData: object, realm: string, language: string) {
    try {
      if (!structureData['category'] || structureData['category'] == null) {
        if (structureData['nodeType'] != 'Block') {
          throw new HttpException(null_value({ val: 'category' }), 400);
        }
      }
      //is there facility-structure parent node
      const node = await this.neo4jService.findByLabelAndFilters([], { isDeleted: false, key: key }, ['Virtual']);

      //////////////////////////// Control of childnode type which will be added to parent node. /////////////////////////////////////////
      let structureRootNode;
      if (node[0]['_fields'][0].labels[0] === 'FacilityStructure') {
        structureRootNode = node;
      } else {
        structureRootNode = await this.neo4jService.findChildrensByLabelsAndFilters(
          ['FacilityStructure'],
          { isDeleted: false },
          [],
          { isDeleted: false, key: node[0]['_fields'][0].properties.key },
        );
      }
      //!!!!!!!!!!!!
      //check if rootNode realm equal to keyclock token realm
      if (structureRootNode[0]['_fields'][0].properties.realm !== realm) {
        throw new HttpException({ message: 'You dont have permission' }, 403);
      }
      ///////////////////////////// parent - child node type relation control ////////////////////////////

      const allowedStructureTypeNode = await this.neo4jService.findChildrensByLabelsOneLevel(
        ['FacilityTypes_en'],
        { isDeleted: false, realm: structureRootNode[0]['_fields'][0].properties.realm },
        [],
        { isDeleted: false, name: node[0]['_fields'][0].labels[0] },
      );

      const allowedStructures = await this.neo4jService.findChildrensByLabelsOneLevel(
        [],
        { isDeleted: false, key: allowedStructureTypeNode[0]['_fields'][1].properties.key },
        ['AllowedStructure'],
        { isDeleted: false },
      );

      const isExist = allowedStructures.filter((allowedStructure) => {
        if (allowedStructure['_fields'][1].properties.name === structureData['nodeType']) {
          return allowedStructure;
        }
      });
      if (!isExist.length) {
        throw new HttpException(
          wrong_parent_error({ node1: structureData['nodeType'], node2: node[0]['_fields'][0].labels[0] }),
          400,
        );
      }

      //name property uniqueness  control
      if (
        node[0]['_fields'][0].labels[0] == 'Building' ||
        node[0]['_fields'][0].labels[0] == 'Block' ||
        node[0]['_fields'][0].labels[0] == 'Floor'
      ) {
        let building;
        if (node[0]['_fields'][0].labels[0] == 'Building') {
          building = node;
        } else {
          building = await this.neo4jService.findChildrensByChildIdAndFilters(
            ['Building'],
            { isDeleted: false },
            node[0]['_fields'][0].identity.low,
            { isDeleted: false },
            RelationName.PARENT_OF,
          );
        }
        let sameNameNode = await this.neo4jService.findChildrensByIdAndFilters(
          building[0]['_fields'][0].identity.low,
          { isDeleted: false },
          [structureData['nodeType']],
          { isDeleted: false, name: structureData['name'] },
          RelationName.PARENT_OF,
        );
        if (sameNameNode && sameNameNode.length > 0) {
          throw new HttpException(not_unique({ val: structureData['name'] }), 400);
        }
      } else {
        let sameNameNode = await this.neo4jService.findChildrensByIdAndFilters(
          structureRootNode[0]['_fields'][0].identity.low,
          { isDeleted: false },
          [structureData['nodeType']],
          { isDeleted: false, name: structureData['name'] },
          RelationName.PARENT_OF,
        );
        if (sameNameNode && sameNameNode.length > 0) {
          throw new HttpException(not_unique({ val: structureData['name'] }), 400);
        }
      }

      ////////////////////////////// Control of input properties with facility type properties //////////////////////////////////////////////////
      const properties = await this.findChildrenByFacilityTypeNode(
        structureData['nodeType'],
        structureRootNode[0]['_fields'][0].properties.realm,
        'en',
      );
      let proper = {};
      Object.keys(properties).forEach((element) => {
        let prop = properties[element]['label'].split(' ');
        let pro = '';
        Object.keys(prop).forEach((element) => {
          pro = pro + prop[element];
        });
        properties[element]['label'] = pro;
      });
      Object.keys(structureData).forEach((property) => {
        if (property != 'nodeType') {
          let i = 0;
          Object.keys(properties).forEach((element) => {
            if (property == properties[element]['label']) {
              i = 1;
              if (
                properties[element]['rules'] &&
                properties[element]['type'] == 'text' &&
                properties[element]['rules'].includes('not null')
              ) {
                if (
                  structureData[property] == null ||
                  structureData[property] == '' ||
                  structureData[property] == undefined
                ) {
                  throw new WrongFacilityStructurePropsRulesExceptions(property, 'not null');
                }
              }
            }
          });
          if (i == 0) {
            throw new WrongFacilityStructurePropsExceptions(structureData['nodeType']);
          }
        }
      });

      let baseFacilityObject;
      if (structureData['nodeType'] === 'Space') {
        baseFacilityObject = new BaseFacilitySpaceObject();
      } else {
        baseFacilityObject = new BaseFacilityObject();
      }

      Object.entries(structureData).forEach((element) => {
        if (element[1] === null || element[1] === undefined) {
          structureData[element[0]] = 0;
        }
      });

      baseFacilityObject = assignDtoPropToEntity(baseFacilityObject, structureData);

      let createdBy = baseFacilityObject['createdBy'];
      delete baseFacilityObject['createdBy'];
      delete baseFacilityObject['category'];
      delete baseFacilityObject['usage'];
      delete baseFacilityObject['status'];

      const createNode = await this.neo4jService.createNode(baseFacilityObject, [structureData['nodeType']]);

      //////////////////////////////////////////////  CREATED_BY,CLASSIFIED_BY relations  ///////////////////////////////////////
      if (structureData['nodeType'] != 'Block') {
        let newCategoriesArr = [];
        let relationArr = [];
        let _root_idArr = [];
        const newCategories = await this.nodeRelationHandler.getNewCategories(realm, structureData['category']);
        const contactNode = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
          ['Contact'],
          { isDeleted: false, realm: realm },
          [],
          { isDeleted: false, email: createdBy },
          'PARENT_OF',
        );
        newCategoriesArr.push(newCategories);
        relationArr.push(RelationName.CLASSIFIED_BY);
        _root_idArr.push(createNode.identity.low);

        newCategoriesArr.push(contactNode);
        relationArr.push(RelationName.CREATED_BY);
        _root_idArr.push(createNode.identity.low);

        await this.nodeRelationHandler.manageNodesRelations([], newCategoriesArr, relationArr, _root_idArr);
      }
      //////////////////////////////////////////////  STATUS_BY relations  ///////////////////////////////////////
      if (structureData['nodeType'] == 'Space' || structureData['nodeType'] == 'Building') {
        let newCategoriesArr = [];
        let relationArr = [];
        let _root_idArr = [];

        const newStatus = await this.nodeRelationHandler.getNewCategories(realm, structureData['status']);
        newCategoriesArr.push(newStatus);
        relationArr.push(RelationName.STATUS_BY);
        _root_idArr.push(createNode.identity.low);
        await this.nodeRelationHandler.manageNodesRelations([], newCategoriesArr, relationArr, _root_idArr);
      }
      //////////////////////////////////////////////  STATUS_BY relations  ///////////////////////////////////////
      if (structureData['nodeType'] == 'Space') {
        let newCategoriesArr = [];
        let relationArr = [];
        let _root_idArr = [];

        const newUsages = await this.nodeRelationHandler.getNewCategories(realm, structureData['usage']);
        newCategoriesArr.push(newUsages);
        relationArr.push(RelationName.USAGE_BY);
        _root_idArr.push(createNode.identity.low);
        await this.nodeRelationHandler.manageNodesRelations([], newCategoriesArr, relationArr, _root_idArr);
      }
      //////////////////////////////////////////////////////////////////////////////////////////////////////////////

      ///////create PARENT_OF relation between parent facility structure node and child facility structure node.  //////
      await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
        node[0]['_fields'][0].identity.low,
        { isDeleted: false, isActive: true },
        createNode.identity.low,
        { isDeleted: false },
        RelationName.PARENT_OF,
        RelationDirection.RIGHT,
      );
      let jointSpaces = new JointSpaces();
      let zones = new Zones();
      if (createNode['labels'][0] === 'Building') {
        const createJointSpacesNode = await this.neo4jService.createNode(jointSpaces, ['JointSpaces']);

        await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
          createNode.identity.low,
          { isDeleted: false },
          createJointSpacesNode.identity.low,
          { isDeleted: false },
          RelationName.PARENT_OF,
          RelationDirection.RIGHT,
        );

        const createZoneNode = await this.neo4jService.createNode(zones, ['Zones']);

        await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
          createNode.identity.low,
          { isDeleted: false },
          createZoneNode.identity.low,
          { isDeleted: false },
          RelationName.PARENT_OF,
          RelationDirection.RIGHT,
        );
      }

      const response = {
        id: createNode['identity'].low,
        labels: createNode['labels'],
        properties: createNode['properties'],
      };
      return response;
    } catch (error) {
      let code = error.response?.code;
      if (code >= 1000 && code <= 1999) {
        if (error.response?.code == CustomIfmCommonError.EXAMPLE1) {
        }
      } else if (code >= 5000 && code <= 5999) {
      } else if (code >= 9000 && code <= 9999) {
        if (error.response?.code == CustomTreeError.WRONG_PARENT) {
          throw new WrongClassificationParentExceptions(
            error.response?.params['node1'],
            error.response?.params['node2'],
          );
        }
        if (error.response?.code == CustomTreeError.NULL_VALUE) {
          throw new ValueNotNullException(error.response?.params['val']);
        }
        if (error.response?.code == CustomTreeError.NOT_UNIQUE) {
          throw new NotUniqueException(error.response?.params['val']);
        }
      } else {
        throw new HttpException('', 500);
      }
    }
  }

  //REVISED FOR NEW NEO4J
  async findStructureFirstLevelNodes(key: string, leafType, realm: string, language: string) {
    try {
      const tree = await this.lazyLoadingDealer.loadByKey(
        key,
        leafType,
        { isDeleted: false, canDisplay: true },
        { isDeleted: false, canDisplay: true },
        { isDeleted: false },
      );
      return tree;
    } catch (error) {
      const code = error.response?.code;
      if (code >= 1000 && code <= 1999) {
        if (error.response?.code == CustomIfmCommonError.EXAMPLE1) {
        }
      } else if (code >= 5000 && code <= 5999) {
        if (
          error.response?.code == CustomNeo4jError.FIND_BY_REALM_WITH_TREE_STRUCTURE_ERROR ||
          error.response?.code == CustomNeo4jError.FIND_WITH_CHILDREN_BY_REALM_AS_TREE_ERROR ||
          error.response?.code == CustomNeo4jError.FIND_WITH_CHILDREN_BY_REALM_AS_TREE__FIND_BY_REALM_ERROR
        ) {
          throw new FindWithChildrenByRealmAsTreeException(realm, 'label');
        }
      } else if (code >= 9000 && code <= 9999) {
      } else {
        throw new HttpException('', 500);
      }
    }
  }

  async addPlanToFloor(key: string, realm: string, language: string) {
    //is there facility-structure node
    const node = await this.neo4jService.findByLabelAndFilters([], { isDeleted: false, key: key }, ['Virtual']);
    const structureRootNode = await this.neo4jService.findChildrensByLabelsAndFilters(
      ['FacilityStructure'],
      { isDeleted: false },
      [],
      { isDeleted: false, key: node[0]['_fields'][0].properties.key },
    );

    //check if rootNode realm equal to keyclock token realm
    if (structureRootNode[0]['_fields'][0].properties.realm !== realm) {
      throw new HttpException({ message: 'You dont have permission' }, 403);
    }

    if (node[0]['_fields'][0].properties.nodeType !== 'Floor') {
      throw new HttpException({ message: 'You can add plan only to floor' }, 403);
    }

    node[0]['_fields'][0].properties.hasPlan = true;
    const updatedNode = await this.neo4jService.updateByIdAndFilter(
      node[0]['_fields'][0].identity.low,
      { isDeleted: false },
      [],
      node[0]['_fields'][0].properties,
    );
    const response = {
      id: updatedNode['identity'].low,
      labels: updatedNode['labels'],
      properties: updatedNode['properties'],
    };
    return response;
  }
}
