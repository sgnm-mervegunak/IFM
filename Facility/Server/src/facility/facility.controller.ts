import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateFacilityDto } from "./dtos/create.facility.dto";
import { UpdateFacilityDto } from "./dtos/update.facility.dto";
import { Facility } from "./entities/facility.entity";
import { FacilityService } from "./facility.service";
import { Roles, Unprotected } from "nest-keycloak-connect";
import { PaginationParams } from "src/common/commonDto/pagination.dto";
import { I18n, I18nContext, I18nService } from "nestjs-i18n";

@ApiTags("Facility")
@Controller("facility")
export class FacilityController {
  constructor(
    private readonly facilityService: FacilityService,
    private readonly i18n: I18nService
  ) {}

  @ApiOperation({
    summary: "Gets all facilities ",
    description:
      "If you want to get all facilities in your organization use this route. It takes no path or query params",
  })
  //@LoggerInter()
  @Get("/")
  //@Roles({roles: ['facility_client_role_admin']})
  @Unprotected()
  async getAllFacilities(
    @Query() query: PaginationParams,
    @I18n() i18n: I18nContext
  ): Promise<Facility[]> {
    return this.facilityService.findAll(query);
  }

  @ApiOperation({
    summary: "Gets facility with id ",
    description:
      "If you want to get specific facility in your organization use this route. It takes  query params which is  id",
  })
  @Get("/:_id")
  //@Roles({roles: ['facility_client_role_user']})
  @Unprotected()
  getFacility(@Param("_id") id: string): Promise<Facility> {
    return this.facilityService.findOne(id);
  }

  @ApiBody({
    type: CreateFacilityDto,
    description: "Store product structure",
  })
  @Post("")
  @Unprotected()
  //@Roles({roles: ['facility_client_role_admin']})
  createFacility(
    @Body() createFacilityDto: CreateFacilityDto
  ): Promise<Facility> {
    return this.facilityService.create(createFacilityDto);
  }

  @ApiBody({
    type: UpdateFacilityDto,
    description: "update  facility structure",
  })
  @Patch("/:_id")
  updateFacility(
    @Param("_id") id: string,
    @Body() updateFacilityDto: UpdateFacilityDto
  ) {
    return this.facilityService.update(id, updateFacilityDto);
  }

  @Delete("/:_id")
  deleteFacility(@Param("_id") id: string) {
    return this.facilityService.remove(id);
  }
}