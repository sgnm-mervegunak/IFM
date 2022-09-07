import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Neo4jService } from 'sgnm-neo4j/dist';


import { ExcelExportInterface } from 'src/common/interface/excel.export.interface';
import { ExportExcelDto } from '../dto/excel.export.dto';

@Injectable()
export class ExcelExportRepository implements ExcelExportInterface<any> {
  constructor(private readonly neo4jService: Neo4jService) {}
 



  async getSpacesByBuilding(realm:string,buildingKey:string){
    let data:any
    let jsonData=[]
    let buildingType=[]
    let cypher =`WITH 'MATCH (c:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b {key:"${buildingKey}"}) MATCH path = (b)-[:PARENT_OF*]->(m)-[:CLASSIFIED_BY|:CREATED_BY]->(z) where  (z.language="EN" or not exists(z.language)) and m.isDeleted=false  and not (m:JointSpaces OR m:JointSpace OR m:Zones or m:Zone OR m:Block) 
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
    
    
    
     if(!typeList.includes("Block")){
      for (let index = 0; index < data.value.parent_of?.length; index++) {
    
        for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
          let spaceProperties= data.value.parent_of[index].parent_of[i];
            jsonData.push({BuildingName:data.value.name,
              BlockName:"-",
              FloorName:data.value.parent_of[index].name,
              SpaceName:spaceProperties.name,
              Code:spaceProperties.code ? spaceProperties.code :" ",
              ArchitecturalName:spaceProperties.architecturalName,
              Category:spaceProperties.classified_by[0].name,
              GrossArea:spaceProperties.grossArea,
              NetArea:spaceProperties.netArea,
              Usage:spaceProperties.usage,
              Tag:spaceProperties.tag,
              Status:spaceProperties.status? spaceProperties.status: " ",
              ArchitecturalCode:spaceProperties.architecturalCode  ? spaceProperties.architecturalCode: " ",
              description:spaceProperties.description,
              UsableHeight:spaceProperties.usableHeight,
              ExternalSystem:spaceProperties.externalSystem,
              ExternalObject:spaceProperties.externalObject,
              ExternalIdentifier:spaceProperties.externalIdentifier,
              CreatedOn:spaceProperties.createdOn,
              CreatedBy:spaceProperties.created_by[0].email
              })
        }
      }
    
    
     } else {
      for (let index = 0; index < data.value.parent_of?.length; index++) {
    
        for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
          
          for (let a = 0; a < data.value.parent_of[index].parent_of[i].parent_of?.length; a++) {
            let spaceProperties=data.value.parent_of[index].parent_of[i].parent_of[a];
            
            jsonData.push({BuildingName:data.value.name,
              BlockName:data.value.parent_of[index].name,
              FloorName:data.value.parent_of[index].parent_of[i].name,
              SpaceName:data.value.parent_of[index].parent_of[i].parent_of[a].name,
              Code:spaceProperties.code ? spaceProperties.code :" ",
              ArchitecturalName:spaceProperties.architecturalName,
              Category:spaceProperties.classified_by[0].name,
              GrossArea:spaceProperties.grossArea,
              NetArea:spaceProperties.netArea,
              Usage:spaceProperties.usage,
              Tag:spaceProperties.tag,
              Status:spaceProperties.status? spaceProperties.status: " ",
              ArchitecturalCode:spaceProperties.architecturalCode  ? spaceProperties.architecturalCode: " ",
              description:spaceProperties.description,
              UsableHeight:spaceProperties.usableHeight,
              ExternalSystem:spaceProperties.externalSystem,
              ExternalObject:spaceProperties.externalObject,
              ExternalIdentifier:spaceProperties.externalIdentifier,
              CreatedOn:spaceProperties.createdOn,
              CreatedBy:spaceProperties.created_by[0].email
              })
            
          }
          
        }
      }
    }
    
    return jsonData;
    
    
    }
    
  async getJointSpacesByBuilding(realm:string,buildingKey:string ){
      let data:any
      let jsonData=[]
      let cypher =`WITH 'MATCH (c:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b {key:"${buildingKey}"}) MATCH path = (b)-[:PARENT_OF*]->(m)-[:CLASSIFIED_BY|:CREATED_BY]->(z) where  (z.language="EN" or not exists(z.language)) and m.isDeleted=false  and not (m:Space OR m:Zone OR m:Zones OR m:Floor OR m:Block)
      WITH collect(path) AS paths
      CALL apoc.convert.toTree(paths)
      YIELD value
      RETURN value' AS query
      CALL apoc.export.json.query(query,'/test121.json',{jsonFormat:'ARRAY_JSON'})
      YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data
      RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data`
      
      await this.neo4jService.write(cypher);
      
      //call the file using below code
      let cypher2=`CALL apoc.load.json("test121.json")`;
      let returnData =await this.neo4jService.read(cypher2)
      data=await returnData.records[0]["_fields"][0]
      
      for (let index = 0; index < data.value.parent_of?.length; index++) {
        
        for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
          
          jsonData.push({BuildingName:data.value.name,
            JointSpaceName:data.value.parent_of[index].parent_of[i].name,
            Category:data.value.parent_of[index].parent_of[i].classified_by[0].name,
            CreatedBy:data.value.parent_of[index].parent_of[i].created_by[0].name,
            SpaceNames:data.value.parent_of[index].parent_of[i].jointSpaceTitle})
        }
      }
    

    console.log(jsonData)
    return jsonData;
    
      
      }
    
    
  async getZonesByBuilding(realm:string,buildingKey:string ){
        let data:any
        let jsonData=[]
        let cypher =`WITH 'MATCH (c:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b {key:"${buildingKey}"}) MATCH path = (b)-[:PARENT_OF*]->(m)-[:CREATED_BY|:CLASSIFIED_BY]->(z) where (z.language="EN" or not exists(z.language)) and m.isDeleted=false  and not (m:Space OR m:JointSpaces OR m:JointSpace OR m:Floor OR m:Block)
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
              
              jsonData.push({BuildingName:data.value.name,
                ZoneName:data.value.parent_of[index].parent_of[i].name,
                Category:data.value.parent_of[index].parent_of[i].classified_by[0].name,
                CreatedBy:data.value.parent_of[index].parent_of[i].created_by[0].email,
                SpaceNames:data.value.parent_of[index].parent_of[i].spaceNames})
               
            }
          }
        

         return jsonData;
       
        
}

  async getSpacesAnExcelFile( {buildingKeys,realm} ){
           let data = [];

          for(let item of buildingKeys){
            let abc =await (this.getSpacesByBuilding(realm,item))
            data = [...data,...abc]
          }
           return data;

        }


  async getZonesAnExcelFile( {buildingKeys,realm} ){
          let data = []
          
          for(let item of buildingKeys){
            console.log(item);
            let abc =await (this.getZonesByBuilding(realm,item))
            data = [...data,...abc]
          }

           return data;
        
      
        }

  async getJointSpacesAnExcelFile( {buildingKeys,realm}){
          let data = []
          for(let item of buildingKeys){
            console.log(item);
            let abc =await (this.getJointSpacesByBuilding(realm,item))
            data = [...data,...abc]
          }
        
          return data;
        
      
 }
}
