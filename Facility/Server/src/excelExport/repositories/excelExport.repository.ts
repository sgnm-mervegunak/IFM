import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FacilityStructureNotFountException } from '../../common/notFoundExceptions/not.found.exception';
import { NestKafkaService } from 'ifmcommon';
import { Neo4jService, assignDtoPropToEntity, createDynamicCyperObject } from 'sgnm-neo4j/dist';
import { RelationName } from 'src/common/const/relation.name.enum';


import { ExcelExportInterface } from 'src/common/interface/excel.export.interface';
import { ExportExcelDto } from '../dto/excel.export.dto';

@Injectable()
export class ExcelExportRepository implements ExcelExportInterface<any> {
  constructor(private readonly neo4jService: Neo4jService) {}
 



  async getSpacesByBuilding(realm:string,buildingKey:string ){
    let data:any
    let jsonData=[]
    let buildingType=[]
    let cypher =`WITH 'MATCH (c:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b {key:"${buildingKey}"}) MATCH path = (b)-[:PARENT_OF*]->(m) where m.isDeleted=false  and not (m:JointSpaces OR m:JointSpace OR m:Zones or m:Zone) 
    WITH collect(path) AS paths
    CALL apoc.convert.toTree(paths)
    YIELD value
    RETURN value' AS query
    CALL apoc.export.json.query(query,'/test121.json',{jsonFormat:'ARRAY_JSON'})
    YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data
    RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data`
    
    await this.neo4jService.write(cypher);
    
    //call the file using below code
    let cypher2=`CALL apoc.load.json("test121.json")`
    
    let returnData =await this.neo4jService.read(cypher2)
    data=await returnData.records[0]["_fields"][0]
    
    if(data.value.parent_of[0]?.parent_of[0]?.parent_of==undefined){
      for (let index = 0; index < data.value.parent_of?.length; index++) {
    
        for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
         buildingType.push({i:data.value.nodeType,
           2:data.value.parent_of[index].nodeType,
           3:data.value.parent_of[index].parent_of[i].nodeType})
         
        }}
    }else{
      for (let index = 0; index < data.value.parent_of?.length; index++) {
        for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
       
         for (let a = 0; a < data.value.parent_of[index].parent_of[i].parent_of?.length; a++) {
         
           buildingType.push({1:data.value.nodeType,
             2:data.value.parent_of[index].nodeType,
             3:data.value.parent_of[index].parent_of[i].nodeType,
               4:data.value.parent_of[index].parent_of[i].parent_of[a].nodeType})
           
         }
         
       }}
    }
    
    let typeList=await Object.values(buildingType[0])
    console.log(typeList)
    
    
    
     if(!typeList.includes("Block")){
      for (let index = 0; index < data.value.parent_of?.length; index++) {
    
        for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
          
            jsonData.push({building:data.value.name,
              block:"-",
              floor:data.value.parent_of[index].name,
                space:data.value.parent_of[index].parent_of[i].name})
        }
      }
    
    
     } else {
      for (let index = 0; index < data.value.parent_of?.length; index++) {
    
        for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
          
          for (let a = 0; a < data.value.parent_of[index].parent_of[i].parent_of?.length; a++) {
            
            jsonData.push({building:data.value.name,
              block:data.value.parent_of[index].name,
              floor:data.value.parent_of[index].parent_of[i].name,
                space:data.value.parent_of[index].parent_of[i].parent_of[a].name})
            
          }
          
        }
      }
    }
    
    return jsonData;
    
    
    }
    
  async getJointSpacesByBuilding(realm:string,buildingKey:string ){
      let data:any
      let jsonData=[]
      let cypher =`WITH 'MATCH (c:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b {key:"${buildingKey}"}) MATCH path = (b)-[:PARENT_OF*]->(m) where m.isDeleted=false  and not (m:Space OR m:Zone OR m:Zones OR m:Floor OR m:Block)
      WITH collect(path) AS paths
      CALL apoc.convert.toTree(paths)
      YIELD value
      RETURN value' AS query
      CALL apoc.export.json.query(query,'/test121.json',{jsonFormat:'ARRAY_JSON'})
      YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data
      RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data`
      
      await this.neo4jService.write(cypher);
      
      //call the file using below code
      // let cypher2=`CALL apoc.load.json("test121.json")`
      
      // let returnData =await this.neo4jService.read(cypher2)
      // data=await returnData.records[0]["_fields"][0]
      
      // if(data.value.parent_of[0]?.parent_of[0]?.parent_of==undefined){
      //   for (let index = 0; index < data.value.parent_of?.length; index++) {
      
      //     for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
      //      buildingType.push({i:data.value.nodeType,
      //        2:data.value.parent_of[index].nodeType,
      //        3:data.value.parent_of[index].parent_of[i].nodeType})
           
      //     }}
      // }else{
      //   for (let index = 0; index < data.value.parent_of?.length; index++) {
      //     for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
         
      //      for (let a = 0; a < data.value.parent_of[index].parent_of[i].parent_of?.length; a++) {
           
      //        buildingType.push({1:data.value.nodeType,
      //          2:data.value.parent_of[index].nodeType,
      //          3:data.value.parent_of[index].parent_of[i].nodeType,
      //            4:data.value.parent_of[index].parent_of[i].parent_of[a].nodeType})
             
      //      }
           
      //    }}
      // }
      
      // let typeList=await Object.values(buildingType[0])
      // console.log(typeList)
      
      
      
      //  if(!typeList.includes("Block")){
      //   for (let index = 0; index < data.value.parent_of?.length; index++) {
      
      //     for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
            
      //         jsonData.push({building:data.value.name,
      //           block:"-",
      //           floor:data.value.parent_of[index].name,
      //             space:data.value.parent_of[index].parent_of[i].name})
      //     }
      //   }
      
      
      //  } else {
      //   for (let index = 0; index < data.value.parent_of?.length; index++) {
      
      //     for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
            
      //       for (let a = 0; a < data.value.parent_of[index].parent_of[i].parent_of?.length; a++) {
              
      //         jsonData.push({building:data.value.name,
      //           block:data.value.parent_of[index].name,
      //           floor:data.value.parent_of[index].parent_of[i].name,
      //             space:data.value.parent_of[index].parent_of[i].parent_of[a].name})
              
      //       }
            
      //     }
      //   }
      // }
      
      
      return jsonData;
      
      
      }
    
    
  async getZonesByBuilding(realm:string,buildingKey:string ){
        let data:any
        let jsonData=[]
        let cypher =`WITH 'MATCH (c:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b {key:"${buildingKey}"}) MATCH path = (b)-[:PARENT_OF*]->(m) where m.isDeleted=false  and not (m:Space OR m:JointSpaces OR m:JointSpace OR m:Floor OR m:Block)
        WITH collect(path) AS paths
        CALL apoc.convert.toTree(paths)
        YIELD value
        RETURN value' AS query
        CALL apoc.export.json.query(query,'/test121.json',{jsonFormat:'ARRAY_JSON'})
        YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data
        RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data`
        
        await this.neo4jService.write(cypher);
        
        //call the file using below code
        let cypher2=`CALL apoc.load.json("test121.json")`
        
        let returnData =await this.neo4jService.read(cypher2)
        data=await returnData.records[0]["_fields"][0]
        
      
         
          for (let index = 0; index < data.value.parent_of?.length; index++) {
        
            for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
              
                jsonData.push({Building:data.value.name,
                    Zones:data.value.parent_of[index].name,
                    ZoneName:data.value.parent_of[index].parent_of[i].name,
                    SpacesName:data.value.parent_of[index].parent_of[i].spaceNames})
            }
          }
        

        console.log(jsonData)
        return jsonData;
        
        
}

  async getSpacesAnExcelFile( body:ExportExcelDto ){
          let data = []
          for(let item of body.buildingKeys){
            console.log(item);
            let abc =await (this.getSpacesByBuilding(body.realm,item))
            data = [...data,...abc]
          }
        
          return data;
        
      
        }


  async getZonesAnExcelFile( {buildingKeys,realm}:ExportExcelDto ){
          let data = []
          for(let item of buildingKeys){
            console.log(item);
            let abc =await (this.getZonesByBuilding(realm,item))
            data = [...data,...abc]
          }
        
          return data;
        
      
        }

  async getJointSpacesAnExcelFile( {buildingKeys,realm}:ExportExcelDto ){
          let data = []
          for(let item of buildingKeys){
            console.log(item);
            let abc =await (this.getJointSpacesByBuilding(realm,item))
            data = [...data,...abc]
          }
        
          return data;
        
      
 }
}
