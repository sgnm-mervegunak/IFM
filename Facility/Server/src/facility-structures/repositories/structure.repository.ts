import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  FacilityStructureNotFountException,
  FindWithChildrenByRealmAsTreeException,
  ParentFacilityStructureNotFountException,
} from '../../common/notFoundExceptions/not.found.exception';
//import { CustomNeo4jError, Neo4jService } from 'sgnm-neo4j';
import { NestKafkaService } from 'ifmcommon';
import {
  Neo4jService,
  assignDtoPropToEntity,
  createDynamicCyperObject,
  CustomNeo4jError,
  Transaction,
  filterArrayForEmptyString,
  dynamicLabelAdder,
  dynamicFilterPropertiesAdder,
  dynamicNotLabelAdder,
  dynamicFilterPropertiesAdderAndAddParameterKey,
  changeObjectKeyName,
  undefined_value_recieved,
} from 'sgnm-neo4j/dist';
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

@Injectable()
export class FacilityStructureRepository implements FacilityInterface<any> {
  constructor(private readonly neo4jService: Neo4jService, private readonly kafkaService: NestKafkaService) {}

  //REVISED FOR NEW NEO4J
  async findOneByRealm(realm: string, language: string) {
    let node = await this.neo4jService.findByLabelAndFiltersWithTreeStructure(
      ['FacilityStructure'],
      { realm: realm, isDeleted: false },
      [],
      { isDeleted: false, canDisplay: true },
    );
    if (!node) {
      throw new FacilityStructureNotFountException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    return node;
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
        //  if (node[0]["_fields"][0].labels[0] == 'Building') {
        //    building = node;
        //  }
        //  else {
        building = await this.neo4jService.findChildrensByChildIdAndFilters(
          ['Building'],
          { isDeleted: false },
          node[0]['_fields'][0].identity.low,
          { isDeleted: false },
          RelationName.PARENT_OF,
        );
        // }
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
      //const updatedNode = await this.neo4jService.updateById(node[0]["_fields"][0].identity.low, dynamicObject);
      const updatedNode = await this.neo4jService.updateByIdAndFilter(
        node[0]['_fields'][0].identity.low,
        { isDeleted: false },
        [],
        dynamicObject,
      );
      const categories = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        [],
        { isDeleted: false, key: node[0]['_fields'][0].properties.key },
        [],
        { isDeleted: false },
        RelationName.CLASSIFIED_BY,
        RelationDirection.RIGHT,
      );
      const newCategories = await this.neo4jService.findChildrensByLabelsAndFilters(
        ['Classification'],
        { isDeleted: false, realm: structureRootNode[0]['_fields'][0].properties.realm },
        [],
        { isDeleted: false, code: structureData['category'] },
      );
      if (categories && categories.length > 0) {
        if (categories[0]['_fields'][1]['properties'].code != structureData['category']) {
          for (let i = 0; i < categories.length; i++) {
            await this.neo4jService.deleteRelationByIdAndRelationNameWithoutFilters(
              node[0]['_fields'][0].identity.low,
              categories[i]['_fields'][1].identity.low,
              RelationName.CLASSIFIED_BY,
              RelationDirection.RIGHT,
            );
          }
          for (let i = 0; i < newCategories.length; i++) {
            await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
              node[0]['_fields'][0].identity.low,
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
            node[0]['_fields'][0].identity.low,
            { isDeleted: false },
            newCategories[i]['_fields'][1].identity.low,
            { isDeleted: false },
            RelationName.CLASSIFIED_BY,
            RelationDirection.RIGHT,
          );
        }
      }
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
        throw new HttpException(
          wrong_parent_error({ node1: node['properties'].name, node2: new_parent['properties'].name }),
          400,
        );
      }
      for (let i = 0; i < nodeChilds['length']; i++) {
        if (
          parent_of_new_parent &&
          parent_of_new_parent['_fields'][0]['identity'].low == nodeChilds[i]['_fields'][1]['identity'].low
        ) {
          throw new HttpException(
            wrong_parent_error({ node1: node['properties'].name, node2: new_parent['properties'].name }),
            400,
          );
        }
      }

