import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  FacilityStructureNotFountException,
  FindWithChildrenByRealmAsTreeException,
  ParentFacilityStructureNotFountException,
} from '../../common/notFoundExceptions/not.found.exception';
import { CreateFacilityStructureDto } from '../dto/create-facility-structure.dto';
import { UpdateFacilityStructureDto } from '../dto/update-facility-structure.dto';
import { FacilityStructure } from '../entities/facility-structure.entity';
//import { CustomNeo4jError, Neo4jService } from 'sgnm-neo4j';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { NestKafkaService, nodeHasChildException } from 'ifmcommon';
import {
  Neo4jService,
  assignDtoPropToEntity,
  createDynamicCyperObject,
  CustomNeo4jError,
  dynamicLabelAdder,
  dynamicFilterPropertiesAdder,
  dynamicNotLabelAdder,
  required_fields_must_entered,
  filterArrayForEmptyString,
  find_with_children_by_realm_as_tree__find_by_realm_error,
  Transaction,
  find_with_children_by_realm_as_tree_error,
  tree_structure_not_found_by_realm_name_error,
  changeObjectKeyName,
  dynamicFilterPropertiesAdderAndAddParameterKey,
  invalid_direction_error,
} from 'sgnm-neo4j/dist';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { RelationName } from 'src/common/const/relation.name.enum';
import { BaseFormdataObject } from 'src/common/baseobject/base.formdata.object';
import { BaseFacilityObject } from 'src/common/baseobject/base.facility.object ';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { AnyARecord } from 'dns';
import { FacilityInterface } from 'src/common/interface/facility.interface';
import * as moment from 'moment';
import { copyFile } from 'fs';
import { JointSpaces } from '../entities/joint-spaces.entity';
import { Zones } from '../entities/zones.entity';
import {
  FacilityNodeNotFoundException,
  FacilityStructureCanNotDeleteExceptions,
  FacilityStructureDeleteExceptions,
  WrongClassificationParentExceptions,
  WrongFacilityStructureExceptions,
  WrongFacilityStructurePropsExceptions,
  WrongFacilityStructurePropsRulesExceptions,
} from 'src/common/badRequestExceptions/bad.request.exception';
import { I18NEnums } from 'src/common/const/i18n.enum';
import { has_children_error, node_not_found, wrong_parent_error } from 'src/common/const/custom.error.object';
import { CustomTreeError } from 'src/common/const/custom.error.enum';
import { CustomIfmCommonError } from 'src/common/const/custom-ifmcommon.error.enum';
import { BaseFacilitySpaceObject } from 'src/common/baseobject/base.facility.space.object';
import { QueryResult } from 'neo4j-driver-core';

@Injectable()
export class FacilityStructureRepository implements FacilityInterface<any> {
  constructor(private readonly neo4jService: Neo4jService, private readonly kafkaService: NestKafkaService) {}

