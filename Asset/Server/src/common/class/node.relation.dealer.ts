import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestKafkaService } from 'ifmcommon/dist';
import { Neo4jService } from 'sgnm-neo4j/dist';
import * as moment from 'moment';
import { CreateKafka, CreateKafkaObject, UpdateKafka } from '../const/kafka.object.type';
import { RelationName } from '../const/relation.name.enum';
import { VirtualNode } from '../baseobject/virtual.node';
import { Neo4jLabelEnum } from '../const/neo4j.label.enum';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { string } from 'joi';

@Injectable()
export class NodeRelationHandler {
  constructor(
    private readonly neo4jService: Neo4jService,
  ) {}
  
  async  getOldCategories(key: string, relation: string)   {
    const oldCategories = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
      [],
      { isDeleted: false, key: key },
      [],
      { isDeleted: false },
      relation,
      RelationDirection.RIGHT,
    );
    return oldCategories;
  }
  
  async  getNewCategories(realm: string, code: string)   {
  
    const newCategories = await this.neo4jService.findChildrensByLabelsAndFilters(
      ['Classification'],
      { isDeleted: false, realm: realm },
      [],
      { isDeleted: false, code: code},
    );
    return newCategories;
  }

  async  manageNodesRelations(categoriesArr: object[], newCategoriesArr: object[], relationArr: string[], _root_idArr: string[])   {
  
    if (categoriesArr && categoriesArr.length>0) {
      for (let j = 0; j<categoriesArr.length; j++) {
        let categories = categoriesArr[j];
        let newCategories = newCategoriesArr[j];
        let relation = relationArr[j];
        let _root_id = _root_idArr[j];
      if (categories[0]['_fields'][1]['properties'].code != newCategories[0]['_fields'][1]['properties'].code) {
        for (let i = 0; i < categories['length']; i++) {
          await this.neo4jService.deleteRelationByIdAndRelationNameWithoutFilters(
            +_root_id,
            categories[i]['_fields'][1].identity.low,
            relation,
            RelationDirection.RIGHT
          );
         }
        
        for (let i = 0; i < newCategories['length']; i++) {
          await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
            +_root_id,
            { isDeleted: false },
            newCategories[i]['_fields'][1].identity.low,
            { isDeleted: false },
            relation,
            RelationDirection.RIGHT
          );
         }
       }
      }
     }
    else {
      for (let j = 0; j<newCategoriesArr.length; j++) { 
        let newCategories = newCategoriesArr[j];
        let relation = relationArr[j];
        let _root_id = _root_idArr[j];
       for (let i = 0; i < newCategories['length']; i++) {
        await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
          +_root_id,
          { isDeleted: false },
          newCategories[i]['_fields'][1].identity.low,
          { isDeleted: false },
          relation,
          RelationDirection.RIGHT
        );
      }
     }
    } 
  }
  async  deleteNodesRelations(categoriesArr: object[], relationArr: string[], _root_idArr: string[])   {

    for (let j = 0; j<categoriesArr.length; j++) {
      let categories = categoriesArr[j];
      let relation = relationArr[j];
      let _root_id = _root_idArr[j];

      if (categories && categories['length'] > 0) {

          for (let i = 0; i < categories['length']; i++) {
            await this.neo4jService.deleteRelationByIdAndRelationNameWithoutFilters(
              +_root_id,
              categories[i]['_fields'][1].identity.low,
              relation,
              RelationDirection.RIGHT
            );
          }
      }
    }
  }
}
