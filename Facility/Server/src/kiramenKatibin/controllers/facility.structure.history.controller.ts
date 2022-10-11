import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Unprotected } from 'nest-keycloak-connect';
import { NoCache, PaginationParams } from 'ifmcommon';
import { FacilityStructureHistory } from '../entities/facilitystructure.history.entity';
import { FacilityStructureHistoryService } from '../services/facilitystructure.history.service';

@ApiTags('Facility_Structure_History')
@Controller('facilityStructureHistory')
@Unprotected()
export class FacilityStructureHistoryController {
  constructor(private readonly facilityStructureHistoryService: FacilityStructureHistoryService) {}

  @Get('/')
  @NoCache()
  async getAll(@Query() query: PaginationParams): Promise<FacilityStructureHistory[]> {
    return await this.facilityStructureHistoryService.findAll(query);
  }

  @Get(':labelclass')
  @NoCache()
  async getFacilityHistory(@Param('labelclass') _id: string): Promise<FacilityStructureHistory[]> {
    return await this.facilityStructureHistoryService.findOne(_id);
  }
}
