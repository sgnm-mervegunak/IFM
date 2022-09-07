import { HttpService } from '@nestjs/axios';
import { Controller, HttpException } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Unprotected } from 'nest-keycloak-connect';
import { catchError, map } from 'rxjs';
import { assignDtoPropToEntity, Neo4jService } from 'sgnm-neo4j/dist';
import { generateUuid } from 'src/common/const/kafka.conf';
import { Neo4jLabelEnum } from 'src/common/const/neo4j.label.enum';
import { Facility } from './entities/facility.entity';

@Controller('organizationListener')
@Unprotected()
export class OrganizationListenerController {
  constructor(private readonly neo4jService: Neo4jService, private readonly httpService: HttpService) {}

  @EventPattern('createFacility')
  async createFacilityListener(@Payload() message) {
    const facilityInfo = message.value;

    const realm = facilityInfo.realm;

    await this.httpService
      .get(`${process.env.STRUCTURE_URL}/${facilityInfo.key}`)
      .pipe(
        catchError(() => {
          throw new HttpException('connection refused due to connection lost or wrong data provided', 502);
        }),
      )
      .pipe(map((response) => response.data));

    const facility = new Facility();
    facility.realm = realm;
    const asset = new Facility();
    asset.realm = realm;
    const structure = new Facility();
    structure.realm = realm;
    const classification = new Facility();
    classification.realm = realm;
    const assetTypes = new Facility();
    assetTypes.realm = realm;
    const contact = new Facility();
    contact.realm = realm;
    const config = new Facility();
    config.realm = realm;

    const AssetTypeInfo = {
      name: 'AssetTypes',
    };

    const organizationInfo = {
      name: facilityInfo.name,
    };

    const classificationInfo = {
      name: facilityInfo.name,
    };

    const assetInfo = {
      name: facilityInfo.name,
    };

    const contactInfo = {
      name: 'Contact',
    };
    const configInfo = {
      name: 'Config',
    };

    const finalOrganizationObject = assignDtoPropToEntity(facility, organizationInfo);
    const finalAssetObject = assignDtoPropToEntity(asset, assetInfo);
    const finalClassificationObject = assignDtoPropToEntity(classification, classificationInfo);
    const finalAssetTypesObject = assignDtoPropToEntity(assetTypes, AssetTypeInfo);
    const finalContactObject = assignDtoPropToEntity(contact, contactInfo);
    const finalConfigObject = assignDtoPropToEntity(config, configInfo);

    //create  node with multi or single label
    const organizationNode = await this.neo4jService.createNode(finalOrganizationObject, [Neo4jLabelEnum.ROOT]);
    const assetNode = await this.neo4jService.createNode(finalAssetObject, [Neo4jLabelEnum.ASSET]);
    const classificationNode = await this.neo4jService.createNode(finalClassificationObject, [
      Neo4jLabelEnum.CLASSIFICATION,
    ]);
    const assetTypeNode = await this.neo4jService.createNode(finalAssetTypesObject, [Neo4jLabelEnum.ASSET_TYPES]);
    const contactNode = await this.neo4jService.createNode(finalContactObject, [Neo4jLabelEnum.CONTACT]);
    const configNode = await this.neo4jService.createNode(finalConfigObject, [Neo4jLabelEnum.SYSTEM_CONFIG]);
    await this.neo4jService.addParentRelationByIdAndFilters(
      classificationNode.identity.low,
      {},
      organizationNode.identity.low,
      {},
    );
    await this.neo4jService.addParentRelationByIdAndFilters(
      assetNode.identity.low,
      {},
      organizationNode.identity.low,
      {},
    );
    await this.neo4jService.addParentRelationByIdAndFilters(
      assetTypeNode.identity.low,
      {},
      organizationNode.identity.low,
      {},
    );
    await this.neo4jService.addParentRelationByIdAndFilters(
      contactNode.identity.low,
      {},
      organizationNode.identity.low,
      {},
    );
    await this.neo4jService.addParentRelationByIdAndFilters(
      configNode.identity.low,
      {},
      organizationNode.identity.low,
      {},
    );

    const types = new Facility();
    types.realm = realm;
    const typesInfo = {
      name: 'Tpes',
    };
    const finalTypesObject = assignDtoPropToEntity(types, typesInfo);
    const typesNode = await this.neo4jService.createNode(finalTypesObject, [Neo4jLabelEnum.TYPES]);

    await this.neo4jService.addParentRelationByIdAndFilters(typesNode.identity.low, {}, assetNode.identity.low, {});

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
        await this.neo4jService.addParentRelationByIdAndFilters(
          createdNodes.identity.low,
          {},
          targetRealmNode[0].get('n').identity.low,
          {},
        );
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
  }
}
