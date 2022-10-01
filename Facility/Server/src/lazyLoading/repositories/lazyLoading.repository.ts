import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { I18NEnums } from '../../common/const/i18n.enum';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { LazyLoadingInterface } from 'src/common/interface/lazyLoading.interface';
import { RelationName } from 'src/common/const/relation.name.enum';

@Injectable()
export class LazyLoadingRepository implements LazyLoadingInterface {
  constructor(private readonly neo4jService: Neo4jService) { }

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


      const firstLevelChildren = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        [label],
        { isDeleted: false, realm: 'IFM', isActive: true },
        [],
        { canDisplay: true },
        'PARENT_OF',
      );

      const children = firstLevelChildren.map((item) => item.get('children'));

      for (const item of children) {
        const childrenOfItem = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
          [],
          { key: item.properties.key },
          [],
          { canDisplay: true },
          'PARENT_OF',
        );
        item.leaf =
          childrenOfItem.map((item) => {
            item.get('children');
          }).length <= 0;

      }

      return { ...node[0].get('n'), children };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async loadByKey(key: string, leafType: string, header) {
    try {
      const node = await this.neo4jService.findByLabelAndFilters([], { key,isDeleted:false });

      if (!node.length) {
        throw new HttpException({ key: I18NEnums.CLASSIFICATION_NOT_FOUND, args: { key } }, HttpStatus.NOT_FOUND);
      }
      const firstLevelChildren = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        [],
        { isDeleted: false, key, isActive: true },
        [],
        { canDisplay: true },
        'PARENT_OF',
      );

      const children = firstLevelChildren.map((item) => item.get('children'));

      for (const item of children) {
        const childrenOfItem = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
          [],
          { isDeleted: false, key: item.properties.key, isActive: true },
          [],
          { canDisplay: true },
          'PARENT_OF',
        );
        item.leaf = childrenOfItem.map((item) => item.get('children')).length <= 0
      }
      children.map((item) => item.leaf = !item.labels.includes(leafType));
      return { ...node[0].get('n'), children };

    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getClassificationRootAndChildrenByLanguageAndRealm(realm: string, language: string) {
    try {
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

      const childrenByLanguage = firstNodes.filter((item) => item['_fields'][1]['labels'][0].endsWith('_' + language));

      const childrenOfChildrenWithChildrenProperties = await Promise.all(
        childrenByLanguage.map(async (item) => {
          const children = await this.neo4jService.findChildrensByIdOneLevel(
            item['_fields'][1]['identity'].low,
            { isDeleted: false },
            [],
            { isDeleted: false },
            'PARENT_OF',
          );
          return {
            ...item['_fields'][1].properties,
            id: item['_fields'][1]['identity'].low,
            children: children.map((child: any) => ({
              ...child['_fields'][1].properties,
              id: child['_fields'][1]['identity'].low,
            })),
          };
        }),
      );

      return {
        ...root_node[0]['_fields'][0].properties,
        id: root_id,
        children: childrenOfChildrenWithChildrenProperties,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async loadClassification(key: string, header) {
    try {
      const node = await this.neo4jService.findByLabelAndFilters([], { key });

      if (!node) {
        throw new HttpException({ key: I18NEnums.CLASSIFICATION_NOT_FOUND, args: { key: key } }, HttpStatus.NOT_FOUND);
      }
      const temp2 = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        [],
        { isDeleted: false, key, isActive: true },
        [],
        { canDisplay: true, isDeleted: false },
        'PARENT_OF',
      );

      const children = temp2.map((item) => item.get('children'));
      for (const item of children) {
        const childrenOfItem = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
          [],
          { isDeleted: false, key: item.properties.key, isActive: true },
          [],
          { canDisplay: true, isDeleted: false },
          'PARENT_OF',
        );
        item.leaf = childrenOfItem.map((item) => item.get('children')).length <= 0;
      }
      return { ...node[0].get('n'), children };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
