import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { ExcelImportExportInterface, HeaderInterface, MainHeaderInterface } from 'src/common/interface/excel.import.export.interface';
const exceljs = require('exceljs');
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class ExcelImportExportRepository implements ExcelImportExportInterface<any> {
  constructor(private readonly neo4jService: Neo4jService) {}
 

  async addTypesWithCobie(file: Express.Multer.File,header:MainHeaderInterface){}
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
