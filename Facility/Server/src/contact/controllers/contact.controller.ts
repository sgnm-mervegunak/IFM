import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers } from '@nestjs/common';
import { ContactService } from '../services/contact.service';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { PaginationParams, SearchParams } from 'src/common/dto/pagination.query';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { UserRoles } from 'src/common/const/keycloak.role.enum';

@ApiTags('contact')
@ApiBearerAuth('JWT-auth')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get('')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOne(@Headers() header, @Query() neo4jQuery: PaginationParams) {
    return this.contactService.findOne(header, neo4jQuery);
  }

  @Get('totalCount')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOneTotalCount(@Headers() header) {
    return this.contactService.findOneTotalCount(header);
  }

  @Get('/search')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findWithSearchString(
    @Headers() header,
    @Query() neo4jQuery: PaginationParams,
    @Query('searchString') searchString: string,
  ) {
    return this.contactService.findWithSearchString(header, neo4jQuery, searchString);
  }

  @Get('/searchByColumn')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findWithSearchStringByColumn(
    @Headers() header,
    @Query() neo4jQuery: PaginationParams,
    @Query() searchParams: SearchParams,
  ) {
    const { searchColumn, searchType, searchString } = searchParams;

    return this.contactService.findWithSearchStringByColumn(header, neo4jQuery, searchColumn, searchString, searchType);
  }

  @Get('/search/totalCount')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findWithSearchStringTotalCount(@Headers() header, @Query('searchString') searchString: string) {
    return this.contactService.findWithSearchStringTotalCount(header, searchString);
  }

  @Get('/searchByColumn/totalCount')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findWithSearchStringByColumnTotalCOunt(@Headers() header, @Query() searchParams: SearchParams) {
    const { searchColumn, searchType, searchString } = searchParams;
    return this.contactService.findWithSearchStringByColumnTotalCount(header, searchColumn, searchString, searchType);
  }

  @Unprotected()
  //@Roles({ roles: [UserRoles.ADMIN] })
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    return this.contactService.findOneNode(key, header);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: CreateContactDto,
    description: 'create  contact',
  })
  @Post()
  create(@Body() createContactDto: CreateContactDto, @Headers() header) {
    return this.contactService.create(createContactDto, header);
  }

  @Patch(':id')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto, @Headers() header) {
    return this.contactService.update(id, updateContactDto, header);
  }

  @Delete(':id')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  remove(@Param('id') id: string, @Headers() header) {
    return this.contactService.remove(id, header);
  }
}
