import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CustomNeo4jError, Neo4jService } from 'sgnm-neo4j/dist';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { wrong_parent_error} from 'src/common/const/custom.error.object';
import { CustomAssetError } from 'src/common/const/custom.error.enum';
import { RelationName } from 'src/common/const/relation.name.enum';
import { System } from '../entities/systems.entity';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';

import { ConfigService } from '@nestjs/config';
import { NodeRelationHandler } from 'src/common/class/node.relation.dealer';
import { SystemComponentInterface } from 'src/common/interface/system-component.interface';
import { SystemComponentRelationDto } from '../dto/component.relation.dto';
import { WrongIdProvided } from 'src/common/bad.request.exception';

@Injectable()
export class SystemComponentRepository implements SystemComponentInterface<System> {
  constructor(
    private readonly neo4jService: Neo4jService,
  ) {}
  
  async create(systemComponentRelationDto: SystemComponentRelationDto, header) {
    try {
      const { realm, authorization, language } = header;
      
      const systemNode = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        [Neo4jLabelEnum.SYSTEMS],
        {isDeleted: false, realm },
        [Neo4jLabelEnum.SYSTEM],
        { isDeleted: false, key: systemComponentRelationDto.system_key  },
        RelationName.PARENT_OF,
        RelationDirection.RIGHT,
      );
      if (!systemNode.length) {
        throw new HttpException(wrong_parent_error({}), 400);
      }

      if (systemComponentRelationDto.component_keys.length == 0) {
        throw new HttpException(wrong_parent_error({}), 400);  //Değişecek    
      }
      
      systemComponentRelationDto.component_keys.forEach(async (item) => {
        let componentNode = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
          [Neo4jLabelEnum.TYPES],
          {isDeleted: false, realm },
          [Neo4jLabelEnum.COMPONENT],
          { isDeleted: false, key: item},
          RelationName.PARENT_OF,
          RelationDirection.RIGHT,
        )
        if (componentNode['length'] > 0) {
          await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
            systemNode[0].get('children').identity.low,
            { isDeleted: false },
            componentNode[0].get('children').identity.low,
            { isDeleted: false },
            'SYSTEM_OF',
            RelationDirection.RIGHT
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
}
