import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import { CustomNeo4jError, Neo4jService } from 'sgnm-neo4j';
import { CreateClassificationDto } from '../dto/create-classification.dto';
import { UpdateClassificationDto } from '../dto/update-classification.dto';
import { Classification } from '../entities/classification.entity';
import {
  Neo4jService,
  dynamicLabelAdder,
  dynamicUpdatePropertyAdder,
  node_not_found,
  filterArrayForEmptyString,
  library_server_error,
  CustomNeo4jError,
} from 'sgnm-neo4j/dist';
import { classificationInterface } from 'src/common/interface/classification.interface';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { I18NEnums } from 'src/common/const/i18n.enum';
import { has_children_error, wrong_parent_error_with_params } from 'src/common/const/custom.error.object';
import { RelationName } from 'src/common/const/relation.name.enum';
import { classification_already_exist, classification_import_error } from 'src/common/const/custom.classification.error';
import { CustomAssetError } from 'src/common/const/custom.error.enum';
import { WrongClassificationParentExceptions } from 'src/common/const/badRequestExceptions/bad.request.exception';

const exceljs = require('exceljs');
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class ClassificationRepository implements classificationInterface<Classification> {
  constructor(private readonly neo4jService: Neo4jService) { }



  //REVISED FOR NEW NEO4J
  async create(createClassificationDto: CreateClassificationDto, header) {
    const { language, realm } = header
    function assignDtoPropToEntity(entity, dto) {
      Object.keys(dto).forEach((element) => {
        if (element != 'parentId' && element != 'parentKey') {
          entity[element] = dto[element];
        }
      });
      entity['language'] = language;
      return entity;
    }
    const classification = new Classification();
    const classificationObject = assignDtoPropToEntity(classification, createClassificationDto);
    let value;

    if (classificationObject['labels']) {
      value = await this.neo4jService.createNode(classificationObject, classificationObject['labels']);
      if (createClassificationDto['parentId']) {
        await this.neo4jService.addParentRelationByIdAndFilters(
          value['identity'].low,
          { isDeleted: false },
          Number(createClassificationDto['parentId']),
          { isDeleted: false },
        );
      }
    } else {
      value = await this.neo4jService.createNode(classificationObject);

      if (createClassificationDto['parentId']) {
        await this.neo4jService.addParentRelationByIdAndFilters(
          value['identity'].low,
          { isDeleted: false },
          Number(createClassificationDto['parentId']),
          { isDeleted: false },
        );
      }

      const newLabel = await this.neo4jService.findChildrensByChildIdAndFilters(
        [],
        { isDeleted: false, isRoot: true },
        value['identity'].low,
        { isDeleted: false },
        RelationName.PARENT_OF,
        //databaseOrTransaction?: string | Transaction
      );

      const label = newLabel[0]['_fields'][0].labels[0].split('_')[0];
      const updateLabel = await this.neo4jService.updateByIdAndFilter(value['identity'].low, {}, [label], {});
    }
    value['properties']['id'] = value['identity'].low;
    const result = { id: value['identity'].low, labels: value['labels'], properties: value['properties'] };

    return result;
  }
  /////////////////////////////////////////////
  async updateByIdAndFilter(
    id: number,
    filter_properties: object = {},
    update_labels: Array<string> = [],
    update_properties: object = {}
    // ,
    // databaseOrTransaction?: string | Transaction
  ) {
    try {
      const updateLabelsWithoutEmptyString =
        filterArrayForEmptyString(update_labels);
      const isNodeExist = await this.neo4jService.findByIdAndFilters(id, filter_properties);

      if (!isNodeExist) {
        throw new HttpException(node_not_found, 404);
      }
      let query =
        "match (n) " +
        ` where id(n)=${id} set ` +
        dynamicUpdatePropertyAdder("n", update_properties);

      if (
        updateLabelsWithoutEmptyString &&
        updateLabelsWithoutEmptyString.length > 0
      ) {
        if (!update_properties || Object.keys(update_properties).length === 0) {
          query =
            query +
            "  n" +
            dynamicLabelAdder(updateLabelsWithoutEmptyString) +
            " return n";
        } else {
          query =
            query +
            ", n" +
            dynamicLabelAdder(updateLabelsWithoutEmptyString) +
            " return n";
        }
      } else {
        query = query + " return n";
      }
      update_properties["id"] = id;
      const parameters = update_properties;
      const node = await this.neo4jService.write(query, parameters); //, databaseOrTransaction);
      if (node.records.length === 0) {
        return null;
      } else {
        return node.records[0]["_fields"][0];
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(
          library_server_error,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }
  /////////////////////////////////////////////
  //REVISED FOR NEW NEO4J
  async update(_id: string, updateClassificationto: UpdateClassificationDto, header) {
    const { language, realm } = header
    const updateClassificationDtoWithoutLabelsAndParentId = {};

    Object.keys(updateClassificationto).forEach((element) => {
      if (element != 'labels' && element != 'parentId') {
        updateClassificationDtoWithoutLabelsAndParentId[element] = updateClassificationto[element];
      }
    });
    // eğer label lar güncellenecekse

    // let labelsWithoutSpace = [];
    // updateClassificationto.labels.forEach((label)=> {
    //    let lbs = label.split(' ');
    //    let finalLabel = "";
    //    lbs.forEach((lb)=> {
    //       finalLabel = finalLabel + lb; 
    //    });
    //    labelsWithoutSpace.push(finalLabel);
    // });
    // updateClassificationto.labels = labelsWithoutSpace;
    const updatedNode = await this.updateByIdAndFilter(
      Number(_id),
      { isDeleted: false },
      //updateClassificationto.labels,
      [],
      updateClassificationDtoWithoutLabelsAndParentId,
    );
    const result = {
      id: updatedNode['identity'].low,
      labels: updatedNode['labels'],
      properties: updatedNode['properties'],
    };

    return result;
  }

  //REVISED FOR NEW NEO4J
  async delete(_id: string, header) {
    try {
      const { language, realm } = header
      const children = await this.neo4jService.findChildrensByIdOneLevel(
        Number(_id),
        {},
        [],
        { isDeleted: false },
        'PARENT_OF',
      );
      if (children && children.length == 0) {
        let deletedNode = await this.neo4jService.updateByIdAndFilter(+_id, { isDeleted: false, canDelete: true }, [], {
          isDeleted: true,
        });
      } else {
        throw new HttpException(has_children_error, 400);
      }
    } catch (error) {
      if (error.response?.code == CustomAssetError.HAS_CHILDREN) {
        throw new HttpException({ key: I18NEnums.NODE_HAS_CHILD, args: { name: _id } }, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException({ key: I18NEnums.NODE_NOT_FOUND, args: { name: _id } }, HttpStatus.BAD_REQUEST);
      }
    }
  }
  s;
  //REVISED FOR NEW NEO4J
  async changeNodeBranch(_id: string, target_parent_id: string, header) {
    try {
      const { language, realm } = header
      const new_parent = await this.neo4jService.findByIdAndFilters(+target_parent_id, { isDeleted: false }, []);
      const node = await this.neo4jService.findByIdAndFilters(+_id, { isDeleted: false }, []);
      if (new_parent['labels'] && new_parent['labels'].includes('Classification')) {
        throw new HttpException(
          wrong_parent_error_with_params({ node1: node['properties'].name, node2: new_parent['properties'].name }),
          400,
        );
      }
      const nodeChilds = await this.neo4jService.findChildrensByIdAndFilters(
        +_id,
        { isDeleted: false },
        [],
        { isDeleted: false },
        'PARENT_OF',
      );
      const parent_of_new_parent = await this.neo4jService.getParentByIdAndFilters(
        new_parent['identity'].low,
        { isDeleted: false },
        {},
      );

      if (parent_of_new_parent && parent_of_new_parent['_fields'][0]['identity'].low == _id) {
        throw new HttpException(
          wrong_parent_error_with_params({ node1: node['properties'].name, node2: new_parent['properties'].name }),
          400,
        );
      }
      for (let i = 0; i < nodeChilds['length']; i++) {
        if (
          parent_of_new_parent &&
          parent_of_new_parent['_fields'][0]['identity'].low == nodeChilds[i]['_fields'][1]['identity'].low
        ) {
          throw new HttpException(
            wrong_parent_error_with_params({ node1: node['properties'].name, node2: new_parent['properties'].name }),
            400,
          );
        }
      }

      if (new_parent['labels'] && new_parent['labels'][0] == 'Classification') {
        if (node['labels'] && node['labels'].length == 0) {
          throw new HttpException(
            wrong_parent_error_with_params({ node1: node['properties'].name, node2: new_parent['properties'].name }),
            400,
          );
        }
      }

      const old_parent = await this.neo4jService.getParentByIdAndFilters(
        +_id,
        { isDeleted: false },
        { isDeleted: false },
      );
      if (old_parent != undefined) {
        await this.neo4jService.deleteRelationByIdAndRelationNameWithFilters(
          old_parent['_fields'][0]['identity'].low,
          {},
          +_id,
          {},
          'PARENT_OF',
          RelationDirection.RIGHT,
        );
      }
      await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
        +target_parent_id,
        { isDeleted: false, isActive: true },
        +_id,
        { isDeleted: false },
        'PARENT_OF',
        RelationDirection.RIGHT,
      );
    } catch (error) {
      let code = error.response?.code;
      if (code >= 1000 && code <= 1999) {

      } else if (code >= 5000 && code <= 5999) {
        if (error.response?.code == CustomNeo4jError.ADD_CHILDREN_RELATION_BY_ID_ERROR) {
          // örnek değişecek
          throw new WrongClassificationParentExceptions(_id, target_parent_id);
        }
      } else if (code >= 9000 && code <= 9999) {
        if (error.response?.code == CustomAssetError.WRONG_PARENT) {
          throw new WrongClassificationParentExceptions(
            error.response?.params['node1'],
            error.response?.params['node2'],
          );
        }
      } else {
        throw new HttpException('', 500);
      }
    }
  }
  //REVISED FOR NEW NEO4J
  async findOneNodeByKey(key: string, header) {
    try {
      const { language, realm } = header
      const node = await this.neo4jService.findByLabelAndFilters([], { isDeleted: false, key: key }, ['Virtual']);

      const result = {
        id: node[0]['_fields'][0]['identity'].low,
        labels: node[0]['_fields'][0]['labels'],
        properties: node[0]['_fields'][0]['properties'],
      };
      return result;
    } catch (error) {
      if (error.response?.code == 5001) {
        throw new HttpException({ key: I18NEnums.NODE_NOT_FOUND, args: { name: key } }, HttpStatus.NOT_FOUND);
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  //REVISED FOR NEW NEO4J
  async getClassificationByIsActiveStatus(header) {
    const { language, realm } = header
    const root_node = await this.neo4jService.findByLabelAndFilters(
      ['Classification'],
      { isDeleted: false, realm: realm },
      [],
    );
    const root_id = root_node[0]['_fields'][0]['identity'].low;
    const _id = root_node[0]['_fields'][0]['identity'];
    const firstNodes = await this.neo4jService.findChildrensByIdOneLevel(
      root_id,
      { isDeleted: false },
      [],
      { isDeleted: false, isActive: true },
      'PARENT_OF',
    );

    let lbls = firstNodes.map((item) => {
      if (item['_fields'][1]['labels'][0] && item['_fields'][1]['labels'][0].endsWith('_' + language)) {
        return item['_fields'][1]['labels'][0];
      }
    });
    lbls = lbls.filter((item) => {
      if (item != undefined) {
        return item;
      }
    });
    let labels = [...new Set(lbls)];
    let root = { root: { parent_of: [], root_id, _id, ...root_node[0]['_fields'][0].properties } };
    for (let i = 0; i < labels.length; i++) {
      let node = await this.neo4jService.findByLabelAndFiltersWithTreeStructure(
        [labels[i].toString()],
        { realm: realm, isDeleted: false },
        [],
        { isDeleted: false, isActive: true },
      );
      if (node['root']['properties'] != null) {
        node['root']['properties']['_id'] = node['root']['identity'];
        root.root.parent_of.push(node['root']['properties']);
      } else {
        root.root.parent_of.push(node['root']);
      }
    }
    root = await this.neo4jService.changeObjectChildOfPropToChildren(root);
    return root;
  }
  //REVISED FOR NEW NEO4J
  async setIsActiveTrueOfClassificationAndItsChild(id: string, header) {

    const { language, realm } = header
    await this.neo4jService.updateByIdAndFilter(Number(id), { isDeleted: false }, [], { isActive: true });

    const children = await this.neo4jService.findChildrensByIdOneLevel(
      Number(id),
      { isDeleted: false },
      [],
      { isDeleted: false },
      'PARENT_OF',
    );
    if (children && children.length > 0) {
      await this.neo4jService.updateNodeChildrensByIdAndFilter(
        Number(id),
        { isDeleted: false },
        [],
        { isDeleted: false },
        'PARENT_OF',
        [],
        { isActive: true },
      );
    }
  }

  //REVISED FOR NEW NEO4J
  async setIsActiveFalseOfClassificationAndItsChild(id: string, header) {

    const { language, realm } = header
    await this.neo4jService.updateByIdAndFilter(Number(id), { isDeleted: false }, [], { isActive: false });
    const children = await this.neo4jService.findChildrensByIdOneLevel(
      Number(id),
      { isDeleted: false },
      [],
      { isDeleted: false },
      'PARENT_OF',
    );
    if (children && children.length > 0) {
      await this.neo4jService.updateNodeChildrensByIdAndFilter(
        Number(id),
        { isDeleted: false },
        [],
        { isDeleted: false },
        'PARENT_OF',
        [],
        { isActive: false },
      );
    }
  }

  async findOneFirstLevelByRealm(label: string, realm: string, language: string) {
    return null;
  }

  //REVISED FOR NEW NEO4J
  async getClassificationsByLanguage(header) {

    const { language, realm } = header
    const root_node = await this.neo4jService.findByLabelAndFilters(
      ['Classification'],
      { isDeleted: false, realm: realm },
      [],
    );
    const root_id = root_node[0]['_fields'][0]['identity'].low;
    const _id = root_node[0]['_fields'][0]['identity'];
    const firstNodes = await this.neo4jService.findChildrensByIdOneLevel(
      root_id,
      { isDeleted: false },
      [],
      { isDeleted: false },
      'PARENT_OF',
    );

    let lbls = firstNodes.map((item) => {
      if (item['_fields'][1]['labels'][0] && item['_fields'][1]['labels'][0].endsWith('_' + language)) {
        return item['_fields'][1]['labels'][0];
      }
    });
    lbls = lbls.filter((item) => {
      if (item != undefined) {
        return item;
      }
    });
    let labels = [...new Set(lbls)];
    let root = { root: { parent_of: [], root_id, _id, ...root_node[0]['_fields'][0].properties } };
    for (let i = 0; i < labels.length; i++) {
      let node = await this.neo4jService.findByLabelAndFiltersWithTreeStructure(
        [labels[i].toString()],
        { realm: realm, isDeleted: false },
        [],
        { isDeleted: false },
      );
      if (node['root']['properties'] != null) {
        node['root']['properties']['_id'] = node['root']['identity'];
        root.root.parent_of.push(node['root']['properties']);
      } else {
        root.root.parent_of.push(node['root']);
      }
    }
    root = await this.neo4jService.changeObjectChildOfPropToChildren(root);
    return root;
  }

  async findChildrenByFacilityTypeNode(language: string, realm: string, typename: string) {
    return null;
  }

  //REVISED FOR NEW NEO4J
  async getAClassificationByRealmAndLabelNameAndLanguage(labelName: string, header) {

    const { language, realm } = header
    const root_node = await this.neo4jService.findByLabelAndFilters(
      ['Classification'],
      { isDeleted: false, realm: realm },
      [],
    );
    let root = { root: { parent_of: [], ...root_node[0]['_fields'][0].properties } };
    let node = await this.neo4jService.findByLabelAndFiltersWithTreeStructure(
      [labelName + '_' + language],
      { realm: realm, isDeleted: false, isActive: true },
      [],
      { isDeleted: false, isActive: true },
    );
    root.root.parent_of.push(node['root']);
    root = await this.neo4jService.changeObjectChildOfPropToChildren(root);
    return root;
  }

  //REVISED FOR NEW NEO4J
  async addAClassificationFromExcel(file: Express.Multer.File, header) {
    try {
      const { language, realm } = header
      let data;

      let buffer = new Uint8Array(file.buffer);
      const workbook = new exceljs.Workbook();

      await workbook.xlsx.load(buffer).then(function async(book) {
        const firstSheet = book.getWorksheet(1);
        data = firstSheet.getColumn(1).values.filter((e) => e != null);
      });
      let label = await data[0].replaceAll(' ', '_');

      let checkClassification = await this.neo4jService.findByLabelAndFilters([`${label}_${language}`], { realm })
      if (checkClassification.length == 0) {
        function key() {
          return uuidv4();
        }
        let params = {
          isRoot: true,
          isActive: true,
          name: label,
          isDeleted: false,
          key: key(),
          canDelete: true,
          realm: realm,
          canDisplay: true,
          language: language,
        };
        let labels = [label + '_' + language];
        let node = await this.neo4jService.createNode(params, labels);

        let parent = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
          ['Root'],
          { isDeleted: false, realm: realm },
          ['Classification'],
          { isDeleted: false, realm: realm },
          'PARENT_OF',
          RelationDirection.RIGHT,
        );
        await this.neo4jService.addRelationByIdAndRelationNameWithoutFilters(
          parent[0]['_fields'][1]['identity'].low,
          node['identity'].low,
          'PARENT_OF',
          RelationDirection.RIGHT,
        );

        for (let i = 1; i < data.length; i++) {
          function key2() {
            return uuidv4();
          }

          let params = {
            name: data[i],
            key: key2(),
            isActive: true,
            isDeleted: false,
            canDelete: true,
            canDisplay: true,
            language: language,
            code: data[0] + i,
          };
          let labels = [data[0]];
          let node = await this.neo4jService.createNode(params, labels);
          let parent = await this.neo4jService.findByLabelAndFilters([data[0] + '_' + language], { isDeleted: false }, []);
          await this.neo4jService.addRelationByIdAndRelationNameWithoutFilters(
            parent[0]['_fields'][0]['identity'].low,
            node['identity'].low,
            'PARENT_OF',
            RelationDirection.RIGHT,
          );
        }
      } else {
        throw new HttpException("Bu classification bulunuyor", 400)
      }

    } catch (error) {
      throw new HttpException({ message: error.message, code: error.status }, error.status)
    }


  }

  //REVISED FOR NEW NEO4J
  async addAClassificationWithCodeFromExcel(file: Express.Multer.File, header) {
    try {
      const { language, realm } = header
      let data = [];
      let columnName;
      let buffer = new Uint8Array(file.buffer);
      const workbook = new exceljs.Workbook();

      await workbook.xlsx.load(buffer).then(function async(book) {
        const firstSheet = book.getWorksheet(1);
        data = firstSheet?.getColumn(1).values.filter((e) => e != null);
      });
      columnName = data.shift()
      for (let i = 1; i < data.length; i++) {
        if (!data[i].match(/[0-9a-zA-Z#-]{1,}(: )[a-zA-Z\s\(\)İĞÜŞÖÇığüşöç:]*/)) {
          throw new classification_import_error();
        }

      }

      let label = await columnName.replaceAll(' ', '_');

      let checkClassification = await this.neo4jService.findByLabelAndFilters([`${label}_${language}`], { realm });

      if (checkClassification.length == 0) {
        let deneme = [];

        for (let i = 0; i < data.length; i++) {

          const [first, ...rest] = data[i].split(new RegExp(/:\s{1}/g));
          let arr = [first, rest.join(": ")];

          deneme.push(arr);
        }

        for (let i = 0; i < deneme.length; i++) {
          deneme[i][0] = deneme[i][0].replace(/ /g, '-');
        }
        let collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

        deneme.sort(collator.compare[0]);
        let newClassification = [];
        let codearray = [];
        function uuidReturn() {
          return uuidv4();
        }
        for (let q = 0; q < deneme.length; q++) {
          let parentcode = '';
          var z = 0;
          codearray = await deneme[q][0].split('-');
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
            }
            else if (z == 5) {
              for (let i = 0; i < codearray.length - 6; i++) {
                if (parentcode == '') {
                  parentcode = codearray[i];
                } else {
                  parentcode = parentcode + '-' + codearray[i];
                }
              }
              if (parentcode == '') {
                parentcode = '00-00-00-00-00-00';
              } else {
                parentcode = parentcode + '-' + '00-00-00-00-00-00';
              }
            }
            else if (z == 6) {
              for (let i = 0; i < codearray.length - 7; i++) {
                if (parentcode == '') {
                  parentcode = codearray[i];
                } else {
                  parentcode = parentcode + '-' + codearray[i];
                }
              }
              if (parentcode == '') {
                parentcode = '00-00-00-00-00-00-00';
              } else {
                parentcode = parentcode + '-' + '00-00-00-00-00-00-00';
              }
            }
          }
          var codestr = '';
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
            name: deneme[q][1],
            key: uuidReturn(),
            isDeleted: false,
            isActive: true,
            canDelete: true,
            canDisplay: true,
          };
          newClassification.push(dto);
        }
        ///// the process start here
        function uuidReturn3() {
          return uuidv4();
        }

        let params = {
          code: newClassification[0].parentCode,
          name: columnName,
          isDeleted: false,
          canCopied: true,
          canDelete: false,
          realm: realm,
          isRoot: true,
          canDisplay: true,
          key: uuidReturn3(),
          isActive: true,
          language: language,
        };
        let lbls = [label + '_' + language];
        let node = await this.neo4jService.createNode(params, lbls);
        let parent = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
          ['Root'],
          { isDeleted: false, realm: realm },
          ['Classification'],
          { isDeleted: false, realm: realm },
          'PARENT_OF',
          RelationDirection.RIGHT,
        );
        await this.neo4jService.addRelationByIdAndRelationNameWithoutFilters(
          parent[0]['_fields'][1]['identity'].low,
          node['identity'].low,
          'PARENT_OF',
          RelationDirection.RIGHT,
        );
        for (let i = 0; i < newClassification.length; i++) {
          let params = {
            code: newClassification[i].code,
            parentCode: newClassification[i].parentCode,
            name: newClassification[i].name,
            isDeleted: newClassification[i].isDeleted,
            isActive: newClassification[i].isActive,
            canDelete: newClassification[i].canDelete,
            key: uuidReturn3(),
            canDisplay: newClassification[i].canDisplay,
            language: language,
          };

          let labels = [label];
          let node = await this.neo4jService.createNode(params, labels);
          let parent = await this.neo4jService.findByLabelAndFilters(
            [],
            { isDeleted: false, code: newClassification[i].parentCode, language: language },
            [],
          );

          await this.neo4jService.addRelationByIdAndRelationNameWithoutFilters(
            parent[0]['_fields'][0]['identity'].low,
            node['identity'].low,
            'PARENT_OF',
            RelationDirection.RIGHT,
          );
        }
      } else {
        throw new classification_already_exist()
      }

    } catch (error) {
      if (error?.response?.code === 10001) {
        throw new classification_already_exist()

      }
      else {
        throw new classification_import_error();
      }
    }

  }

  async getNodeByClassificationLanguageRealmAndCode(
    classificationName: string,
    code: string,
    header) {

    const { language, realm } = header
    const cypher = `match (n:${classificationName}_${language} {realm:"${realm}"})-[:PARENT_OF*]->(m {code:"${code}"}) return m`;

    let data = await this.neo4jService.read(cypher);

    return data.records[0]['_fields'][0].properties;
  }

  async getNodeByLanguageRealmAndCode(code: string, header) {

    const { language, realm } = header

    // const x=await this.neo4jService.findChildrenNodesByLabelsAndRelationName([],{key},[],{language,isDeleted:false},'classified_by')
    const deneme = await this.neo4jService.findByLabelAndFilters([], {
      isDeleted: false,
      code,
      language
    });
    return deneme;
  }
}