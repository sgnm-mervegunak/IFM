import { Inject, Injectable } from '@nestjs/common';
import { BaseGraphDatabaseInterfaceRepository } from 'ifmcommon';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { ContactInterface } from 'src/common/interface/modules.with.pagination.interface';
import { ZoneInterface } from 'src/common/interface/zone.interface';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';


@Injectable()
export class ContactService {
  constructor(
    @Inject(RepositoryEnums.CONTACT)
    private readonly contactRepository: ContactInterface<any>,
  ) {}
  async create(createContactDto: CreateContactDto, realm:string, language: string) {
    return await this.contactRepository.create(createContactDto, realm, language);
  }

  findOne(realm: string, language: string,neo4jQuery) {
    return this.contactRepository.findOneByRealm(realm, language,neo4jQuery);
  }

  update(id: string, updateContactDto: UpdateContactDto, realm:string, language: string) {
    return this.contactRepository.update(id, updateContactDto, realm, language);
  }

  remove(id: string, realm:string, language: string) {
    return this.contactRepository.delete(id, realm, language);
  }

  async changeNodeBranch(id: string, target_parent_id: string, realm:string, language: string) {
    return await this.contactRepository.changeNodeBranch(id, target_parent_id,realm, language);
  }

  async findOneNode(key: string, realm:string, language: string) {
    //checkObjectIddİsValid(id);
    return await this.contactRepository.findOneNodeByKey(key,realm, language);
  }
}
