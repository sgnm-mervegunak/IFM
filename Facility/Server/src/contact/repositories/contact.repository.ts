import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

//import { CustomNeo4jError, Neo4jService } from 'sgnm-neo4j';
import { assignDtoPropToEntity, createDynamicCyperObject, Neo4jService } from 'src/sgnm-neo4j/src';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { has_children_error } from 'src/common/const/custom.error.object';
import { CustomTreeError } from 'src/common/const/custom.error.enum';
import { Contact } from '../entities/contact.entity';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { ContactNotFoundException } from 'src/common/notFoundExceptions/not.found.exception';

@Injectable()
export class ContactRepository implements GeciciInterface<Contact> {
  constructor(private readonly neo4jService: Neo4jService) {}

  async findOneByRealm(label: string, realm: string) {
    let node = await this.neo4jService.findByRealmWithTreeStructure(label, realm);
    if (!node) {
      throw new ContactNotFoundException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    return node;
  }
  async create(createContactDto: CreateContactDto) {
    const contact = new Contact();
    const contactObject = assignDtoPropToEntity(contact, createContactDto);
    delete contactObject['parentId'];
    delete contactObject['createdById'];
    delete contactObject['classificationId'];
    let value;
    if (contactObject['labels']) {
      value = await this.neo4jService.createNode(contactObject, contactObject['labels']);
    } else {
      value = await this.neo4jService.createNode(contactObject);
    }
    value['properties']['id'] = value['identity'].low;
    const result = { id: value['identity'].low, labels: value['labels'], properties: value['properties'] };
    if (createContactDto['parentId']) {
      await this.neo4jService.addRelations(result['id'], createContactDto['parentId']);
    }
    if (createContactDto['createdById']) {
      await this.neo4jService.addRelationWithRelationName(result['id'], createContactDto['createdById'],"CREATED_BY");
    }
    if (createContactDto['classificationId']) {
      await this.neo4jService.addRelationWithRelationName(createContactDto['classificationId'],result['id'], "CLASSIFICATION_OF");
    }
    return result;
  }

  async update(_id: string, updateContactDto: UpdateContactDto) {
    const updateContactDtoWithoutLabelsAndParentId = {};
    Object.keys(updateContactDto).forEach((element) => {
      if (element != 'labels' && element != 'parentId') {
        updateContactDtoWithoutLabelsAndParentId[element] = updateContactDto[element];
      }
    });
    const dynamicObject = createDynamicCyperObject(updateContactDtoWithoutLabelsAndParentId);
    const updatedNode = await this.neo4jService.updateById(_id, dynamicObject);

    if (!updatedNode) {
      throw new ContactNotFoundException(_id);
    }
    const result = {
      id: updatedNode['identity'].low,
      labels: updatedNode['labels'],
      properties: updatedNode['properties'],
    };
    if (updateContactDto['labels'] && updateContactDto['labels'].length > 0) {
      await this.neo4jService.removeLabel(_id, result['labels']);
      await this.neo4jService.updateLabel(_id, updateContactDto['labels']);
    }
    return result;
  }

  async delete(_id: string) {
    try {
      let deletedNode;

      const hasChildren = await this.neo4jService.findChildrenById(_id);
      if (hasChildren['records'].length == 0) {
        deletedNode = await this.neo4jService.delete(_id); 
      } else {
        throw new HttpException(has_children_error, 400);
      }
      return deletedNode;
    } catch (error) {
      if (error.response?.code == CustomTreeError.HAS_CHILDREN) {
        throw new HttpException(has_children_error, 400);
      }
      else {
        throw new HttpException(error.response?.message, error.response?.code);
      }
    }
  }

  async changeNodeBranch(_id: string, _target_parent_id: string) {
    try {
      await this.neo4jService.deleteRelations(_id);
      await this.neo4jService.addRelations(_id, _target_parent_id);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteRelations(_id: string) {
    await this.neo4jService.deleteRelations(_id);
  }

  async addRelations(_id: string, _target_parent_id: string) {
    try {
      await this.neo4jService.addRelations(_id, _target_parent_id);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOneNodeByKey(key: string) {
    try {
      const node = await this.neo4jService.findOneNodeByKey(key);
      if (!node) {
        throw new ContactNotFoundException(key);
      }
      const result = { id: node['identity'].low, labels: node['labels'], properties: node['properties'] };
      return result;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}