import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

// import { CustomNeo4jError, Neo4jService } from 'sgnm-neo4j';

import { CreateClassificationDto } from '../dto/create-classification.dto';
import { UpdateClassificationDto } from '../dto/update-classification.dto';
import { Classification } from '../entities/classification.entity';
import { ClassificationNotFountException, FacilityStructureNotFountException } from 'src/common/notFoundExceptions/not.found.exception';
import { CustomTreeError } from 'src/common/const/custom.error.enum';
import { createDynamicCyperObject, Neo4jService , dynamicLabelAdder, dynamicFilterPropertiesAdder, dynamicNotLabelAdder} from 'sgnm-neo4j/dist';
import { classificationInterface } from 'src/common/interface/classification.interface';
import { I18NEnums } from 'ifmcommon/dist';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
const exceljs = require('exceljs');
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class ClassificationRepository implements classificationInterface<Classification> {
  constructor(private readonly neo4jService: Neo4jService) {}


  async findOneByRealm(label: string, realm: string) {
    // //let node = await this.neo4jService.findByRealmWithTreeStructure(label, realm);
    // let node = await this.neo4jService.findByLabelAndFiltersWithTreeStructure(
    //   ['FacilityStructure'],{"realm":realm, "isDeleted":false},[],{"isDeleted":false, "canDisplay":true}
    // ) 
    // if (!node) {
    //   throw new ClassificationNotFountException(realm);
    // }
    // node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    // return node;
  }

  async create(createClassificationDto: CreateClassificationDto) {
    function assignDtoPropToEntity(entity, dto) {
      Object.keys(dto).forEach((element) => {
        if (element != 'parentId' && element != 'parentKey') {
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
    try {
      let deletedNode;
      // const hasChildren = await this.neo4jService.findChildrenById(_id);
      // if (hasChildren['records'].length == 0) {
      //   deletedNode = await this.neo4jService.delete(_id);
      // } else {
      //   throw new HttpException(has_children_error, 400);
      // }
      deletedNode = await this.neo4jService.delete(_id);
      return deletedNode;
    } catch (error) {
      if (error.response?.code == CustomTreeError.HAS_CHILDREN) {
        throw new HttpException({ key: I18NEnums.NODE_HAS_CHILD, args: { name: _id } }, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException({ message: error.response?.message, code: 400 }, 400);
      }
    }
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
 //////////////////////////////////////////////////// Berkayın ekledikleri ve yeni sgnm neo4j ye göre revizeleri  ////////////////////
 //REVISED FOR NEW NEO4J
 async getClassificationByIsActiveStatus(realm: string, language: string) {
  const root_node = await this.neo4jService.findByLabelAndFilters(['Classification'],{"isDeleted":false, "realm": realm},[]);
  const root_id = root_node[0]['_fields'][0]['identity'].low;
  const firstNodes  = await this.neo4jService.findChildrensByIdOneLevel(root_id,{"isDeleted":false},[],{"isDeleted":false,"isActive":true},'PARENT_OF');

 let lbls = firstNodes.map((item) => {
   if (item['_fields'][1]['labels'][0].endsWith('_'+language)) {
     return item['_fields'][1]['labels'][0];
   }
 });
 lbls = lbls.filter((item) => {
  if (item != undefined) {
    return item;
  }
});
let labels = [...new Set(lbls)];
 let root = {root:{ parent_of: [], root_id, ...root_node[0]['_fields'][0].properties }};
 for (let i = 0; i < labels.length; i++) {
   let node = await this.neo4jService.findByLabelAndFiltersWithTreeStructure(
     [labels[i].toString()],{"realm":realm, "isDeleted":false},[],{"isDeleted":false,"isActive":true}
   )
   root.root.parent_of.push(node['root']); 
 }
 root = await this.neo4jService.changeObjectChildOfPropToChildren(root);
 return root;
}

  // async getClassificationByIsActiveStatus(realm: string, language: string) {
  //   let cypher = `MATCH (r:Root {realm:"${realm}"})-[:PARENT_OF]->(c:Classification {realm:"${realm}"}) MATCH path =(c)-[:PARENT_OF]->(n) WHERE (n.isActive=true and n.isDeleted=false) WITH DISTINCT labels(n) AS labels \
  //     UNWIND labels AS label \
  //     RETURN DISTINCT label\
  //     `;

  //   let data = await this.neo4jService.read(cypher);
  //   let returnData = [];
  //   for (let index = 0; index < data.records.length; index++) {
  //     returnData.push(data.records[index]['_fields'][0]);
  //   }

  //   let cypher2 = `MATCH (r:Root {realm:"${realm}"})-[:PARENT_OF]->(c:Classification {realm:"${realm}"})  RETURN c`;

  //   let data2 = await this.neo4jService.read(cypher2);
  //   let _id = data2.records[0]['_fields'][0].identity;
  //   let root = { parent_of: [], _id, ...data2.records[0]['_fields'][0].properties };

  //   let abc = [];
  //   for (let index = 0; index < returnData.length; index++) {
  //     if (returnData[index].endsWith('_' + language) == true) {
  //       abc.push(returnData[index]);
  //     }
  //   }

  //   for (let index = 0; index < abc.length; index++) {
  //     let cypher2 = `MATCH (c:Classification {realm:"${realm}"})-[:PARENT_OF]->(b:${abc[index]} {realm:"${realm}"})  MATCH path = (b)-[:PARENT_OF*]->(m) where (b.isActive=true and b.isDeleted=false) and (m.isActive=true and m.isDeleted=false) \
  //       WITH collect(path) AS paths\
  //       CALL apoc.convert.toTree(paths)\
  //       YIELD value\
  //       RETURN value;`;

  //     let data2 = await this.neo4jService.read(cypher2);
  //     if (data2.records[0]['_fields'][0].parent_of?.length > 0) {
  //       root.parent_of.push(data2.records[0]['_fields'][0]);
  //     } else {
  //       let cypher2 = `MATCH (c:Classification {realm:"${realm}"})-[:PARENT_OF]->(b:${abc[index]} {realm:"${realm}"}) where b.isDeleted=false RETURN b`;

  //       let data3 = await this.neo4jService.read(cypher2);
  //       let _id = data3.records[0]['_fields'][0].identity;
  //       let data = { _id, ...data3.records[0]['_fields'][0].properties };
  //       root.parent_of.push(data);
  //     }
  //   }

  //   let rootObject = { root };
  //   let result = await this.neo4jService.changeObjectChildOfPropToChildren(rootObject);
  //   return result;
  // }

  async setIsActiveTrueOfClassificationAndItsChild(id: string) {
    let cypher = `MATCH (n) where id(n)=${Number(id)} SET n.isActive=true`;
    await this.neo4jService.write(cypher);

    let cypher2 = `MATCH (n) where id(n)=${Number(id)} MATCH (n)-[:PARENT_OF*]->(a) SET a.isActive=true `;
    await this.neo4jService.write(cypher2);
  }

  async setIsActiveFalseOfClassificationAndItsChild(id: string) {
    let cypher = `MATCH (n) where id(n)=${Number(id)} SET n.isActive=false`;
    await this.neo4jService.write(cypher);

    let cypher2 = `MATCH (n) where id(n)=${Number(id)} MATCH (n)-[:PARENT_OF*]->(a) SET a.isActive=false`;
    await this.neo4jService.write(cypher2);
  }

  async findOneFirstLevelByRealm(label: string, realm: string) {
    return null;
  }
  //REVISED FOR NEW NEO4J
  async getClassificationsByLanguage(realm: string, language: string) {
     const root_node = await this.neo4jService.findByLabelAndFilters(['Classification'],{"isDeleted":false, "realm": realm},[]);
     const root_id = root_node[0]['_fields'][0]['identity'].low;
     const firstNodes  = await this.neo4jService.findChildrensByIdOneLevel(root_id,{"isDeleted":false},[],{"isDeleted":false},'PARENT_OF');
    //const firstNodes  = await this.neo4jService.findChildrensByLabelsOneLevel(['Classification'],{'isDeleted':false,'realm':realm},[],{"isDeleted":false})

    let lbls = firstNodes.map((item) => {
      if (item['_fields'][1]['labels'][0].endsWith('_'+language)) {
        return item['_fields'][1]['labels'][0];
      }
    });
    lbls = lbls.filter((item) => {
      if (item != undefined) {
        return item;
      }
    });
    let labels = [...new Set(lbls)];
    let root = {root:{ parent_of: [], root_id, ...root_node[0]['_fields'][0].properties }};
    for (let i = 0; i < labels.length; i++) {
      let node = await this.neo4jService.findByLabelAndFiltersWithTreeStructure(
        [labels[i].toString()],{"realm":realm, "isDeleted":false},[],{"isDeleted":false}
      )
      root.root.parent_of.push(node['root']); 
    }
    root = await this.neo4jService.changeObjectChildOfPropToChildren(root);
    return root;
  }


  // async getClassificationsByLanguage(realm: string, language: string) {
  //   let cypher = `MATCH (r:Root {realm:"${realm}"})-[:PARENT_OF]->(c:Classification {realm:"${realm}"}) MATCH path =(c)-[:PARENT_OF]->(n) where n.isDeleted=false WITH DISTINCT labels(n) AS labels \
  //   UNWIND labels AS label \
  //   RETURN DISTINCT label\
  //   `;

  //   let data = await this.neo4jService.read(cypher);
  //   let returnData = [];
  //   for (let index = 0; index < data.records.length; index++) {
  //     returnData.push(data.records[index]['_fields'][0]);
  //   }

  //   let cypher2 = `MATCH (r:Root {realm:"${realm}"})-[:PARENT_OF]->(c:Classification {realm:"${realm}"}) RETURN c`;

  //   let data2 = await this.neo4jService.read(cypher2);
  //   let _id = data2.records[0]['_fields'][0].identity;
  //   let root = { parent_of: [], _id, ...data2.records[0]['_fields'][0].properties };

  //   let abc = [];
  //   for (let index = 0; index < returnData.length; index++) {
  //     if (returnData[index].endsWith('_' + language) == true) {
  //       abc.push(returnData[index]);
  //     }
  //   }

  //   for (let index = 0; index < abc.length; index++) {
  //     let cypher2 = `MATCH (c:Classification {realm:"${realm}"})-[:PARENT_OF]->(b:${abc[index]} {realm:"${realm}"})  MATCH path = (b)-[:PARENT_OF*]->(m) where m.isDeleted=false  \
  //   WITH collect(path) AS paths\
  //   CALL apoc.convert.toTree(paths)\
  //   YIELD value\
  //   RETURN value;`;

  //     let data2 = await this.neo4jService.read(cypher2);
  //     if (data2.records[0]['_fields'][0].parent_of?.length > 0) {
  //       root.parent_of.push(data2.records[0]['_fields'][0]);
  //     } else {
  //       let cypher2 = `MATCH (c:Classification {realm:"${realm}"})-[:PARENT_OF]->(b:${abc[index]} {realm:"${realm}"}) RETURN b`;

  //       let data3 = await this.neo4jService.read(cypher2);
  //       let _id = data3.records[0]['_fields'][0].identity;
  //       let data = { _id, ...data3.records[0]['_fields'][0].properties };
  //       root.parent_of.push(data);
  //     }
  //   }

  //   let rootObject = { root };
  //   let result = await this.neo4jService.changeObjectChildOfPropToChildren(rootObject);
  //   return result;
  // }

  async findChildrenByFacilityTypeNode(language: string, realm: string, typename: string) {
    return null;
  }

 
   //REVISED FOR NEW NEO4J
   async getAClassificationByRealmAndLabelNameAndLanguage(realm: string, labelName: string, language: string) {
     const root_node = await this.neo4jService.findByLabelAndFilters(['Classification'],{"isDeleted":false, "realm": realm},[]);
     let root = {root:{ parent_of: [], ...root_node[0]['_fields'][0].properties }};
     let node = await this.neo4jService.findByLabelAndFiltersWithTreeStructure(
       [labelName+'_'+language],{"realm":realm, "isDeleted":false, "isActive":true},[],{"isDeleted":false, "isActive":true}
     )
     root.root.parent_of.push(node['root']); 
     root = await this.neo4jService.changeObjectChildOfPropToChildren(root);
     return root;
 } 

  // async getAClassificationByRealmAndLabelNameAndLanguage(realm: string, labelName: string, language: string) {
  //   let cypher = `MATCH (c:Classification {realm:"${realm}"}) return c`;
  //   let data = await this.neo4jService.read(cypher);

  //   let root = { root: { parent_of: [], ...data.records[0]['_fields'][0].properties } };

  //   let cypher2 = `MATCH (c:Classification {realm:"${realm}"})-[:PARENT_OF]->(b:${labelName}_${language} {realm:"${realm}"}) \
  //   MATCH path = (b)-[:PARENT_OF*]->(m)  where b.isActive=true and b.isDeleted=false and m.isActive=true and m.isDeleted=false  \
  //     WITH collect(path) AS paths\
  //     CALL apoc.convert.toTree(paths)\
  //     YIELD value\
  //     RETURN value;`;

  //   let data2 = await this.neo4jService.read(cypher2);
  //   let p = data2.records[0]['_fields'][0];

  //   root.root.parent_of.push(p);

  //   let result = await this.neo4jService.changeObjectChildOfPropToChildren(root);
  //   console.log(result);
  //   return result;
  // }



  async addAClassificationFromExcel( file: Express.Multer.File, realm: string, language: string) {

    let data;

  let buffer = new Uint8Array(file.buffer);
  const workbook = new exceljs.Workbook();

  await workbook.xlsx.load(buffer).then(function async(book) {
    const firstSheet =  book.getWorksheet(1);
      data=firstSheet.getColumn(1).values.filter((e)=>(e!=null));

 })
 await data[0].replaceAll(" ","_")
  function key(){
    return uuidv4()
    }
    let cypher=`MATCH (r:Root {realm:"${realm}"})-[:PARENT_OF]->(c:Classification {realm:"${realm}"}) MERGE (n:${data[0]}_${language} {isRoot:true,isActive:true,name:"${data[0]}",isDeleted:false,key:"${key()}",canDelete:true,realm:"${realm}",canDisplay:true}) MERGE (c)-[:PARENT_OF]->(n)`
   
  
    await this.neo4jService.write(cypher)

  for (let i = 1; i < data.length; i++) {
    function key2(){
      return uuidv4()
      }
    let cypher2=`MATCH (m:${data[0]}_${language})  MERGE (n {name:"${data[i]}",key:"${key2()}",isActive:true,isDeleted:false,canDelete:true}) MERGE (m)-[:PARENT_OF]->(n) `
    await this.neo4jService.write(cypher2)
   
  }
  }



  async addAClassificationWithCodeFromExcel(file: Express.Multer.File, realm: string,language: string) {

    let data=[];


    let buffer = new Uint8Array(file.buffer);
    const workbook = new exceljs.Workbook();
   
    await workbook.xlsx.load(buffer).then(function async(book) {
      const firstSheet =  book.getWorksheet(1);
       
         data=firstSheet.getColumn(1).values.filter((e)=>(e!=null));
       
      
   
   })
   
   
   
     let deneme=[];
   
     for (let index = 1; index < data.length; index++) {
       const element = data[index].split(new RegExp(/\s{1,}|:\s{1,}|:/g));
      
       deneme.push(element);
     }
     for(let i=0;i<deneme.length;i++){
       deneme[i][0]=deneme[i][0].replace(/ /g, '-');
     }
   
     let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
   
         deneme.sort(collator.compare[0]);
   
     let newClassification=[]
     let codearray=[]
   
   
     function uuidReturn(){
       return uuidv4()
      }
      await data[0].replaceAll(" ","_")
   for (let q = 0; q < deneme.length; q++) {
     
     let parentcode = "";   
     var z = 0;
     codearray= await deneme[q][0].split("-");
   
     for (let j=0; j < codearray.length; j++) {
       if (codearray[j] == "00") {
         z=z+1;
       }
     }
   
     if (z == 0) {
       for (let i=0; i<codearray.length-1; i++ ) {
         if (parentcode == "") {
           parentcode = codearray[i];
         }
         else {
           parentcode = parentcode + "-" + codearray[i];
         }
         
       }
       if (codearray.length == 4) {
         parentcode = parentcode + "-" +  "00";
       }  
     }
     else {
       if (z == 1) {
         for (let i=0; i<codearray.length-2; i++ ) {
           if (parentcode == "") {
             parentcode = codearray[i];
           }
           else {
             parentcode = parentcode + "-" + codearray[i];
           }
         }
           parentcode = parentcode + "-" + "00-00"; 
       }
       else if (z == 2) {
         for (let i=0; i<codearray.length-3; i++ ) {
           if (parentcode == "") {
             parentcode = codearray[i];
           }
           else {
             parentcode = parentcode + "-" + codearray[i];
           }
         }
           parentcode = parentcode + "-" + "00-00-00"; 
       }
       else if (z == 3) {
         for (let i=0; i<codearray.length-4; i++ ) {
           if (parentcode == "") {
             parentcode = codearray[i];
           } 
           else {
             parentcode = parentcode + "-" + codearray[i];
           }
         }
         if (parentcode == "") {
           parentcode = "00-00-00-00";
         } 
         else {
           parentcode = parentcode + "-" + "00-00-00-00"; 
         }
           
       }
   
       else if (z == 4) {
         for (let i=0; i<codearray.length-5; i++ ) {
           if (parentcode == "") {
             parentcode = codearray[i];
           } 
           else {
             parentcode = parentcode + "-" + codearray[i];
           }
         }
         if (parentcode == "") {
           parentcode = "00-00-00-00-00";
         } 
         else {
           parentcode = parentcode + "-" + "00-00-00-00-00"; 
         }
           
       }
     } 
   
     var codestr = "";
     for (let t=0; t < codearray.length; t++) {
       if (codestr == "") {
         codestr =  codearray[t];
       }
       else {
         codestr = codestr + "-" + codearray[t]; 
       }
       
     }
     
      
     let dto = {
       code: codestr,
       parentCode: parentcode.length<codestr.length ? parentcode +"-00" : parentcode,
       name: deneme[q][1],
       key: uuidReturn(),
       isDeleted:false,
       isActive:true,
       canDelete:true,
     };
   
   
     
     newClassification.push(dto);
   
   }
   
   ///////// the process start here
   function uuidReturn3(){
   return uuidv4()
   
   }
     let cypher= `Match (a:Root {realm:"${realm}"})-[:PARENT_OF]->(n:Classification {realm:"${realm}"}) MERGE (b:${data[0]}_${language} {code:"${newClassification[0].parentCode}",name:"${data[0]}",isDeleted:false,canCopied:true,canDelete:false,realm:"${realm}",isRoot:true,canDisplay:true,key:"${uuidReturn3()}",isActive:true}) MERGE (n)-[:PARENT_OF]->(b)`;
   await this.neo4jService.write(cypher);
   
     
   
     for(let i=0;i<newClassification.length;i++){
   
      let cypher2= `MATCH (n) where n.code="${newClassification[i].parentCode}" MERGE (b {code:"${newClassification[i].code}",parentCode:"${newClassification[i].parentCode}",name:"${newClassification[i].name}",isDeleted:${newClassification[i].isDeleted},isActive:${newClassification[i].isActive},canDelete:${newClassification[i].canDelete},key:"${uuidReturn3()}"}) MERGE (n)-[:PARENT_OF]->(b)`;
      await this.neo4jService.write(cypher2)
     }
    
  }



  
}
