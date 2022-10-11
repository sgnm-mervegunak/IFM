import { HttpException, Injectable } from '@nestjs/common';

import { Neo4jService } from 'sgnm-neo4j/dist';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { LazyLoadingRepository } from 'src/common/class/lazyLoading.dealer';
import { node_not_found } from 'src/common/const/custom.error.object';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { RelationName } from 'src/common/const/relation.name.enum';
import { LazyLoadingPathDto } from 'src/common/dto/lazy.loading.path.dto';
import { LazyLoadingPathByKeyDto } from 'src/common/dto/lazy.loading.path.key.dto ';
import { SystemLazyLoadingInterface } from 'src/common/interface/system.lazyloading.interface';

@Injectable()
export class SystemLazyLoadingRepository implements SystemLazyLoadingInterface {
  constructor(private readonly lazyLoadingDealer: LazyLoadingRepository, private readonly neo4jService: Neo4jService) {}
  async getPathByKey(lazyLoadingPathByKeyDto: LazyLoadingPathByKeyDto, header: any) {
    try {
      const { key, leafType, label } = lazyLoadingPathByKeyDto;
      const { realm } = header;
      const node = await this.neo4jService.findByLabelAndFilters([], { key });
      if (!node.length) {
        throw new HttpException(node_not_found(), 400);
      }

      const parents = await (
        await this.neo4jService.findChildrensByLabelsAndFiltersWithNotLabels([], {}, [], { key }, [
          'Root',
          'Systems',
        ])
      )
        .map((item) => item.get('parent').properties.key)
        .reverse();

      const tree = await this.lazyLoadingDealer.loadByPath(
        parents,
        'FacilityStructure',
        leafType,
        { realm, isDeleted: false },
        { isDeleted: false, canDisplay: true },
        { isDeleted: false, canDisplay: true },
      );
      return tree;
    } catch (error) {}
  }

  async findRootByRealm(header) {
    try {
      let { realm } = header;
      //realm = 'IFM';
      console.log(realm);
      const tree = await this.lazyLoadingDealer.loadByLabel(
        'Systems',
        'Component',
        { realm, isDeleted: false },
        { isDeleted: false, canDisplay: true },
        { isDeleted: false, canDisplay: true },
        [''],
        header,
      );
      return tree;
    } catch (error) {}
  }

  async getPath(lazyLoadingPathDto: LazyLoadingPathDto, header) {
    try {
      const { realm, language } = header;
      const { path } = lazyLoadingPathDto;

      const tree = await this.lazyLoadingDealer.loadByPath(
        path,
        'Systems',
        'Component',
        { realm, isDeleted: false },
        { isDeleted: false, canDisplay: true },
        { isDeleted: false, canDisplay: true },
      );
      return tree;
    } catch (error) {}
  }

  async findChildrensByKey(key: string, leafType, header) {
    try {
      const tree = await this.lazyLoadingDealer.loadByKey(
        key,
        leafType,
        { isDeleted: false},
        { isDeleted: false },
        { isDeleted: false },
      );
      return tree;
    } catch (error) {}
  }

  async findChildrensByKeyAndFilterIt(key: string, leafType, header, filterKey: string) {
    try {
      let tree = await this.lazyLoadingDealer.loadByKey(
        key,
        leafType,
        { isDeleted: false},
        { isDeleted: false },
        { isDeleted: false },
      );
      const componentsOfSystem = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
                                    [Neo4jLabelEnum.SYSTEM],
                                    {"isDeleted": false , "key": filterKey},
                                    [Neo4jLabelEnum.COMPONENT],
                                    {"isDeleted": false},
                                    RelationName.SYSTEM_OF,
                                    RelationDirection.RIGHT
                                  );  
      let filteredComponents = [];                            
      tree.children.forEach((typeComponent) => {
        componentsOfSystem.forEach((systemComponent) => {
             if (typeComponent["id"] == systemComponent.get('children').identity.low) {
               filteredComponents.push(typeComponent);
             }  
        });
      });
      tree.children = filteredComponents;

      return tree;
    } catch (error) {}
  }
}
