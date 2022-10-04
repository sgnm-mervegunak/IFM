import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { I18NEnums } from '../../common/const/i18n.enum';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { LazyLoadingInterface } from 'src/common/interface/lazyLoading.interface';
import { RelationName } from 'src/common/const/relation.name.enum';

@Injectable()
export class LazyLoadingRepository implements LazyLoadingInterface {
  constructor(private readonly neo4jService: Neo4jService) {}
  loadByPath(path: string[], header: any) {
    throw new Error('Method not implemented.');
  }

  async loadByLabel(label: string, header) {
    const { realm } = header;
    try {
      const node = await this.neo4jService.findByLabelAndFilters([label], { realm });

      if (!node) {
        throw new HttpException(
          { key: I18NEnums.CLASSIFICATION_NOT_FOUND, args: { key: label } },
          HttpStatus.NOT_FOUND,
        );
      }

      const firstLevelChildren = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        [label],
        { isDeleted: false, realm, isActive: true },
        [],
        { canDisplay: true },
        'PARENT_OF',
      );

      const root_id = node[0].get('n').identity.low;

      const children = await Promise.all(
        firstLevelChildren.map(async (item) => {
          const firstLevelChildrensChildren = await this.neo4jService.findChildrensByIdOneLevel(
            item.get('children').identity.low,
            { isDeleted: false },
            [],
            { isDeleted: false },
            'PARENT_OF',
          );
          return {
            labels: item.get('children').labels,
            ...item.get('children').properties,
            id: item.get('children').identity.low,
            leaf: firstLevelChildrensChildren.length <= 0,
          };
        }),
      );

      return {
        ...node[0].get('n').properties,
        id: root_id,
        leaf: children.length <= 0,
        children,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async loadByKey(key: string, leafType: string, header) {
    try {
      const node = await this.neo4jService.findByLabelAndFilters([], { key, isDeleted: false });

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

      const root_id = node[0].get('n').identity.low;

      const children = await Promise.all(
        firstLevelChildren.map(async (item) => {
          const firstLevelChildrensChildren = await this.neo4jService.findChildrensByIdOneLevel(
            item.get('children').identity.low,
            { isDeleted: false },
            [],
            { isDeleted: false },
            'PARENT_OF',
          );
          return {
            labels: item.get('children').labels,
            ...item.get('children').properties,
            id: item.get('children').identity.low,
            leaf: firstLevelChildrensChildren.length <= 0 || item.get('children').labels.includes(leafType),
          };
        }),
      );

      return {
        ...node[0].get('n').properties,
        id: root_id,
        leaf: children.length <= 0,
        children,
      };
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
      const firstNodes = await this.neo4jService.findChildrensByIdOneLevel(
        root_id,
        { isDeleted: false },
        [],
        { isDeleted: false },
        'PARENT_OF',
      );

      const childrenByLanguage = firstNodes.filter((item) => item['_fields'][1]['labels'][0].endsWith('_' + language));

      const children = await Promise.all(
        childrenByLanguage.map(async (item) => {
          const temp = await this.neo4jService.findChildrensByIdOneLevel(
            item['_fields'][1]['identity'].low,
            { isDeleted: false },
            [],
            { isDeleted: false },
            'PARENT_OF',
          );
          return {
            ...item['_fields'][1].properties,
            id: item['_fields'][1]['identity'].low,
            leaf: temp.length <= 0,
          };
        }),
      );

      return {
        ...root_node[0]['_fields'][0].properties,
        id: root_id,
        leaf: children.length <= 0,
        children,
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
        { isDeleted: false, key },
        [],
        { canDisplay: true, isDeleted: false },
        'PARENT_OF',
      );

      const children = temp2.map((item) => item.get('children'));
      for (const item of children) {
        const childrenOfItem = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
          [],
          { isDeleted: false, key: item.properties.key },
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
  async loadClassificationWithPath(path: string[], realm: string, language: string) {
    try {
      const rootWithChildren: any = await this.getClassificationRootAndChildrenByLanguageAndRealm(realm, language);

      // referans tutucu
      const temp: any = new Map();

      for (const item of rootWithChildren.children) {
        temp[item.key] = item;
      }
      for (const item of path) {
        const loadedChildren = await this.loadClassification(item, null);
        temp[item].children = loadedChildren.children.map((child: any) => ({
          ...child.properties,
          id: child.identity.low,
          leaf: child.leaf,
        }));
        for (const it of temp[item].children) {
          temp[it.key] = it;
        }
      }
      return rootWithChildren;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getClassificationRootAndChildrenByLanguageAndRealmAndIsActive(
    realm: string,
    language: string,
    isActive: boolean,
  ) {
    try {
      const root_node = await this.neo4jService.findByLabelAndFilters(
        ['Classification'],
        { isDeleted: false, realm: realm, isActive },
        [],
      );
      const root_id = root_node[0]['_fields'][0]['identity'].low;
      const firstNodes = await this.neo4jService.findChildrensByIdOneLevel(
        root_id,
        { isDeleted: false, isActive },
        [],
        { isDeleted: false, isActive },
        'PARENT_OF',
      );

      const childrenByLanguage = firstNodes.filter((item) => item['_fields'][1]['labels'][0].endsWith('_' + language));

      const children = await Promise.all(
        childrenByLanguage.map(async (item) => {
          const temp = await this.neo4jService.findChildrensByIdOneLevel(
            item['_fields'][1]['identity'].low,
            { isDeleted: false, isActive },
            [],
            { isDeleted: false, isActive },
            'PARENT_OF',
          );
          return {
            ...item['_fields'][1].properties,
            id: item['_fields'][1]['identity'].low,
            leaf: temp.length <= 0,
          };
        }),
      );

      return {
        ...root_node[0]['_fields'][0].properties,
        id: root_id,
        leaf: children.length <= 0,
        children,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async loadClassificationByIsActive(key: string, header, isActive: boolean) {
    try {
      const node = await this.neo4jService.findByLabelAndFilters([], { key, isActive });

      if (!node) {
        throw new HttpException({ key: I18NEnums.CLASSIFICATION_NOT_FOUND, args: { key: key } }, HttpStatus.NOT_FOUND);
      }
      const temp2 = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        [],
        { isDeleted: false, key, isActive },
        [],
        { canDisplay: true, isDeleted: false, isActive },
        'PARENT_OF',
      );

      const children = temp2.map((item) => item.get('children'));
      for (const item of children) {
        const childrenOfItem = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
          [],
          { isDeleted: false, key: item.properties.key, isActive },
          [],
          { canDisplay: true, isDeleted: false, isActive },
          'PARENT_OF',
        );
        item.leaf = childrenOfItem.map((item) => item.get('children')).length <= 0;
      }
      return { ...node[0].get('n'), children };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async loadClassificationWithPathByIsActive(path: string[], realm: string, language: string, isActive: boolean) {
    try {
      const rootWithChildren: any = await this.getClassificationRootAndChildrenByLanguageAndRealmAndIsActive(
        realm,
        language,
        isActive,
      );

      // referans tutucu
      const temp: any = new Map();

      for (const item of rootWithChildren.children) {
        temp[item.key] = item;
      }
      for (const item of path) {
        const loadedChildren = await this.loadClassificationByIsActive(item, null, isActive);
        temp[item].children = loadedChildren.children.map((child: any) => ({
          ...child.properties,
          id: child.identity.low,
          leaf: child.leaf,
        }));
        for (const it of temp[item].children) {
          temp[it.key] = it;
        }
      }
      return rootWithChildren;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
