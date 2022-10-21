import { HttpException, Injectable } from '@nestjs/common';
import { CustomTreeError } from 'src/common/const/custom.error.enum';
import { Contact } from '../entities/contact.entity';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import {
  ContactNotFoundException,
  FacilityStructureNotFountException,
} from 'src/common/notFoundExceptions/not.found.exception';
import { assignDtoPropToEntity, createDynamicCyperObject, CustomNeo4jError, Neo4jService } from 'sgnm-neo4j/dist';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { has_children_error, node_not_found } from 'src/common/const/custom.error.object';
import { RelationName } from 'src/common/const/relation.name.enum';
import { CustomIfmCommonError } from 'src/common/const/custom-ifmcommon.error.enum';
import { ContactHasChildrenException } from 'src/common/badRequestExceptions/bad.request.exception';
import { ContactInterface } from 'src/common/interface/modules.with.pagination.interface';
import { PaginationParams } from 'src/common/dto/pagination.query';
import { SearchStringRepository } from 'src/common/class/search.string.from.nodes.dealer';
import { AscendingEnum, SearchType } from 'sgnm-neo4j/dist/constant/pagination.enum';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { generateUuid } from 'src/common/baseobject/base.virtual.node.object';
import { fieldSorter } from 'src/common/func/common.func';

