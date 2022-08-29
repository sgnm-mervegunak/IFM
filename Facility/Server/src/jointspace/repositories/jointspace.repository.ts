import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FacilityStructureNotFountException } from '../../common/notFoundExceptions/not.found.exception';
import { NestKafkaService } from 'ifmcommon';
import { Neo4jService, assignDtoPropToEntity, createDynamicCyperObject, node_not_found } from 'sgnm-neo4j/dist';
import { RelationName } from 'src/common/const/relation.name.enum';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { CreateJointSpaceDto } from '../dto/create.jointspace.dto';
import { JointSpace } from '../entities/jointspace.entity';
import * as moment from 'moment';

@Injectable()
export class JointSpaceRepository implements GeciciInterface<any> {
  constructor(private readonly neo4jService: Neo4jService, private readonly kafkaService: NestKafkaService) {}
  changeNodeBranch(id: string, target_parent_id: string) {
    throw new Error('Method not implemented.');
  }
  findChildrenByFacilityTypeNode(language: string, realm: string, typename: string) {
    throw new Error('Method not implemented.');
  }

  async findOneByRealm(label: string, realm: string) {
    let node = await this.findByRealmWithTreeStructure(label, realm);
    if (!node) {
      throw new FacilityStructureNotFountException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    node.root.children = node.root.children.filter(
      (item: any) =>
        item._type === 'JointSpaces' || item._type === 'Floor' || item._type === 'Block' || item._type === 'Space',
    );

    return node;
  }

  async create(createJointSpaceDto: CreateJointSpaceDto) {
    try {
      
   
    const { nodeKeys } = createJointSpaceDto;

    const spaceNodes = [];
    const jointSpaceNodes = [];
    const parentNodes = [];

    //get all nodes by key and their parent building node
    await Promise.all(
      nodeKeys.map(async (key) => {
         const node = await this.neo4jService.findByOrLabelsAndFilters(['Space','JointSpace'],{isDeleted:false,key,isActive:true })
        if (!node.length) {
          throw new HttpException(node_not_found, HttpStatus.NOT_FOUND);
        }
        //checkt type and has active merged relationship
        if (node[0].get('n').labels[0] === 'Space') {
          if ( node[0].get('n').properties.isBlocked===true) {
            throw new HttpException('Node is already in joint space', HttpStatus.BAD_REQUEST);
          } else {
            spaceNodes.push(node[0].get('n'));
          }
        }
        //check type and has active merged relationship and updateJointSpace property
        if (node[0].get('n').labels[0] === 'JointSpace') {
          jointSpaceNodes.push(node[0].get('n'));

          const mergedNodes=await  this.neo4jService.findChildrenNodesByLabelsAndRelationName(['JointSpace'],{key},['Space'],{isActive:true,isDeleted:false},'MERGEDJS')
          mergedNodes.map((mergedNode) => {
            spaceNodes.push(mergedNode.get('children'));
          });
        }

        const parentStructure=await this.neo4jService.findChildrenNodesByLabelsAndRelationName(['Building'],{isDeleted:false},[],{key},'PARENT_OF')
        parentNodes.push(parentStructure[0].get('parent'));
      }),
      
    );
    //check every node's building parent is same
    parentNodes.map((element) => {
      if (parentNodes[0].properties.Name !== element.properties.Name) {
        throw new HttpException('Building must be same', HttpStatus.BAD_REQUEST);
      }
    });

    await Promise.all(
      jointSpaceNodes.map(async (element) => {
        await this.neo4jService.updateByIdAndFilter(element.identity.low, {
          isActive: false,
          isDeleted: true,
          jointEndDate: moment().format('YYYY-MM-DD HH:mm:ss'),
        });
      }),
    );

    const jointSpacesNode=await this.neo4jService.findChildrensByLabelsOneLevel(['Building'],{key:parentNodes[0].properties.key,isDeleted:false},['JointSpaces'],{isActive:true,isDeleted:false})
    let jointSpaceTitle=''

    spaceNodes.forEach((element,index) => {
      if(index+1===spaceNodes.length){
        jointSpaceTitle=jointSpaceTitle+element.name
      }else{
        jointSpaceTitle=jointSpaceTitle+element.name+','
      }
    });
    createJointSpaceDto['jointSpaceTitle']=jointSpaceTitle

    //create new JointSpace node and add relations to relating JointSpaces node and space nodes
    const jointSpaceEntity = new JointSpace();
    const jointSpaceObject = assignDtoPropToEntity(jointSpaceEntity, createJointSpaceDto);
    delete jointSpaceObject['nodeKeys'];
    const jointSpace = await this.neo4jService.createNode(jointSpaceObject, ['JointSpace']);
    await this.neo4jService.addRelations(
      jointSpace.identity.low,
      jointSpacesNode[0].get('children').identity.low,
    );
    spaceNodes.map(async (element) => {
      await this.neo4jService.updateByIdAndFilter(element.identity.low, { isDeleted:false},[],{ isBlocked: true });
      await this.neo4jService.addRelationWithRelationName(
        element.identity.low,
        jointSpace.identity.low,
        RelationName.MERGEDJS,
      );
    });

    return jointSpace.properties;
  }
    catch(error){
      if (error.response?.code) {
        throw new HttpException({ message: error.response?.message, code: error.response?.code }, HttpStatus.NOT_FOUND);
      }
      else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
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
    const updatedNode = await this.neo4jService.updateByIdAndFilter(+_id,{isDeleted:false},[],dynamicObject);
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

  async delete(key: string) {

    const node = await this.neo4jService.findByLabelAndFilters(['JointSpace'],{isDeleted:false,key,isActive:true })
    if (!node.length) {
      throw new HttpException('Node not found', HttpStatus.NOT_FOUND);
    }

    const mergedNodes=await  this.neo4jService.findChildrenNodesByLabelsAndRelationName(['Space'],{isActive:true,isDeleted:false},['JointSpace'],{key,isDeleted:false},'MERGEDJS')

    mergedNodes.map(async (mergedNode) => {
      console.log(mergedNode)
      await this.neo4jService.updateByIdAndFilter(mergedNode.get('parent').identity.low,{},[], { isBlocked: false });
    });
  
    //check type and has active merged relationship and updateJointSpace property

    const deletedNode = await this.neo4jService.updateById(node[0].get('n').identity.low, {
      isActive: false,
      isDeleted: true,
      jointEndDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    });

    return deletedNode.properties;
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
