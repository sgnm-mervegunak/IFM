import { HttpException, Injectable } from '@nestjs/common';

import { Neo4jService } from 'sgnm-neo4j/dist';
import { LazyLoadingRepository } from 'src/common/class/lazyLoading.dealer';
import { node_not_found } from 'src/common/const/custom.error.object';
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
          'FacilityStructure',
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
      realm = 'IFM';
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
        'FacilityStructure',
        'Space',
        { realm, isDeleted: false },
        { isDeleted: false, canDisplay: true },
        { isDeleted: false, canDisplay: true },
      );
      return tree;
    } catch (error) {}
  }

  //REVISED FOR NEW NEO4J
  async findChildrensByKey(key: string, leafType, header) {
    try {
      const tree = await this.lazyLoadingDealer.loadByKey(
        key,
        leafType,
        { isDeleted: false, canDisplay: true },
        { isDeleted: false, canDisplay: true },
        { isDeleted: false },
      );
      return tree;
    } catch (error) {}
  }
}
