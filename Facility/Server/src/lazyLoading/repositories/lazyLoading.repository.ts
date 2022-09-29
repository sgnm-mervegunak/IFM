import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { I18NEnums } from '../../common/const/i18n.enum';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { LazyLoadingInterface } from 'src/common/interface/lazyLoading.interface';

@Injectable()
export class LazyLoadingRepository implements LazyLoadingInterface {
  constructor(private readonly neo4jService: Neo4jService) {}

  loadByLabel(key: string, header) {
    throw new Error('Method not implemented.');
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
      console.log({ ...node, children });
      return { ...node, children };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
