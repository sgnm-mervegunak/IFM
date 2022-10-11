import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Unprotected } from 'nest-keycloak-connect';
import { NoCache, PaginationParams } from 'ifmcommon';
import { ClassificationHistory } from '../entities/classification.history.entity';
import { ClassificationHistoryService } from '../services/classification.history.service';

@ApiTags('Classification_History')
@Controller('classification_history')
@Unprotected()
export class ClassificationHistoryController {
  constructor(private readonly classificationHistoryService: ClassificationHistoryService) {}

  @Get('')
  @NoCache()
  async getAllClassification(@Query() query: PaginationParams): Promise<ClassificationHistory[]> {
    return await this.classificationHistoryService.findAll(query);
  }
  @Get(':labelclass')
  @NoCache()
  async getClassificationHistory(@Param('labelclass') _id: string): Promise<ClassificationHistory[]> {
    return await this.classificationHistoryService.findOne(_id);
  }
}