      if (new_parent['labels'] && new_parent['labels'][0] == 'FacilityStructure') {
        if (!node['labels'] || node['labels'].length == 0 || node['labels'][0] != 'Building') {
          throw new HttpException(
            wrong_parent_error({ node1: node['properties'].name, node2: new_parent['properties'].name }),
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
        ['FacilityTypes_EN'],
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
      const classNode = await this.neo4jService.findChildrensByIdOneLevel(
        node[0]['_fields'][0].identity.low,
        { isDeleted: false },
        [],
        { isDeleted: false, language: language },
        RelationName.CLASSIFIED_BY,
      );
      node = node[0]['_fields'][0];
      if (classNode && classNode.length) {
        node['properties']['category'] = classNode[0]['_fields'][1]['properties'].code;
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
      ['FacilityTypes_en'],
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

  //////////////////////////////////////
  async findChildrensByLabelsOneLevel(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction,
  ) {
    try {
      const rootLabelsWithoutEmptyString = filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString = filterArrayForEmptyString(children_labels);

      const cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[:PARENT_OF]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` RETURN n as parent,m as children`;

      children_filters = changeObjectKeyName(children_filters);
      const parameters = { ...root_filters, ...children_filters };
      const result = await this.neo4jService.read(cypher, parameters, databaseOrTransaction);
      return result['records'];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException({ message: error.response?.message, code: error.response?.code }, error.status);
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  /////////////////////////////////////

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

      const allowedStructureTypeNode = await this.findChildrensByLabelsOneLevel(
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

      const createNode = await this.neo4jService.createNode(baseFacilityObject, [structureData['nodeType']]);
      const contactNode = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        ['Contact'],
        { isDeleted: false, realm: realm },
        [],
        { isDeleted: false, email: createdBy },
        'PARENT_OF',
      );
      if (contactNode && contactNode.length && contactNode.length == 1) {
        await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
          createNode.identity.low,
          { isDeleted: false },
          contactNode[0]['_fields'][1].identity.low,
          { isDeleted: false },
          RelationName.CREATED_BY,
          RelationDirection.RIGHT,
        );
      }
      if (structureData['nodeType'] != 'Block') {
        const languages = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
          ['Language_Config'],
          { isDeleted: false, realm: realm },
          [],
          { isDeleted: false },
          'PARENT_OF',
        );
        let classificationRootNone;
        if (structureData['nodeType'] == 'Building') {
          classificationRootNone = 'OmniClass11';
        }
        if (structureData['nodeType'] == 'Floor') {
          classificationRootNone = 'FacilityFloorTypes';
        }
        if (structureData['nodeType'] == 'Space') {
          classificationRootNone = 'OmniClass13';
        }

        languages.map(async (record) => {
          let lang = record['_fields'][1].properties.name;

          let nodeClass = await this.neo4jService.findChildrensByLabelsAndFilters(
            [classificationRootNone + '_' + lang],
            { isDeleted: false, realm: realm },
            [],
            { language: lang, code: structureData['category'] },
          );
          if (nodeClass && nodeClass.length && nodeClass.length == 1) {
            await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
              createNode.identity.low,
              { isDeleted: false },
              nodeClass[0]['_fields'][1].identity.low,
              { isDeleted: false },
              RelationName.CLASSIFIED_BY,
              RelationDirection.RIGHT,
            );
          }
        });
      }
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
  async findStructureFirstLevelNodes(label: string, realm: string, language: string) {
    try {
      let node = await this.neo4jService.findByLabelAndNotLabelAndFiltersWithTreeStructureOneLevel(
        [label],
        ['Virtual'],
        { isDeleted: false, realm: realm },
        [],
        ['Virtual'],
        { isDeleted: false, canDisplay: true },
      );

      node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

      return node['root']['children'];
    } catch (error) {
      let code = error.response?.code;
      if (code >= 1000 && code <= 1999) {
        if (error.response?.code == CustomIfmCommonError.EXAMPLE1) {
        }
      } else if (code >= 5000 && code <= 5999) {
        if (
          error.response?.code == CustomNeo4jError.FIND_BY_REALM_WITH_TREE_STRUCTURE_ERROR ||
          error.response?.code == CustomNeo4jError.FIND_WITH_CHILDREN_BY_REALM_AS_TREE_ERROR ||
          error.response?.code == CustomNeo4jError.FIND_WITH_CHILDREN_BY_REALM_AS_TREE__FIND_BY_REALM_ERROR
        ) {
          throw new FindWithChildrenByRealmAsTreeException(realm, label);
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
