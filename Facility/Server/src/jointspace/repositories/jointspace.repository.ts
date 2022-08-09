import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FacilityStructureNotFountException } from '../../common/notFoundExceptions/not.found.exception';
import { NestKafkaService, nodeHasChildException } from 'ifmcommon';
import { Neo4jService, assignDtoPropToEntity, createDynamicCyperObject, CustomNeo4jError } from 'sgnm-neo4j/dist';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { RelationName } from 'src/common/const/relation.name.enum';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { CreateJointSpaceDto } from '../dto/create.jointspace.dto';
import { JointSpace } from '../entities/jointspace.entity';
import * as moment from 'moment';

@Injectable()
export class JointSpaceRepository implements GeciciInterface<any> {
  constructor(private readonly neo4jService: Neo4jService, private readonly kafkaService: NestKafkaService) {}

  async findOneByRealm(label: string, realm: string) {
    let node = await this.findByRealmWithTreeStructure(label, realm);
    if (!node) {
      throw new FacilityStructureNotFountException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    return node;
  }

  async create(createJointSpaceDto: CreateJointSpaceDto) {
    const { nodeKeys } = createJointSpaceDto;

    const nodes = [];
    const parentNodes = [];

    //get all nodes by key and their parent building node
    await Promise.all(
      nodeKeys.map(async (element) => {
        const node = await this.neo4jService.read(
          `match(n{isDeleted:false,key:$key,isActive:true }) where n:Space or n:JointSpace return n`,
          {
            key: element,
          },
        );
        if (!node.records.length) {
          throw new HttpException('Node not found', HttpStatus.NOT_FOUND);
        }
        if (node.records[0]['_fields'][0].labels[0] === 'Space') {
          const hasMergedRelation = await this.neo4jService.read(
            `match(n{key:$key}) match(p:JointSpace {isActive:true}) match(n)-[:MERGED]->(p) return p`,
            { key: node.records[0]['_fields'][0].properties.key },
          );
          if (hasMergedRelation.records.length) {
            throw new HttpException('Node is already in joint space', HttpStatus.BAD_REQUEST);
          } else {
            nodes.push(node.records[0]['_fields'][0]);
          }
        }

        if (node.records[0]['_fields'][0].labels[0] === 'JointSpace') {
          const mergedNodes = await this.neo4jService.read(
            `match(n {key:$key}) match(p {isActive:true,isDeleted:false}) match(p)-[:MERGED]->(n) return p`,
            { key: node.records[0]['_fields'][0].properties.key },
          );

          mergedNodes.records.map((mergedNode) => {
            nodes.push(mergedNode['_fields'][0]);
          });

          const updateJointSpace = await this.neo4jService.updateById(node.records[0]['_fields'][0].identity.low, {
            isActive: false,
            jointEndDate: moment().format('YYYY-MM-DD HH:mm:ss'),
          });
        }
        const parentStructure = await this.neo4jService.read(
          `match (n:Building) match(p {key:$key}) match(n)-[r:PARENT_OF*]->(p) return n`,
          { key: element },
        );
        parentNodes.push(parentStructure.records[0]['_fields'][0]);
        //   const isInJointSpace = await this.neo4jService.read(`match(n{isDeleted:false,key:$key }) where n:JointSpace return n`, {})
      }),
    );

    //check every node's building parent is same
    parentNodes.map((element) => {
      if (parentNodes[0].properties.Name !== element.properties.Name) {
        throw new HttpException('Building must be same', HttpStatus.BAD_REQUEST);
      }
    });

    //get building node Jointspaces
    const jointSpacesNode = await this.neo4jService.read(
      `match(p:Building {key:$key,isDeleted:false})  match(n:JointSpaces {isDeleted:false}) match(p)-[:PARENT_OF]->(n)  return n`,
      { key: parentNodes[0].properties.key },
    );

    //create new JointSpace node and add relations to relating JointSpaces node and space nodes
    const jointSpaceEntity = new JointSpace();
    const jointSpaceObject = assignDtoPropToEntity(jointSpaceEntity, createJointSpaceDto);
    delete jointSpaceObject['nodeKeys'];
    const jointSpace = await this.neo4jService.createNode(jointSpaceObject, ['JointSpace']);
    await this.neo4jService.addRelations(
      jointSpace.identity.low,
      jointSpacesNode.records[0]['_fields'][0].identity.low,
    );
    nodes.map(async (element) => {
      const node = await this.neo4jService.read(
        `match(n{isDeleted:false,key:$key }) where n:Space or n:JointSpace return n`,
        {
          key: element.properties.key,
        },
      );
      if (!node.records.length) {
        throw new HttpException('Node not found', HttpStatus.NOT_FOUND);
      }
      const relation = await this.neo4jService.addRelationWithRelationName(
        node.records[0]['_fields'][0].identity.low,
        jointSpace.identity.low,
        RelationName.MERGED,
      );
      //   const isInJointSpace = await this.neo4jService.read(`match(n{isDeleted:false,key:$key }) where n:JointSpace return n`, {})

      return await node.records[0]['_fields'][0];
    });

    return 'as';

    // const facilityStructure = new FacilityStructure();
    // const facilityStructureObject = assignDtoPropToEntity(facilityStructure, createFacilityStructureDto);

    // let value;
    // if (createFacilityStructureDto['labels']) {
    //   createFacilityStructureDto.labels.push('FacilityStructure');
    //   value = await this.neo4jService.createNode(facilityStructureObject, createFacilityStructureDto.labels);
    // } else {
    //   value = await this.neo4jService.createNode(facilityStructureObject, ['FacilityStructure']);
    // }
    // value['properties']['id'] = value['identity'].low;
    // const result = { id: value['identity'].low, labels: value['labels'], properties: value['properties'] };
    // if (createFacilityStructureDto['parentId']) {
    //   await this.neo4jService.addRelations(result['id'], createFacilityStructureDto['parentId']);
    // }
    // return result;
  }
  ///////////////////////// Static DTO ////////////////////////////////////////////////////////////////////
  async update(_id: string, updateFacilityStructureDto) {
    const updateFacilityStructureDtoWithoutLabelsAndParentId = {};
    Object.keys(updateFacilityStructureDto).forEach((element) => {
      if (element != 'labels' && element != 'parentId') {
        updateFacilityStructureDtoWithoutLabelsAndParentId[element] = updateFacilityStructureDto[element];
      }
    });
    const dynamicObject = createDynamicCyperObject(updateFacilityStructureDtoWithoutLabelsAndParentId);
    const updatedNode = await this.neo4jService.updateById(_id, dynamicObject);
    if (!updatedNode) {
      throw new FacilityStructureNotFountException(_id);
    }
    const result = {
      id: updatedNode['identity'].low,
      labels: updatedNode['labels'],
      properties: updatedNode['properties'],
    };
    if (updateFacilityStructureDto['labels'] && updateFacilityStructureDto['labels'].length > 0) {
      await this.neo4jService.removeLabel(_id, result['labels']);
      await this.neo4jService.updateLabel(_id, updateFacilityStructureDto['labels']);
    }
    return result;
  }

  async delete(_id: string) {
    try {
      // const node = await this.neo4jService.read(
      //   `match(n {isDeleted:false}) where id(n)=$id and not n:Virtual return n`,
      //   { id: parseInt(_id) },
      // );
      const node = await this.neo4jService.findByIdWithoutVirtualNode(_id);
      // if (!node.records[0]) {
      //   throw new HttpException({ code: 5005 }, 404);
      // }
      await this.neo4jService.getParentById(_id);
      let deletedNode;

      const hasChildren = await this.neo4jService.findChildrenById(_id);

      if (hasChildren['records'].length == 0) {
        const hasAssetRelation = await this.neo4jService.findNodesWithRelationNameById(_id, 'HAS');
        console.log(hasAssetRelation);
        if (hasAssetRelation.length > 0) {
          await this.kafkaService.producerSendMessage(
            'deleteStructure',
            //JSON.stringify({ referenceKey: node.records[0]['_fields'][0].properties.key }),
            JSON.stringify({ referenceKey: node.properties.key }),
          );
        }

        deletedNode = await this.neo4jService.delete(_id);
        if (!deletedNode) {
          throw new FacilityStructureNotFountException(_id);
        }
      }

      return deletedNode;
    } catch (error) {
      console.log(error);
      const { code, message } = error.response;
      if (code === CustomNeo4jError.HAS_CHILDREN) {
        nodeHasChildException(_id);
      } else if (code === 5005) {
        FacilityStructureNotFountException(_id);
      } else {
        throw new HttpException(message, code);
      }
    }
  }

  async changeNodeBranch(_id: string, _target_parent_id: string) {
    try {
      await this.neo4jService.deleteRelations(_id);
      await this.neo4jService.addRelations(_id, _target_parent_id);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteRelations(_id: string) {
    await this.neo4jService.deleteRelations(_id);
  }

  async addRelations(_id: string, _target_parent_id: string) {
    try {
      await this.neo4jService.addRelations(_id, _target_parent_id);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOneNodeByKey(key: string) {
    const node = await this.neo4jService.findOneNodeByKey(key);
    if (!node) {
      throw new FacilityStructureNotFountException(key);
    }
    return node;
  }

  async findOneFirstLevelByRealm(label: string, realm: string) {
    let node = await this.neo4jService.findByRealmWithTreeStructureOneLevel(label, realm);
    if (!node) {
      throw new FacilityStructureNotFountException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    return node['root']['children'];
  }

  async findChildrenByFacilityTypeNode(language: string, realm: string, typename: string) {
    let node = await this.neo4jService.findChildNodesOfFirstParentNodeByLabelsRealmAndName(
      'FacilityTypes_' + language,
      realm,
      'FacilityType',
      typename,
      'FacilityTypeProperty',
      RelationName.PARENT_OF,
      RelationDirection.RIGHT,
    );

    if (!node) {
      throw new FacilityStructureNotFountException(realm); //DEĞİŞECEK
    }
    if (node['records'] && node['records'][0]) {
      let propertyList = [];
      for (let i = 0; i < node['records'].length; i++) {
        let property = node['records'][i];
        property['_fields'][0]['properties']._id = property['_fields'][0]['identity']['low'];
        propertyList.push(property['_fields'][0]['properties']);
      }
      return propertyList;
    }

    return [];
  }

  //-------------------------------------------------------neo4j-------------------------------------------------------
  async findWithChildrenByRealmAsTree(label: string, realm: string) {
    try {
      const node = await this.findByRealm(label, realm);
      if (!node) {
        throw new HttpException('node bulunamadı', 404);
      }
      const buildingNode = await this.neo4jService.read(
        `match(n:FacilityStructure {realm:$realm}) match(p {key:$key}) match (n)-[:PARENT_OF]->(p) return p`,
        { realm: realm, key: label },
      );
      const cypher = `MATCH p=(n:Building)-[:PARENT_OF*]->(m) \
            WHERE  n.key = $key and n.isDeleted=false and m.isDeleted=false  and m.isActive=true\
            WITH COLLECT(p) AS ps \
            CALL apoc.convert.toTree(ps) yield value \
            RETURN value`;

      const result = await this.neo4jService.read(cypher, { key: label });
      if (!result['records'][0].length) {
        throw new HttpException('find_with_children_by_realm_as_tree_error', 404);
      }
      return result['records'][0]['_fields'][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException({ message: error.response?.message, code: error.response?.code }, error.status);
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  async findByRealmWithTreeStructure(label: string, realm: string) {
    try {
      if (!label || !realm) {
        throw new HttpException('find_by_realm_with_tree_structure__not_entered_error', 400);
      }
      let tree = await this.findWithChildrenByRealmAsTree(label, realm);
      if (!tree) {
        throw new HttpException('tree_structure_not_found_by_realm_name_error', 404);
      } else if (Object.keys(tree).length === 0) {
        tree = await this.findByRealm(label, realm);
        const rootNodeObject = { root: tree };
        return rootNodeObject;
      } else {
        const rootNodeObject = { root: tree };
        return rootNodeObject;
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException({ message: error.response?.message, code: error.response?.code }, error.status);
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findByRealm(label: string, realm: string, databaseOrTransaction?: string) {
    try {
      if (!label || !realm) {
        throw new HttpException('find_by_realm__not_entered_error', 400);
      }
      const cypher = `MATCH (n {isDeleted: false}) where  n.realm = $realm return n`;
      const result = await this.neo4jService.read(cypher, { realm });
      if (!result['records'][0].length) {
        throw new HttpException('find_by_realm__not_found_error', 404);
      }
      return result['records'][0]['_fields'][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException({ message: error.response?.message, code: error.response?.code }, error.status);
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  //////////////////////////  Dynamic DTO  /////////////////////////////////////////////////////////////////////////////////////////

  //------------------------------------------
  // async findStructureRootNode(key){
  //  const structureRootNode=await this.neo4jService.read('match(n:FacilityStructure) match(p {key:$key}) match (n)-[:PARENT_OF*]->(p) return n',{key})
  //   console.log(structureRootNode.records[0]['_fields'][0])

  //  return structureRootNode.records[0]['_fields'][0]
  // }
}
