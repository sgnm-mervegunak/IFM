import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers } from '@nestjs/common';
import { ContactService } from '../services/contact.service';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { PaginationParams, SearchParams } from 'src/common/dto/pagination.query';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { UserRoles } from 'src/common/const/keycloak.role.enum';
import { SearchType } from 'sgnm-neo4j/dist/constant/pagination.enum';

@ApiTags('contact')
@ApiBearerAuth('JWT-auth')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) { }

  @Get('')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOne(@Headers() header, @Query() neo4jQuery: PaginationParams) {
    console.log(neo4jQuery)
    const { language, realm } = header;
    return this.contactService.findOne(realm, language, neo4jQuery);
  }

  @Get('totalCount')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findOneTotalCount(@Headers() header) {
    const { language, realm } = header;
    return this.contactService.findOneTotalCount(realm, language);
  }

  @Get('/search')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findWithSearchString(@Headers() header, @Query() neo4jQuery: PaginationParams, @Query('searchString') searchString: string) {
    const { language, realm } = header;
    return this.contactService.findWithSearchString(realm, language, neo4jQuery, searchString);
  }


  @Get('/searchByColumn')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findWithSearchStringByColumn(@Headers() header, @Query() neo4jQuery: PaginationParams,@Query() searchParams:SearchParams) {
    const {searchColumn,searchType,searchString}=searchParams
    const { language, realm } = header;
    return this.contactService.findWithSearchStringByColumn(realm, language, neo4jQuery,searchColumn,searchString,searchType);
  }


  @Get('/search/totalCount')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findWithSearchStringTotalCount(@Headers() header,  @Query('searchString') searchString: string) {
    const { language, realm } = header;
    return this.contactService.findWithSearchStringTotalCount(realm, language, searchString);

  }

  @Get('/searchByColumn/totalCount')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @NoCache()
  findWithSearchStringByColumnTotalCOunt(@Headers() header,@Query() searchParams:SearchParams) {
    const {searchColumn,searchType,searchString}=searchParams
    const { language, realm } = header;
    return this.contactService.findWithSearchStringByColumnTotalCount(realm, language,searchColumn,searchString,searchType);
  }

  @Unprotected()
  //@Roles({ roles: [UserRoles.ADMIN] })
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    const { language, realm } = header;
    return this.contactService.findOneNode(key, realm, language);
  }

  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: CreateContactDto,
    description: 'create  contact',
  })
  @Post()
  create(@Body() createContactDto: CreateContactDto, @Headers() header) {
    const { language, realm } = header;
    return this.contactService.create(createContactDto, realm, language);
  }



  @Patch(':id')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto, @Headers() header) {
    const { language, realm } = header;
    return this.contactService.update(id, updateContactDto, realm, language);
  }

  @Delete(':id')
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  remove(@Param('id') id: string, @Headers() header) {
    const { language, realm } = header;
    return this.contactService.remove(id, realm, language);
  }
  //@Unprotected()
  @Roles({ roles: [UserRoles.ADMIN] })
  @Post('/relation/:id/:target_parent_id')
  changeNodeBranch(@Param('id') id: string, @Param('target_parent_id') target_parent_id: string, @Headers() header) {
    const { language, realm } = header;
    return this.contactService.changeNodeBranch(id, target_parent_id, realm, language);
  }


}
