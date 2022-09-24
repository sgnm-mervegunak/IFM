/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpException, Injectable } from '@nestjs/common';
import { NestKafkaService } from 'ifmcommon';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { InfraInterface } from 'src/common/interface/infra.interface';
const exceljs = require('exceljs');
import { generateUuid } from 'src/common/baseobject/base.virtual.node.object';
@Injectable()
export class InfraRepository implements InfraInterface {
  constructor(private readonly neo4jService: Neo4jService, private readonly kafkaService: NestKafkaService) { }
  async createConstraints() {
    try {
      const neo4Transaction = await this.neo4jService.beginTransaction();
      const constraintArr = [
        'CREATE CONSTRAINT IF NOT EXISTS ON (node:Infra) ASSERT  (node.realm) IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS ON (node:Types) ASSERT  (node.realm) IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS ON (node:Type) ASSERT  (node.name) IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS ON (node:Root) ASSERT  (node.realm) IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS ON (node:Classification) ASSERT  (node.realm) IS UNIQUE',
      ];

      constraintArr.forEach((element) => {
        neo4Transaction
          .run(element)
          .then((res) => { })
          .catch((err) => {
            console.log(err);
            neo4Transaction.rollback();
            throw new HttpException(err, 400);
          });
      });
      neo4Transaction.commit();
      neo4Transaction.close();

      /* without transaction
    arr.forEach(async (element) => {
      await this.neo4jService
        .write(element)
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    });
    */
      return 'constraints succesfully created';
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }
  async create() {
    //create  node with multi or single label
    try {
      const realmUniqness = await this.neo4jService.findByLabelAndFilters(['Infra'], { realm: 'Signum' });

      if (realmUniqness.length > 0) {
        throw new HttpException('realm must bu uniqe for Root node', 400);
      }
      const infraNode = await this.neo4jService.createNode(
        { canDelete: false, isDeleted: false, name: 'Infra', realm: 'Signum' },
        ['Infra'],
      );
      const classificationNode = await this.neo4jService.createNode(
        { canDelete: false, isDeleted: false, name: 'Classification', realm: 'Signum' },
        ['Classification'],
      );
      const assetNode = await this.neo4jService.createNode(
        { canDelete: false, isDeleted: false, name: 'Asset', realm: 'Signum' },
        ['Asset'],
      );
      const configNode = await this.neo4jService.createNode(
        { canDelete: false, isDeleted: false, name: 'System Config', realm: 'Signum' },
        ['System_Config'],
      );
      await this.neo4jService.addParentRelationByIdAndFilters(
        classificationNode.identity.low,
        {},
        infraNode.identity.low,
        {},
      );
      await this.neo4jService.addParentRelationByIdAndFilters(assetNode.identity.low, {}, infraNode.identity.low, {});
      await this.neo4jService.addParentRelationByIdAndFilters(configNode.identity.low, {}, infraNode.identity.low, {});

      const assetTypesNodeEN = await this.neo4jService.createNode(
        { canDelete: false, isDeleted: false, canCopied: true, isActive: true, isRoot: true, name: 'Asset Types', realm: 'Signum' },
        ['AssetTypes_en'],
      );
      const assetTypesNodeTR = await this.neo4jService.createNode(
        { canDelete: false, isDeleted: false, canCopied: true, isActive: true, isRoot: true, name: 'Asset Types', realm: 'Signum' },
        ['AssetTypes_tr'],
      );

      await this.neo4jService.addParentRelationByIdAndFilters(
        assetTypesNodeEN.identity.low,
        {},
        classificationNode.identity.low,
        {},
      );
      await this.neo4jService.addParentRelationByIdAndFilters(
        assetTypesNodeTR.identity.low,
        {},
        classificationNode.identity.low,
        {},
      );

      const fixedAssetTypeNodeEN = await this.neo4jService.createNode(
        {
          canDelete: true,
          isDeleted: false,
          name: 'Fixed',
          isActive: true,
          language: 'en',
        },
        ['AssetType'],
      );
      const moveableAssetTypeNodeEN = await this.neo4jService.createNode(
        {
          canDelete: true,
          isDeleted: false,
          name: 'Moveable',
          isActive: true,
          language: 'en',
        },
        ['AssetType'],
      );
      await this.neo4jService.addParentRelationByIdAndFilters(
        fixedAssetTypeNodeEN.identity.low,
        {},
        assetTypesNodeEN.identity.low,
        {},
      );
      await this.neo4jService.addParentRelationByIdAndFilters(
        moveableAssetTypeNodeEN.identity.low,
        {},
        assetTypesNodeEN.identity.low,
        {},
      );

      const fixedAssetTypeNodeTR = await this.neo4jService.createNode(
        {
          canDelete: true,
          isDeleted: false,
          name: 'Sabit',
          isActive: true,
          language: 'tr',
        },
        ['AssetType'],
      );
      const moveableAssetTypeNodeTR = await this.neo4jService.createNode(
        {
          canDelete: true,
          isDeleted: false,
          name: 'Hareketli',
          isActive: true,
          language: 'tr',
        },
        ['AssetType'],
      );
      await this.neo4jService.addParentRelationByIdAndFilters(
        fixedAssetTypeNodeTR.identity.low,
        {},
        assetTypesNodeTR.identity.low,
        {},
      );
      await this.neo4jService.addParentRelationByIdAndFilters(
        moveableAssetTypeNodeTR.identity.low,
        {},
        assetTypesNodeTR.identity.low,
        {},
      );

      const languageConfigNode = await this.neo4jService.createNode(
        {
          canDelete: false,
          isDeleted: false,
          nodesCanDelete: true,
          name: 'LanguageConfig',
          realm: 'Signum',
          isRoot: true,
          canCopied: true,
          isActive: true,
        },
        ['Language_Config'],
      );

      await this.neo4jService.addParentRelationByIdAndFilters(
        languageConfigNode.identity.low,
        {},
        configNode.identity.low,
        {},
      );

      const languageTRNode = await this.neo4jService.createNode(
        {
          canDelete: true,
          isDeleted: false,
          name: 'tr',
          realm: 'Signum',
          isActive: true,
        },
        [],
      );

      const languageENNode = await this.neo4jService.createNode(
        {
          canDelete: true,
          isDeleted: false,
          name: 'en',
          realm: 'Signum',
          isActive: true,
        },
        [],
      );
      await this.neo4jService.addParentRelationByIdAndFilters(
        languageTRNode.identity.low,
        {},
        languageConfigNode.identity.low,
        {},
      );
      await this.neo4jService.addParentRelationByIdAndFilters(
        languageENNode.identity.low,
        {},
        languageConfigNode.identity.low,
        {},
      );

      const typesNode = await this.neo4jService.createNode(
        { canDelete: false, isDeleted: false, name: 'Types', realm: 'Signum' },
        ['Types'],
      );

      await this.neo4jService.updateByIdAndFilter(typesNode.identity.low, {}, [], { id: typesNode.identity.low });

      const systemsNode = await this.neo4jService.createNode(
        { canDelete: false, isDeleted: false, canCopied: true, isRoot: true, name: 'Systems', realm: 'Signum' },
        ['Systems'],
      );
      await this.neo4jService.updateByIdAndFilter(systemsNode.identity.low, {}, [], { id: systemsNode.identity.low });

      await this.neo4jService.addParentRelationByIdAndFilters(typesNode.identity.low, {}, assetNode.identity.low, {});
      await this.neo4jService.addParentRelationByIdAndFilters(systemsNode.identity.low, {}, assetNode.identity.low, {});

      return infraNode;
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }

  async importClassificationFromExcel(file: Express.Multer.File, language: string) {
    try {
      const realmName = 'Signum';

      let checkClassification1 = await this.neo4jService.findByLabelAndFilters([`DurationUnits_${language}`], {
        realm: realmName,
      });
      let checkClassification2 = await this.neo4jService.findByLabelAndFilters([`AssetTypes_${language}`], {
        realm: realmName,
      });
      let checkClassification3 = await this.neo4jService.findByLabelAndFilters([`OmniClass23_${language}`], {
        realm: realmName,
      });

      let checkClassification4 = await this.neo4jService.findByLabelAndFilters([`OmniClass21_${language}`], {
        realm: realmName,
      });
      //console.log(checkClassification1.length==0 && checkClassification2.length==0 && checkClassification3.length==0);

      if (checkClassification1.length == 0 && checkClassification2.length == 0 && checkClassification3.length == 0 && checkClassification4.length == 0) {
        let durationUnit: any;
        let assetType: any;
        let categoryProduct: any;
        let categoryElement: any;

        let buffer = new Uint8Array(file.buffer);
        const workbook = new exceljs.Workbook();

        await workbook.xlsx.load(buffer).then(function async(book) {
          const instructionsSheet = book.getWorksheet(1);
          const realmAndValue = instructionsSheet
            .getRow(1)
            .values.splice(1)
            .map((x) => x.toLocaleLowerCase());

          // if (!realmAndValue.includes('realm') || realmAndValue.length != 2) {
          //   console.log('realm and its value are not');
          // } else {
          const sheet = book.getWorksheet(20);

          // columnsLength = book.getWorksheet(20)._columns?.length; //column length of specific sheet

          //we got what we want
          assetType = sheet.getColumn(3).values;
          durationUnit = sheet.getColumn(13).values;
          categoryProduct = sheet.getColumn(7).values;
          categoryElement = sheet.getColumn(6).values;
        });

        let classificationsWithoutCode = [assetType, durationUnit];
        let classifications = [categoryProduct, categoryElement];

        /////////// process of classifications with code ////////////////////////////////
        for (let i = 0; i < classifications.length; i++) {
          let data = [];

          for (let index = 2; index < classifications[i].length; index++) {
            const element = classifications[i][index].split(new RegExp(/\s{3,}|:\s/g));

            data.push(element);
          }
          for (let i = 0; i < data.length; i++) {
            data[i][0] = data[i][0].replace(/ /g, '-');
          }

          let collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

          data.sort(collator.compare[0]);

          ////// add digits to codes /////
          for (let index = 0; index < data.length; index++) {
            data[index][0] = data[index][0].replaceAll('-', '');
          }
          let long = await Math.max(...data.map((val) => val[0].length));

          for (let index = 0; index < data.length; index++) {
            if (data[index][0].length == 4) {
              data[index][0] = data[index][0].match(/.{2}/g);
              for (let i = 0; i < (long - 4) / 2; i++) {
                data[index][0].push(['00']);
              }
              data[index][0] = data[index][0].join('-');
            } else if (data[index][0].length == 6) {
              data[index][0] = data[index][0].match(/.{2}/g);
              for (let i = 0; i < (long - 6) / 2; i++) {
                data[index][0].push(['00']);
              }
              data[index][0] = data[index][0].join('-');
            } else if (data[index][0].length == 8) {
              data[index][0] = data[index][0].match(/.{2}/g);
              for (let i = 0; i < (long - 8) / 2; i++) {
                data[index][0].push(['00']);
              }
              data[index][0] = data[index][0].join('-');
            } else if (data[index][0].length == 10) {
              data[index][0] = data[index][0].match(/.{2}/g);
              for (let i = 0; i < (long - 10) / 2; i++) {
                data[index][0].push(['00']);
              }
              data[index][0] = data[index][0].join('-');
            } else if (data[index][0].length == 12) {
              data[index][0] = data[index][0].match(/.{2}/g);
              for (let i = 0; i < (long - 12) / 2; i++) {
                data[index][0].push(['00']);
              }
              data[index][0] = data[index][0].join('-');
            } else if (data[index][0].length == 14) {
              data[index][0] = data[index][0].match(/.{2}/g);
              for (let i = 0; i < (long - 14) / 2; i++) {
                data[index][0].push(['00']);
              }
              data[index][0] = data[index][0].join('-');
            } else if (data[index][0].length == 16) {
              data[index][0] = data[index][0].match(/.{2}/g);
              for (let i = 0; i < (long - 16) / 2; i++) {
                data[index][0].push(['00']);
              }
              data[index][0] = data[index][0].join('-');
            }
          }
          let classificationName = `OmniClass${data[0][0].slice(0, 2)}`;

          let newClassification = [];
          let codearray = [];

          for (let q = 0; q < data.length; q++) {
            let parentcode = '';
            let z = 0;
            codearray = await data[q][0].split('-');

            for (let j = 0; j < codearray.length; j++) {
              if (codearray[j] == '00') {
                z = z + 1;
              }
            }

            if (z == 0) {
              for (let i = 0; i < codearray.length - 1; i++) {
                if (parentcode == '') {
                  parentcode = codearray[i];
                } else {
                  parentcode = parentcode + '-' + codearray[i];
                }
              }
              if (codearray.length == 4) {
                parentcode = parentcode + '-' + '00';
              }
            } else {
              if (z == 1) {
                for (let i = 0; i < codearray.length - 2; i++) {
                  if (parentcode == '') {
                    parentcode = codearray[i];
                  } else {
                    parentcode = parentcode + '-' + codearray[i];
                  }
                }
                parentcode = parentcode + '-' + '00-00';
              } else if (z == 2) {
                for (let i = 0; i < codearray.length - 3; i++) {
                  if (parentcode == '') {
                    parentcode = codearray[i];
                  } else {
                    parentcode = parentcode + '-' + codearray[i];
                  }
                }
                parentcode = parentcode + '-' + '00-00-00';
              } else if (z == 3) {
                for (let i = 0; i < codearray.length - 4; i++) {
                  if (parentcode == '') {
                    parentcode = codearray[i];
                  } else {
                    parentcode = parentcode + '-' + codearray[i];
                  }
                }
                if (parentcode == '') {
                  parentcode = '00-00-00-00';
                } else {
                  parentcode = parentcode + '-' + '00-00-00-00';
                }
              } else if (z == 4) {
                for (let i = 0; i < codearray.length - 5; i++) {
                  if (parentcode == '') {
                    parentcode = codearray[i];
                  } else {
                    parentcode = parentcode + '-' + codearray[i];
                  }
                }
                if (parentcode == '') {
                  parentcode = '00-00-00-00-00';
                } else {
                  parentcode = parentcode + '-' + '00-00-00-00-00';
                }
              } else if (z == 5) {
                for (let i = 0; i < codearray.length - 6; i++) {
                  if (parentcode == '') {
                    parentcode = codearray[i];
                  } else {
                    parentcode = (await parentcode) + '-' + codearray[i];
                  }
                }
                if (parentcode == '') {
                  parentcode = '00-00-00-00-00-00';
                } else {
                  parentcode = (await parentcode) + '-' + '00-00-00-00-00-00';
                }
              } else if (z == 6) {
                for (let i = 0; i < codearray.length - 7; i++) {
                  if (parentcode == '') {
                    parentcode = codearray[i];
                  } else {
                    parentcode = (await parentcode) + '-' + codearray[i];
                  }
                }
                if (parentcode == '') {
                  parentcode = '00-00-00-00-00-00-00';
                } else {
                  parentcode = (await parentcode) + '-' + '00-00-00-00-00-00-00';
                }
              }
            }

            let codestr = '';
            for (let t = 0; t < codearray.length; t++) {
              if (codestr == '') {
                codestr = codearray[t];
              } else {
                codestr = codestr + '-' + codearray[t];
              }
            }

            let dto = {
              code: codestr,
              parentCode: parentcode.length < codestr.length ? parentcode + '-00' : parentcode,
              name: data[q][1],
              key: generateUuid(),
              isDeleted: false,
              isActive: true,
              canDelete: true,
              canDisplay: true,
            };

            newClassification.push(dto);
          }


          ///////// the process start here //////////////////////////////////

          // let cypher = `MATCH (a:Infra {realm:"${realmName}"})-[:PARENT_OF]->(n:Classification {realm:"${realmName}"}) MERGE (b:${classificationName}_${language} {code:"${newClassification[0].parentCode}",isActive: true,name:"${classificationName}",isDeleted:${newClassification[i].isDeleted},canCopied:true,canDelete:false,realm:"${realmName}",isRoot:true,canDisplay:true,language:"${language}"}) MERGE (n)-[:PARENT_OF]->(b)`;
          // let data = await this.neo4jService.write(cypher);

          // for (let i = 0; i < newClassification.length; i++) {
          //   let cypher2 = `MATCH (n:${classificationName}_${language}) where n.code="${newClassification[i].parentCode}" MERGE (b:${classificationName}_${language} {code:"${newClassification[i].code}",parentCode:"${newClassification[i].parentCode}",name:"${newClassification[i].name}",isDeleted:${newClassification[i].isDeleted},isActive:${newClassification[i].isActive},canDelete:${newClassification[i].canDelete},canDisplay:${newClassification[i].canDisplay},language:"${language}"}) MERGE (n)-[:PARENT_OF]->(b)`;
          //   let data2 = await this.neo4jService.write(cypher2);
          // }
        }

        /////////////// process of classfications without code ////////////////////////////////////////////////////////////////
        let deneme4 = [];


        for (let i = 0; i < classificationsWithoutCode.length; i++) {
          let deneme5 = [];
          let dto = {};
          for (let index = 1; index < classificationsWithoutCode[i].length; index++) {
            dto = {
              name: classificationsWithoutCode[i][index],
              isDeleted: false,
              isActive: true,
              canDelete: true,
              canDisplay: true,
              code: `${classificationsWithoutCode[i][1]}${index - 1}`,
            };
            deneme5.push(dto);
          }
          deneme4.push(deneme5);
        }

        for (let i = 0; i < deneme4.length; i++) {
          let cypher = `MATCH (n:Classification {realm:"${realmName}"}) MERGE (b:${deneme4[i][0].name
            }s_${language} {name:"${deneme4[i][0].name}",isDeleted:${deneme4[i][0].isDeleted
            },key:"${generateUuid()}",realm:"${realmName}",canDelete:false,isActive:true,canCopied:true,isRoot:true,canDisplay:true,language:"${language}"})  MERGE (n)-[:PARENT_OF]->(b)`;
          await this.neo4jService.write(cypher);

          for (let index = 1; index < deneme4[i].length; index++) {
            let { name, code, isDeleted, canDelete, canDisplay, isActive } = deneme4[i][index];

            let cypher3 = `MATCH (n:${deneme4[i][0].name}s_${language} {isDeleted:false}) MERGE (b:${deneme4[i][0].name} {code:"${code}",name:"${name}",isDeleted:${isDeleted},key:"${generateUuid()}",canDelete:${canDelete}, \
            canDisplay:${canDisplay},language:"${language}",isActive:${isActive}})  MERGE (n)-[:PARENT_OF]->(b)`;
            let data = await this.neo4jService.write(cypher3);
            console.log(data);
          }
        }
      } else {
        throw new HttpException('Bu classificationlar bulunuyor', 400);
      }
    } catch (error) {
      throw new HttpException({ message: error.message, code: error.status }, error.status);
    }
  }
}