  //REVISED FOR NEW NEO4J
  async findOneByRealm(label: string, realm: string) {
    let node = await this.neo4jService.findByLabelAndFiltersWithTreeStructure(
      [label],
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
  async update(key: string, structureData: Object) {
    //is there facility-structure node
    const node = await this.neo4jService.findOneNodeByKey(key);
    if (!node) {
      throw new FacilityStructureNotFountException(key);
    }
    const structureRootNode = await this.neo4jService.findStructureRootNode(key, 'FacilityStructure');
    //const properties = this.findChildrenByFacilityTypeNode('EN', structureRootNode.properties.realm,  structureData['nodeType']);
    const properties = await this.findChildrenByFacilityTypeNode(
      'EN',
      structureRootNode.properties.realm,
      structureData['nodeType'],
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
    const dynamicObject = createDynamicCyperObject(structureData);
    const updatedNode = await this.neo4jService.updateById(node.id, dynamicObject);

    if (!updatedNode) {
      throw new FacilityStructureNotFountException(node.id); //DEĞİŞECEK
    }
    const response = {
      id: updatedNode['identity'].low,
      labels: updatedNode['labels'],
      properties: updatedNode['properties'],
    };

    return response;
  }

  //REVISED FOR NEW NEO4J
  async delete(_id: string) {
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
  async changeNodeBranch(_id: string, target_parent_id: string) {
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
  async findOneNodeByKey(key: string) {
    try {
      let node = await this.neo4jService.findByLabelAndFilters([], { isDeleted: false, key: key }, ['Virtual']);
      if (!node || node.length == 0) {
        throw new HttpException(node_not_found({ node1: '', node2: '' }), 404);
      }

      node = node[0]['_fields'][0];
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
  async findOneFirstLevelByRealm(language: string, label: string, realm: string) {
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
  async findChildrenByFacilityTypeNode(language: string, realm: string, typename: string) {
    let parent_node = await this.neo4jService.findByLabelAndFilters(
      ['FacilityTypes_' + language],
      { isDeleted: false, realm: realm },
      [],
    );
    let type_node = await this.neo4jService.findChildrensByIdOneLevel(
      parent_node[0]['_fields'][0]['identity'].low,
      { isDeleted: false },
      ['FacilityType'],
      { isDeleted: false, name: typename },
      'PARENT_OF',
    );
    let node = await this.neo4jService.findChildrensByIdOneLevel(
      type_node[0]['_fields'][1]['identity'].low,
      { isDeleted: false },
      ['FacilityTypeProperty'],
      { isDeleted: false, isActive: true, canDisplay: true },
      'PARENT_OF',
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
  //////////////////////////////
  async findChildrensByLabelsAndRelationNameOneLevel(
    first_node_labels: Array<string> = [],
    first_node_filters: object = {},
    second_node_labels: Array<string> = [],
    second_node_filters: object = {},
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction,
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const firstNodeLabelsWithoutEmptyString = filterArrayForEmptyString(first_node_labels);

      const secondNodeLabelsWithoutEmptyString = filterArrayForEmptyString(second_node_labels);

      let parameters;
      let cypher: string;
      let result: QueryResult;

      switch (relation_direction) {
        case RelationDirection.RIGHT:
          cypher =
            `MATCH (n` +
            dynamicLabelAdder(firstNodeLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(first_node_filters) +
            `-[:${relation_name}]->(m` +
            dynamicLabelAdder(secondNodeLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKey(second_node_filters) +
            ` RETURN n as parent,m as children`;

          second_node_filters = changeObjectKeyName(second_node_filters);
          parameters = { ...first_node_filters, ...second_node_filters };

          result = await this.neo4jService.read(cypher, parameters, databaseOrTransaction);
          break;
        case RelationDirection.LEFT:
          cypher =
            `MATCH (n` +
            dynamicLabelAdder(firstNodeLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(first_node_filters) +
            `<-[:${relation_name}]-(m` +
            dynamicLabelAdder(secondNodeLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKey(second_node_filters) +
            ` RETURN m as parent,n as children`;

          second_node_filters = changeObjectKeyName(second_node_filters);
          parameters = { ...first_node_filters, ...second_node_filters };

          result = await this.neo4jService.read(cypher, first_node_filters, databaseOrTransaction);
          break;
        default:
          throw new HttpException(invalid_direction_error, 400);
      }

      return result['records'];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException({ message: error.response?.message, code: error.response?.code }, error.status);
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  ///////////////////////////////
  //////////////////////////  Dynamic DTO  /////////////////////////////////////////////////////////////////////////////////////////
  async create(key: string, structureData: Object, realm: string) {
    //is there facility-structure parent node

    const node = await this.neo4jService.findOneNodeByKey(key);
    if (!node) {
      throw new FacilityStructureNotFountException(key);
    }
    //////////////////////////// Control of childnode type which will be added to parent node. /////////////////////////////////////////
    let structureRootNode;
    if (node.labels[0] === 'FacilityStructure') {
      structureRootNode = node;
    } else {
      structureRootNode = await this.neo4jService.findStructureRootNode(key, 'FacilityStructure');
      //structureRootNode=await this.findStructureRootNode(key, 'FacilityStructure');
    }
    //!!!!!!!!!!!!
    //check if rootNode realm equal to keyclock token realm

    if (structureRootNode.properties.realm !== realm) {
      throw new HttpException({ message: 'You dont have permission' }, 403);
    }

    //const allowedStructureTypeNode = await this.neo4jService.read('match (n:FacilityTypes_EN {realm:$realm}) match(p {name:$name}) match(n)-[:PARENT_OF]->(p) return p', { realm: structureRootNode.properties.realm, name: node.labels[0] })
    const allowedStructureTypeNode = await this.neo4jService.getAllowedStructureTypeNode(
      structureRootNode.properties.realm,
      node.labels[0],
    );
    //const allowedStructures=await this.neo4jService.read('match(n {key:$key}) match(p) match (n)-[:PARENT_OF]->(p) return p',{key:allowedStructureTypeNode.records[0]['_fields'][0].properties.key})
    const allowedStructures = await this.neo4jService.getAllowedStructures(
      allowedStructureTypeNode.records[0]['_fields'][0].properties.key,
    );

    const isExist = allowedStructures.records.filter((allowedStructure) => {
      if (allowedStructure['_fields'][0].properties.name === structureData['nodeType']) {
        return allowedStructure;
      }
    });
    if (!isExist.length) {
      throw new WrongFacilityStructureExceptions(structureData['nodeType'], node.properties['nodeType']);
      //throw new HttpException('Yapıyı Bu şekilde oluşturamazsınız1',400)
    }

    ////////////////////////////// Control of input properties with facility type properties //////////////////////////////////////////////////

    //const properties = this.findChildrenByFacilityTypeNode('EN', structureRootNode.properties.realm,  structureData['nodeType']);
    const properties = await this.findChildrenByFacilityTypeNode(
      'EN',
      structureRootNode.properties.realm,
      structureData['nodeType'],
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

    baseFacilityObject = assignDtoPropToEntity(baseFacilityObject, structureData);
    let createdBy = baseFacilityObject['createdBy'];
    delete baseFacilityObject['createdBy'];
    delete baseFacilityObject['category'];

    const createNode = await this.neo4jService.createNode(baseFacilityObject, [structureData['nodeType']]);
    const contactNode = await this.findChildrensByLabelsAndRelationNameOneLevel(
      ['Contact'],
      { isDeleted: false, realm: realm },
      [],
      { isDeleted: false, email: createdBy },
      'PARENT_OF',
    );
    if (contactNode && contactNode.length && contactNode.length == 1) {
      await this.neo4jService.addRelationWithRelationNameByKey(
        createNode.properties.key,
        contactNode[0]['_fields'][1]['properties'].key,
        RelationName.CREATED_BY,
      );
    }
    if (structureData['nodeType'] != 'Block') {
      await this.neo4jService.addRelationWithRelationNameByKey(
        createNode.properties.key,
        structureData['category'],
        RelationName.CLASSIFIED_BY,
      );
    }

    //create PARENT_OF relation between parent facility structure node and child facility structure node.
    await this.neo4jService.addRelationWithRelationNameByKey(key, createNode.properties.key, RelationName.PARENT_OF);
    let jointSpaces = new JointSpaces();
    let zones = new Zones();
    if (createNode['labels'][0] === 'Building') {
      const createJointSpacesNode = await this.neo4jService.createNode(jointSpaces, ['JointSpaces']);
      await this.neo4jService.addRelationWithRelationNameByKey(
        createNode['properties'].key,
        jointSpaces.key,
        RelationName.PARENT_OF,
      );

      const createZoneNode = await this.neo4jService.createNode(zones, ['Zones']);
      await this.neo4jService.addRelationWithRelationNameByKey(
        createNode['properties'].key,
        zones.key,
        RelationName.PARENT_OF,
      );
    }

    const response = {
      id: createNode['identity'].low,
      labels: createNode['labels'],
      properties: createNode['properties'],
    };
    return response;
  }

  //REVISED FOR NEW NEO4J
  async findStructureFirstLevelNodes(label: string, realm: string) {
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
}
