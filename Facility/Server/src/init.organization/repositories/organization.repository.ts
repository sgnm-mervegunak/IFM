/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from '../dtos/create.organization.dto';
import { UpdateOrganizationDto } from '../dtos/update.organization.dto';
import { BaseInterfaceRepository } from 'src/common/interface/base.facility.interface';
import { Facility } from '../entities/facility.entity';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { FacilityNotFountException } from 'src/common/notFoundExceptions/not.found.exception';
import { NestKafkaService } from 'ifmcommon';
import {
  Neo4jService,
  assignDtoPropToEntity,
  Transaction,
  dynamicFilterPropertiesAdder,
  dynamicLabelAdder,
  filterArrayForEmptyString,
  find_with_children_by_realm_as_tree_error,
  find_with_children_by_realm_as_tree__find_by_realm_error,
  invalid_direction_error,
  required_fields_must_entered,
} from 'sgnm-neo4j/dist';
import { generateUuid } from 'src/common/baseobject/base.virtual.node.object';
import { OrganizationInterface } from 'src/common/interface/organization.interface';
import { RelationDirection } from 'sgnm-neo4j/dist/constant/relation.direction.enum';
const exceljs = require('exceljs');
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class OrganizationRepository implements OrganizationInterface<Facility> {
  constructor(private readonly neo4jService: Neo4jService, private readonly kafkaService: NestKafkaService) {}

  async findOneByRealm(realm: string): Promise<any> {
    const neo4Transaction = await this.neo4jService.beginTransaction();
    const constraintArr = [
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:Infra) ASSERT  (node.realm) IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:Root) ASSERT  (node.realm) IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:Classification) ASSERT  (node.realm) IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:FacilityStructure) ASSERT (node.realm) IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:FacilityStructure) ASSERT (node.key) IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:FacilityDocTypes) ASSERT (node.realm) IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:FacilityDocTypes) ASSERT (node.key) IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:FacilityTypes) ASSERT (node.realm) IS UNIQUE',
    ];

    constraintArr.forEach((element) => {
      neo4Transaction
        .run(element)
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);

          neo4Transaction.rollback();
        });
    });
    neo4Transaction.commit();
    neo4Transaction.close();

    /* without transaction
    arr.forEach(async (element) => {
      await this.neo4jService
        .write(element)
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    });
    */
    return 'constraints succesfully created';
  }

  async findOneByRealmAndLabel(label: string, realm: string) {
    function uuidReturn() {
      return uuidv4();
    }
    const realmUniqness = await this.neo4jService.findByLabelAndFilters(['Infra'], { realm: 'Signum' });

    if (realmUniqness.length > 0) {
      throw new HttpException('realm must bu uniqe for Root node', 400);
    }

    //create  node with multi or single label
    const infraNode = await this.neo4jService.createNode(
      { canDelete: false, isDeleted: false, name: 'Infra', realm: 'Signum' },
      ['Infra'],
    );
    const classificationNode = await this.neo4jService.createNode(
      { canDelete: false, isDeleted: false, name: 'Classification', realm: 'Signum' },
      ['Classification'],
    );
    const typeNode = await this.neo4jService.createNode(
      { canDelete: false, isDeleted: false, name: 'Types', realm: 'Signum' },
      ['Types'],
    );
    const configNode = await this.neo4jService.createNode(
      { canDelete: false, isDeleted: false, name: 'System Config', realm: 'Signum' },
      ['System_Config'],
    );

    await this.neo4jService.addRelations(classificationNode.identity.low, infraNode.identity.low);
    await this.neo4jService.addRelations(typeNode.identity.low, infraNode.identity.low);
    await this.neo4jService.addRelations(configNode.identity.low, infraNode.identity.low);

    const spaceConfigNode = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        nodesCanDelete: false,
        name: 'JointSpaceConfig',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
      },
      ['JointSpace_Config'],
    );

    const zoneConfigNode = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        nodesCanDelete: true,
        name: 'ZoneConfig',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
      },
      ['Zone_Config'],
    );

    const languageConfigNode = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        nodesCanDelete: true,
        name: 'LanguageConfig',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
      },
      ['Language_Config'],
    );
    await this.neo4jService.addRelations(spaceConfigNode.identity.low, configNode.identity.low);
    await this.neo4jService.addRelations(zoneConfigNode.identity.low, configNode.identity.low);
    await this.neo4jService.addRelations(languageConfigNode.identity.low, configNode.identity.low);

    const languageTRNode = await this.neo4jService.createNode(
      {
        canDelete: true,
        isDeleted: false,
        name: 'tr',
        realm: 'Signum',
        isActive: true,
      },
      [],
    );
    const languageENNode = await this.neo4jService.createNode(
      {
        canDelete: true,
        isDeleted: false,
        name: 'en',
        realm: 'Signum',
        isActive: true,
      },
      [],
    );
    await this.neo4jService.addRelations(languageTRNode.identity.low, languageConfigNode.identity.low);
    await this.neo4jService.addRelations(languageENNode.identity.low, languageConfigNode.identity.low);

    const facilityStatusNode = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'FacilityStatus',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
        language: 'en',
      },
      ['FacilityStatus_en'],
    );
    const facilityStatusNodeTR = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'FacilityStatus',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
        language: 'tr',
      },
      ['FacilityStatus_tr'],
    );
    const FacilityDocTypesNode = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'FacilityDocTypes',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
        language: 'en',
      },
      ['FacilityDocTypes_en'],
    );
    const FacilityDocTypesNodeTR = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'FacilityDocTypes',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
        language: 'tr',
      },
      ['FacilityDocTypes_tr'],
    );
    const FacilityZoneTypesNode = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'FacilityZoneTypes',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
        language: 'en',
      },
      ['FacilityZoneTypes_en'],
    );
    const FacilityZoneTypesNodeTR = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'FacilityZoneTypes',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
        language: 'tr',
      },
      ['FacilityZoneTypes_tr'],
    );
    const FacilityFloorTypesNode = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'FacilityFloorTypes',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
        language: 'en',
      },
      ['FacilityFloorTypes_en'],
    );
    const FacilityFloorTypesNodeTR = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'FacilityFloorTypes',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
        language: 'tr',
      },
      ['FacilityFloorTypes_tr'],
    );
    await this.neo4jService.addRelations(facilityStatusNode.identity.low, classificationNode.identity.low);
    await this.neo4jService.addRelations(FacilityDocTypesNode.identity.low, classificationNode.identity.low);
    await this.neo4jService.addRelations(FacilityZoneTypesNode.identity.low, classificationNode.identity.low);
    await this.neo4jService.addRelations(FacilityFloorTypesNode.identity.low, classificationNode.identity.low);

    await this.neo4jService.addRelations(facilityStatusNodeTR.identity.low, classificationNode.identity.low);
    await this.neo4jService.addRelations(FacilityDocTypesNodeTR.identity.low, classificationNode.identity.low);
    await this.neo4jService.addRelations(FacilityZoneTypesNodeTR.identity.low, classificationNode.identity.low);
    await this.neo4jService.addRelations(FacilityFloorTypesNodeTR.identity.low, classificationNode.identity.low);

    const facilityTypesNode = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'FacilityTypes',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
        language: 'en',
      },
      ['FacilityTypes_en'],
    );

    const facilityTypesNodeTR = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'FacilityTypes',
        realm: 'Signum',
        isRoot: true,
        canCopied: true,
        isActive: true,
        language: 'tr',
      },
      ['FacilityTypes_tr'],
    );

    await this.neo4jService.addRelations(facilityTypesNode.identity.low, typeNode.identity.low);
    await this.neo4jService.addRelations(facilityTypesNodeTR.identity.low, typeNode.identity.low);

    const facilityDocTypeNode1 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Situation plan',
        code: 'FacilityDocType1',
        isActive: true,
        language: 'en',
      },
      ['FacilityDocTypes'],
    );
    const facilityDocTypeNode1TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Durum planı',
        code: 'FacilityDocType1',
        isActive: true,
        language: 'tr',
      },
      ['FacilityDocTypes'],
    );
    const facilityDocTypeNode2 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Architectural drawings',
        code: 'FacilityDocType2',
        isActive: true,
        language: 'en',
      },
      ['FacilityDocTypes'],
    );
    const facilityDocTypeNode2TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Mimari çizimler',
        code: 'FacilityDocType2',
        isActive: true,
        language: 'tr',
      },
      ['FacilityDocTypes'],
    );
    const facilityDocTypeNode3 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Other documents',
        code: 'FacilityDocType3',
        isActive: true,
        language: 'en',
      },
      ['FacilityDocTypes'],
    );
    const facilityDocTypeNode3TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Diğer dokümanlar',
        code: 'FacilityDocType3',
        isActive: true,
        language: 'tr',
      },
      ['FacilityDocTypes'],
    );
    await this.neo4jService.addRelations(facilityDocTypeNode1.identity.low, FacilityDocTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityDocTypeNode2.identity.low, FacilityDocTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityDocTypeNode3.identity.low, FacilityDocTypesNode.identity.low);

    await this.neo4jService.addRelations(facilityDocTypeNode1TR.identity.low, FacilityDocTypesNodeTR.identity.low);
    await this.neo4jService.addRelations(facilityDocTypeNode2TR.identity.low, FacilityDocTypesNodeTR.identity.low);
    await this.neo4jService.addRelations(facilityDocTypeNode3TR.identity.low, FacilityDocTypesNodeTR.identity.low);

    const facilityZoneTypeNode1 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Circulation Zone',
        code: 'FacilityzoneType1',
        isActive: true,
        language: 'en',
      },
      ['FacilityZoneTypes'],
    );
    const facilityZoneTypeNode2 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Lighting Zone',
        code: 'FacilityzoneType2',
        isActive: true,
        language: 'en',
      },
      ['FacilityZoneTypes'],
    );
    const facilityZoneTypeNode3 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Fire Alarm Zone',
        code: 'FacilityzoneType3',
        isActive: true,
        language: 'en',
      },
      ['FacilityZoneTypes'],
    );
    const facilityZoneTypeNode4 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Historical Preservation Zone',
        code: 'FacilityzoneType4',
        isActive: true,
        language: 'en',
      },
      ['FacilityZoneTypes'],
    );
    const facilityZoneTypeNode5 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Occupancy Zone',
        code: 'FacilityzoneType5',
        isActive: true,
        language: 'en',
      },
      ['FacilityZoneTypes'],
    );
    const facilityZoneTypeNode6 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Ventilation Zone',
        code: 'FacilityzoneType6',
        isActive: true,
        language: 'en',
      },
      ['FacilityZoneTypes'],
    );

    const facilityZoneTypeNode1TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Dolaşım Bölgesi',
        code: 'FacilityzoneType1',
        isActive: true,
        language: 'tr',
      },
      ['FacilityZoneTypes'],
    );
    const facilityZoneTypeNode2TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Aydınlatma Bölgesi',
        code: 'FacilityzoneType2',
        isActive: true,
        language: 'tr',
      },
      ['FacilityZoneTypes'],
    );
    const facilityZoneTypeNode3TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Yangın Alarm Bölgesi',
        code: 'FacilityzoneType3',
        isActive: true,
        language: 'tr',
      },
      ['FacilityZoneTypes'],
    );
    const facilityZoneTypeNode4TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Historical Preservation Zone',
        code: 'FacilityzoneType4',
        isActive: true,
        language: 'tr',
      },
      ['FacilityZoneTypes'],
    );
    const facilityZoneTypeNode5TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Doluluk Bölgesi',
        code: 'FacilityzoneType5',
        isActive: true,
        language: 'tr',
      },
      ['FacilityZoneTypes'],
    );
    const facilityZoneTypeNode6TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Havalandırma Bölgesi',
        code: 'FacilityzoneType6',
        isActive: true,
        language: 'tr',
      },
      ['FacilityZoneTypes'],
    );
    await this.neo4jService.addRelations(facilityZoneTypeNode1.identity.low, FacilityZoneTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityZoneTypeNode2.identity.low, FacilityZoneTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityZoneTypeNode3.identity.low, FacilityZoneTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityZoneTypeNode4.identity.low, FacilityZoneTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityZoneTypeNode5.identity.low, FacilityZoneTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityZoneTypeNode6.identity.low, FacilityZoneTypesNode.identity.low);

    await this.neo4jService.addRelations(facilityZoneTypeNode1TR.identity.low, FacilityZoneTypesNodeTR.identity.low);
    await this.neo4jService.addRelations(facilityZoneTypeNode2TR.identity.low, FacilityZoneTypesNodeTR.identity.low);
    await this.neo4jService.addRelations(facilityZoneTypeNode3TR.identity.low, FacilityZoneTypesNodeTR.identity.low);
    await this.neo4jService.addRelations(facilityZoneTypeNode4TR.identity.low, FacilityZoneTypesNodeTR.identity.low);
    await this.neo4jService.addRelations(facilityZoneTypeNode5TR.identity.low, FacilityZoneTypesNodeTR.identity.low);
    await this.neo4jService.addRelations(facilityZoneTypeNode6TR.identity.low, FacilityZoneTypesNodeTR.identity.low);

    const facilityFloorTypeNode1 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Site',
        code: 'FacilityFloorType1',
        isActive: true,
        language: 'en',
      },
      ['FacilityFloorTypes'],
    );
    const facilityFloorTypeNode2 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Floor',
        code: 'FacilityFloorType2',
        isActive: true,
        language: 'en',
      },
      ['FacilityFloorTypes'],
    );
    const facilityFloorTypeNode3 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Roof',
        code: 'FacilityFloorType3',
        isActive: true,
        language: 'en',
      },
      ['FacilityFloorTypes'],
    );

    const facilityFloorTypeNode1TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Alan',
        code: 'FacilityFloorType1',
        isActive: true,
        language: 'tr',
      },
      ['FacilityFloorTypes'],
    );
    const facilityFloorTypeNode2TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Kat',
        code: 'FacilityFloorType2',
        isActive: true,
        language: 'tr',
      },
      ['FacilityFloorTypes'],
    );
    const facilityFloorTypeNode3TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Çatı',
        code: 'FacilityFloorType3',
        isActive: true,
        language: 'tr',
      },
      ['FacilityFloorTypes'],
    );

    await this.neo4jService.addRelations(facilityFloorTypeNode1.identity.low, FacilityFloorTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityFloorTypeNode2.identity.low, FacilityFloorTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityFloorTypeNode3.identity.low, FacilityFloorTypesNode.identity.low);

    await this.neo4jService.addRelations(facilityFloorTypeNode1TR.identity.low, FacilityFloorTypesNodeTR.identity.low);
    await this.neo4jService.addRelations(facilityFloorTypeNode2TR.identity.low, FacilityFloorTypesNodeTR.identity.low);
    await this.neo4jService.addRelations(facilityFloorTypeNode3TR.identity.low, FacilityFloorTypesNodeTR.identity.low);

    const facilityStatusNode1 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'In used',
        code: 'FacilityStatus1',
        isActive: true,
        language: 'en',
      },
      ['FacilityStatus'],
    );
    const facilityStatusNode2 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'out of use',
        code: 'FacilityStatus2',
        isActive: true,
        language: 'en',
      },
      ['FacilityStatus'],
    );

    const facilityStatusNode3 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'rented',
        code: 'FacilityStatus3',
        isActive: true,
        language: 'en',
      },
      ['FacilityStatus'],
    );
    const facilityStatusNode4 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'sold',
        code: 'FacilityStatus4',
        isActive: true,
        language: 'en',
      },
      ['FacilityStatus'],
    );

    const facilityStatusNode1TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Kullanımda',
        code: 'FacilityStatus1',
        isActive: true,
        language: 'tr',
      },
      ['FacilityStatus'],
    );
    const facilityStatusNode2TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Kullanım dışı',
        code: 'FacilityStatus2',
        isActive: true,
        language: 'tr',
      },
      ['FacilityStatus'],
    );

    const facilityStatusNode3TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Kiralık',
        code: 'FacilityStatus3',
        isActive: true,
        language: 'tr',
      },
      ['FacilityStatus'],
    );
    const facilityStatusNode4TR = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        name: 'Satıldı',
        code: 'FacilityStatus4',
        isActive: true,
        language: 'tr',
      },
      ['FacilityStatus'],
    );
    await this.neo4jService.addRelations(facilityStatusNode1.identity.low, facilityStatusNode.identity.low);
    await this.neo4jService.addRelations(facilityStatusNode2.identity.low, facilityStatusNode.identity.low);
    await this.neo4jService.addRelations(facilityStatusNode3.identity.low, facilityStatusNode.identity.low);
    await this.neo4jService.addRelations(facilityStatusNode4.identity.low, facilityStatusNode.identity.low);

    await this.neo4jService.addRelations(facilityStatusNode1TR.identity.low, facilityStatusNodeTR.identity.low);
    await this.neo4jService.addRelations(facilityStatusNode2TR.identity.low, facilityStatusNodeTR.identity.low);
    await this.neo4jService.addRelations(facilityStatusNode3TR.identity.low, facilityStatusNodeTR.identity.low);
    await this.neo4jService.addRelations(facilityStatusNode4TR.identity.low, facilityStatusNodeTR.identity.low);

    const facilityTypesNode1 = await this.neo4jService.createNode(
      {
        canDelete: true,
        isDeleted: false,
        name: 'Building',
        isActive: true,
        canDisplay: true,
      },
      ['FacilityType'],
    );
    const facilityTypesNode2 = await this.neo4jService.createNode(
      {
        canDelete: true,
        isDeleted: false,
        name: 'Floor',
        isActive: true,
        canDisplay: true,
      },
      ['FacilityType'],
    );
    const facilityTypesNode3 = await this.neo4jService.createNode(
      {
        canDelete: true,
        isDeleted: false,
        name: 'Block',
        isActive: true,
        canDisplay: true,
      },
      ['FacilityType'],
    );
    const facilityTypesNode4 = await this.neo4jService.createNode(
      {
        canDelete: true,
        isDeleted: false,
        name: 'FacilityStructure',
        isActive: true,
        canDisplay: false,
      },
      ['FacilityType'],
    );
    const facilityTypesNode5 = await this.neo4jService.createNode(
      {
        canDelete: true,
        isDeleted: false,
        isBlocked: false,
        name: 'Space',
        isActive: true,
        canDisplay: true,
      },
      ['FacilityType'],
    );

    // const facilityTypesNodeTR1 = await this.neo4jService.createNode(
    //   {
    //     canDelete: true,
    //     isDeleted: false,
    //     name: 'Bina',
    //     isActive: true,
    //     canDisplay: true,
    //   },
    //   ['FacilityType'],
    // );
    // const facilityTypesNodeTR2 = await this.neo4jService.createNode(
    //   {
    //     canDelete: true,
    //     isDeleted: false,
    //     name: 'Kat',
    //     isActive: true,
    //     canDisplay: true,
    //   },
    //   ['FacilityType'],
    // );
    // const facilityTypesNodeTR3 = await this.neo4jService.createNode(
    //   {
    //     canDelete: true,
    //     isDeleted: false,
    //     name: 'Blok',
    //     isActive: true,
    //     canDisplay: true,
    //   },
    //   ['FacilityType'],
    // );
    // const facilityTypesNodeTR4 = await this.neo4jService.createNode(
    //   {
    //     canDelete: true,
    //     isDeleted: false,
    //     name: 'Tesis Yapısı',
    //     isActive: true,
    //     canDisplay: false,
    //   },
    //   ['FacilityType'],
    // );
    // const facilityTypesNodeTR5 = await this.neo4jService.createNode(
    //   {
    //     canDelete: true,
    //     isDeleted: false,
    //     isBlocked: false,
    //     name: 'Alan',
    //     isActive: true,
    //     canDisplay: true,
    //   },
    //   ['FacilityType'],
    // );
    await this.neo4jService.addRelations(facilityTypesNode1.identity.low, facilityTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode2.identity.low, facilityTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode3.identity.low, facilityTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode4.identity.low, facilityTypesNode.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5.identity.low, facilityTypesNode.identity.low);

    // await this.neo4jService.addRelations(facilityTypesNodeTR1.identity.low, facilityTypesNodeTR.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNodeTR2.identity.low, facilityTypesNodeTR.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNodeTR3.identity.low, facilityTypesNodeTR.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNodeTR4.identity.low, facilityTypesNodeTR.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNodeTR5.identity.low, facilityTypesNodeTR.identity.low);

    const allowedForFacilityStructureBuilding = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'Building',
        isActive: true,
        canDisplay: false,
      },
      ['AllowedStructure'],
    );
    await this.neo4jService.addRelations(
      allowedForFacilityStructureBuilding.identity.low,
      facilityTypesNode4.identity.low,
    );
    // const allowedForFacilityStructureBuildingTR = await this.neo4jService.createNode(
    //   {
    //     canDelete: false,
    //     isDeleted: false,
    //     name: 'Bina',
    //     isActive: true,
    //     canDisplay: false,
    //   },
    //   ['AllowedStructure'],
    // );

    // await this.neo4jService.addRelations(
    //   allowedForFacilityStructureBuildingTR.identity.low,
    //   facilityTypesNodeTR4.identity.low,
    // );

    const allowedForBuildingStructureBlock = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'Block',
        isActive: true,
        canDisplay: false,
      },
      ['AllowedStructure'],
    );
    const allowedForBuildingStructureFloor = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'Floor',
        isActive: true,
        canDisplay: false,
      },
      ['AllowedStructure'],
    );

    // const allowedForBuildingStructureBlockTR = await this.neo4jService.createNode(
    //   {
    //     canDelete: false,
    //     isDeleted: false,
    //     name: 'Blok',
    //     isActive: true,
    //     canDisplay: false,
    //   },
    //   ['AllowedStructure'],
    // );
    // const allowedForBuildingStructureFloorTR = await this.neo4jService.createNode(
    //   {
    //     canDelete: false,
    //     isDeleted: false,
    //     name: 'KAt',
    //     isActive: true,
    //     canDisplay: false,
    //   },
    //   ['AllowedStructure'],
    // );

    await this.neo4jService.addRelations(
      allowedForBuildingStructureBlock.identity.low,
      facilityTypesNode1.identity.low,
    );
    await this.neo4jService.addRelations(
      allowedForBuildingStructureFloor.identity.low,
      facilityTypesNode1.identity.low,
    );

    // await this.neo4jService.addRelations(
    //   allowedForBuildingStructureBlockTR.identity.low,
    //   facilityTypesNodeTR1.identity.low,
    // );
    // await this.neo4jService.addRelations(
    //   allowedForBuildingStructureFloorTR.identity.low,
    //   facilityTypesNodeTR1.identity.low,
    // );

    const allowedForFloorStructureSpace = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'Space',
        isActive: true,
        canDisplay: false,
      },
      ['AllowedStructure'],
    );

    // const allowedForFloorStructureSpaceTR = await this.neo4jService.createNode(
    //   {
    //     canDelete: false,
    //     isDeleted: false,
    //     name: 'Alan',
    //     isActive: true,
    //     canDisplay: false,
    //   },
    //   ['AllowedStructure'],
    // );
    await this.neo4jService.addRelations(allowedForFloorStructureSpace.identity.low, facilityTypesNode2.identity.low);
    // await this.neo4jService.addRelations(allowedForFloorStructureSpaceTR.identity.low, facilityTypesNodeTR2.identity.low);

    const allowedForBlockStructureFloor = await this.neo4jService.createNode(
      {
        canDelete: false,
        isDeleted: false,
        name: 'Floor',
        isActive: true,
        canDisplay: false,
      },
      ['AllowedStructure'],
    );
    // const allowedForBlockStructureFloorTR = await this.neo4jService.createNode(
    //   {
    //     canDelete: false,
    //     isDeleted: false,
    //     name: 'Kat',
    //     isActive: true,
    //     canDisplay: false,
    //   },
    //   ['AllowedStructure'],
    // );
    // await this.neo4jService.addRelations(allowedForBlockStructureFloorTR.identity.low, facilityTypesNodeTR3.identity.low);
    await this.neo4jService.addRelations(allowedForBlockStructureFloor.identity.low, facilityTypesNode3.identity.low);
    //Building
    const facilityTypesNode1property1 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'name',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: ['not null'],
        options: [],
        placeHolder: 'Name',
        index: 0,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode1property2 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'category',
        type: 'treeselect',
        dataType: 'string',
        defaultValue: '',
        rules: ['not null'],
        options: [],
        placeHolder: 'Category',
        index: 1,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode1property3 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'project Name',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Project Name',
        index: 2,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode1property4 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'site Name',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Site Name',
        index: 3,
      },
      ['FacilityTypeProperty'],
    );

    //Bunlar organizasyona kaydırıldı
    // const facilityTypesNode1property5 = await this.neo4jService.createNode(
    //   {
    //     canDelete: true,
    //     canDisplay: true,
    //     isDeleted: false,
    //     isActive: true,
    //     label: 'linear Unit',
    //     type: 'text',
    //     dataType: 'string',
    //     defaultValue: '',
    //     rules: [

    //     ],
    //     options: [],
    //     placeHolder: 'Linear Unit',
    //     index: 4,
    //   },
    //   ['FacilityTypeProperty'],
    // );
    // const facilityTypesNode1property6 = await this.neo4jService.createNode(
    //   {
    //     canDelete: true,
    //     canDisplay: true,
    //     isDeleted: false,
    //     isActive: true,
    //     label: 'area Unit',
    //     type: 'text',
    //     dataType: 'string',
    //     defaultValue: '',
    //     rules: [

    //     ],
    //     options: [],
    //     placeHolder: 'Area Unit',
    //     index: 5,
    //   },
    //   ['FacilityTypeProperty'],
    // );
    // const facilityTypesNode1property7 = await this.neo4jService.createNode(
    //   {
    //     canDelete: true,
    //     canDisplay: true,
    //     isDeleted: false,
    //     isActive: true,
    //     label: 'volume Unit',
    //     type: 'text',
    //     dataType: 'string',
    //     defaultValue: '',
    //     rules: [

    //     ],
    //     options: [],
    //     placeHolder: 'Volume Unit',
    //     index: 6,
    //   },
    //   ['FacilityTypeProperty'],
    // );

    // const facilityTypesNode1property8 = await this.neo4jService.createNode(
    //   {
    //     canDelete: true,
    //     canDisplay: true,
    //     isDeleted: false,
    //     isActive: true,
    //     label: 'currency Unit',
    //     type: 'text',
    //     dataType: 'string',
    //     defaultValue: '',
    //     rules: [

    //     ],
    //     options: [],
    //     placeHolder: 'Currency Unit',
    //     index: 7,
    //   },
    //   ['FacilityTypeProperty'],
    // );
    const facilityTypesNode1property9 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'area Measurement',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Area Measurement',
        index: 8,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode1property10 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external Site Object',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External Site Object',
        index: 9,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode1property11 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external Site Identifier',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External Site Identifier',
        index: 10,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode1property12 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external Facility Object',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External Facility Object',
        index: 11,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode1property13 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external Facility Identifier',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External Facility Identifier',
        index: 12,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode1property14 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'description',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Description',
        index: 13,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode1property15 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'project Description',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Project Description',
        index: 14,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode1property16 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'site Description',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Site Description',
        index: 15,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode1property17 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'phase',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Phase',
        index: 16,
      },
      ['FacilityTypeProperty'],
    );
    /////////////////////////////////////////// Buradan aşağısı (building için) silinebilwcwk//////////////////////////////////////////////////////////////
    const facilityTypesNode1property18 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'address',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Address',
        index: 17,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode1property20 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'images',
        type: 'imageupload',
        dataType: 'file',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Images',
        index: 19,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode1property21 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'status',
        type: 'dropdown',
        dataType: 'string',
        defaultValue: '',
        rules: ['not null'],
        options: ['in use', 'out of use', 'sold', ''],
        placeHolder: 'Status',
        index: 20,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode1property22 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'owner',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Owner',
        index: 21,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode1property23 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'operator',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Operator',
        index: 22,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode1property24 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'contractor',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Contractor',
        index: 23,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode1property25 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'handover Date',
        type: 'date',
        dataType: 'date',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Handover Date',
        index: 24,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode1property26 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'operation Start Date',
        type: 'date',
        dataType: 'date',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Operation Start Date',
        index: 25,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode1property27 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'warranty Expire Date',
        type: 'date',
        dataType: 'date',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Warranty Expire Date',
        index: 26,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode1property28 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'documents',
        type: 'documentupload',
        dataType: 'file',
        defaultValue: '',
        rules: [],
        options: ['Vaziyet Planı', 'Mimari Çizim', 'Diğer'],
        placeHolder: 'Documents',
        index: 27,
      },
      ['FacilityTypeProperty'],
    );
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const facilityTypesNode1property29 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'tag',
        type: 'array',
        dataType: 'string',
        defaultValue: [],
        rules: [],
        options: [],
        placeHolder: 'Tag',
        index: 28,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode1property30 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external System',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External System',
        index: 29,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode1property31 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external Object',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External Object',
        index: 30,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode1property32 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external Identifier',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External Identifier',
        index: 31,
      },
      ['FacilityTypeProperty'],
    );

    await this.neo4jService.addRelations(facilityTypesNode1property1.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property2.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property3.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property4.identity.low, facilityTypesNode1.identity.low);
    //Bunlar organizasyona kaydırıldı
    // await this.neo4jService.addRelations(facilityTypesNode1property5.identity.low, facilityTypesNode1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property6.identity.low, facilityTypesNode1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property7.identity.low, facilityTypesNode1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property8.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property9.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property10.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property11.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property12.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property13.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property14.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property15.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property16.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property17.identity.low, facilityTypesNode1.identity.low);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    await this.neo4jService.addRelations(facilityTypesNode1property18.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property20.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property21.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property22.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property23.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property24.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property25.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property26.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property27.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property28.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property29.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property30.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property31.identity.low, facilityTypesNode1.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode1property32.identity.low, facilityTypesNode1.identity.low);

    //TR
    // await this.neo4jService.addRelations(facilityTypesNode1property1.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property2.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property3.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property4.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property9.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property10.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property11.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property12.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property13.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property14.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property15.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property16.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property17.identity.low, facilityTypesNodeTR1.identity.low);
    // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // await this.neo4jService.addRelations(facilityTypesNode1property18.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property20.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property21.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property22.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property23.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property24.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property25.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property26.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property27.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property28.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property29.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property30.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property31.identity.low, facilityTypesNodeTR1.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode1property32.identity.low, facilityTypesNodeTR1.identity.low)
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Floor
    const facilityTypesNode2property1 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'name',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: ['not null'],
        options: [],
        placeHolder: 'Name',
        index: 0,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode2property3 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'description',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Description',
        index: 2,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode2property4 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'category',
        type: 'treeselect',
        dataType: 'string',
        defaultValue: '',
        rules: ['not null'],
        options: [],
        placeHolder: 'Category',
        index: 3,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode2property5 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'elevation',
        type: 'number',
        dataType: 'number',
        defaultValue: 0,
        rules: [],
        options: [],
        placeHolder: 'Elevation',
        index: 4,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode2property6 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'height',
        type: 'number',
        dataType: 'number',
        defaultValue: 0,
        rules: [],
        options: [],
        placeHolder: 'Height',
        index: 5,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode2property7 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'tag',
        type: 'array',
        dataType: 'string',
        defaultValue: [],
        rules: [],
        options: [],
        placeHolder: 'Tag',
        index: 6,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode2property8 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external System',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External System',
        index: 7,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode2property9 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external Object',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External Object',
        index: 8,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode2property10 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external Identifier',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External Identifier',
        index: 9,
      },
      ['FacilityTypeProperty'],
    );
    await this.neo4jService.addRelations(facilityTypesNode2property1.identity.low, facilityTypesNode2.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode2property3.identity.low, facilityTypesNode2.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode2property4.identity.low, facilityTypesNode2.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode2property5.identity.low, facilityTypesNode2.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode2property6.identity.low, facilityTypesNode2.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode2property7.identity.low, facilityTypesNode2.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode2property8.identity.low, facilityTypesNode2.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode2property9.identity.low, facilityTypesNode2.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode2property10.identity.low, facilityTypesNode2.identity.low);

    //TR
    // await this.neo4jService.addRelations(facilityTypesNode2property1.identity.low, facilityTypesNodeTR2.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode2property3.identity.low, facilityTypesNodeTR2.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode2property4.identity.low, facilityTypesNodeTR2.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode2property5.identity.low, facilityTypesNodeTR2.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode2property6.identity.low, facilityTypesNodeTR2.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode2property7.identity.low, facilityTypesNodeTR2.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode2property8.identity.low, facilityTypesNodeTR2.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode2property9.identity.low, facilityTypesNodeTR2.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode2property10.identity.low, facilityTypesNodeTR2.identity.low);

    //block
    const facilityTypesNode3property1 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'name',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: ['not null'],
        options: [],
        placeHolder: 'Name',
        index: 0,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode3property2 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'tag',
        type: 'textarray',
        dataType: 'string',
        defaultValue: [],
        rules: [],
        options: [],
        placeHolder: 'Tag',
        index: 1,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode3property3 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'description',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Description',
        index: 2,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode3property4 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external System',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External System',
        index: 3,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode3property5 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external Object',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External Object',
        index: 4,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode3property6 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external Identifier',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External Identifier',
        index: 5,
      },
      ['FacilityTypeProperty'],
    );

    await this.neo4jService.addRelations(facilityTypesNode3property1.identity.low, facilityTypesNode3.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode3property2.identity.low, facilityTypesNode3.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode3property3.identity.low, facilityTypesNode3.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode3property4.identity.low, facilityTypesNode3.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode3property5.identity.low, facilityTypesNode3.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode3property6.identity.low, facilityTypesNode3.identity.low);

    // await this.neo4jService.addRelations(facilityTypesNode3property1.identity.low, facilityTypesNodeTR3.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode3property2.identity.low, facilityTypesNodeTR3.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode3property3.identity.low, facilityTypesNodeTR3.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode3property4.identity.low, facilityTypesNodeTR3.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode3property5.identity.low, facilityTypesNodeTR3.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode3property6.identity.low, facilityTypesNodeTR3.identity.low);

    //space
    const facilityTypesNode5property1 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'code',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: ['not null'],
        options: [],
        placeHolder: 'Code',
        index: 0,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property2 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'name',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: ['not null'],
        options: [],
        placeHolder: 'Name',
        index: 1,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property3 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'architectural Name',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Architectural Name',
        index: 2,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property4 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'category',
        type: 'treeselect',
        dataType: 'string',
        defaultValue: '',
        rules: ['not null'],
        options: [],
        placeHolder: 'Category',
        index: 3,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property5 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'gross Area',
        type: 'number',
        dataType: 'number',
        defaultValue: 0,
        rules: [],
        options: [],
        placeHolder: 'Gross Area',
        index: 4,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode5property6 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'net Area',
        type: 'number',
        dataType: 'number',
        defaultValue: 0,
        rules: [],
        options: [],
        placeHolder: 'Net Area',
        index: 5,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property7 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'usage',
        type: 'treeselect',
        dataType: 'string',
        defaultValue: '',
        rules: ['not null'],
        options: [],
        placeHolder: 'Usage',
        index: 6,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property8 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'tag',
        type: 'textarray',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Tag',
        index: 7,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property9 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'images',
        type: 'imageupload',
        dataType: 'file',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Images',
        index: 8,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property10 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'status',
        type: 'treeselect',
        dataType: 'string',
        defaultValue: '',
        rules: ['not null'],
        options: [],
        placeHolder: 'Status',
        index: 9,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property11 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'architectural Code',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Architectural Code',
        index: 10,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode5property12 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'description',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Description',
        index: 11,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode5property13 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'usable Height',
        type: 'number',
        dataType: 'number',
        defaultValue: 0,
        rules: [],
        options: [],
        placeHolder: 'Usable Height',
        index: 12,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property14 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external System',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External System',
        index: 13,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property15 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external Object',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External Object',
        index: 14,
      },
      ['FacilityTypeProperty'],
    );
    const facilityTypesNode5property16 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'external Identifier',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'External Identifier',
        index: 15,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property17 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'room Tag',
        type: 'textarray',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Room Tag',
        index: 16,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property18 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'operator Code',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Operator Code',
        index: 17,
      },
      ['FacilityTypeProperty'],
    );

    const facilityTypesNode5property19 = await this.neo4jService.createNode(
      {
        canDelete: true,
        canDisplay: true,
        isDeleted: false,
        isActive: true,
        label: 'operator Name',
        type: 'text',
        dataType: 'string',
        defaultValue: '',
        rules: [],
        options: [],
        placeHolder: 'Operator Name',
        index: 18,
      },
      ['FacilityTypeProperty'],
    );
    await this.neo4jService.addRelations(facilityTypesNode5property1.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property2.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property3.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property4.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property5.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property6.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property7.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property8.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property9.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property10.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property11.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property12.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property13.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property14.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property15.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property16.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property17.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property18.identity.low, facilityTypesNode5.identity.low);
    await this.neo4jService.addRelations(facilityTypesNode5property19.identity.low, facilityTypesNode5.identity.low);

    //TR
    // await this.neo4jService.addRelations(facilityTypesNode5property1.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property2.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property3.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property4.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property5.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property6.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property7.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property8.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property9.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property10.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property11.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property12.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property13.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property14.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property15.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property16.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property17.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property18.identity.low, facilityTypesNodeTR5.identity.low);
    // await this.neo4jService.addRelations(facilityTypesNode5property19.identity.low, facilityTypesNodeTR5.identity.low);

    return facilityTypesNode;
  }

  async create(createFacilityDto: CreateOrganizationDto) {
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
    const structureNode = await this.neo4jService.createNode(finalStructureObject, [Neo4jLabelEnum.FACILITY_STRUCTURE]);
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
  }
  async update(_id: string, updateFacilityDto: UpdateOrganizationDto) {
    const updatedFacility = await this.neo4jService.updateById(_id, updateFacilityDto);

    if (!updatedFacility) {
      throw FacilityNotFountException(_id);
    }
    return updatedFacility;
  }

  //FacilityInfra yı label ve realm ile bulan fonksiyon
  //match(n:FacilityInfra {realm:'Signum'} ) return n

  //FacilityInfrayı ve çocuklarını bulan fonksiyon
  //match(n:FacilityInfra {realm:'Signum'} ) match (p ) MATCH(n)-[:PARENT_OF]->(p) return p

  //neo4j id si verilen nodun kopyalanabilir ve root olan cocuklarını getiren query
  //match(n) where id(n)=106 match (p {isCopied:true,isRoot:true}) MATCH(n)-[:PARENT_OF]->(p) return p

  async findOneById(id: string): Promise<any> {
    const infraChildren = await this.neo4jService.read(`match (n:Root ) where n.id=$id return n`, { id });
    return 'facility';
  }

  //----------------------------------------This funcs will add to  neo4j Service-------------------------
  async getFirstLvlChildren(label, realm) {
    const nodes = await this.neo4jService.read(
      `match(n:${label} {realm:$realm} ) match (p ) MATCH(n)-[:PARENT_OF]->(p) return p`,
      { realm },
    );
    const nodesChildren = nodes.records.map((children) => {
      return children['_fields'][0];
    });

    return nodesChildren;
  }

  async getReplicableNodesFromFirstLvlNode(id) {
    const nodes = await this.neo4jService.read(
      `match(n) where id(n)=$id match (p {canCopied:true,isRoot:true}) MATCH(n)-[:PARENT_OF]->(p) return p`,
      { id },
    );

    const nodesChildren = nodes.records.map((children) => {
      return children['_fields'][0];
    });

    return nodesChildren;
  }

  async getNodeByLabelAndRealm(label, realm) {
    const nodes = await this.neo4jService.findByRealm(label, realm);

    const nodesChildren = nodes.records.map((children) => {
      return children['_fields'][0];
    });

    return nodesChildren;
  }

  async findByRealm(label: string, realm: string, databaseOrTransaction?: string | Transaction) {
    try {
      if (!label || !realm) {
        throw new HttpException('not found label', 400);
      }
      const cypher = `MATCH (n:${label} {isDeleted: false}) where  n.realm = $realm return n`;

      const result = await this.neo4jService.read(cypher, { realm });

      if (!result['records'].length) {
        throw new HttpException('not found in db', 404);
      }

      return result['records'][0]['_fields'][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException({ message: error.response?.message, code: error.response?.code }, error.status);
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async importClassificationFromExcel(file: Express.Multer.File, language: string) {
    let data = [];
    let columnNames: string[] = [];
    let columnsLength: number;

    let buffer = new Uint8Array(file.buffer);
    const workbook = new exceljs.Workbook();

    await workbook.xlsx.load(buffer).then(function async(book) {
      const instructionsSheet = book.getWorksheet(1);
      const realmAndValue = instructionsSheet
        .getRow(1)
        .values.splice(1)
        .map((x) => x.toLocaleLowerCase());

      // if (!realmAndValue.includes('realm') || realmAndValue.length != 2) {
      //   console.log('realm and its value are not');
      // } else {
      const sheet = book.getWorksheet(20);

      columnsLength = book.getWorksheet(20)._columns?.length; //column length of specific sheet

      for (let i = 1; i <= columnsLength; i++) {
        data.push(sheet.getColumn(i).values);
      }

      //console.log(data.length)
      // for(let a = 0; a < data.length; a++){
      //   columnNames.push(data[a][1]);
      // }

      //}
    });

    let [
      ApprovalBy,
      AreaUnit,
      AssetType,
      category_facility,
      category_space,
      category_element,
      category_product,
      category_role,
      ...others
    ] = data;

    //let firstThree = [ApprovalBy, AreaUnit, AssetType];
    let classifications = [category_facility, category_space, category_role];

    /////////// classifications ////////////////////////////////
    for (let i = 0; i < classifications.length; i++) {
      let deneme = [];

      for (let index = 2; index < classifications[i].length; index++) {
        const element = classifications[i][index].split(new RegExp(/\s{3,}|:\s/g));

        deneme.push(element);
      }
      for (let i = 0; i < deneme.length; i++) {
        deneme[i][0] = deneme[i][0].replace(/ /g, '-');
      }

      let collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

      deneme.sort(collator.compare[0]);

      ////// add digits to codes /////
      for (let index = 0; index < deneme.length; index++) {
        deneme[index][0] = deneme[index][0].replaceAll('-', '');
      }
      let long = await Math.max(...deneme.map((val) => val[0].length));

      for (let index = 0; index < deneme.length; index++) {
        if (deneme[index][0].length == 4) {
          deneme[index][0] = deneme[index][0].match(/.{2}/g);
          for (let i = 0; i < (long - 4) / 2; i++) {
            deneme[index][0].push(['00']);
          }
          deneme[index][0] = deneme[index][0].join('-');
        } else if (deneme[index][0].length == 6) {
          deneme[index][0] = deneme[index][0].match(/.{2}/g);
          for (let i = 0; i < (long - 6) / 2; i++) {
            deneme[index][0].push(['00']);
          }
          deneme[index][0] = deneme[index][0].join('-');
        } else if (deneme[index][0].length == 8) {
          deneme[index][0] = deneme[index][0].match(/.{2}/g);
          for (let i = 0; i < (long - 8) / 2; i++) {
            deneme[index][0].push(['00']);
          }
          deneme[index][0] = deneme[index][0].join('-');
        } else if (deneme[index][0].length == 10) {
          deneme[index][0] = deneme[index][0].match(/.{2}/g);
          for (let i = 0; i < (long - 10) / 2; i++) {
            deneme[index][0].push(['00']);
          }
          deneme[index][0] = deneme[index][0].join('-');
        } else if (deneme[index][0].length == 12) {
          deneme[index][0] = deneme[index][0].match(/.{2}/g);
          for (let i = 0; i < (long - 12) / 2; i++) {
            deneme[index][0].push(['00']);
          }
          deneme[index][0] = deneme[index][0].join('-');
        } else if (deneme[index][0].length == 14) {
          deneme[index][0] = deneme[index][0].match(/.{2}/g);
          for (let i = 0; i < (long - 14) / 2; i++) {
            deneme[index][0].push(['00']);
          }
          deneme[index][0] = deneme[index][0].join('-');
        } else if (deneme[index][0].length == 16) {
          deneme[index][0] = deneme[index][0].match(/.{2}/g);
          for (let i = 0; i < (long - 16) / 2; i++) {
            deneme[index][0].push(['00']);
          }
          deneme[index][0] = deneme[index][0].join('-');
        }
      }
      let classificationName2 = `OmniClass${deneme[0][0].slice(0, 2)}`;

      let newClassification = [];
      let codearray = [];

      for (let q = 0; q < deneme.length; q++) {
        let parentcode = '';
        var z = 0;
        codearray = await deneme[q][0].split('-');

        for (let j = 0; j < codearray.length; j++) {
          if (codearray[j] == '00') {
            z = z + 1;
          }
        }

        if (z == 0) {
          for (let i = 0; i < codearray.length - 1; i++) {
            if (parentcode == '') {
              parentcode = codearray[i];
            } else {
              parentcode = parentcode + '-' + codearray[i];
            }
          }
          if (codearray.length == 4) {
            parentcode = parentcode + '-' + '00';
          }
        } else {
          if (z == 1) {
            for (let i = 0; i < codearray.length - 2; i++) {
              if (parentcode == '') {
                parentcode = codearray[i];
              } else {
                parentcode = parentcode + '-' + codearray[i];
              }
            }
            parentcode = parentcode + '-' + '00-00';
          } else if (z == 2) {
            for (let i = 0; i < codearray.length - 3; i++) {
              if (parentcode == '') {
                parentcode = codearray[i];
              } else {
                parentcode = parentcode + '-' + codearray[i];
              }
            }
            parentcode = parentcode + '-' + '00-00-00';
          } else if (z == 3) {
            for (let i = 0; i < codearray.length - 4; i++) {
              if (parentcode == '') {
                parentcode = codearray[i];
              } else {
                parentcode = parentcode + '-' + codearray[i];
              }
            }
            if (parentcode == '') {
              parentcode = '00-00-00-00';
            } else {
              parentcode = parentcode + '-' + '00-00-00-00';
            }
          } else if (z == 4) {
            for (let i = 0; i < codearray.length - 5; i++) {
              if (parentcode == '') {
                parentcode = codearray[i];
              } else {
                parentcode = parentcode + '-' + codearray[i];
              }
            }
            if (parentcode == '') {
              parentcode = '00-00-00-00-00';
            } else {
              parentcode = parentcode + '-' + '00-00-00-00-00';
            }
          } else if (z == 5) {
            for (let i = 0; i < codearray.length - 6; i++) {
              if (parentcode == '') {
                parentcode = codearray[i];
              } else {
                parentcode = (await parentcode) + '-' + codearray[i];
              }
            }
            if (parentcode == '') {
              parentcode = '00-00-00-00-00-00';
            } else {
              parentcode = (await parentcode) + '-' + '00-00-00-00-00-00';
            }
          } else if (z == 6) {
            for (let i = 0; i < codearray.length - 7; i++) {
              if (parentcode == '') {
                parentcode = codearray[i];
              } else {
                parentcode = (await parentcode) + '-' + codearray[i];
              }
            }
            if (parentcode == '') {
              parentcode = '00-00-00-00-00-00-00';
            } else {
              parentcode = (await parentcode) + '-' + '00-00-00-00-00-00-00';
            }
          }
        }

        var codestr = '';
        for (let t = 0; t < codearray.length; t++) {
          if (codestr == '') {
            codestr = codearray[t];
          } else {
            codestr = codestr + '-' + codearray[t];
          }
        }

        let dto = {
          code: codestr,
          parentCode: parentcode.length < codestr.length ? parentcode + '-00' : parentcode,
          name: deneme[q][1],
          key: generateUuid(),
          isDeleted: false,
          isActive: true,
          canDelete: true,
          canDisplay: true,
        };

        newClassification.push(dto);
      }

      const realmName = 'Signum';
      ///////// the process start here

      let cypher = `Match (a:Infra {realm:"${realmName}"})-[:PARENT_OF]->(n:Classification {realm:"${realmName}"}) MERGE (b:${classificationName2}_${language} {code:"${newClassification[0].parentCode}",isActive: true,name:"${classificationName2}",isDeleted:${newClassification[i].isDeleted},canCopied:true,canDelete:false,realm:"${realmName}",isRoot:true,canDisplay:true,language:"${language}"}) MERGE (n)-[:PARENT_OF]->(b)`;
      let data = await this.neo4jService.write(cypher);

      for (let i = 0; i < newClassification.length; i++) {
        let cypher2 = `MATCH (n:${classificationName2}_${language}) where n.code="${newClassification[i].parentCode}" MERGE (b:${classificationName2}_${language} {code:"${newClassification[i].code}",parentCode:"${newClassification[i].parentCode}",name:"${newClassification[i].name}",isDeleted:${newClassification[i].isDeleted},isActive:${newClassification[i].isActive},canDelete:${newClassification[i].canDelete},canDisplay:${newClassification[i].canDisplay},language:"${language}"}) MERGE (n)-[:PARENT_OF]->(b)`;
        let data2 = await this.neo4jService.write(cypher2);
      }
    }

    /////////////////////////////////////////////////////////////// first three datas ////////////////////////////////////////////////////////////////
    // let deneme4 = []
    // const realmName="IFM"
    // function key(){
    //   return uuidv4()
    //   }

    //   for(let i=0;i<firstThree.length;i++){
    //     let deneme5=[];
    //      let dto ={}
    //     for (let index = 1; index < firstThree[i].length; index++) {

    //       dto={name:firstThree[i][index],isDeleted:false,isActive:true,canDelete:true}
    //       deneme5.push(dto);

    //     }
    //    deneme4.push(deneme5);
    //     }

    //     for(let i=0;i < deneme4.length;i++){
    //       let cypher= `match (n:Classification {realm:"${realmName}"}) MERGE (b:${deneme4[i][0].name} {name:"${deneme4[i][0].name}",isDeleted:${deneme4[i][0].isDeleted},key:"${deneme4[i][0].key}",realm:"${realmName}",canDelete:false,isActive:true})  MERGE (n)-[:PARENT_OF]->(b)`;
    //       await this.neo4jService.write(cypher);

    //       for (let index = 1; index < deneme4[i].length; index++) {

    //      //console.log(deneme4[i][0].name)
    //     let cypher3= `Match (n:${deneme4[i][0].name} {isDeleted:false}) MERGE (b {name:"${deneme4[i][index].name}",isDeleted:${deneme4[i][index].isDeleted},key:"${deneme4[i][index].key}",canDelete:${deneme4[i][index].canDelete},})  MERGE (n)-[:PARENT_OF]->(b)`;
    //      let data =await this.neo4jService.write(cypher3)
    //      console.log(data);
    //       }
    //     }

    //   }
    ////////////////////////////////////////////////////////////// the rest of the process //////////////////////////////////////////////////////////////////

    //  let deneme2 = []
    // function key2(){
    //   return uuidv4()
    //   }

    // for (let i = 0; i < others.length; i++) {
    //   let deneme3 = [];
    //     let dto ={}
    //   for (let index = 1; index < others[i].length; index++) {
    //   dto={name:others[i][index],isDeleted:false,isActive:true,canDelete:true}
    //     deneme3.push(dto);
    //   }
    //   deneme2.push(deneme3);
    // }

    //  for(let i=0;i<deneme2.length;i++){

    //   let cypher= `match (n:Classification {realm:"${realmName}"}) MERGE  (b:${deneme2[i][0].name}  {name:"${deneme2[i][0].name}",isDeleted:${deneme2[i][0].isDeleted},key:"${deneme2[i][0].key}",isActive:true,canDelete:false}) MERGE (n)-[:PARENT_OF]->(b)`;
    //   await this.neo4jService.write(cypher)

    //   for (let index = 1; index < deneme2[i].length; index++) {

    //         let cypher2= `Match  (n:${deneme2[i][0].name} {isDeleted:false}) MERGE (b {name:"${deneme2[i][index].name}",isDeleted:${deneme2[i][index].isDeleted},key:"${deneme2[i][index].key}",isActive:{deneme2[i][0].isActive},canDelete:{deneme2[i][0].canDelete}}) MERGE (n)-[:PARENT_OF]->(b)`;
    //       await this.neo4jService.write(cypher2)
    //   }
    //  }
    ////////////////////////////////
  }
}
