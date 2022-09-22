import { Controller, HttpException } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { CustomTreeError } from './common/const/custom.error.enum';
import { has_not_reference_key } from './common/const/custom.error.object';
import * as moment from 'moment';

@Controller('appListener')
export class AppListenerController {
  constructor(private readonly neo4jService: Neo4jService) {}

  @EventPattern('deleteVirtualNodeRelations')
  async deleteAssetListener(@Payload() message) {
    try {
      if (!message.value?.referenceKey) {
        throw new HttpException(has_not_reference_key(), 400);
      }
      console.log(message.value.referenceKey);
      const willDeleteVirtualNodes = await this.neo4jService.findByLabelAndFilters([], {
        referenceKey: message.value?.referenceKey,
        isDeleted: false,
      });

      willDeleteVirtualNodes.forEach(async (node) => {
        const updatedNode = await this.neo4jService.updateByIdAndFilter(node.get('n').identity.low, {}, [], {
          isDeleted: true,
          updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        });
        console.log(updatedNode);
      });
    } catch (error) {
      const code = error.response?.code;

      if (code) {
        if (code === CustomTreeError.HAS_NOT_REFERENCE_KEY) {
          throw new HttpException({ message: error.response.message }, error.status);
        }
      }
      throw new HttpException(error, 500);
    }
  }
}
