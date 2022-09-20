/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpException, Injectable } from '@nestjs/common';
import { NestKafkaService } from 'ifmcommon';
import { assignDtoPropToEntity, Neo4jService } from 'sgnm-neo4j/dist';
const exceljs = require('exceljs');
import { generateUuid } from 'src/common/baseobject/base.virtual.node.object';
import { CreateOrganizationDto } from './dtos/create.organization.dto';
import { Facility } from './entities/facility.entity';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
@Injectable()
export class OrganizationRepository {
  constructor(private readonly neo4jService: Neo4jService, private readonly kafkaService: NestKafkaService) {}

  async create(createFacilityDto: CreateOrganizationDto) {
    try {
      const { structureInfo, organizationInfo, classificationInfo, realm } = createFacilityDto;
      const realmUniqness = await this.neo4jService.findByLabelAndFilters(['Root'], { realm });

      console.log(realmUniqness);
      if (realmUniqness.length > 0) {
        throw new HttpException('realm must bu uniqe for Root node', 400);
      }

      const facility = new Facility();
      facility.realm = realm;
      const structure = new Facility();
      structure.realm = realm;
      const classification = new Facility();
      classification.realm = realm;
      const types = new Facility();
      types.realm = realm;
      const contact = new Facility();
      contact.realm = realm;
      const config = new Facility();
      config.realm = realm;

      const typeInfo = {
        name: 'Type',
      };

      const contactInfo = {
        name: 'Contact',
      };
      const configInfo = {
        name: 'Config',
      };

      const finalOrganizationObject = assignDtoPropToEntity(facility, organizationInfo);
      const finalStructureObject = assignDtoPropToEntity(structure, structureInfo);
      const finalClassificationObject = assignDtoPropToEntity(classification, classificationInfo);
      const finalTypesObject = assignDtoPropToEntity(types, typeInfo);
      const finalContactObject = assignDtoPropToEntity(contact, contactInfo);
      const finalConfigObject = assignDtoPropToEntity(config, configInfo);

      //create  node with multi or single label
      const organizationNode = await this.neo4jService.createNode(finalOrganizationObject, [Neo4jLabelEnum.ROOT]);
      const structureNode = await this.neo4jService.createNode(finalStructureObject, [
        Neo4jLabelEnum.FACILITY_STRUCTURE,
      ]);
      const classificationNode = await this.neo4jService.createNode(finalClassificationObject, [
        Neo4jLabelEnum.CLASSIFICATION,
      ]);
      const typeNode = await this.neo4jService.createNode(finalTypesObject, [Neo4jLabelEnum.TYPES]);
      const contactNode = await this.neo4jService.createNode(finalContactObject, [Neo4jLabelEnum.CONTACT]);
      const configNode = await this.neo4jService.createNode(finalConfigObject, [Neo4jLabelEnum.SYSTEM_CONFIG]);

      await this.neo4jService.addRelations(structureNode.identity.low, organizationNode.identity.low);
      await this.neo4jService.addRelations(classificationNode.identity.low, organizationNode.identity.low);
      await this.neo4jService.addRelations(typeNode.identity.low, organizationNode.identity.low);
      await this.neo4jService.addRelations(contactNode.identity.low, organizationNode.identity.low);
      await this.neo4jService.addRelations(configNode.identity.low, organizationNode.identity.low);

      //const infraFirstLevelChildren = await this.getFirstLvlChildren('Infra', 'Signum');

      const infraFirstLevelChildren = await this.neo4jService.findChildrensByLabelsOneLevel(
        ['Infra'],
        { realm: 'Signum' },
        [],
        {},
      );

      infraFirstLevelChildren.map(async (node) => {
        //from lvl 1 to lvl 2 which nodes are replicable
        const replicableNodes = await this.neo4jService.findChildrensByIdOneLevel(
          node.get('children').identity.low,
          {},
          [],
          { canCopied: true, isRoot: true },
          'PARENT_OF',
        );

        //target realm node(Classification,Types)
        const targetRealmNode = await this.neo4jService.findByLabelAndFilters(node.get('children').labels, { realm });

        replicableNodes.map(async (replicableNode) => {
          replicableNode.get('children').properties.realm = realm;
          const key = generateUuid();
          replicableNode.get('children').properties.key = key;
          const createdNodes = await this.neo4jService.createNode(
            replicableNode.get('children').properties,
            replicableNode.get('children').labels,
          );
          await this.neo4jService.addRelations(createdNodes.identity.low, targetRealmNode[0].get('n').identity.low);
          const root = await this.neo4jService.findByLabelAndFilters(replicableNode.get('children').labels, {
            realm: 'Signum',
          });
          const targetRoot = await this.neo4jService.findByLabelAndFilters(replicableNode.get('children').labels, {
            realm,
          });

          await this.neo4jService.copySubGrapFromOneNodeToAnotherById(
            root[0].get('n').identity.low,
            targetRoot[0].get('n').identity.low,
            'PARENT_OF',
          );

          const replicableNodesChilds = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
            createdNodes.labels,
            { realm },
            [],
            {},
            'PARENT_OF',
          );
          if (replicableNodesChilds.length) {
            replicableNodesChilds.map(async (node) => {
              const key = generateUuid();
              await this.neo4jService.updateByIdAndFilter(node.get('children').identity.low, {}, [], { key });
            });
          }
        });
      });

      await this.kafkaService.producerSendMessage('createFacility', JSON.stringify(organizationNode.properties));

      return organizationNode;
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }
}
