import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FacilityStructureNotFountException } from '../../common/notFoundExceptions/not.found.exception';
import { CreateFacilityStructureDto } from '../dto/create-facility-structure.dto';
import { UpdateFacilityStructureDto } from '../dto/update-facility-structure.dto';
import { FacilityStructure } from '../entities/facility-structure.entity';
//import { CustomNeo4jError, Neo4jService } from 'sgnm-neo4j';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { NestKafkaService, nodeHasChildException } from 'ifmcommon';
import { Neo4jService, assignDtoPropToEntity, createDynamicCyperObject, CustomNeo4jError } from 'sgnm-neo4j/dist';
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
import { FacilityStructureDeleteExceptions, WrongFacilityStructureExceptions, WrongFacilityStructurePropsExceptions } from 'src/common/badRequestExceptions/bad.request.exception';


@Injectable()
export class FacilityStructureRepository implements FacilityInterface<any> {
  constructor(private readonly neo4jService: Neo4jService, private readonly kafkaService: NestKafkaService) { }

  async findOneByRealm(label: string, realm: string) {
    let node = await this.neo4jService.findByRealmWithTreeStructure(label, realm);
    if (!node) {
      throw new FacilityStructureNotFountException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    return node;
  }
  /////////////////////////// Static DTO ////////////////////////////////////////////////////////////////////
  // async create(createFacilityStructureDto: CreateFacilityStructureDto) {
  //   const facilityStructure = new FacilityStructure();
  //   const facilityStructureObject = assignDtoPropToEntity(facilityStructure, createFacilityStructureDto);

  //   let value;
  //   if (createFacilityStructureDto['labels']) {
  //     createFacilityStructureDto.labels.push('FacilityStructure');
  //     value = await this.neo4jService.createNode(facilityStructureObject, createFacilityStructureDto.labels);
  //   } else {
  //     value = await this.neo4jService.createNode(facilityStructureObject, ['FacilityStructure']);
  //   }
  //   value['properties']['id'] = value['identity'].low;
  //   const result = { id: value['identity'].low, labels: value['labels'], properties: value['properties'] };
  //   if (createFacilityStructureDto['parentId']) {
  //     await this.neo4jService.addRelations(result['id'], createFacilityStructureDto['parentId']);
  //   }
  //   return result;
  // }
  /////////////////////////// Static DTO ////////////////////////////////////////////////////////////////////
  // async update(_id: string, updateFacilityStructureDto: UpdateFacilityStructureDto) {
  //   const updateFacilityStructureDtoWithoutLabelsAndParentId = {};
  //   Object.keys(updateFacilityStructureDto).forEach((element) => {
  //     if (element != 'labels' && element != 'parentId') {
  //       updateFacilityStructureDtoWithoutLabelsAndParentId[element] = updateFacilityStructureDto[element];
  //     }
  //   });
  //   const dynamicObject = createDynamicCyperObject(updateFacilityStructureDtoWithoutLabelsAndParentId);
  //   const updatedNode = await this.neo4jService.updateById(_id, dynamicObject);

  //   if (!updatedNode) {
  //     throw new FacilityStructureNotFountException(_id);
  //   }
  //   const result = {
  //     id: updatedNode['identity'].low,
  //     labels: updatedNode['labels'],
  //     properties: updatedNode['properties'],
  //   };
  //   if (updateFacilityStructureDto['labels'] && updateFacilityStructureDto['labels'].length > 0) {
  //     await this.neo4jService.removeLabel(_id, result['labels']);
  //     await this.neo4jService.updateLabel(_id, updateFacilityStructureDto['labels']);
  //   }
  //   return result;
  // }

  //////////////////////////  Dynamic DTO  /////////////////////////////////////////////////////////////////////////////////////////
  async update(key: string, structureData: Object) {
    //is there facility-structure node 
    const node = await this.neo4jService.findOneNodeByKey(key);
    if (!node) {
      throw new FacilityStructureNotFountException(key);
    }
    const structureRootNode=await this.neo4jService.findStructureRootNode(key, 'FacilityStructure');
    //const properties = this.findChildrenByFacilityTypeNode('EN', structureRootNode.properties.realm,  structureData['nodeType']);
    const properties = await this.findChildrenByFacilityTypeNode('EN', structureRootNode.properties.realm,  structureData['nodeType']);
    let proper = {};
    Object.keys(properties).forEach((element) => { 
      let prop = properties[element]['label'].split(' ');
      let pro = "";
      Object.keys(prop).forEach((element) => {
          pro = pro+prop[element]; 
      });
      properties[element]['label']= pro;
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
      throw new FacilityStructureNotFountException(node.id);  //DEĞİŞECEK
    }
    const response = {
      id: updatedNode['identity'].low,
      labels: updatedNode['labels'],
      properties: updatedNode['properties'],
    };

    return response;
  }


  async delete(_id: string) {
    //try {
      
      const node = await this.neo4jService.findByIdWithoutVirtualNode(_id);
      
      await this.neo4jService.getParentById(_id);
      let deletedNode;

      const hasChildren = await this.neo4jService.findChildrenById(_id);
      let canDelete = false;
      if (node['properties']['nodeType']  == 'Building' && hasChildren['records'].length == 1 && hasChildren['records'][0]['_fields'][0]["labels"][0] == 'JointSpaces') {
         canDelete = true;
      }

      if (hasChildren['records'].length == 0 || canDelete) {
        const hasAssetRelation = await this.neo4jService.findNodesWithRelationNameById(_id, 'HAS');
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
      else {
        throw new FacilityStructureDeleteExceptions(node['properties']['nodeType']);
      }
      return deletedNode;
    // } catch (error) {
    //   console.log(error);
    //   const { code, message } = error.response;
    //   if (code === CustomNeo4jError.HAS_CHILDREN) {
    //     nodeHasChildException(_id);
    //   } else if (code === 5005) {
    //     FacilityStructureNotFountException(_id);
    //   } else {
    //     throw new HttpException(message, code);
    //   }
    //}
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

    let node = await this.neo4jService.findChildNodesOfFirstParentNodeByLabelsRealmAndName('FacilityTypes_' + language, realm, 'FacilityType',
      typename, 'FacilityTypeProperty', RelationName.PARENT_OF, RelationDirection.RIGHT);

    if (!node) {
      throw new FacilityStructureNotFountException(realm); //DEĞİŞECEK
    }
    if (node["records"] && node["records"][0]) {
      let propertyList = [];
      for (let i = 0; i < node["records"].length; i++) {
        let property = node["records"][i];
        property["_fields"][0]["properties"]._id = property["_fields"][0]["identity"]["low"];
        propertyList.push(property["_fields"][0]["properties"]);
      }
      return propertyList;
    }

    return [];
  }
  //////////////////////////  Dynamic DTO  /////////////////////////////////////////////////////////////////////////////////////////
  async create(key: string, structureData: Object) {
    //is there facility-structure parent node 
    const node = await this.neo4jService.findOneNodeByKey(key);
    if (!node) {
      throw new FacilityStructureNotFountException(key);
    }
  //////////////////////////// Control of childnode type which will be added to parent node. /////////////////////////////////////////
   let structureRootNode;
   if(node.labels[0]==='FacilityStructure'){
    structureRootNode=node
   }else{
    structureRootNode=await this.neo4jService.findStructureRootNode(key, 'FacilityStructure');
    //structureRootNode=await this.findStructureRootNode(key, 'FacilityStructure');
   }

    //const allowedStructureTypeNode = await this.neo4jService.read('match (n:FacilityTypes_EN {realm:$realm}) match(p {name:$name}) match(n)-[:PARENT_OF]->(p) return p', { realm: structureRootNode.properties.realm, name: node.labels[0] })
    const allowedStructureTypeNode = await this.neo4jService.getAllowedStructureTypeNode(structureRootNode.properties.realm, node.labels[0]);
    //const allowedStructures=await this.neo4jService.read('match(n {key:$key}) match(p) match (n)-[:PARENT_OF]->(p) return p',{key:allowedStructureTypeNode.records[0]['_fields'][0].properties.key})
    const allowedStructures =  await this.neo4jService.getAllowedStructures(allowedStructureTypeNode.records[0]['_fields'][0].properties.key)
    
    const isExist=allowedStructures.records.filter(allowedStructure=>{
      console.log(allowedStructure['_fields'])
      if(allowedStructure['_fields'][0].properties.name===structureData['nodeType']){
        return allowedStructure
      }
    })
    if(!isExist.length){
      throw new WrongFacilityStructureExceptions(structureData['nodeType'],node.properties["nodeType"]);
      //throw new HttpException('Yapıyı Bu şekilde oluşturamazsınız1',400)
    }

  ////////////////////////////// Control of input properties with facility type properties //////////////////////////////////////////////////

    //const properties = this.findChildrenByFacilityTypeNode('EN', structureRootNode.properties.realm,  structureData['nodeType']);
    const properties = await this.findChildrenByFacilityTypeNode('EN', structureRootNode.properties.realm,  structureData['nodeType']);
    let proper = {};
    Object.keys(properties).forEach((element) => { 
      let prop = properties[element]['label'].split(' ');
      let pro = "";
      Object.keys(prop).forEach((element) => {
          pro = pro+prop[element]; 
      });
      properties[element]['label']= pro;
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
          //throw new HttpException('Yapıyı Bu şekilde oluşturamazsınız2',400)
        }
      }
    });
    

    let baseFacilityObject = new BaseFacilityObject();
    baseFacilityObject = assignDtoPropToEntity(baseFacilityObject, structureData);
    const createNode = await this.neo4jService.createNode(baseFacilityObject, [structureData['nodeType']]);
    //create PARENT_OF relation between parent facility structure node and child facility structure node.
    await this.neo4jService.addRelationWithRelationNameByKey(key, createNode.properties.key, RelationName.PARENT_OF);
    let jointSpaces = new JointSpaces();
    if (createNode['labels'][0]==='Building') {
      const createJointSpacesNode  = await this.neo4jService.createNode(jointSpaces, ['JointSpaces']);
      await this.neo4jService.addRelationWithRelationNameByKey(createNode['properties'].key, jointSpaces.key, RelationName.PARENT_OF);
    }
    const response = { id: createNode['identity'].low, labels: createNode['labels'], properties: createNode['properties'] };
    return response;
  }
  //------------------------------------------
  // async findStructureRootNode(key){
  //  const structureRootNode=await this.neo4jService.read('match(n:FacilityStructure) match(p {key:$key}) match (n)-[:PARENT_OF*]->(p) return n',{key})
  //   console.log(structureRootNode.records[0]['_fields'][0])
  

  //  return structureRootNode.records[0]['_fields'][0]
  // }

  // async findStructureRootNode(key, label){

  //   try {
  //     if (!key) {
  //       throw new HttpException('key olmalıdır', 400); 
  //     }

  //     const cypher = `match(n:${label}) match(p {key:$key}) match (n)-[:PARENT_OF*]->(p) return n`;
  //     const structureRootNode = await this.neo4jService.read(cypher, { key });
  //     if (!structureRootNode || !structureRootNode["records"].length) {
  //       throw new HttpException({code:'3000',message:'Hatalı işlem yaptınız'}, 400);
  //     }
  //     return structureRootNode.records[0]['_fields'][0];

  //   } catch (error) {
  //     if (error.response?.code) {
  //       throw new HttpException(
  //         { message: error.response?.message, code: error.response?.code },
  //         error.status
  //       );
  //     } else {
  //       throw new HttpException("500 hatası", 500);
  //     }
  //   }
  // } 

  async findStructureFirstLevelNodes(label: string, realm: string) {
    let node = await this.neo4jService.findByRealmWithTreeStructureOneLevel(label, realm);
    if (!node) {
      throw new FacilityStructureNotFountException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    return node['root']['children'];
  }
  
}
