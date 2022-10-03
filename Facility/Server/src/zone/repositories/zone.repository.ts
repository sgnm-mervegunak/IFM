import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FacilityStructureNotFountException } from '../../common/notFoundExceptions/not.found.exception';
import { Neo4jService, assignDtoPropToEntity, createDynamicCyperObject } from 'sgnm-neo4j/dist';
import { RelationName } from 'src/common/const/relation.name.enum';
import { CreateZoneDto } from '../dto/create.zone.dto';
import { Zone } from '../entities/zone.entity';
const exceljs = require('exceljs');
import { generateUuid } from 'src/common/baseobject/base.virtual.node.object';
import { JointSpaceAndZoneInterface } from 'src/common/interface/joint.space.zone.interface';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';

@Injectable()
export class ZoneRepository implements JointSpaceAndZoneInterface<any> {
  constructor(private readonly neo4jService: Neo4jService, private readonly nodeRelationHandler:NodeRelationHandler) { }

  async findOneByRealm(key: string, realm: string, language: string) {
    let node = await this.neo4jService.findByLabelAndFiltersWithTreeStructure(
      ['Building'],
      { key, isDeleted: false },
      [],
      {
        isDeleted: false,
      },
    );
    if (!node) {
      throw new FacilityStructureNotFountException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    node.root.children = node.root.children.filter(
      (item: any) =>
        item._type === 'Zones' || item._type === 'Floor' || item._type === 'Block' || item._type === 'Space',
    );
    return node;
  }

  async create(createZoneDto: CreateZoneDto, realm: string, language: string) {
    const { nodeKeys } = createZoneDto;

    const spaceNodes = [];
    const parentNodes = [];

    //get all nodes by key and their parent building node
    await Promise.all(
      nodeKeys.map(async (key) => {
        const node = await this.neo4jService.findByLabelAndFilters(['Space'], {
          isDeleted: false,
          key,
          isActive: true,
        });
        if (!node[0].length) {
          throw new HttpException('Node not found', HttpStatus.NOT_FOUND);
        }
        //check type and has active merged relationship
        if (node[0].get('n').labels.includes('Space')) {
          spaceNodes.push(node[0].get('n'));
          const parentStructure = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
            ['Building'],
            { isDeleted: false },
            [],
            { key: key },
            'PARENT_OF',
          );
          parentNodes.push(parentStructure[0].get('parent'));
        } else {
          throw new HttpException('Zones cannot use for create zones', 400);
        }
      }),
    );

    //check every node's building parent is same
    parentNodes.map((element) => {
      if (parentNodes[0].properties.Name !== element.properties.Name) {
        throw new HttpException('Building must be same', HttpStatus.BAD_REQUEST);
      }
    });

    //get building node zones

    const zonesNode = await this.neo4jService.findChildrensByLabelsOneLevel(
      ['Building'],
      { key: parentNodes[0].properties.key, isDeleted: false },
      ['Zones'],
      { isActive: true, isDeleted: false },
    );

    //create new Zone node and add relations to relating Zones node and space nodes
    const zoneEntity = new Zone();
    const zoneObject = assignDtoPropToEntity(zoneEntity, createZoneDto);
    const createdBy = zoneObject['createdBy'];
    //const createdBy="";
    delete zoneObject['createdBy'];
    delete zoneObject['category'];
    delete zoneObject['nodeKeys'];
    const zone = await this.neo4jService.createNode(zoneObject, ['Zone']);
    await this.neo4jService.addRelations(zone.identity.low, zonesNode[0].get('children').identity.low);

    spaceNodes.map(async (element) => {
      await this.neo4jService.addRelationWithRelationName(
        element.identity.low,
        zone.identity.low,
        RelationName.MERGEDZN,
      );
    });


 //////////////////////////////////////////////  CREATED_BY,CLASSIFIED_BY relations  ///////////////////////////////////////
      
 let newCategoriesArr = [];
 let relationArr = [];
 let _root_idArr = [];   
 const newCategories = await this.nodeRelationHandler.getNewCategories(realm, createZoneDto['category']);
 const contactNode = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
   ['Contact'],
   {"isDeleted": false, "realm": realm},
   [],
   {"isDeleted": false, "email":  createdBy},
   "PARENT_OF"
   );


