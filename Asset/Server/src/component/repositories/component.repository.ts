import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  AssetNotFoundException,
  FacilityStructureNotFountException,
} from '../../common/notFoundExceptions/not.found.exception';
import { Component } from '../entities/component.entity';
import { NestKafkaService } from 'ifmcommon';
import {
  assignDtoPropToEntity,
  CustomNeo4jError,
  Neo4jService,
} from 'sgnm-neo4j/dist';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { CreateComponentDto } from '../dto/create.component.dto';
import { UpdateComponentDto } from '../dto/update.component.dto';
import { NodeNotFound, WrongIdProvided } from 'src/common/bad.request.exception';
import { CustomAssetError } from 'src/common/const/custom.error.enum';
import {
  wrong_parent_error,
  other_microservice_errors,
  node_not_found,
  has_children_error,
} from 'src/common/const/custom.error.object';
import { RelationName } from 'src/common/const/relation.name.enum';
import { HttpRequestHandler } from 'src/common/class/http.request.helper.class';
import { VirtualNodeCreator } from 'src/common/class/virtual.node.creator';
import { ComponentInterface } from 'src/common/interface/component.interface';
import * as moment from 'moment';
import {
  avaiableCreateVirtualPropsGetter,
  avaiableUpdateVirtualPropsGetter,
} from 'src/common/func/virtual.node.props.functions';
import { VirtualNodeHandler } from 'src/common/class/virtual.node.dealer';
import { ConfigService } from '@nestjs/config';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';

