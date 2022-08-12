import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

// import { CustomNeo4jError, Neo4jService } from 'sgnm-neo4j';

import { PaginationNeo4jParams } from 'src/common/commonDto/pagination.neo4j.dto';
import { CreateClassificationDto } from '../dto/create-classification.dto';
import { UpdateClassificationDto } from '../dto/update-classification.dto';
import { Classification } from '../entities/classification.entity';
import { ClassificationNotFountException } from 'src/common/notFoundExceptions/not.found.exception';


import { has_children_error } from 'src/common/const/custom.error.object';
import { CustomTreeError } from 'src/common/const/custom.error.enum';
import { assignDtoPropToEntity, createDynamicCyperObject, Neo4jService } from 'sgnm-neo4j/dist';
import { classificationInterface } from 'src/common/interface/classification.interface';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';

@Injectable()
export class ClassificationRepository implements classificationInterface<Classification> {
  constructor(private readonly neo4jService: Neo4jService) {}

  async findOneByRealm(label: string, realm: string) {
    let node = await this.neo4jService.findByRealmWithTreeStructure(label, realm);

    if (!node) {
      throw new ClassificationNotFountException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    return node;
  }

  async create(createClassificationDto: CreateClassificationDto) {
    function assignDtoPropToEntity(entity, dto) {
      Object.keys(dto).forEach((element) => {
        if (
          element != "parentId" &&

          element != "parentKey"
        ) {
          entity[element] = dto[element];
        }
      });
    
      return entity;
    }
    const classification = new Classification();
    const classificationObject = assignDtoPropToEntity(classification, createClassificationDto);
    let value;
    console.log(classificationObject);
    
    if (classificationObject['labels']) {
      value = await this.neo4jService.createNode(classificationObject, classificationObject['labels']);
    } else {
      value = await this.neo4jService.createNode(classificationObject);
    }
    value['properties']['id'] = value['identity'].low;
    const result = { id: value['identity'].low, labels: value['labels'], properties: value['properties'] };
    if (createClassificationDto['parentId']) {
      await this.neo4jService.addRelations(result['id'], createClassificationDto['parentId']);
    }

    return result;
  }

  async update(_id: string, updateClassificationto: UpdateClassificationDto) {
    const updateClassificationDtoWithoutLabelsAndParentId = {};

    Object.keys(updateClassificationto).forEach((element) => {
      if (element != 'labels' && element != 'parentId') {
        updateClassificationDtoWithoutLabelsAndParentId[element] = updateClassificationto[element];
      }
    });

    const dynamicObject = createDynamicCyperObject(updateClassificationto);

    const updatedNode = await this.neo4jService.updateById(_id, dynamicObject);
    if (!updatedNode) {
      throw new ClassificationNotFountException(_id);
    }
    const result = {
      id: updatedNode['identity'].low,
      labels: updatedNode['labels'],
      properties: updatedNode['properties'],
    };
    if (updateClassificationto['labels'] && updateClassificationto['labels'].length > 0) {
      await this.neo4jService.removeLabel(_id, result['labels']);
      await this.neo4jService.updateLabel(_id, updateClassificationto['labels']);
    }
    return result;
  }
  async delete(_id: string) {
    // try {
      let deletedNode;
      const hasChildren = await this.neo4jService.findChildrenById(_id);
      if (hasChildren['records'].length == 0) {
        deletedNode = await this.neo4jService.delete(_id);
      } else {
        throw new HttpException(has_children_error, 400);
      }

      return deletedNode;
    // } catch (error) {
    //   if (error.response?.code == CustomTreeError.HAS_CHILDREN) {
    //     throw new HttpException(has_children_error, 400);
    //   } else {
    //     throw new HttpException(error.response?.message, error.response?.code);
    //   }
    // }
  }
  
  async changeNodeBranch(_id: string, target_parent_id: string) {
    try {
      await this.neo4jService.deleteRelations(_id);
      await this.neo4jService.addRelations(_id, target_parent_id);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async deleteRelations(_id: string) {
    await this.neo4jService.deleteRelations(_id);
  }
  async addRelations(_id: string, target_parent_id: string) {
    try {
      await this.neo4jService.addRelations(_id, target_parent_id);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOneNodeByKey(key: string) {
    try {
      const node = await this.neo4jService.findOneNodeByKey(key);
      if (!node) {
        throw new ClassificationNotFountException(key);
      }

      return node;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getClassificationByIsActiveStatus(realm: string,language: string){
    
      let cypher=`MATCH (r:Root {realm:"${realm}"})-[:PARENT_OF]->(c:Classification {realm:"${realm}"}) MATCH path =(c)-[:PARENT_OF]->(n) WHERE (n.isActive=true and n.isDeleted=false) WITH DISTINCT labels(n) AS labels \
      UNWIND labels AS label \
      RETURN DISTINCT label\
      `
      
      let data =await this.neo4jService.read(cypher);
      let returnData=[]
      for (let index = 0; index < data.records.length; index++) {
        returnData.push(data.records[index]["_fields"][0])
        
      }
   
      let cypher2=`MATCH (r:Root {realm:"${realm}"})-[:PARENT_OF]->(c:Classification {realm:"${realm}"})  RETURN c`
      
      let data2 =await this.neo4jService.read(cypher2);
      let _id=data2.records[0]["_fields"][0].identity;
      let root={parent_of:[],_id,...data2.records[0]["_fields"][0].properties}
      
      
    let abc=[]
    for (let index = 0; index < returnData.length; index++) {
      if(returnData[index].endsWith("_"+language)==true){
     
        abc.push(returnData[index])
      }
      
    }
  
      for (let index = 0; index < abc.length; index++) {
        let cypher2=`MATCH (c:Classification {realm:"${realm}"})-[:PARENT_OF]->(b:${abc[index]} {realm:"${realm}"})  MATCH path = (b)-[:PARENT_OF*]->(m) where (b.isActive=true and b.isDeleted=false) and (m.isActive=true and m.isDeleted=false) \
        WITH collect(path) AS paths\
        CALL apoc.convert.toTree(paths)\
        YIELD value\
        RETURN value;`
        
        let data2 =await this.neo4jService.read(cypher2);
        if(data2.records[0]["_fields"][0].parent_of?.length>0){
          root.parent_of.push(data2.records[0]["_fields"][0])
        }
        else{
          let cypher2=`MATCH (c:Classification {realm:"${realm}"})-[:PARENT_OF]->(b:${abc[index]} {realm:"${realm}"}) where b.isDeleted=false RETURN b`
      
        let data3 =await this.neo4jService.read(cypher2);
        let _id=data3.records[0]["_fields"][0].identity;
        let data ={_id,...data3.records[0]["_fields"][0].properties}
        root.parent_of.push(data)
         }
      }
    
       let rootObject ={root}
       let result =await this.neo4jService.changeObjectChildOfPropToChildren(rootObject)
       return result
      
    
  }

  async setIsActiveTrueOfClassificationAndItsChild(id:string){
    let cypher=`MATCH (n) where id(n)=${Number(id)} SET n.isActive=true`
    await this.neo4jService.write(cypher)

  let cypher2=`MATCH (n) where id(n)=${Number(id)} MATCH (n)-[:PARENT_OF*]->(a) SET a.isActive=true `;
    await this.neo4jService.write(cypher2)
  }


  async setIsActiveFalseOfClassificationAndItsChild(id:string){
    let cypher=`MATCH (n) where id(n)=${Number(id)} SET n.isActive=false`
    await this.neo4jService.write(cypher)
   
     let cypher2=`MATCH (n) where id(n)=${Number(id)} MATCH (n)-[:PARENT_OF*]->(a) SET a.isActive=false`;
     await this.neo4jService.write(cypher2) 
  };

  async findOneFirstLevelByRealm(label: string, realm: string) {
    return null;
  }

  
  async getClassificationsByLanguage(realm:string, language:string) 
  {
    let cypher=`MATCH (r:Root {realm:"${realm}"})-[:PARENT_OF]->(c:Classification {realm:"${realm}"}) MATCH path =(c)-[:PARENT_OF]->(n) where n.isDeleted=false WITH DISTINCT labels(n) AS labels \
    UNWIND labels AS label \
    RETURN DISTINCT label\
    `
  
  let data =await this.neo4jService.read(cypher);
  let returnData=[]
  for (let index = 0; index < data.records.length; index++) {
    returnData.push(data.records[index]["_fields"][0])
    
  }
  
  let cypher2=`MATCH (r:Root {realm:"${realm}"})-[:PARENT_OF]->(c:Classification {realm:"${realm}"}) RETURN c`
  
  let data2 =await this.neo4jService.read(cypher2);
  let _id=data2.records[0]["_fields"][0].identity;
  let root={parent_of:[],_id,...data2.records[0]["_fields"][0].properties}
  
  
let abc=[]
for (let index = 0; index < returnData.length; index++) {
  if(returnData[index].endsWith("_"+language)==true){
 
    abc.push(returnData[index])
  }
  
}

  for (let index = 0; index < abc.length; index++) {
    let cypher2=`MATCH (c:Classification {realm:"${realm}"})-[:PARENT_OF]->(b:${abc[index]} {realm:"${realm}"})  MATCH path = (b)-[:PARENT_OF*]->(m) where m.isDeleted=false  \
    WITH collect(path) AS paths\
    CALL apoc.convert.toTree(paths)\
    YIELD value\
    RETURN value;`
    
    let data2 =await this.neo4jService.read(cypher2);
    if(data2.records[0]["_fields"][0].parent_of?.length>0){
      root.parent_of.push(data2.records[0]["_fields"][0])
    }
    else{
      let cypher2=`MATCH (c:Classification {realm:"${realm}"})-[:PARENT_OF]->(b:${abc[index]} {realm:"${realm}"}) RETURN b`
  
    let data3 =await this.neo4jService.read(cypher2);
    let _id=data3.records[0]["_fields"][0].identity;
    let data ={_id,...data3.records[0]["_fields"][0].properties}
    root.parent_of.push(data)
     }
  }

   let rootObject ={root}
   let result =await this.neo4jService.changeObjectChildOfPropToChildren(rootObject)
   return result
  }


  async findChildrenByFacilityTypeNode(language: string,realm: string, typename:string) {
      return null;
    }

  async getAClassificationByRealmAndLabelNameAndLanguage(realm: string, labelName: string,language: string){
    
    let cypher=`MATCH (c:Classification {realm:"${realm}"}) return c` 
    let data =await this.neo4jService.read(cypher);
    
    let root ={root:{parent_of:[],...data.records[0]["_fields"][0].properties}}

      let cypher2=`MATCH (c:Classification {realm:"${realm}"})-[:PARENT_OF]->(b:${labelName}_${language} {realm:"${realm}"})  MATCH path = (b)-[:PARENT_OF*]->(m)  where b.isActive=true and b.isDeleted=false and m.isActive=true and m.isDeleted=false  \
      WITH collect(path) AS paths\
      CALL apoc.convert.toTree(paths)\
      YIELD value\
      RETURN value;`
  
      let data2 =await this.neo4jService.read(cypher2);
      let p=data2.records[0]["_fields"][0];
     
      root.root.parent_of.push(p);
    
     
       let result =await this.neo4jService.changeObjectChildOfPropToChildren(root)
       console.log(result)
       return result
      
    }
}