@Injectable()
export class ContactRepository implements ContactInterface<any> {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly searchStringRepository: SearchStringRepository,
  ) {}

  async findWithSearchStringWithSearchedStringTotalCount(
    header,
    neo4jQuery: PaginationParams,
    searchString,
    searchedStringTotalCount: number,
  ) {
    try {
      const { realm } = header;
      const contactNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.CONTACTS], {
        realm,
        isDeleted: false,
      });
      if (!contactNode.length) {
        throw new FacilityStructureNotFountException(realm);
      }

      const paginationParam: PaginationParams = {
        skip: 0,
        limit: searchedStringTotalCount,
        page: 1,
        orderBy: AscendingEnum.ASCENDING,
      };

      neo4jQuery.skip = Math.abs(neo4jQuery.page - 1) * neo4jQuery.limit;
      const matchedNodes = await this.searchStringRepository.searchByString(
        contactNode[0].get('n').identity.low,
        { isDeleted: false },
        [],
        { isDeleted: false },
        [],
        'PARENT_OF',
        paginationParam,
        searchString,
      );

      let children = matchedNodes.map((item) => {
        item.get('children').properties['id'] = item.get('children').identity.low;
        return item.get('children').properties;
      });
      let orderByColumn: string[] = [];
      if (!Array.isArray(neo4jQuery.orderByColumn)) {
        orderByColumn = [neo4jQuery.orderByColumn];
      } else {
        orderByColumn = neo4jQuery.orderByColumn;
      }
      children = children.sort(fieldSorter(orderByColumn, neo4jQuery.orderBy));

      children = children.slice(neo4jQuery.skip, neo4jQuery.skip + neo4jQuery.limit);

      const finalResponse = { ...contactNode[0].get('n').properties, children };

      return finalResponse;
    } catch (error) {}
  }

  async findWithSearchStringByColumnWithSearchedStringTotalCount(
    header,
    neo4jQuery: PaginationParams,
    searchColumn,
    searchString,
    searchType: SearchType = SearchType.CONTAINS,
    searchedStringTotalCount: number,
  ) {
    try {
      const { realm } = header;
      const contactNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.CONTACTS], {
        realm,
        isDeleted: false,
      });
      if (!contactNode.length) {
        throw new FacilityStructureNotFountException(realm);
      }

      const paginationParam: PaginationParams = {
        skip: 0,
        limit: searchedStringTotalCount,
        page: 1,
        orderBy: AscendingEnum.ASCENDING,
      };

      neo4jQuery.skip = Math.abs(neo4jQuery.page - 1) * neo4jQuery.limit;
      const matchedNodes = await this.searchStringRepository.searchByStringBySpecificColumn(
        contactNode[0].get('n').identity.low,
        { isDeleted: false },
        [],
        { isDeleted: false },
        [],
        'PARENT_OF',
        paginationParam,
        searchColumn,
        searchString,
        searchType,
      );
      let children = matchedNodes.map((item) => {
        item.get('children').properties['id'] = item.get('children').identity.low;
        return item.get('children').properties;
      });
      let orderByColumn: string[] = [];
      if (!Array.isArray(neo4jQuery.orderByColumn)) {
        orderByColumn = [neo4jQuery.orderByColumn];
      } else {
        orderByColumn = neo4jQuery.orderByColumn;
      }

      children = children.sort(fieldSorter(orderByColumn, neo4jQuery.orderBy));

      children = children.slice(neo4jQuery.skip, neo4jQuery.skip + neo4jQuery.limit);

      const finalResponse = { ...contactNode[0].get('n').properties, children };

      return finalResponse;
    } catch (error) {}
  }
  async findOneByRealmTotalCount(header) {
    try {
      const { realm } = header;
      const contactNode = await this.neo4jService.findByLabelAndFilters(['Contacts'], { realm, isDeleted: false });
      let totalCount = await this.neo4jService.findChildrensByIdAndFiltersTotalCount(
        contactNode[0].get('n').identity.low,
        {},
        [],
        { isDeleted: false },
        'PARENT_OF',
      );
      totalCount = totalCount[0].get('count').low;

      return { totalCount };
    } catch (error) {}
  }
  async findWithSearchStringTotalCount(header, searchString: string) {
    try {
      const { realm } = header;
      const contactNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.CONTACTS], {
        realm,
        isDeleted: false,
      });
      if (!contactNode.length) {
        throw new FacilityStructureNotFountException(realm);
      }
      const totalCount = await this.searchStringRepository.searchByStringTotalCount(
        contactNode[0].get('n').identity.low,
        { isDeleted: false },
        [],
        { isDeleted: false },
        [],
        'PARENT_OF',
        searchString,
      );

      return { totalCount };
    } catch (error) {}
  }
  async findWithSearchStringByColumnTotalCount(
    header,
    searchColumn: string,
    searchString: string,
    searchType: SearchType,
  ) {
    try {
      const { realm } = header;
      const contactNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.CONTACTS], {
        realm,
        isDeleted: false,
      });
      if (!contactNode.length) {
        throw new FacilityStructureNotFountException(realm);
      }
      const totalCount = await this.searchStringRepository.searchByStringBySpecificColumnTotalCount(
        contactNode[0].get('n').identity.low,
        { isDeleted: false },
        [],
        { isDeleted: false },
        [],
        'PARENT_OF',
        searchColumn,
        searchString,
        searchType,
      );

      return { totalCount };
    } catch (error) {}
  }

  async findOneByRealm(header, neo4jQuery: PaginationParams) {
    try {
      const { realm } = header;
      const contactNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.CONTACTS], {
        realm,
        isDeleted: false,
      });
      // for (let index = 0; index < 2000000; index++) {
      //   const key = generateUuid();
      //   console.log(key);
      //   const contact = new Contact();
      //   contact['company'] = key;
      //   contact['email'] = key + '@gmail.com';
      //   contact['phone'] = key;
      //   contact['classificationId'] = '34-55-00-00-00-00';
      //   const value = await this.neo4jService.createNode(contact, ['Contact']);

      //   await this.neo4jService.addParentRelationByIdAndFilters(
      //     value.identity.low,
      //     {},
      //     contactNode[0].get('n').identity.low,
      //     {},
      //   );
      // }

      if (!contactNode.length) {
        throw new FacilityStructureNotFountException(realm);
      }
      neo4jQuery.skip = Math.abs(neo4jQuery.page - 1) * neo4jQuery.limit;
      let children = await this.neo4jService.findChildrensByIdAndFiltersWithPagination(
        contactNode[0].get('n').identity.low,
        {},
        [],
        { isDeleted: false },
        'PARENT_OF',
        neo4jQuery,
      );


      children = children.map((item) => {
        item.get('children').properties['id'] = item.get('children').identity.low;
        return item.get('children').properties;
      });
      const finalResponse = { ...contactNode[0].get('n').properties, children };

      return finalResponse;
    } catch (error) {}
  }

  async findWithSearchString(header, neo4jQuery: PaginationParams, searchString) {
    try {
      const { realm } = header;
      const contactNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.CONTACTS], {
        realm,
        isDeleted: false,
      });
      if (!contactNode.length) {
        throw new FacilityStructureNotFountException(realm);
      }

      neo4jQuery.skip = Math.abs(neo4jQuery.page - 1) * neo4jQuery.limit;
      const matchedNodes = await this.searchStringRepository.searchByString(
        contactNode[0].get('n').identity.low,
        { isDeleted: false },
        [],
        { isDeleted: false },
        [],
        'PARENT_OF',
        neo4jQuery,
        searchString,
      );
      const children = matchedNodes.map((item) => {
        item.get('children').properties['id'] = item.get('children').identity.low;
        return item.get('children').properties;
      });

      const finalResponse = { ...contactNode[0].get('n').properties, children };

      return finalResponse;
    } catch (error) {}
  }

  async findWithSearchStringByColumn(
    header,
    neo4jQuery: PaginationParams,
    searchColumn,
    searchString,
    searchType: SearchType = SearchType.CONTAINS,
  ) {
    try {
      const { realm } = header;
      const contactNode = await this.neo4jService.findByLabelAndFilters([Neo4jLabelEnum.CONTACTS], {
        realm,
        isDeleted: false,
      });
      if (!contactNode.length) {
        throw new FacilityStructureNotFountException(realm);
      }

      neo4jQuery.skip = Math.abs(neo4jQuery.page - 1) * neo4jQuery.limit;
      const matchedNodes = await this.searchStringRepository.searchByStringBySpecificColumn(
        contactNode[0].get('n').identity.low,
        { isDeleted: false },
        [],
        { isDeleted: false },
        [],
        'PARENT_OF',
        neo4jQuery,
        searchColumn,
        searchString,
        searchType,
      );
      const children = matchedNodes.map((item) => {
        item.get('children').properties['id'] = item.get('children').identity.low;
        return item.get('children').properties;
      });

      const finalResponse = { ...contactNode[0].get('n').properties, children };

      return finalResponse;
    } catch (error) {}
  }

  //REVISED FOR NEW NEO4J
  async create(createContactDto: CreateContactDto, header) {
    try {
      const { realm } = header;
      const contactRootNode = await this.neo4jService.findByLabelAndFilters(
        ['Contacts'],
        { isDeleted: false, realm },
        [],
      );
      //check if rootNode realm equal to keyclock token realm
      if (contactRootNode[0].get('n').properties.realm !== realm) {
        throw new HttpException({ message: 'You dont have permission' }, 403);
      }

      const contact = new Contact();
      const contactObject = assignDtoPropToEntity(contact, createContactDto);
      delete contactObject['createdById'];
      delete contactObject['classificationId'];

      let value;
      if (createContactDto['labels']) {
        value = await this.neo4jService.createNode(contactObject, createContactDto['labels']);
      } else {
        value = await this.neo4jService.createNode(contactObject, [Neo4jLabelEnum.CONTACT]);
      }
      value['properties']['id'] = value['identity'].low;
      const result = { id: value['identity'].low, labels: value['labels'], properties: value['properties'] };

      await this.neo4jService.addRelationByIdAndRelationNameWithoutFilters(
        contactRootNode[0].get('n').identity.low,
        result['id'],
        RelationName.PARENT_OF,
        RelationDirection.RIGHT,
      );

      // CREATED BY relation create
      if (createContactDto['createdById']) {
        await this.neo4jService.addRelationByIdAndRelationNameWithoutFilters(
          result['id'],
          +createContactDto['createdById'],
          RelationName.CREATED_BY,
          RelationDirection.RIGHT,
        );
      }
      // CLASSIFIED BY relation create
      const newClassificationCode = await this.neo4jService.findByIdAndFilters(
        +createContactDto['classificationId'],
        { isDeleted: false },
        [],
      );
      const newCategories = await this.neo4jService.findChildrensByLabelsAndFilters(
        ['Classification'],
        { isDeleted: false, realm: contactRootNode[0].get('n').properties.realm },
        [],
        { isDeleted: false, code: newClassificationCode['properties'].code },
      );
      for (let i = 0; i < newCategories.length; i++) {
        await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
          result.id,
          { isDeleted: false },
          newCategories[i]['_fields'][1].identity.low,
          { isDeleted: false },
          RelationName.CLASSIFIED_BY,
          RelationDirection.RIGHT,
        );
      }
      return result;
    } catch (error) {
      const code = error.response?.code;
      if (code >= 1000 && code <= 1999) {
        if (error.response?.code == CustomIfmCommonError.EXAMPLE1) {
        }
      } else if (code >= 5000 && code <= 5999) {
      } else if (code >= 9000 && code <= 9999) {
      } else {
        throw new HttpException('', 500);
      }
    }
  }
  //REVISED FOR NEW NEO4J
  async update(_id: string, updateContactDto: UpdateContactDto, header) {
    try {
      const { realm } = header;
      const structureRootNode = await this.neo4jService.findChildrensByChildIdAndFilters(
        [Neo4jLabelEnum.CONTACTS],
        { isDeleted: false },
        +_id,
        { isDeleted: false },
        RelationName.PARENT_OF,
      );
      //check if rootNode realm equal to keyclock token realm
      if (structureRootNode[0]['_fields'][0].properties.realm !== realm) {
        throw new HttpException({ message: 'You dont have permission' }, 403);
      }

      const updateContactDtoWithoutLabelsAndParentId = {};
      Object.keys(updateContactDto).forEach((element) => {
        if (element != 'labels' && element != 'parentId' && element != 'createdById' && element != 'classificationId') {
          updateContactDtoWithoutLabelsAndParentId[element] = updateContactDto[element];
        }
      });
      const dynamicObject = createDynamicCyperObject(updateContactDtoWithoutLabelsAndParentId);

      const updatedNode = await this.neo4jService.updateByIdAndFilter(+_id, {}, [], dynamicObject);
      if (!updatedNode) {
        throw new ContactNotFoundException(_id);
      }
      const result = {
        id: updatedNode['identity'].low,
        labels: updatedNode['labels'],
        properties: updatedNode['properties'],
      };
      if (updateContactDto['labels'] && updateContactDto['labels'].length > 0) {
        await this.neo4jService.removeLabel(_id, result['labels']); //neo4j library de yenisi yazılacak
        const updateNodeLabels = await this.neo4jService.updateByIdAndFilter(+_id, {}, updateContactDto['labels'], {});
        result['labels'] = updateNodeLabels['labels'];
      }

      // CREATED BY relation update, if necessary
      if (updateContactDto['createdById']) {
        const createdByResult = await this.neo4jService.findChildrensByIdAndNotLabelsOneLevel(
          +_id,
          { isDeleted: false },
          [],
          ['Virtual'],
          { isDeleted: false },
          RelationName.CREATED_BY,
        );
        //if there is a "CREATED_BY" relation
        if (createdByResult && createdByResult.length > 0) {
          if (createdByResult[0]['_fields'][1]['identity'].low != updateContactDto['createdById']) {
            await this.neo4jService.deleteRelationByRelationId(createdByResult[0]['_fields'][2]['identity'].low);
            await this.neo4jService.addRelationWithRelationName(
              _id,
              updateContactDto['createdById'],
              RelationName.CREATED_BY,
            );
          }
        }
        //if there is no "CREATED_BY" relation
        else {
          await this.neo4jService.addRelationWithRelationName(
            _id,
            updateContactDto['createdById'],
            RelationName.CREATED_BY,
          );
        }
      }

      // CLASSIFIED_BY relation update, if necessary
      const categories = await this.neo4jService.findChildrensByLabelsAndRelationNameOneLevel(
        [],
        { isDeleted: false, key: result['properties'].key },
        [],
        { isDeleted: false },
        RelationName.CLASSIFIED_BY,
        RelationDirection.RIGHT,
      );
      const newClassificationCode = await this.neo4jService.findByIdAndFilters(
        +updateContactDto['classificationId'],
        { isDeleted: false },
        [],
      );
      const newCategories = await this.neo4jService.findChildrensByLabelsAndFilters(
        ['Classification'],
        { isDeleted: false, realm: structureRootNode[0]['_fields'][0].properties.realm },
        [],
        { isDeleted: false, code: newClassificationCode['properties'].code },
      );
      if (categories && categories.length > 0) {
        if (categories[0]['_fields'][1]['properties'].code != newClassificationCode['properties'].code) {
          for (let i = 0; i < categories.length; i++) {
            await this.neo4jService.deleteRelationByIdAndRelationNameWithoutFilters(
              result.id,
              categories[i]['_fields'][1].identity.low,
              RelationName.CLASSIFIED_BY,
              RelationDirection.RIGHT,
            );
          }
          for (let i = 0; i < newCategories.length; i++) {
            await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
              result.id,
              { isDeleted: false },
              newCategories[i]['_fields'][1].identity.low,
              { isDeleted: false },
              RelationName.CLASSIFIED_BY,
              RelationDirection.RIGHT,
            );
          }
        }
      } else {
        for (let i = 0; i < newCategories.length; i++) {
          await this.neo4jService.addRelationByIdAndRelationNameWithFilters(
            result.id,
            { isDeleted: false },
            newCategories[i]['_fields'][1].identity.low,
            { isDeleted: false },
            RelationName.CLASSIFIED_BY,
            RelationDirection.RIGHT,
          );
        }
      }
      return result;
    } catch (error) {
      const code = error.response?.code;
      if (code >= 1000 && code <= 1999) {
        if (error.response?.code == CustomIfmCommonError.EXAMPLE1) {
        }
      } else if (code >= 5000 && code <= 5999) {
      } else if (code >= 9000 && code <= 9999) {
      } else {
        throw new HttpException('', 500);
      }
    }
  }

  async delete(_id: string, header) {
    try {
      const {} = header;
      const createdByChilds = await this.neo4jService.findChildrensByChildIdAndFilters(
        [],
        { isDeleted: false },
        +_id,
        { isDeleted: false },
        RelationName.CREATED_BY,
      );
      if (createdByChilds && createdByChilds.length > 0) {
        throw new HttpException(
          has_children_error({ email: createdByChilds[0]['_fields'][0]['properties'].email }),
          400,
        );
      } else {
        let deletedNode;
        // eslint-disable-next-line prefer-const
        deletedNode = await this.neo4jService.updateByIdAndFilter(+_id, { isDeleted: false }, [], { isDeleted: true });
        return deletedNode;
      }
    } catch (error) {
      const code = error.response?.code;
      if (code >= 1000 && code <= 1999) {
        if (error.response?.code == CustomIfmCommonError.EXAMPLE1) {
        }
      } else if (code >= 5000 && code <= 5999) {
        if (error.response?.code == CustomNeo4jError.NOT_FOUND) {
          throw new ContactNotFoundException(_id);
        }
      } else if (code >= 9000 && code <= 9999) {
        if (error.response?.code == CustomTreeError.HAS_CHILDREN) {
          console.log(error.response?.email);
          throw new ContactHasChildrenException(error.response?.params['email']);
        }
      } else {
        throw new HttpException('', 500);
      }
    }
  }

  //REVISED FOR NEW NEO4J
  async findOneNodeByKey(key: string, header) {
    try {
      const { language } = header;
      const node = await this.neo4jService.findByLabelAndFilters([], { isDeleted: false, key: key }, []);
      if (!node || node.length == 0) {
        throw new HttpException(node_not_found({ email: 'string' }), 404);
      }

      // get createdby person key and set it to return object
      const createdBy = await this.neo4jService.findChildrensByIdOneLevel(
        node[0]['_fields'][0]['identity'].low,
        { isDeleted: false },
        [],
        { isDeleted: false },
        RelationName.CREATED_BY,
      );

      if (createdBy && createdBy.length > 0) {
        node[0]['_fields'][0]['properties'].createdByKey = createdBy[0]['_fields'][1]['properties'].key;
      }

      // get classification  key and set it to return object
      const classification = await this.neo4jService.findChildrensByIdOneLevel(
        node[0]['_fields'][0]['identity'].low,
        { isDeleted: false },
        ['OmniClass34'],
        { isDeleted: false, language: language },
        RelationName.CLASSIFIED_BY,
      );

      if (classification && classification.length > 0) {
        node[0]['_fields'][0]['properties']['classificationKey'] = classification[0]['_fields'][1]['properties'].key;
      }
      const result = {
        id: node[0]['_fields'][0]['identity'].low,
        labels: node[0]['_fields'][0]['labels'],
        properties: node[0]['_fields'][0]['properties'],
      };
      return result;
    } catch (error) {
      const code = error.response?.code;
      if (code >= 1000 && code <= 1999) {
        if (error.response?.code == CustomIfmCommonError.EXAMPLE1) {
        }
      } else if (code >= 5000 && code <= 5999) {
      } else if (code >= 9000 && code <= 9999) {
        if (error.response?.code == CustomTreeError.NODE_NOT_FOUND) {
          throw new ContactNotFoundException(error.response?.params['email']);
        }
      } else {
        throw new HttpException('', 500);
      }
    }
  }
}