@Injectable()
export class ComponentRepository implements ComponentInterface<Component> {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly kafkaService: NestKafkaService,
    private readonly httpService: HttpRequestHandler,
    private readonly virtualNodeHandler: VirtualNodeHandler,
    private readonly configService: ConfigService,
    private readonly nodeRelationHandler: NodeRelationHandler,
  ) {}
  async findByKey(key: string, header) {
    try {
      const {realm, language, authorization} = header;
      const nodes = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.COMPONENT], { key });
      if (!nodes.length) {
        throw new AssetNotFoundException(key);
      }

      const createdByNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.COMPONENT],
        { key: nodes[0].get('n').properties.key },
        [],
        { isDeleted: false },
        RelationName.CREATED_BY,
      );
      if (createdByNode.length>0) {
      nodes[0].get('n').properties['createdBy'] = createdByNode[0].get('children').properties.referenceKey;
      }

      const spaceNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.COMPONENT],
        { key: nodes[0].get('n').properties.key },
        [],
        { isDeleted: false },
        RelationName.LOCATED_IN,
      );
      if (spaceNode.length>0) {
      nodes[0].get('n').properties['space'] = spaceNode[0].get('children').properties.referenceKey;4
      }
      const warrantyGuaranorLaborNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.COMPONENT],
        { key: nodes[0].get('n').properties.key },
        [],
        { isDeleted: false },
        RelationName.WARRANTY_GUARANTOR_LABOR,
      );
      if (warrantyGuaranorLaborNode.length>0) {
      nodes[0].get('n').properties['warrantyGuarantorLabor'] =
        warrantyGuaranorLaborNode[0].get('children').properties.referenceKey;
      }
      const warrantyGuaranorPartsNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
        [Neo4jLabelEnum.COMPONENT],
        { key: nodes[0].get('n').properties.key },
        [],
        { isDeleted: false },
        RelationName.WARRANTY_GUARANTOR_PARTS,
      );
      if (warrantyGuaranorPartsNode.length>0) {
      nodes[0].get('n').properties['warrantyGuarantorParts'] =
        warrantyGuaranorPartsNode[0].get('children').properties.referenceKey;
      }
      
      const warrantyDurationUnitNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
          [Neo4jLabelEnum.COMPONENT],
          { key: nodes[0].get('n').properties.key },
          [],
          { isDeleted: false, language: language },
          RelationName.WARRANTY_DURATION_UNIT_BY,
        );
        if (warrantyDurationUnitNode.length>0) {
          nodes[0].get('n').properties['warrantyDurationUnit'] =
          warrantyDurationUnitNode[0].get('children').properties.code;  
        }
        

      return nodes[0]['_fields'][0];
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findRootByRealm(key, header) {
    console.log(key);

    const { realm } = header;
    console.log(realm);
    const typeNode = await this.neo4jService.findChildrensByLabelsOneLevel(
      [Neo4jLabelEnum.TYPES],
      { realm },
      [Neo4jLabelEnum.TYPE],
      { key },
    );

    if (!typeNode.length) {
      throw new HttpException(wrong_parent_error(), 400);
    }

    const node = await this.neo4jService.findChildrensByLabelsAndFilters(
      [Neo4jLabelEnum.TYPE],
      {
        key,
        isDeleted: false,
        isActive: true,
      },
      [Neo4jLabelEnum.COMPONENT],
      { isDeleted: false, isActive: true },
    );

    if (!node.length) {
      return node;
    } else {
      const componentArray = node.map((element) => {
        element.get('children').properties['id'] = element.get('children').identity.low;
        return element.get('children').properties;
      });
      return componentArray;
    }
  }
  async create(createComponentDto: CreateComponentDto, header) {
    try {
      const { realm, authorization } = header;
      const typesNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.TYPES], {
        isDeleted: false,
        realm,
      });
      if (!typesNode.length) {
        throw new HttpException(wrong_parent_error(), 400);
      }

      const typeNode = await this.neo4jService.findChildrensByIdAndFilters(
        typesNode[0].get('n').identity.low,
        { isDeleted: false },
        [Neo4jLabelEnum.TYPE],
        {
          key: createComponentDto.parentKey,
          isDeleted: false,
        },
        RelationName.PARENT_OF,
      );

      if (!typeNode.length) {
        throw new HttpException(wrong_parent_error(), 400);
      }

      if (!createComponentDto.name || createComponentDto.name.trim() === '' || createComponentDto.name === '') {
        createComponentDto.name = typeNode[0].get('children').properties.name;
      }

      const component = new Component();
      const componentFinalObject = assignDtoPropToEntity(component, createComponentDto);
      delete componentFinalObject['space'];
      delete componentFinalObject['spaceType'];
      delete componentFinalObject['createdBy'];
      delete componentFinalObject['warrantyGuarantorParts'];
      delete componentFinalObject['warrantyGuarantorLabor'];
      const warrantyDurationUnit = componentFinalObject['warrantyDurationUnit'];
      delete componentFinalObject['warrantyDurationUnit'];
      
      const componentNode = await this.neo4jService.createNode(componentFinalObject, [Neo4jLabelEnum.COMPONENT]);
      const uniqName = componentNode.properties.name + ' ' + componentNode.identity.low;

      const updatedNode = await this.neo4jService.updateByIdAndFilter(componentNode.identity.low, {}, [], {
        id: componentNode['identity'].low,
        name: uniqName,
      });
      console.log(updatedNode);

      componentNode['properties']['id'] = componentNode['identity'].low;
      componentNode['properties']['name'] = uniqName;
      const componentUrl = `${process.env.COMPONENT_URL}/${componentNode.properties.key}`;
       const result = {
         id: componentNode['identity'].low,
         labels: componentNode['labels'],
         properties: componentNode['properties'],
       };
      await this.neo4jService.addParentRelationByIdAndFilters(
        componentNode.identity.low,
        {},
        typeNode[0].get('children').identity.low,
        {},
      );

      const finalObjectArray = avaiableCreateVirtualPropsGetter(createComponentDto);

      for (let index = 0; index < finalObjectArray.length; index++) {
        const url =
          (await this.configService.get(finalObjectArray[index].url)) + '/' + finalObjectArray[index].referenceKey;

        await this.httpService.get(url, { authorization });
      }
      await this.virtualNodeHandler.createVirtualNode(componentNode['identity'].low, componentUrl, finalObjectArray);

    /////////////////////////////////// create classified_by  relation for duration unit //////////////////////////////////////////////////////  
    const newWarrantyDurationUnits = await this.nodeRelationHandler.getNewCategories(realm, warrantyDurationUnit);
    let categoriesArr = [];
    let newCategoriesArr = [];
    let relationArr = [];
    let _root_idArr = [];

      newCategoriesArr.push(newWarrantyDurationUnits); 
    relationArr.push(RelationName.WARRANTY_DURATION_UNIT_BY);
    _root_idArr.push(componentNode.identity.low);
    await this.nodeRelationHandler.manageNodesRelations(categoriesArr, newCategoriesArr,relationArr,_root_idArr);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      return result;

      
    } catch (error) {
      const code = error.response?.code;

      if (code >= 1000 && code <= 1999) {
      } else if (code >= 5000 && code <= 5999) {
        if (error.response?.code == CustomNeo4jError.ADD_CHILDREN_RELATION_BY_ID_ERROR) {
        }
      } else if (code >= 9500 && code <= 9750) {
        if (error.response?.code == CustomAssetError.WRONG_PARENT) {
          throw new WrongIdProvided();
        }
        if (error.response?.code == CustomAssetError.OTHER_MICROSERVICE_ERROR) {
          throw new HttpException(error.response.message, error.status);
        }
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async update(_id: string, updateComponentDto: UpdateComponentDto, header) {
    try {
      const { realm, authorization, language } = header;

      const node = await this.neo4jService.findChildrensByChildIdAndFilters(
        [Neo4jLabelEnum.TYPES],
        { realm },
        +_id,
        { isDeleted: false, isActive: true },
        RelationName.PARENT_OF,
      );
      if (!node.length) {
        throw new HttpException(node_not_found(), 400);
      }

    /////////////////////////////////// update classified_by  relation, if duration unit changed //////////////////////////////////////////////////////  
    const warrantyDurationUnit = updateComponentDto['warrantyDurationUnit'];
    delete updateComponentDto['warrantyDurationUnit'];
    const oldWarrantyDurationUnits = await this.nodeRelationHandler.getOldCategories(node[0]['_fields'][1].properties.key, RelationName.WARRANTY_DURATION_UNIT_BY); 
    const newWarrantyDurationUnits = await this.nodeRelationHandler.getNewCategories(realm, warrantyDurationUnit);
    let categoriesArr = [];
    let newCategoriesArr = [];
    let relationArr = [];
    let _root_idArr = [];

      categoriesArr.push(oldWarrantyDurationUnits);
      newCategoriesArr.push(newWarrantyDurationUnits); 
    relationArr.push(RelationName.WARRANTY_DURATION_UNIT_BY);
    _root_idArr.push(node[0]['_fields'][1].identity.low);
    
    await this.nodeRelationHandler.manageNodesRelations(categoriesArr, newCategoriesArr,relationArr,_root_idArr);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      const componentUrl = `${process.env.COMPONENT_URL}/${node[0].get('children').properties.key}`;
      const finalObjectArray = await avaiableUpdateVirtualPropsGetter(updateComponentDto);
      for (let index = 0; index < finalObjectArray.length; index++) {
        const url =
          (await this.configService.get(finalObjectArray[index].url)) + '/' + finalObjectArray[index].newParentKey;
        await this.httpService.get(url, { authorization });
      }

      if (!updateComponentDto.name || updateComponentDto.name.trim() === '' || updateComponentDto.name === '') {
        delete updateComponentDto['name'];
      }

      await this.virtualNodeHandler.updateVirtualNode(+_id, componentUrl, finalObjectArray);
      delete updateComponentDto['space'];
      delete updateComponentDto['spaceType'];
      delete updateComponentDto['createdBy'];
      delete updateComponentDto['warrantyGuarantorParts'];
      delete updateComponentDto['warrantyGuarantorLabor'];

      const updatedNode = await this.neo4jService.updateById(_id, updateComponentDto);
      if (!updatedNode) {
        throw new FacilityStructureNotFountException(_id);
      }
      return updatedNode;

      
    } catch (error) {
      const code = error.response?.code;

      if (code >= 1000 && code <= 1999) {
      } else if (code >= 5000 && code <= 5999) {
        if (error.response?.code == CustomNeo4jError.ADD_CHILDREN_RELATION_BY_ID_ERROR) {
        }
      } else if (code >= 9500 && code <= 9750) {
        if (error.response?.code == CustomAssetError.WRONG_PARENT) {
          throw new WrongIdProvided();
        }
        if (error.response?.code == CustomAssetError.OTHER_MICROSERVICE_ERROR) {
          throw new HttpException(error.response.message, error.status);
        }
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async delete(_id: string, header) {
    try {
      const typeNode = await this.neo4jService.findByIdAndFilters(+_id, { isDeleted: false });

      let deletedNode;
      let deletedVirtualNode;

      const hasChildrenArray = await this.neo4jService.findChildrensByIdAndFilters(+_id, {}, [], {}, 'PARENT_OF');

      if (hasChildrenArray.length === 0) {
        //delete virtual nodes in this database
        const virtualNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
          [Neo4jLabelEnum.COMPONENT],
          { key: typeNode.properties.key },
          ['Virtual'],
          { isDeleted: false },
          RelationName.HAS_VIRTUAL_RELATION
        );
        virtualNode.forEach( async (item)=> {
          await this.neo4jService.updateByIdAndFilter(
            +item.get('children').identity.low,
            {},
            [],
            { isDeleted: true },
          );
        });
        //delete virtual nodes in target database
        await this.kafkaService.producerSendMessage(
          'deleteVirtualNodeRelations',
          JSON.stringify({ referenceKey: typeNode.properties.key }),
        );

        //delete warrantyunit relations in this database
        let categoriesArr = [];
        let relationArr = [];
        let _root_idArr = [];
        const oldWarrantyDurationUnits = await this.nodeRelationHandler.getOldCategories(typeNode.properties.key, RelationName.WARRANTY_DURATION_UNIT_BY); 
        categoriesArr.push(oldWarrantyDurationUnits);
        relationArr.push(RelationName.CLASSIFIED_BY);
        _root_idArr.push(typeNode.identity.low);

        await this.nodeRelationHandler.deleteNodesRelations(categoriesArr, relationArr, _root_idArr)

        deletedNode = await this.neo4jService.updateByIdAndFilter(+_id, {}, [], { isDeleted: true, isActive: false });

      } else {
        throw new HttpException(has_children_error({ id: _id }), 400);
      }

      return deletedNode;
    } catch (error) {
      const code = error.response?.code;
      if (code === CustomAssetError.HAS_CHILDREN) {
        throw new HttpException({ message: error.response.message }, 400);
      } else if (code === 5005) {
        AssetNotFoundException(_id);
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findChildrenOfRootByRealm(header) {
    try {
      let { realm } = header;

      let node = await this.neo4jService.findByLabelAndNotLabelAndFiltersWithTreeStructure(
        [Neo4jLabelEnum.TYPES],
        [],
        { isDeleted: false, realm },
        [],
        ['Virtual'],
        { isDeleted: false },
      );

      if (!node) {
        throw new HttpException(node_not_found(), 400);
      }

      node = await this.neo4jService.changeObjectChildOfPropToChildren(node);
      return node;
    } catch (error) {
      const code = error.response?.code;

      if (code >= 1000 && code <= 1999) {
      } else if (code >= 5000 && code <= 5999) {
        if (error.response?.code == CustomNeo4jError.ADD_CHILDREN_RELATION_BY_ID_ERROR) {
        }
      } else if (code >= 9500 && code <= 9750) {
        if (error.response?.code == CustomAssetError.NODE_NOT_FOUND) {
          NodeNotFound();
        }
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
}
