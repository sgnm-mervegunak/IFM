import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers } from '@nestjs/common';
import { ContactService} from '../services/contact.service';
import { Unprotected } from 'nest-keycloak-connect';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { NoCache } from 'ifmcommon';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
@ApiTags('contact')
@ApiBearerAuth('JWT-auth')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Unprotected()
  //@Roles({ roles: [UserRoles.ADMIN] })
  @ApiBody({
    type: CreateContactDto,
    description: 'create  contact',
  })
  @Post()
  create(@Body() createContactDto: CreateContactDto, @Headers() header) {
    const {language, realm} = header;
    return this.contactService.create(createContactDto, realm, language);
  }

  @Get(':label')
  @Unprotected()
  @NoCache()
  findOne(@Param('label') label: string, @Headers() header) {
    const {language, realm} = header;
    return this.contactService.findOne(label, realm, language);
  }

  @Patch(':id')
  @Unprotected()
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto, @Headers() header) {
    const {language, realm} = header;
    return this.contactService.update(id, updateContactDto, realm, language);
  }

  @Delete(':id')
  @Unprotected()
  remove(@Param('id') id: string, @Headers() header) {
    const {language, realm} = header;
    return this.contactService.remove(id, realm, language);
  }
  @Unprotected()
  @Post('/relation/:id/:target_parent_id')
  changeNodeBranch(@Param('id') id: string, @Param('target_parent_id') target_parent_id: string, @Headers() header) {
    const {language, realm} = header;
    return this.contactService.changeNodeBranch(id, target_parent_id, realm, language);
  }

  @Unprotected()
  @Get('/:key')
  @NoCache()
  findOneNode(@Param('key') key: string, @Headers() header) {
    const {language, realm} = header;
    return this.contactService.findOneNode(key, realm, language);
  }
}
