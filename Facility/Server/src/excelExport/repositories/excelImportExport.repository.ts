import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Neo4jService } from 'sgnm-neo4j/dist';


import { ExcelImportExportInterface, HeaderInterface, MainHeaderInterface } from 'src/common/interface/excel.import.export.interface';
import { ExportExcelDto } from '../dto/excel.export.dto';
const exceljs = require('exceljs');
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class ExcelImportExportRepository implements ExcelImportExportInterface<any> {
  constructor(private readonly neo4jService: Neo4jService) {}
 



  async getSpacesByBuilding(realm:string,buildingKey:string,language:string){
    let data:any
    let jsonData=[]
    let buildingType=[]
    let cypher =`WITH 'MATCH (c:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b {key:"${buildingKey}"}) MATCH path = (b)-[:PARENT_OF*]->(m)-[:CLASSIFIED_BY|:CREATED_BY]->(z) where  (z.language="${language}" or not exists(z.language)) and m.isDeleted=false  and not (m:JointSpaces OR m:JointSpace OR m:Zones or m:Zone OR m:Block) 
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
              Tag:spaceProperties.tag.toString(),
              Status:spaceProperties.status? spaceProperties.status: " ",
              ArchitecturalCode:spaceProperties.architecturalCode  ? spaceProperties.architecturalCode: " ",
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
              Tag:spaceProperties.tag.toString(),
              Status:spaceProperties.status? spaceProperties.status: " ",
              ArchitecturalCode:spaceProperties.architecturalCode  ? spaceProperties.architecturalCode: " ",
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
    
    return jsonData;
    
    
    }
    
  async getJointSpacesByBuilding(realm:string,buildingKey:string,language:string ){
      let data:any
      let jsonData=[]
      let cypher =`WITH 'MATCH (c:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b {key:"${buildingKey}"}) MATCH path = (b)-[:PARENT_OF*]->(m)-[:CLASSIFIED_BY|:CREATED_BY]->(z) where  (z.language="${language}" or not exists(z.language)) and m.isDeleted=false  and not (m:Space OR m:Zone OR m:Zones OR m:Floor OR m:Block)
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
    


    return jsonData;
    
      
      }
    
    
  async getZonesByBuilding(realm:string,buildingKey:string,language:string ){
        let data:any
        let jsonData=[]
        let cypher =`WITH 'MATCH (c:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b {key:"${buildingKey}"}) MATCH path = (b)-[:PARENT_OF*]->(m)-[:CREATED_BY|:CLASSIFIED_BY]->(z) where (z.language="${language}" or not exists(z.language)) and m.isDeleted=false  and not (m:Space OR m:JointSpaces OR m:JointSpace OR m:Floor OR m:Block)
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

  async getSpacesAnExcelFile( {buildingKeys}:ExportExcelDto,{realm,language}:HeaderInterface){
           let data = [];

          for(let item of buildingKeys){
            let abc =await (this.getSpacesByBuilding(realm,item,language))
            data = [...data,...abc]
          }
           return data;

        }


  async getZonesAnExcelFile( {buildingKeys}:ExportExcelDto,{realm,language}:HeaderInterface){
          let data = []
          
          for(let item of buildingKeys){
            console.log(item);
            let abc =await (this.getZonesByBuilding(realm,item,language))
            data = [...data,...abc]
          }

           return data;
        
      
        }

  async getJointSpacesAnExcelFile( {buildingKeys}:ExportExcelDto,{realm,language}:HeaderInterface){
          let data = []
          for(let item of buildingKeys){
            console.log(item);
            let abc =await (this.getJointSpacesByBuilding(realm,item,language))
            data = [...data,...abc]
          }
        
          return data;

 }


 async addBuildingwithCobie( file: Express.Multer.File,header:MainHeaderInterface){
   
    const {realm}= header;
    let data=[]
    let values:[string];
    let buffer = new Uint8Array(file.buffer);
    const workbook = new exceljs.Workbook();
  
  
  await workbook.xlsx.load(buffer).then(function async(book) {
      const firstSheet =  book.getWorksheet(3);
      firstSheet.eachRow({ includeEmpty: false }, function(row) {
        data.push(row.values);
      });
  
  
      
      values= firstSheet.getColumn(4).values;
      
  
   })
  
  
  
   let categoryCode = await data[1][4].split(":");
  
   let code =await categoryCode[0].replaceAll(" ","-")
  
  
  
  // add digits to code  
   let getClassificationType=`MATCH (n:OmniClass11_EN {realm:"${realm}"}) return n`
   let codeData= await this.neo4jService.write(getClassificationType)
   console.log(codeData)
   let abc = codeData.records[0]["_fields"][0].properties.code
  
   for (let index = 0; index = (abc.length-code.length)/3; index++) {
    
      code=await code+"-00"
   }
  
 
  
      let {createdCypher,createdRelationCypher}=await this.createCypherForClassification(realm,"OmniClass11",code,"b");
  
  // cypher query for building 
  let cypher=`MATCH (r:FacilityStructure {realm:"${realm}"}) \
  ${createdCypher} \
  MATCH (p {email:"${data[1][2]}"} ) \
  MERGE (b:Building {name:"${data[1][1]}",createdOn:"${data[1][3]}",projectName:"${data[1][5]}",siteName:"${data[1][6]}",areaMeasurement:"${data[1][11]}",externalSystem:"${data[1][12]}",externalObject:"${data[1][13]}", \
  externalIdentifier:"${data[1][14]}",externalSiteObject:"${data[1][15]}",externalSiteIdentifier:"${data[1][16]}",externalFacilityObject:"${data[1][17]}",externalFacilityIdentifier:"${data[1][18]}", \
  description:"${data[1][19]}",projectDescription:"${data[1][20]}",siteDescription:"${data[1][21]}",phase:"${data[1][22]}",address:"",status:"${data[1][23]}",owner:"",operator:"",contractor:"",handoverDate:"",operationStartDate:"",warrantyExpireDate:"",tag:[],canDisplay:true,key:"${this.keyGenerate()}",canDelete:true,isActive:true,isDeleted:false, \
  nodeType:"Building"}) MERGE (js:JointSpaces {key:"${this.keyGenerate()}",canDelete:false,canDisplay:false,isActive:true,isDeleted:false,name:"Joint Space"})\ 
  MERGE (zs:Zones {key:"${this.keyGenerate()}",canDelete:false,canDisplay:false,isActive:true,isDeleted:false,name:"Zones"})\ 
  MERGE (b)-[:PARENT_OF]->(zs) MERGE (b)-[:PARENT_OF]->(js)  MERGE (r)-[:PARENT_OF]->(b) ${createdRelationCypher} MERGE (b)-[:CREATED_BY]->(p) ;`
  
   let value =await this.neo4jService.write(cypher)
  console.log(value)
   }

  async addFloorsToBuilding(file: Express.Multer.File, header:MainHeaderInterface, buildingKey: string)
{
  const {realm}=header;

  let data=[]
  

  let buffer = new Uint8Array(file.buffer);
  const workbook = new exceljs.Workbook();


await workbook.xlsx.load(buffer).then(function async(book) {
    const firstSheet =  book.getWorksheet(4);
    firstSheet.eachRow({ includeEmpty: false }, function(row) {
      data.push(row.values);
    });
 })


   for (let i = 1; i < data.length; i++) {
    let {createdCypher,createdRelationCypher}=await this.createCypherForClassification(realm,"FacilityFloorTypes",data[i][4],"f");

    let cypher=`MATCH (a:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b:Building {key:"${buildingKey}"}) \
                ${createdCypher} \
                MATCH (p {email:"${data[i][2]}"}) \
                MERGE (f:Floor {code:"",name:"${data[i][1]}",isDeleted:false,isActive:true,nodeType:"Floor",description:"${data[i][8]}",tag:[],canDelete:true,canDisplay:true,key:"${this.keyGenerate()}",createdOn:"${data[i][3]}",elevation:"${data[i][9]}",height:"${data[i][10]}",externalSystem:"",externalObject:"",externalIdentifier:""}) \
                MERGE (b)-[:PARENT_OF]->(f)\
                ${createdRelationCypher} \
                MERGE (f)-[:CREATED_BY]->(p)`;

 let value =await this.neo4jService.write(cypher);
 console.log(value);
  }

}

async addSpacesToBuilding( file: Express.Multer.File, header:MainHeaderInterface, buildingKey: string)
{
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

    values= firstSheet.getColumn(4).values;
    
 })


 for (let index = 2; index < values.length; index++) {
     
  const element = values[index].split(new RegExp(/\s{3,}|:\s{1,}/g));
 
  categoryColumn.push(element);
}
  for(let i=0;i<categoryColumn.length;i++){

    categoryColumn[i][0]=categoryColumn[i][0].replace(/ /g, '-')
  }



let long=10

for (let index = 0; index < categoryColumn.length; index++) {
  categoryColumn[index][0] = categoryColumn[index][0].replaceAll('-', '');
}
//
for (let index = 0; index < categoryColumn.length; index++) {
  if (categoryColumn[index][0].length == 4) {
    categoryColumn[index][0] = categoryColumn[index][0].match(/.{2}/g);
    for (let i = 0; i < (long - 4) / 2; i++) {
      categoryColumn[index][0].push(['00']);
    }
    categoryColumn[index][0] = categoryColumn[index][0].join('-');
  } else if (categoryColumn[index][0].length == 6) {
    categoryColumn[index][0] = categoryColumn[index][0].match(/.{2}/g);
    for (let i = 0; i < (long - 6) / 2; i++) {
      categoryColumn[index][0].push(['00']);
    }
    categoryColumn[index][0] = categoryColumn[index][0].join('-');
  } else if (categoryColumn[index][0].length == 8) {
    categoryColumn[index][0] = categoryColumn[index][0].match(/.{2}/g);
    for (let i = 0; i < (long - 8) / 2; i++) {
      categoryColumn[index][0].push(['00']);
    }
    categoryColumn[index][0] = categoryColumn[index][0].join('-');
  } else if (categoryColumn[index][0].length == 10) {
    categoryColumn[index][0] = categoryColumn[index][0].match(/.{2}/g);
    for (let i = 0; i < (long - 10) / 2; i++) {
      categoryColumn[index][0].push(['00']);
    }
    categoryColumn[index][0] = categoryColumn[index][0].join('-');
  } 
}

for (let i = 1; i < data.length; i++) {
  let {createdCypher,createdRelationCypher} =await this.createCypherForClassification(realm,'OmniClass13',categoryColumn[i-1][0],"s")
  let cypher=`MATCH (a:FacilityStructure {realm:"${realm}"})-[:PARENT_OF]->(b:Building {key:"${buildingKey}"}) \
  MATCH (p {email:"${data[i][2]}"}) \
   ${createdCypher} \
   MATCH (b)-[:PARENT_OF]->(f:Floor {name:"${data[i][5]}"})\
   MERGE (s:Space {code:"",name:"${data[i][1]}",createdOn:"${data[i][3]}",architecturalName:"${data[i][6]}",usage:"${data[i][8]}",description:"${data[i][6]}",key:"${this.keyGenerate()}",externalSystem:"${data[i][7]}",externalObject:"${data[i][8]}",externalIdentifier:"${data[i][9]}",tag:["${data[i][10]}"],usableHeight:"${data[i][11]}",grossArea:"${data[i][12]}",netArea:"${data[i][13]}",image:[],canDisplay:true,isDeleted:false,isActive:true,nodeType:"Space",isBlocked:false,canDelete:true})\
   MERGE (f)-[:PARENT_OF]->(s) MERGE (s)-[:CREATED_BY]->(p) ${createdRelationCypher};`
  await this.neo4jService.write(cypher);

}
   

}

async addZonesToBuilding( file: Express.Multer.File,header:MainHeaderInterface, buildingKey: string){
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


 for (let i = 1; i < data.length; i++) {
  
    let {createdCypher,createdRelationCypher}=await this.createCypherForClassification(realm,"FacilityZoneTypes",data[i][4],"zz");

  let cypher =`MATCH (b:Building {key:"${buildingKey}"})-[:PARENT_OF]->(z:Zones {name:"Zones"})\
  MATCH (c:Space {name:"${data[i][5]}"})\
  MATCH (p {email:"${data[i][2]}"})\
  ${createdCypher} \
  MERGE (zz:Zone {name:"${data[i][1]}",createdOn:"${data[i][3]}",externalSystem:"${data[i][6]}", externalObject:"${data[i][7]}", externalIdentifier:"${data[i][8]}", description:"${data[i][9]}", tag:[],\
  nodeKeys:[], nodeType:"Zone", key:"${this.keyGenerate()}", canDisplay:true, isActive:true, isDeleted:false, canDelete:true})\
  MERGE (z)-[:PARENT_OF]->(zz)  \
  MERGE (c)-[:MERGEDZN]->(zz)  \
  ${createdRelationCypher} \
  MERGE (zz)-[:CREATED_BY]->(p);`

  await this.neo4jService.write(cypher)

  
}

 }


  ////common functions for this page

  async createCypherForClassification(realm:string,classificationLabel:string,categoryCode:string,nodeName:string){
    let cypherArray=[]
    let cypherArray2=[]
    let cypher= `MATCH (a:Language_Config {realm:"${realm}"})-[:PARENT_OF]->(z) return z`;
    let abc = await this.neo4jService.read(cypher);
    let datasLenght=  await abc.records;  
  
    for (let index = 0; index < datasLenght.length; index++) {
     let createdCypher=` MATCH (cc${index}:${classificationLabel}_${datasLenght[index]["_fields"][0].properties.name} {realm:"${realm}"})-[:PARENT_OF*]->(c${index} {code:"${categoryCode}",language:"${datasLenght[index]["_fields"][0].properties.name}"})`;
     let createdRelationCypher=`MERGE (${nodeName})-[:CLASSIFIED_BY]->(c${index})`
      cypherArray.push(createdCypher);
      cypherArray2.push(createdRelationCypher);
    }
  
  return {createdCypher:cypherArray.join(" "),createdRelationCypher:cypherArray2.join(" ")}
    }

  keyGenerate(){
      return uuidv4()
  }
}