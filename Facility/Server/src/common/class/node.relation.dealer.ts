import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';

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
    if (oldCategories.length > 0) {
      return oldCategories;
    }
    return [];
  }
  
  async  getNewCategories(realm: string, code: string)   {
    if (code == undefined || realm == undefined) {
      return [];
    }
    const newCategories = await this.neo4jService.findChildrensByLabelsAndFilters(
      ['Classification'],
      { isDeleted: false, realm: realm },
      [],
      { isDeleted: false, code: code},
    );
    if (newCategories.length > 0) {
      return newCategories;
    }
    return [];
  }

  async  manageNodesRelations(categoriesArr: object[], newCategoriesArr: object[], relationArr: string[], _root_idArr: string[])   {
  
    if (categoriesArr && categoriesArr.length>0) {
      for (let j = 0; j<categoriesArr.length; j++) {
        let categories = categoriesArr[j];
        let newCategories = newCategoriesArr[j];
        let relation = relationArr[j];
        let _root_id = _root_idArr[j];
      if ((categories['length'] == 0 &&  newCategories['length'] > 0) || 
          (categories['length'] > 0 && newCategories['length'] > 0 && 
           categories[0]['_fields'][1]['properties'].code != newCategories[0]['_fields'][1]['properties'].code)
         ) {
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
