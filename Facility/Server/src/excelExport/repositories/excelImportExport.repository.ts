import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { building_already_exist, building_already_exist_object, contact_already_exist, contact_already_exist_object, floor_already_exist, floor_already_exist_object, space_already_exist, space_already_exist_object, zone_already_exist, zone_already_exist_object,default_error, space_has_already_relation_object, space_has_already_relation, there_are_no_spaces_object, there_are_no_spaces, there_are_no_jointSpaces, there_are_no_zones, there_are_no_jointSpaces_object, there_are_no_zones_object } from 'src/common/const/custom.classification.error';


import { ExcelImportExportInterface, HeaderInterface, MainHeaderInterface } from 'src/common/interface/excel.import.export.interface';
import { ExportExcelDto } from '../dto/excel.export.dto';
const exceljs = require('exceljs');
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class ExcelImportExportRepository implements ExcelImportExportInterface<any> {
  constructor(private readonly neo4jService: Neo4jService) {}
 



  async getSpacesByBuilding(realm:string,buildingKey:string,language:string){
    try {
      let data:any
      let jsonData=[]
      let buildingType=[]
      let cypher =`WITH 'MATCH (c:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b {key:"${buildingKey}",isDeleted:false}) MATCH path = (b)-[:PARENT_OF*]->(m)-[:CLASSIFIED_BY|:CREATED_BY]->(z) where  (z.language="${language}" or not exists(z.language)) and m.isDeleted=false  and not (m:JointSpaces OR m:JointSpace OR m:Zones or m:Zone) 
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
      data=await returnData.records[0]["_fields"][0];
      
      console.log(data.value.parent_of[0]?.nodeType)   
      console.log(typeof data.value.parent_of[0].parent_of)                                                                                           
      if(data.value.parent_of==undefined || (data.value.parent_of[0]?.nodeType=="Floor" && typeof data.value.parent_of[0].parent_of=="undefined") ||(data.value.parent_of[0]?.nodeType=="Block" && (typeof data.value.parent_of[0].parent_of=="undefined" ||typeof data.value.parent_of[0].parent_of[0].parent_of=="undefined"))){
        throw new HttpException(there_are_no_spaces_object(),404);
      }
      else {
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
        
        let typeList=await Object.values(buildingType[0]);
        console.log(typeList);
        
         if(!typeList.includes("Block")){
          for (let index = 0; index < data.value.parent_of?.length; index++) {
        
            for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
              let spaceProperties = data.value.parent_of[index].parent_of[i];
                jsonData.push({BuildingName:data.value.name,
                  BlockName:"-",
                  FloorName:data.value.parent_of[index].name,
                  SpaceName:spaceProperties.name,
                  Code:spaceProperties.code ? spaceProperties.code : " ",
                  ArchitecturalName:spaceProperties.architecturalName,
                  ArchitecturalCode:spaceProperties.architecturalCode  ? spaceProperties.architecturalCode : " ",
                  Category:spaceProperties.classified_by[0].name,
                  GrossArea:spaceProperties.grossArea,
                  NetArea:spaceProperties.netArea,
                  Usage:spaceProperties.usage ? spaceProperties.usage : " ",
                  Tag:spaceProperties.tag.toString(),
                  RoomTag:spaceProperties.roomTag.toString(),
                  Status:spaceProperties.status? spaceProperties.status: " ",
                  OperatorName:spaceProperties.operatorName ? spaceProperties.operatorName : " ", 
                  OperatorCode:spaceProperties.operatorCode ? spaceProperties.operatorCode : " ", 
                  Description:spaceProperties.description,
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
        
            for (let i = 0; i < data.value.parent_of[index]?.parent_of?.length; i++) {
              
              for (let a = 0; a < data.value.parent_of[index]?.parent_of[i]?.parent_of?.length; a++) {
                let spaceProperties = data.value.parent_of[index]?.parent_of[i]?.parent_of[a];
                
                jsonData.push({BuildingName:data.value.name,
                  BlockName:data.value.parent_of[index].name,
                  FloorName:data.value.parent_of[index].parent_of[i].name,
                  SpaceName:data.value.parent_of[index].parent_of[i].parent_of[a].name,
                  Code:spaceProperties.code ? spaceProperties.code: " ",
                  ArchitecturalName:spaceProperties.architecturalName,
                  ArchitecturalCode:spaceProperties.architecturalCode  ? spaceProperties.architecturalCode: " ",
                  Category:spaceProperties.classified_by[0].name,
                  GrossArea:spaceProperties.grossArea,
                  NetArea:spaceProperties.netArea,
                  Usage:spaceProperties.usage ? spaceProperties.usage : " ",
                  Tag:spaceProperties.tag.toString(),
                  RoomTag:spaceProperties.roomTag.toString(),
                  Status:spaceProperties.status? spaceProperties.status: " ",
                  OperatorName:spaceProperties.operatorName ? spaceProperties.operatorName : " ", 
                  OperatorCode:spaceProperties.operatorCode ? spaceProperties.operatorCode : " ", 
                  Description:spaceProperties.description,
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
        console.log(jsonData,"2");
        return jsonData;
      }
      
     
      
    } catch (error) {
      if(error.response?.code===10010){
        there_are_no_spaces()
      }else {
        default_error()
      }
  
     }
  
    
    }
    
  async getJointSpacesByBuilding(realm:string,buildingKey:string,language:string ){
    try {
      let data:any
      let jsonData=[]
      let cypher =`WITH 'MATCH (c:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b {key:"${buildingKey}",isDeleted:false}) MATCH path = (b)-[:PARENT_OF*]->(m)-[:CLASSIFIED_BY|:CREATED_BY]->(z) where  (z.language="${language}" or not exists(z.language)) and m.isDeleted=false  and not (m:Space OR m:Zone OR m:Zones OR m:Floor OR m:Block)
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
      
      if(Object.keys(data?.value).length==0 ){
        throw new HttpException(there_are_no_jointSpaces_object(),404)
      }
     
      for (let index = 0; index < data.value.parent_of?.length; index++) {
        
        for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
          let jointSpaceProperties=data.value.parent_of[index].parent_of[i]
          jsonData.push({BuildingName:data.value.name,
            JointSpaceName:jointSpaceProperties.name,
            Category:jointSpaceProperties.classified_by[0].name,
            CreatedBy:jointSpaceProperties.created_by[0].name,
            SpaceNames:jointSpaceProperties.jointSpaceTitle,
            Description:jointSpaceProperties.description,
            Tags:jointSpaceProperties.tag.toString(),
            RoomTags:jointSpaceProperties.roomTag.toString(),
            Status:jointSpaceProperties.status ? jointSpaceProperties.status : " ",
            Usage :jointSpaceProperties.usage ? jointSpaceProperties.usage : " ",
            UsableHeight:jointSpaceProperties.usableHeight ? jointSpaceProperties.usableHeight : " ",
            GrossArea:jointSpaceProperties.grossArea ? jointSpaceProperties.grossArea : " ",
            NetArea:jointSpaceProperties.netArea ? jointSpaceProperties.netArea : " ",

          })
        }
      }
    


    return jsonData;
    
    } catch (error) {
      if(error.response?.code===10011){
        there_are_no_jointSpaces()
      }else {
        default_error()
      }
  
     }
     
      
      }
    
    
  async getZonesByBuilding(realm:string,buildingKey:string,language:string ){
    try {
      let data:any
      let jsonData=[]
      let cypher =`WITH 'MATCH (c:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b {key:"${buildingKey}",isDeleted:false}) MATCH path = (b)-[:PARENT_OF*]->(m)-[:CREATED_BY|:CLASSIFIED_BY]->(z) where (z.language="${language}" or not exists(z.language)) and m.isDeleted=false  and not (m:Space OR m:JointSpaces OR m:JointSpace OR m:Floor OR m:Block)
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

      if(Object.keys(data?.value).length==0 ){
        throw new HttpException(there_are_no_zones_object(),404)
      }else {
        console.log(data.value.parent_of[0].parent_of[0].nodeType);
        console.log(data.value.parent_of[0].parent_of.length)
           
            for (let index = 0; index < data.value.parent_of?.length; index++) {
          
              for (let i = 0; i < data.value.parent_of[index].parent_of?.length; i++) {
                
                jsonData.push({BuildingName:data.value.name,
                  ZoneName:data.value.parent_of[index].parent_of[i].name,
                  Category:data.value.parent_of[index].parent_of[i].classified_by[0].name,
                  CreatedBy:data.value.parent_of[index].parent_of[i].created_by[0].email,
                  SpaceNames:data.value.parent_of[index].parent_of[i].spaceNames.toString(),
                  Description:data.value.parent_of[index].parent_of[i].description,
                  Tags:data.value.parent_of[index].parent_of[i].tag.toString()
                
                })
                 
              }
            }
          
    
           return jsonData;
      }

    } catch (error) {
      if(error.response?.code===10012){
        there_are_no_zones()
      }else {
        default_error()
      }
  
     }
       
        
}

  async getSpacesAnExcelFile( {buildingKeys}:ExportExcelDto,{realm,language}:HeaderInterface){
    try {
      let data = [];

          for(let item of buildingKeys){
            let abc =await this.getSpacesByBuilding(realm,item,language);
            console.log(abc)
          if(abc instanceof Error ){
            throw new HttpException(there_are_no_spaces_object(),404);
          }else {
            data = [...data,...abc]
          }
           return data;
          }
            
    } catch (error) {
      if(error.response?.code===10010){
        there_are_no_spaces()
      }else {
        default_error()
      }
  
     }
           

  }


  async getZonesAnExcelFile( {buildingKeys}:ExportExcelDto,{realm,language}:HeaderInterface){
    try {
      let data = []
          
      for(let item of buildingKeys){
        console.log(item);
        
        let abc =await (this.getZonesByBuilding(realm,item,language))
        if(abc instanceof Error ){
          throw new HttpException(there_are_no_zones_object(),404);
        }else {
          data = [...data,...abc]
        }
        
      }

       return data;
    } catch (error) {
      if(error.response?.code===10012){
        there_are_no_zones()
      }else {
        default_error()
      }
  
     }
         
        
      
  }

  async getJointSpacesAnExcelFile( {buildingKeys}:ExportExcelDto,{realm,language}:HeaderInterface){
    try {
      let data = []
      for(let item of buildingKeys){
        console.log(item);
        let abc =await (this.getJointSpacesByBuilding(realm,item,language))
        if(abc instanceof Error ){
          throw new HttpException(there_are_no_jointSpaces_object(),404);
        }else{
          data = [...data,...abc]
        }
        
      }
    
      return data;
    } catch (error) {
      if(error.response?.code===10011){
        there_are_no_jointSpaces()
      }else {
        default_error()
      }
  
     }
         

 }


 async addBuildingWithCobie( file: Express.Multer.File,header:MainHeaderInterface){
   try {
    const {realm}= header;
    let email:string;
    
    let data=[]

    let buffer = new Uint8Array(file.buffer);
    const workbook = new exceljs.Workbook();
  
  
  await workbook.xlsx.load(buffer).then(function async(book) {
      const firstSheet =  book.getWorksheet(3);
      firstSheet.eachRow({ includeEmpty: false }, function(row) {
        data.push(row.values);
      });


   })
  
   let checkBuilding = await this.neo4jService.findChildrensByLabelsAndFilters(['FacilityStructure'],{realm},[`Building`],{name:data[1][1],isDeleted:false});
   if(checkBuilding.length==0){
    let categoryCode = await data[1][4].split(": ");

       let {createdCypher,createdRelationCypher}=await this.createCypherForClassification(realm,"OmniClass11",categoryCode[0],"b","cc","c","CLASSIFIED_BY");
 
       if(typeof data[1][2]=='object'){
         email=await data[1][2].text;
       }else {
         email= await data[1][2];
       }
   
   //CYPHER QUERY FOR BUILDING 

   let cypher=`MATCH (r:FacilityStructure {realm:"${realm}"}) ${createdCypher} \
   MATCH (cnt:Contact {realm:"${realm}"})-[:PARENT_OF]->(p {email:"${email}",isDeleted:false} ) \
   MERGE (b:Building {name:"${data[1][1]}",createdOn:"${data[1][3]}",projectName:"${data[1][5]}",siteName:"${data[1][6]}",areaMeasurement:"${data[1][11]}",externalSystem:"${data[1][12]}",externalObject:"${data[1][13]}", \
   externalIdentifier:"${data[1][14]}",externalSiteObject:"${data[1][15]}",externalSiteIdentifier:"${data[1][16]}",externalFacilityObject:"${data[1][17]}",externalFacilityIdentifier:"${data[1][18]}", \
   description:"${data[1][19]}",projectDescription:"${data[1][20]}",siteDescription:"${data[1][21]}",phase:"${data[1][22]}",address:"",status:"${data[1][23]}",code:"${data[1][24]}",owner:"",operator:"",contractor:"",handoverDate:"",operationStartDate:"",warrantyExpireDate:"",tag:[],canDisplay:true,key:"${this.keyGenerate()}",canDelete:true,isActive:true,isDeleted:false, \
   nodeType:"Building"}) MERGE (js:JointSpaces {key:"${this.keyGenerate()}",canDelete:false,canDisplay:false,isActive:true,isDeleted:false,name:"Joint Space"})\ 
   MERGE (zs:Zones {key:"${this.keyGenerate()}",canDelete:false,canDisplay:false,isActive:true,isDeleted:false,name:"Zones"})\ 
   MERGE (b)-[:PARENT_OF]->(zs) MERGE (b)-[:PARENT_OF]->(js)  MERGE (r)-[:PARENT_OF]->(b) ${createdRelationCypher} MERGE (b)-[:CREATED_BY]->(p) ;`
   
  await this.neo4jService.write(cypher)

   }else {
    throw new HttpException(building_already_exist_object(),400)
   }
   
   } catch (error) {
    if(error.response?.code===10003){
      building_already_exist()
    }else {
      default_error()
    }
   }
    
  }

 async addFloorsToBuilding(file: Express.Multer.File, header:MainHeaderInterface, buildingKey: string)
{
  let data=[]
  try {
    let email:string;
    const {realm}=header;
  
   
    
  
    let buffer = new Uint8Array(file.buffer);
    const workbook = new exceljs.Workbook();
  
  
  await workbook.xlsx.load(buffer).then(function async(book) {
      const firstSheet =  book.getWorksheet(4);
      firstSheet.eachRow({ includeEmpty: false }, function(row) {
        data.push(row.values);
      });
   })
  
  
     for (let i = 1; i < data.length; i++) {
      let checkFloor = await this.neo4jService.findChildrensByLabelsAndFilters(['Building'],{key:buildingKey,isDeleted:false},[`Floor`],{name:data[i][1],isDeleted:false});

      if(checkFloor.length==0){
        let {createdCypher,createdRelationCypher}=await this.createCypherForClassification(realm,"FacilityFloorTypes",data[i][4],"f","cc","c","CLASSIFIED_BY");
  
        if(typeof data[i][2]=='object'){
          email=await data[i][2].text;
        }else {
          email= await data[i][2];
        }
    
        let cypher=`MATCH (a:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b:Building {key:"${buildingKey}",isDeleted:false}) \
                    ${createdCypher} \
                    MATCH (cont:Contact {realm:"${realm}"})-[:PARENT_OF]->(p {email:"${email}",isDeleted:false}) \
                    MERGE (f:Floor {code:"",name:"${data[i][1]}",isDeleted:false,isActive:true,nodeType:"Floor",description:"${data[i][8]}",tag:[],canDelete:true,canDisplay:true,key:"${this.keyGenerate()}",createdOn:"${data[i][3]}",elevation:"${data[i][9]}",height:"${data[i][10]}",externalSystem:"",externalObject:"",externalIdentifier:""}) \
                    MERGE (b)-[:PARENT_OF]->(f)\
                    ${createdRelationCypher} \
                    MERGE (f)-[:CREATED_BY]->(p)`;
    
     await this.neo4jService.write(cypher);

      }else {
        throw new HttpException(floor_already_exist_object(data[i][1]),400)
      }

    }
  } catch (error) {
    if(error.response?.code===10004){
      floor_already_exist(error.response?.name)
    }else {
      default_error()
    }
   }


 }

async addSpacesToBuilding( file: Express.Multer.File, header:MainHeaderInterface, buildingKey: string)
{
  try {
    let email:string;
    const {realm}= header;
    

    
      let data=[]
      let categoryColumn=[];
      let values:[string];
      let buffer = new Uint8Array(file.buffer);
      const workbook = new exceljs.Workbook();
    
    
    await workbook.xlsx.load(buffer).then(function async(book) {
        const firstSheet =  book.getWorksheet(5);
        firstSheet.eachRow({ includeEmpty: false }, function(row) {
          data.push(row.values);
        });
    
        values= firstSheet.getColumn(8).values; // getting classification values
        
     })
    
    
     for (let index = 1; index < values.length; index++) {
      const [first, ...rest] = values[index].split(new RegExp(/:\s{1}/g));
      let arr = [first, rest.join(': ')];
      categoryColumn.push(arr);
    }
console.log(categoryColumn)
    for (let i = 1; i < data.length; i++) {
      let checkSpaces = await this.neo4jService.findChildrensByLabelsAndFilters(['Building'],{key:buildingKey},[`Space`],{locationCode:data[i][3],isDeleted:false});

      if(checkSpaces.length == 0) {
        let {createdCypher,createdRelationCypher} =await this.createCypherForClassification(realm,'OmniClass13',categoryColumn[i][0],"s","cc","c","CLASSIFIED_BY")
        if(typeof data[i][6]=='object'){
          email=await data[i][6].text;
        }else {
          email= await data[i][6];
        }
      
        let cypher=`MATCH (a:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b:Building {key:"${buildingKey}",isDeleted:false}) \
         MATCH (cont:Contact {realm:"${realm}"})-[:PARENT_OF]->(p {email:"${email}",isDeleted:false}) \
         ${createdCypher} \
         MATCH (b)-[:PARENT_OF]->(f:Floor {name:"${data[i][7]}",isDeleted:false}) \
         MERGE (s:Space {operatorCode:"",operatorName:"",name:"${data[i][1]}",architecturalCode:"${data[i][4]}",architecturalName:"${data[i][2]}",locationCode:"${data[i][5]}",createdOn:"${data[i][7]}",description:"${data[i][10]}",key:"${this.keyGenerate()}",externalSystem:"${data[i][11]}",externalObject:"${data[i][12]}",externalIdentifier:"${data[i][13]}", \ 
         tag:[],roomTag:["${data[i][14]}"],usableHeight:"${data[i][15]}",grossArea:"${data[i][16]}",netArea:"${data[i][17]}",images:"",documents:"", \
         canDisplay:true,isDeleted:false,isActive:true,nodeType:"Space",isBlocked:false,canDelete:true}) \
         MERGE (f)-[:PARENT_OF]->(s) MERGE (s)-[:CREATED_BY]->(p) ${createdRelationCypher};`
        let abc =await this.neo4jService.write(cypher);
        console.log(abc)
      }else{
        throw new HttpException(space_already_exist_object(data[i][3]),400) 
      }

   
    
     }
  } catch (error) {
    if(error.response?.code===10005){
      space_already_exist(error.response?.name)
    }else {
      default_error()
    }
   }
 
   

}

async addZonesToBuilding( file: Express.Multer.File,header:MainHeaderInterface, buildingKey: string){

  try {
    let email:string;
    const {realm}= header;
    let data=[]
    let buffer = new Uint8Array(file.buffer);
    const workbook = new exceljs.Workbook();
  
  
  await workbook.xlsx.load(buffer).then(function async(book) {
      const firstSheet =  book.getWorksheet(6);
      firstSheet.eachRow({ includeEmpty: false }, function(row) {
        data.push(row.values);
      });
   })
  
  
   for (let i = 1; i <data.length; i++) {
  let cypher =`MATCH (n:Building {key:"${buildingKey}",isDeleted:false})-[:PARENT_OF*]->(s:Space {locationCode:"${data[i][5]}",isDeleted:false}) \ 
   MATCH (s)-[:MERGEDZN]->(z:Zone {name:"${data[i][1]}",isDeleted:false}) return z`;
   let returnData = await this.neo4jService.read(cypher);
   
 
    if(returnData.records.length==0){
  let {createdCypher,createdRelationCypher}=await this.createCypherForClassification(realm,"FacilityZoneTypes",data[i][4],"zz","cc","c","CLASSIFIED_BY");
  
      if(typeof data[i][2]=='object'){
        email=await data[i][2].text;
      }else {
        email= await data[i][2];
      }
  
    let cypher =`MATCH (b:Building {key:"${buildingKey}"})-[:PARENT_OF]->(z:Zones {name:"Zones"})\
    MATCH (c:Space {locationCode:"${data[i][5]}"})\
    MATCH (cnt:Contact {realm:"${realm}"})-[:PARENT_OF]->(p {email:"${email}"})\
    ${createdCypher} \
    ${await this.getZoneFromDb(buildingKey,data[i])} \
    MERGE (z)-[:PARENT_OF]->(zz)  \
    MERGE (c)-[:MERGEDZN]->(zz)  \
    ${createdRelationCypher} \
    MERGE (zz)-[:CREATED_BY]->(p);`

     await this.neo4jService.write(cypher)
    }else {
      throw new HttpException(space_has_already_relation_object(),400)
     }

    
  }
  
  } catch (error) {
    if(error.response?.code===10006){
      zone_already_exist(error.response?.name)
    }else if(error.response?.code===10009){
      space_has_already_relation()
    }
    else {
      default_error()
    }
   }
 
 }

 async addContacts(file: Express.Multer.File,header:MainHeaderInterface)  {
  try {
    let email:string;
  let createdByEmail:string;
  const {realm}= header;

 
    let data=[]
    let categoryColumn=[];
    let values:[string];
    let buffer = new Uint8Array(file.buffer);
    const workbook = new exceljs.Workbook();
  
  
  await workbook.xlsx.load(buffer).then(function async(book) {
      const firstSheet =  book.getWorksheet(2);
      firstSheet.eachRow({ includeEmpty: false }, function(row) {
        data.push(row.values);
      });
  
      values= firstSheet.getColumn(4).values;
      
   })
  
   for (let index = 1; index < values.length; index++) {
         
    const [first, ...rest] = values[index].split(new RegExp(/:\s{1}/g));
    let arr = [first, rest.join(': ')];
   
    categoryColumn.push(arr);
  }
  
  for (let i = 1; i < data.length; i++) {
    
    let {createdCypher,createdRelationCypher} =await this.createCypherForClassification(realm,'OmniClass34',categoryColumn[i-1][0],"p","cc","c","PARENT_OF")

    if(typeof data[i][1]=='object'){
      email=await data[i][1].text;
    }else {
      email= await data[i][1];
    }
    if(typeof data[i][2]=='object'){
      createdByEmail=await data[i][2].text;
    }else {
      createdByEmail= await data[i][2];
    }

    let checkEmail = await this.neo4jService.findChildrensByLabelsAndFilters(['Contact'],{realm},[],{email,isDeleted:false});
    if(checkEmail.length==0){
      let cypher=`MATCH (c:Contact {realm:"${realm}"}) ${createdCypher} \
      MERGE (p {email:"${email}",createdOn:"${data[i][3]}",company:"${data[i][5]}", phone:"${data[i][6]}",externalSystem:"${data[i][7]}",externalObject:"${data[i][8]}",externalIdentifier:"${data[i][9]}",department:"${data[i][10]}",organizationCode:"${data[i][11]}", \
      givenName:"${data[i][12]}",familyName:"${data[i][13]}",street:"${data[i][14]}",postalBox:"${data[i][15]}",town:"${data[i][16]}",stateRegion:"${data[i][17]}",postalCode:"${data[i][18]}",country:"${data[i][19]}",canDisplay:true,isDeleted:false,isActive:true,className:"Contact",key:"${this.keyGenerate()}",canDelete:true} )\
      MERGE (c)-[:PARENT_OF]->(p)  ${createdRelationCypher}`
      let data2 =await this.neo4jService.write(cypher);
    console.log(data2)

    let cypher2 = `MATCH (p {email:"${email}"}) MATCH (p2 {email:"${createdByEmail}"}) MERGE (p)-[:CREATED_BY]->(p2)`
    let data3 =await this.neo4jService.write(cypher2);
    }else{
      throw new HttpException(contact_already_exist_object(email),400)
    }
  
    }
   
  } catch (error) {
    if(error.response?.code===10007){
      contact_already_exist(error.response?.name)
    }else {
      default_error()
    }

   }
  
  
  };


  async addTypesWithCobie(file: Express.Multer.File,header:MainHeaderInterface){}
  async addComponentsWithCobie(file: Express.Multer.File,header:MainHeaderInterface){}
  async addSystemWithCobie(file: Express.Multer.File,header:MainHeaderInterface){}

  ////common functions for this page

  async createCypherForClassification(realm:string,classificationLabel:string,categoryCode:string,nodeName:string,classificationParentPlaceholder:string,classificationChildrenPlaceholder:string,relationName:string){
    let cypherArray=[]
  let cypherArray2=[]
  let cypher= `MATCH (a:Language_Config {realm:"${realm}"})-[:PARENT_OF]->(z) return z`;
  let abc = await this.neo4jService.read(cypher);
  let datasLenght=  await abc.records;  

  for (let index = 0; index < datasLenght.length; index++) {
   let createdCypher=` MATCH (${classificationParentPlaceholder}${index}:${classificationLabel}_${datasLenght[index]["_fields"][0].properties.name} {realm:"${realm}"})-[:PARENT_OF*]->(${classificationChildrenPlaceholder}${index} {code:"${categoryCode}",language:"${datasLenght[index]["_fields"][0].properties.name}"})`;
   let createdRelationCypher=`MERGE (${nodeName})-[:${relationName}]->(${classificationChildrenPlaceholder}${index})`
    cypherArray.push(createdCypher);
    cypherArray2.push(createdRelationCypher);
  }

return {createdCypher:cypherArray.join(" "),createdRelationCypher:cypherArray2.join(" ")}
    }

  keyGenerate(){
      return uuidv4()
  }


  async getZoneFromDb(buildingKey:string,data:string[]){


    let cypher =`MATCH (b:Building {key:"${buildingKey}"})-[:PARENT_OF]->(zz:Zones {name:"Zones"})-[:PARENT_OF]->(z:Zone {name:"${data[1]}",isDeleted:false}) return z`;
    let returnData = await this.neo4jService.read(cypher);
    
    
    if(returnData.records?.length==1){
      return `Match (zz:Zone {key:"${returnData.records[0]["_fields"][0].properties.key}",isDeleted:false}) SET zz.spaceNames = zz.spaceNames + "${data[5]}"`;
    }else{
      return `MERGE (zz:Zone {name:"${data[1]}",createdOn:"${data[3]}",externalSystem:"${data[6]}", externalObject:"${data[7]}", externalIdentifier:"${data[8]}", description:"${data[9]}", tag:[],\
      nodeKeys:[], nodeType:"Zone",images:[],documents:[],spaceNames:["${data[5]}"], key:"${this.keyGenerate()}", canDisplay:true, isActive:true, isDeleted:false, canDelete:true})\
      MERGE (z)-[:PARENT_OF]->(zz)`; 
    }
  }
}

