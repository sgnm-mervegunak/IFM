import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { I18NEnums } from '../../common/const/i18n.enum';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { LazyLoadingInterface } from 'src/common/interface/lazyLoading.interface';
import { RelationName } from 'src/common/const/relation.name.enum';

@Injectable()
export class LazyLoadingRepository implements LazyLoadingInterface {
  constructor(private readonly neo4jService: Neo4jService) {}

  async loadByLabel(label: string, header) {
    // try {
    //   const { realm } = header;
    //   const node = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
    //     [label],
    //     { realm: 'IFM' },
    //     [],
    //     { isDeleted: false },
    //     RelationName.PARENT_OF,
    //   );
    //   if (!node) {
    //     throw new HttpException(
    //       { key: I18NEnums.CLASSIFICATION_NOT_FOUND, args: { key: label } },
    //       HttpStatus.NOT_FOUND,
    //     );
    //   }

    //   const firstLevelNodes = node.map((item) => item.get('children'));
    //   console.log(firstLevelNodes);

    //   for (const item of firstLevelNodes) {
    //     const firstLevelNodesChildrens = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
    //       [],
    //       { key: item.properties.key },
    //       [],
    //       { isDeleted: false },
    //       RelationName.PARENT_OF,
    //     );

    //     if (firstLevelNodesChildrens.map((item) => item.get('children').properties).length > 0) {
    //       item.properties.leaf = false;
    //     }
    //   }
    //   const x = firstLevelNodes.map((item) => {
    //     item.get('children');
    //   });

    //   return { ...node[0].get('parent').properties, firstLevelNodes };
    // } catch (error) {}
    try {
      const node = await this.neo4jService.findByLabelAndFilters([label], { realm: 'IFM' });

      if (!node) {
        throw new HttpException(
          { key: I18NEnums.CLASSIFICATION_NOT_FOUND, args: { key: label } },
          HttpStatus.NOT_FOUND,
        );
      }
      const temp = await this.neo4jService.read(
        `match(n:FacilityStructure {isDeleted:false,realm:$realm,isActive:true})-[:PARENT_OF]->(r) return r`,
        {
          realm: 'IFM',
        },
      );
      console.log(temp);

      const children = temp.records.map((item) => item['_fields'][0]);
      for (const item of children) {
        const childrenOfItem = await this.neo4jService.read(
          `match(n{isDeleted:false,key:$key,isActive:true})-[:PARENT_OF]->(r) return r`,
          {
            key: item.properties.key,
          },
        );
        item.leaf = childrenOfItem.records.map((item) => item['_fields'][0]).length <= 0;
      }
      return { ...node[0].get('n'), children };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async loadByKey(key: string, leafType: string, header) {
    try {
      const node = await this.neo4jService.findOneNodeByKey('a583fb5c-3891-47f8-94c5-91612f7cacb9');

      if (!node) {
        throw new HttpException({ key: I18NEnums.CLASSIFICATION_NOT_FOUND, args: { key: key } }, HttpStatus.NOT_FOUND);
      }
      const temp = await this.neo4jService.read(
        `match(n{isDeleted:false,key:$key,isActive:true})-[:PARENT_OF]->(r) return r`,
        {
          key: key,
        },
      );

      const children = temp.records.map((item) => item['_fields'][0]);
      for (const item of children) {
        const childrenOfItem = await this.neo4jService.read(
          `match(n{isDeleted:false,key:$key,isActive:true})-[:PARENT_OF]->(r) return r`,
          {
            key: item.properties.key,
          },
        );
        item.leaf = childrenOfItem.records.map((item) => item['_fields'][0]).length <= 0;
      }
      return { ...node, children };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
