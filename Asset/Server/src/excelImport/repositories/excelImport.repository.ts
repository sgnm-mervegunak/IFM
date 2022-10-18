import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { ExcelImportInterface, MainHeaderInterface } from 'src/common/interface/excel.import.interface';
const exceljs = require('exceljs');
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class ExcelImportRepository implements ExcelImportInterface<any> {
  constructor(private readonly neo4jService: Neo4jService) {}
 

  async addTypesWithCobie(file: Express.Multer.File,header:MainHeaderInterface){

  let createdBy:string;
  let manufacturer:string;
  let warrantyGuarantorParts:string;
  let warrantyGuarantorLabor:string;
  const {realm}= header;


    let data=[]
    let categoryColumn=[];
    let values:[string];
    let buffer = new Uint8Array(file.buffer);
    const workbook = new exceljs.Workbook();
  
  
  await workbook.xlsx.load(buffer).then(function async(book) {
      const firstSheet =  book.getWorksheet(7);
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
      if(categoryColumn[i].length>2){
        categoryColumn[i][1] =await  categoryColumn[i][1].concat(`: ${categoryColumn[i][2]}`)
        categoryColumn[i].pop()
      }
    }
  
  
  
  let long=16
  
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
    else if (categoryColumn[index][0].length == 12) {
      categoryColumn[index][0] = categoryColumn[index][0].match(/.{2}/g);
      for (let i = 0; i < (long - 12) / 2; i++) {
        categoryColumn[index][0].push(['00']);
      }
      categoryColumn[index][0] = categoryColumn[index][0].join('-');
    } 
    else if (categoryColumn[index][0].length == 14) {
      categoryColumn[index][0] = categoryColumn[index][0].match(/.{2}/g);
      for (let i = 0; i < (long - 14) / 2; i++) {
        categoryColumn[index][0].push(['00']);
      }
      categoryColumn[index][0] = categoryColumn[index][0].join('-');
    } 
    else if (categoryColumn[index][0].length == 16) {
      categoryColumn[index][0] = categoryColumn[index][0].match(/.{2}/g);
      for (let i = 0; i < (long - 16) / 2; i++) {
        categoryColumn[index][0].push(['00']);
      }
      categoryColumn[index][0] = categoryColumn[index][0].join('-');
    } 
  }
  
  for (let i = 1; i < data.length; i++) {
  
    let {createdCypher,createdRelationCypher} =await this.createCypherForClassification(realm,'OmniClass23',categoryColumn[i-1][0],"t")

    if(typeof data[i][2]=='object'){
      createdBy=await data[i][2].text;
    }else {
      createdBy= await data[i][2];
    }

    if(typeof data[i][7]=='object'){
      manufacturer=await data[i][7].text;
    }else {
      manufacturer= await data[i][7];
    }

    if(typeof data[i][9]=='object'){
      warrantyGuarantorParts=await data[i][9].text;
    }else {
      warrantyGuarantorParts= await data[i][9];
    }

    if(typeof data[i][11]=='object'){
      warrantyGuarantorLabor=await data[i][11].text;
    }else {
      warrantyGuarantorLabor= await data[i][11];
    }
  
 
  
  //   let cypher=`MATCH (c:Contact {realm:"${realm}"}) ${createdCypher} \
  //   MERGE (p {email:"${email}",createdOn:"${data[i][3]}",company:"${data[i][5]}", phone:"${data[i][6]}",externalSystem:"${data[i][7]}",externalObject:"${data[i][8]}",externalIdentifier:"${data[i][9]}",department:"${data[i][10]}",organizationCode:"${data[i][11]}", \
  //   givenName:"${data[i][12]}",familyName:"${data[i][13]}",street:"${data[i][14]}",postalBox:"${data[i][15]}",town:"${data[i][16]}",stateRegion:"${data[i][17]}",postalCode:"${data[i][18]}",country:"${data[i][19]}",canDisplay:true,isDeleted:false,isActive:true,className:"Contact",key:"${this.keyGenerate()}",canDelete:true} )\
  //   MERGE (c)-[:PARENT_OF]->(p)  ${createdRelationCypher}`
  //   let data2 =await this.neo4jService.write(cypher);
  // console.log(data2)
  }
  // let cypher2 = `MATCH (p {email:"${email}"}) MATCH (p2 {email:"${createdByEmail}"}) MERGE (p)-[:CREATED_BY]->(p2)`
  // let data3 =await this.neo4jService.write(cypher2);
  // console.log(data3)
  }







  async addComponentsWithCobie(file: Express.Multer.File,header:MainHeaderInterface){}
  async addSystemWithCobie(file: Express.Multer.File,header:MainHeaderInterface){}

  ////common functions for this page

  async createCypherForClassification(realm:string,classificationLabel:string,categoryCode:string,nodeName:string){
    let cypherArray=[]
    let cypherArray2=[]
    let cypher= `MATCH (a:Language_Config {realm:"${realm}"})-[:PARENT_OF]->(z) return z`;
    let abc = await this.neo4jService.read(cypher);
    let datasLenght=  await abc.records;  
  
    for (let index = 0; index < datasLenght.length; index++) {
     let createdCypher=` MATCH (cc${index}:${classificationLabel}_${datasLenght[index]["_fields"][0].properties.name} {realm:"${realm}"})-[:PARENT_OF*]->(c${index} {code:"${categoryCode}",language:"${datasLenght[index]["_fields"][0].properties.name}"})`;
     let createdRelationCypher=`MERGE (${nodeName})-[:CLASSIFIED_BY]->(c${index})`;
      cypherArray.push(createdCypher);
      cypherArray2.push(createdRelationCypher);
    }
  
  return {createdCypher:cypherArray.join(" "),createdRelationCypher:cypherArray2.join(" ")}
    }

  keyGenerate(){
      return uuidv4()
  }
}
