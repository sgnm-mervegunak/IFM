import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

//import { CustomNeo4jError, Neo4jService } from 'sgnm-neo4j';
import { GeciciInterface } from 'src/common/interface/gecici.interface';
import { CustomTreeError } from 'src/common/const/custom.error.enum';
import { Contact } from '../entities/contact.entity';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { ContactNotFoundException } from 'src/common/notFoundExceptions/not.found.exception';
import { assignDtoPropToEntity, createDynamicCyperObject, Neo4jService } from 'sgnm-neo4j/dist';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
import { has_children_error } from 'src/common/const/custom.error.object';

@Injectable()
export class ContactRepository implements GeciciInterface<Contact> {
  constructor(private readonly neo4jService: Neo4jService) {}

  async findOneByRealm(label: string, realm: string, language: string) {
    let node = await this.neo4jService.findByRealmWithTreeStructure(label, realm);
    if (!node) {
      throw new ContactNotFoundException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    return node;
  }
  async create(createContactDto: CreateContactDto, realm: string, language: string) {
    const contact = new Contact();
    const contactObject = assignDtoPropToEntity(contact, createContactDto);
    delete contactObject['createdById'];
    delete contactObject['classificationId'];

    let value;
    if (createContactDto['labels']) {
      value = await this.neo4jService.createNode(contactObject, createContactDto['labels']);
    } else {
      value = await this.neo4jService.createNode(contactObject);
    }
    value['properties']['id'] = value['identity'].low;
    const result = { id: value['identity'].low, labels: value['labels'], properties: value['properties'] };
    if (createContactDto['parentId']) {
      await this.neo4jService.addRelations(result['id'], createContactDto['parentId']);
    }
    if (createContactDto['createdById']) {
      await this.neo4jService.addRelationWithRelationName(result['id'], createContactDto['createdById'], 'CREATED_BY');
    }
    if (createContactDto['classificationId']) {
      await this.neo4jService.addRelationWithRelationName(
        createContactDto['classificationId'],
        result['id'],
        'CLASSIFICATION_OF',
      );
    }
    return result;
  }

  async update(_id: string, updateContactDto: UpdateContactDto, realm: string, language: string) {
    const updateContactDtoWithoutLabelsAndParentId = {};
    Object.keys(updateContactDto).forEach((element) => {
      if (element != 'labels' && element != 'parentId' && element != 'createdById' && element != 'classificationId') {
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
    if (updateContactDto['createdById']) {
      const result = await this.neo4jService.findNodeAndRelationByRelationNameAndId(_id, 'CREATED_BY', RelationDirection.RIGHT);
      //if there is a "CREATED_BY" relation
      if (result['records'][0] && result['records'][0]['_fields'] && result['records'][0]['_fields'].length > 0) {
        if (result['records'][0]['_fields'][0]['identity'].low != updateContactDto['createdById']) {
          await this.neo4jService.deleteRelationByRelationId(result['records'][0]['_fields'][1]['identity'].low);
          await this.neo4jService.addRelationWithRelationName(_id, updateContactDto['createdById'], 'CREATED_BY');
        }
      }
      //if there is not "CREATED_BY" relation
      else {
        await this.neo4jService.addRelationWithRelationName(_id, updateContactDto['createdById'], 'CREATED_BY');
      }
    }
    if (updateContactDto['classificationId']) {
      const result = await this.neo4jService.findNodeAndRelationByRelationNameAndId(_id, 'CLASSIFICATION_OF', RelationDirection.LEFT);
      //if there is a "CLASSIFICATION_OF" relation
      if (result['records'][0] && result['records'][0]['_fields'] && result['records'][0]['_fields'].length > 0) {
        if (result['records'][0]['_fields'][0]['identity'].low != updateContactDto['classificationId']) {
          await this.neo4jService.deleteRelationByRelationId(result['records'][0]['_fields'][1]['identity'].low);
          await this.neo4jService.addRelationWithRelationName(
            updateContactDto['classificationId'],
            _id,
            'CLASSIFICATION_OF',
          );
        }
      }
      //if there is not "CLASSIFICATION_OF" relation
      else {
        await this.neo4jService.addRelationWithRelationName(
          updateContactDto['classificationId'],
          _id,
          'CLASSIFICATION_OF',
        );
      }
    }
    return result;
  }

  async delete(_id: string, realm: string, language: string) {
    try {
      let deletedNode;

      const hasChildren = await this.neo4jService.findChildrenById(_id);
      if (hasChildren['records'].length == 0) {
        deletedNode = await this.neo4jService.delete(_id);
      } else {
        throw new HttpException(has_children_error({}), 400);
      }
      return deletedNode;
    } catch (error) {
      if (error.response?.code == CustomTreeError.HAS_CHILDREN) {
        throw new HttpException(has_children_error({}), 400);
      } else {
        throw new HttpException(error.response?.message, error.response?.code);
      }
    }
  }

  async changeNodeBranch(_id: string, _target_parent_id: string, realm: string, language: string) {
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

  async findOneNodeByKey(key: string, realm: string, language: string) {
    try {
      const node = await this.neo4jService.findOneNodeByKey(key);
      if (!node) {
        throw new ContactNotFoundException(key);
      }
      const createdBy = await this.neo4jService.findNodeAndRelationByRelationNameAndId(
        node.id,
        'CREATED_BY',
        RelationDirection.RIGHT,
      );
      const classification = await this.neo4jService.findNodeAndRelationByRelationNameAndId(
        node.id,
        'CLASSIFICATION_OF',
        RelationDirection.LEFT,
      );
      if (
        createdBy['records'][0] &&
        createdBy['records'][0]['_fields'] &&
        createdBy['records'][0]['_fields'].length > 0
      ) {
        node.properties['createdByKey'] = createdBy['records'][0]['_fields'][0]['properties'].key;
      }
      if (
        classification['records'][0] &&
        classification['records'][0]['_fields'] &&
        classification['records'][0]['_fields'].length > 0
      ) {
        node.properties['classificationKey'] = classification['records'][0]['_fields'][0]['properties'].key;
      }
      const result = { id: node.id, labels: node.labels, properties: node.properties };
      return result;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async findOneFirstLevelByRealm(label: string, realm: string, language: string) {
    return null;
  }

  async findChildrenByFacilityTypeNode(language: string,realm: string, typename:string){
      return null;
    }
}
