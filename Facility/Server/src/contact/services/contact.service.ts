import { Inject, Injectable } from '@nestjs/common';
import { SearchType } from 'sgnm-neo4j/dist/constant/pagination.enum';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { ContactInterface } from 'src/common/interface/modules.with.pagination.interface';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @Inject(RepositoryEnums.CONTACT)
    private readonly contactRepository: ContactInterface<any>,
  ) {}
  async create(createContactDto: CreateContactDto, header) {
    return await this.contactRepository.create(createContactDto, header);
  }

  findOne(header, neo4jQuery) {
    return this.contactRepository.findOneByRealm(header, neo4jQuery);
  }
  findOneTotalCount(header) {
    return this.contactRepository.findOneByRealmTotalCount(header);
  }

  findWithSearchString(header, neo4jQuery, searchString) {
    return this.contactRepository.findWithSearchString(header, neo4jQuery, searchString);
  }
  findWithSearchStringTotalCount(header, searchString) {
    return this.contactRepository.findWithSearchStringTotalCount(header, searchString);
  }

  findWithSearchStringByColumn(header, neo4jQuery, searchColumn, searchString, searchType: SearchType) {
    return this.contactRepository.findWithSearchStringByColumn(
      header,
      neo4jQuery,
      searchColumn,
      searchString,
      searchType,
    );
  }

  findWithSearchStringWithSearchedStringTotalCount(header, neo4jQuery, searchString, searchedStringTotalCount) {
    return this.contactRepository.findWithSearchStringWithSearchedStringTotalCount(
      header,
      neo4jQuery,
      searchString,
      searchedStringTotalCount,
    );
  }

  findWithSearchStringByColumnWithSearchedStringTotalCount(
    header,
    neo4jQuery,
    searchColumn,
    searchString,
    searchType: SearchType,
    searchedStringTotalCount,
  ) {
    return this.contactRepository.findWithSearchStringByColumnWithSearchedStringTotalCount(
      header,
      neo4jQuery,
      searchColumn,
      searchString,
      searchType,
      searchedStringTotalCount,
    );
  }

  findWithSearchStringByColumnTotalCount(header, searchColumn, searchString, searchType: SearchType) {
    return this.contactRepository.findWithSearchStringByColumnTotalCount(
      header,
      searchColumn,
      searchString,
      searchType,
    );
  }

  update(id: string, updateContactDto: UpdateContactDto, header) {
    return this.contactRepository.update(id, updateContactDto, header);
  }

  remove(id: string, header) {
    return this.contactRepository.delete(id, header);
  }

  async findOneNode(key: string, header) {
    //checkObjectIddİsValid(id);
    return await this.contactRepository.findOneNodeByKey(key, header);
  }
}