   newCategoriesArr.push(newCategories); 
   newCategoriesArr.push(contactNode); 
 relationArr.push(RelationName.CLASSIFIED_BY,RelationName.CREATED_BY);
 _root_idArr.push(zone.identity.low,zone.identity.low);
 await this.nodeRelationHandler.manageNodesRelations([], newCategoriesArr,relationArr,_root_idArr);  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    return { ...zone.properties, id: zone.identity.low };
  }
  ///////////////////////// Static DTO ////////////////////////////////////////////////////////////////////
  async update(_id: string, updateFacilityStructureDto, realm: string, language: string) {
    ;
    try {


      const updateFacilityStructureDtoWithoutLabelsAndParentId = {};
      Object.keys(updateFacilityStructureDto).forEach((element) => {
        if  (element != 'labels' && element != 'parentId' && element != 'category' &&  element != 'createdBy') {
          updateFacilityStructureDtoWithoutLabelsAndParentId[element] = updateFacilityStructureDto[element];
        }
      });
      const dynamicObject = createDynamicCyperObject(updateFacilityStructureDtoWithoutLabelsAndParentId);
      const updatedNode = await this.neo4jService.updateById(_id, updateFacilityStructureDto);
      if (!updatedNode) {
        throw new FacilityStructureNotFountException(_id);
      }

      /////////////////////////////////// update CLASSIFIED_BY  //////////////////  
    const category = updateFacilityStructureDto['category'];
    const newCategories = await this.nodeRelationHandler.getNewCategories(realm, category);
    const oldCategories = await this.nodeRelationHandler.getOldCategories(updatedNode.properties.key, RelationName.CLASSIFIED_BY); 
   
    let categoriesArr = [];
    let newCategoriesArr = [];
    let relationArr = [];
    let _root_idArr = [];

      categoriesArr.push(oldCategories);
      newCategoriesArr.push(newCategories); 
    relationArr.push(RelationName.CLASSIFIED_BY);
    _root_idArr.push(updatedNode.identity.low);

    await this.nodeRelationHandler.manageNodesRelations(categoriesArr, newCategoriesArr,relationArr,_root_idArr);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      const result = {
        id: updatedNode['identity'].low,
        labels: updatedNode['labels'],
        properties: updatedNode['properties'],
      };
      if (updateFacilityStructureDto['labels'] && updateFacilityStructureDto['labels'].length > 0) {
        await this.neo4jService.removeLabel(_id, result['labels']);
        await this.neo4jService.updateLabel(_id, updateFacilityStructureDto['labels']);
      } else {
      }

      return updatedNode;

    } catch (error) {
      console.log(error, "ERROR--------------------");
    }
  }

  async delete(key: string, realm: string, language: string) {
    const node = await this.neo4jService.read(
      `match(n{isDeleted:false,key:$key,isActive:true }) where n:Zone return n`,
      {
        key,
      },
    );
    if (!node.records.length) {
      throw new HttpException('Node not found', HttpStatus.NOT_FOUND);
    }

     //delete CLASSIFIED_BY, CREATED_BY relations in this database /////////////////////////////////////////////////////
     let categoriesArr = [];
     let relationArr = [];
     let _root_idArr = [];
 
     const oldCategories = await this.nodeRelationHandler.getOldCategories(node['records'][0].get('n').properties.key, RelationName.CLASSIFIED_BY); 
     const oldCreatedBy = await this.nodeRelationHandler.getOldCategories(node['records'][0].get('n').properties.key, RelationName.CREATED_BY); 
     
     categoriesArr.push(oldCategories,oldCreatedBy);
     relationArr.push(RelationName.CLASSIFIED_BY, RelationName.CREATED_BY);
     _root_idArr.push(node['records'][0].get('n').identity.low, node['records'][0].get('n').identity.low);
     await this.nodeRelationHandler.deleteNodesRelations(categoriesArr, relationArr, _root_idArr) 
     ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const deletedNode = await this.neo4jService.updateById(node.records[0]['_fields'][0].identity.low, {
      isActive: false,
      isDeleted: true,
    });

    return deletedNode.properties;
  }

  async findOneNodeByKey(key: string, realm: string, language: string) {
    const node = await this.neo4jService.findOneNodeByKey(key);
    if (!node) {
      throw new FacilityStructureNotFountException(key);
    }
    const categoryNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
      [Neo4jLabelEnum.ZONE],
      { key: node.properties.key },
      [],
      { isDeleted: false, language: language },
      RelationName.CLASSIFIED_BY
    );
    if (categoryNode.length>0) {
      node.properties['category'] =
      categoryNode[0].get('children').properties.code;  
    }

    const contactNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
      [Neo4jLabelEnum.CONTACT],
      { key: node.properties.key },
      [],
      { isDeleted: false },
      RelationName.CREATED_BY
    );
    if (contactNode.length>0) {
      node.properties['createdBy'] =
      contactNode[0].get('children').properties.key;  
    }
    return node;
  }

  async findOneFirstLevelByRealm(label: string, realm: string, language: string) {
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

  async addZonesToBuilding(file: Express.Multer.File, realm: string, buildingKey: string, language: string) {
    let data = [];
    let buffer = new Uint8Array(file.buffer);
    const workbook = new exceljs.Workbook();

    await workbook.xlsx.load(buffer).then(function async(book) {
      const firstSheet = book.getWorksheet(6);
      firstSheet.eachRow({ includeEmpty: false }, function (row) {
        data.push(row.values);
      });
    });
    console.log(data.length);
    for (let i = 1; i < data.length; i++) {
      let cypherCategory = `MATCH (cl:FacilityZoneTypes_${language} {realm:"${realm}"})-[:PARENT_OF]->(c {name:"${data[i][4]}"}) return c`;
      let data2 = await this.neo4jService.read(cypherCategory);
      let key = await data2.records[0]['_fields'][0].properties.key;

      let cypher = `MATCH (b:Building {key:"${buildingKey}"})-[:PARENT_OF]->(z:Zones {name:"Zones"})\
    MATCH (c:Space {name:"${data[i][5]}"})\
    MATCH (p {email:"${data[i][2]}"})\
    MATCH (zt {key:"${key}"})\
    MERGE (zz:Zone {name:"${data[i][1]}",createdOn:"${data[i][3]}",externalSystem:"${data[i][6]}", externalObject:"${data[i][7]
        }", externalIdentifier:"${data[i][8]}", description:"${data[i][9]}", tag:[],\
    nodeKeys:[], nodeType:"Zone", key:"${generateUuid()}", canDisplay:true, isActive:true, isDeleted:false, canDelete:true})\
    MERGE (z)-[:PARENT_OF]->(zz)  \
    MERGE (c)-[:MERGEDZN]->(zz)  \
    MERGE (zt)-[:CLASSIFICATION_OF]->(zz)\
    MERGE (zt)-[:CREATED_BY]->(p)`;
      let data3 = await this.neo4jService.write(cypher);
      console.log(data3);
    }
  }
}
