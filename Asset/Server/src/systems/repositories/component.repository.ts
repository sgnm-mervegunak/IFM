import { HttpException, Injectable } from '@nestjs/common';
import { CustomNeo4jError, Neo4jService } from 'sgnm-neo4j/dist';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { node_not_found, wrong_parent_error } from 'src/common/const/custom.error.object';
import { CustomAssetError } from 'src/common/const/custom.error.enum';
import { RelationName } from 'src/common/const/relation.name.enum';
import { System } from '../entities/systems.entity';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';
import { SystemComponentInterface } from 'src/common/interface/system-component.interface';
import { SystemComponentRelationDto } from '../dto/component.relation.dto';
import { WrongIdProvided } from 'src/common/bad.request.exception';
import { AssetNotFoundException } from 'src/common/notFoundExceptions/not.found.exception';
import { PaginationParams } from 'src/common/commonDto/pagination.dto';

@Injectable()
export class SystemComponentRepository implements SystemComponentInterface<System> {
  constructor(private readonly neo4jService: Neo4jService, private readonly nodeRelationHandler: NodeRelationHandler) {}

  async findOneByRealmTotalCount(systemId: string, realm: string, language: string) {
    try {
      let totalCount = await this.neo4jService.findChildrensByIdAndFiltersTotalCount(
        +systemId,
        {},
        [Neo4jLabelEnum.COMPONENT],
        { isDeleted: false },
        'SYSTEM_OF',
      );
      totalCount = totalCount[0].get('count').low;

      return { totalCount };
    } catch (error) {}
  }

  async create(systemComponentRelationDto: SystemComponentRelationDto, header) {
    try {
      const { realm, authorization, language } = header;

      const systemNode = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        [Neo4jLabelEnum.SYSTEMS],
        { isDeleted: false, realm },
        [Neo4jLabelEnum.SYSTEM],
        { isDeleted: false, key: systemComponentRelationDto.system_key },
        RelationName.PARENT_OF,
        RelationDirection.RIGHT,
      );
      if (!systemNode.length) {
        throw new HttpException(wrong_parent_error({}), 400);
      }

      if (systemComponentRelationDto.component_keys.length == 0) {
        throw new HttpException(wrong_parent_error({}), 400); //Değişecek
      }

      systemComponentRelationDto.component_keys.forEach(async (item) => {
        const componentNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
          [Neo4jLabelEnum.TYPES],
          { isDeleted: false, realm },
          [Neo4jLabelEnum.COMPONENT],
          { isDeleted: false, key: item },
          RelationName.PARENT_OF,
          RelationDirection.RIGHT,
        );
        if (componentNode['length'] > 0) {
          await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
            systemNode[0].get('children').identity.low,
            { isDeleted: false },
            componentNode[0].get('children').identity.low,
            { isDeleted: false },
            'SYSTEM_OF',
            RelationDirection.RIGHT,
          );
        }
      });
      return 'success';
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
          throw new HttpException(error.response.message, error.response.status);
        }
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  async delete(_parent_key: string, _children_keys: string[], header) {
    try {
      // if ( typeof(_children_keys) == 'string') {
      //   _children_keys = [_children_keys];
      // }
      const { realm } = header;
      const selectedSystemNode = await this.neo4jService.findByLabelAndFilters(
        [],
        { isDeleted: false, key: _parent_key },
        [],
      );
      if (!selectedSystemNode.length) {
        throw new AssetNotFoundException(_parent_key);
      }
      //delete system_by relations in this database
      _children_keys.forEach(async (child) => {
        const relatedComponent = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
          ['System'],
          { isDeleted: false, key: _parent_key },
          ['Component'],
          { isDeleted: false, key: child },
          RelationName.SYSTEM_OF,
          RelationDirection.RIGHT,
        );
        if (relatedComponent.length > 0) {
          await this.neo4jService.deleteRelationByIdAndRelationNameWithFilters(
            selectedSystemNode[0].get('n')['identity'].low,
            {},
            relatedComponent[0].get('children').identity.low,
            {},
            RelationName.SYSTEM_OF,
            RelationDirection.RIGHT,
          );
        }
      });
    } catch (error) {
      const { code, message } = error.response;
      if (code === CustomAssetError.HAS_CHILDREN) {
        throw new HttpException({ message: error.response.message }, 400);
      } else if (code === 5005) {
        AssetNotFoundException(_parent_key);
      } else {
        throw new HttpException(message, code);
      }
    }
  }

  async findComponentsIncludedBySystem(key: string, header, neo4jQuery: PaginationParams) {
    const { language, realm } = header;
    const systemNode = await this.neo4jService.findByLabelAndFilters(
      [Neo4jLabelEnum.SYSTEM],
      { isDeleted: false, key: key },
      [Neo4jLabelEnum.VIRTUAL],
    );
    if (!systemNode['length']) {
      throw new HttpException(node_not_found({}), 400);
    }
    const systemComponents = await this.neo4jService.findChildrensByIdAndFiltersWithPagination(
      systemNode[0].get('n').identity.low,
      { isDeleted: false },
      ['Component'],
      { isDeleted: false },
      RelationName.SYSTEM_OF,
      neo4jQuery,
    );
    const components = [];
    systemComponents.forEach((record) => {
      components.push(record.get('children').properties);
    });
    const totalCount = await this.findOneByRealmTotalCount(systemNode[0].get('n').identity.low, realm, language);
    const resultObject = { totalCount: totalCount, properties: components };

    return resultObject;
  }
}
