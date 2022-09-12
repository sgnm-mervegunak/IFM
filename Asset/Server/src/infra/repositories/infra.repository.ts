/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpException, Injectable } from '@nestjs/common';
import { NestKafkaService } from 'ifmcommon';
import { Neo4jService } from 'sgnm-neo4j/dist';
import { InfraInterface } from 'src/common/interface/infra.interface';

@Injectable()
export class InfraRepository implements InfraInterface {
  constructor(private readonly neo4jService: Neo4jService, private readonly kafkaService: NestKafkaService) {}
  async createConstraints() {
    const neo4Transaction = await this.neo4jService.beginTransaction();
    const constraintArr = [
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:Infra) ASSERT  (node.realm) IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:Types) ASSERT  (node.realm) IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:Type) ASSERT  (node.name) IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:Root) ASSERT  (node.realm) IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS ON (node:Classification) ASSERT  (node.realm) IS UNIQUE',
    ];

    constraintArr.forEach((element) => {
      neo4Transaction
        .run(element)
        .then((res) => {})
        .catch((err) => {
          console.log(err);
          neo4Transaction.rollback();
          throw new HttpException(err, 400);
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
  async create() {
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
    await this.neo4jService.addParentRelationByIdAndFilters(
      classificationNode.identity.low,
      {},
      infraNode.identity.low,
      {},
    );
    await this.neo4jService.addParentRelationByIdAndFilters(typeNode.identity.low, {}, infraNode.identity.low, {});
    await this.neo4jService.addParentRelationByIdAndFilters(configNode.identity.low, {}, infraNode.identity.low, {});


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
   
    await this.neo4jService.addParentRelationByIdAndFilters(
      languageConfigNode.identity.low,
      {},
      configNode.identity.low,
      {},
    );

    const languageTRNode = await this.neo4jService.createNode(
      {
        canDelete: true,
        isDeleted: false,
        name: 'TR',
        realm: 'Signum',
        isActive: true,
      },
      [],
    );

  
    const languageENNode = await this.neo4jService.createNode(
      {
        canDelete: true,
        isDeleted: false,
        name: 'EN',
        realm: 'Signum',
        isActive: true,
      },
      [],
    );
    await this.neo4jService.addParentRelationByIdAndFilters(
      languageTRNode.identity.low,
      {},
      languageConfigNode.identity.low,
      {},
    );
    await this.neo4jService.addParentRelationByIdAndFilters(
      languageENNode.identity.low,
      {},
      languageConfigNode.identity.low,
      {},
    );


    //-----AssetTypes------
    const assetTypesNode = await this.neo4jService.createNode(
      { canDelete: false, isDeleted: false, name: 'Types', realm: 'Signum' },
      ['AssetTypes'],
    );

    await this.neo4jService.addParentRelationByIdAndFilters(
      assetTypesNode.identity.low,
      {},
      classificationNode.identity.low,
      {},
    );

      const fixedAssetTypeNode = await this.neo4jService.createNode(
      {
        canDelete: true,
        isDeleted: false,
        name: 'fixed',
        isActive: true,
      },
      ['AssetType'],
    );
    const moveableAssetTypeNode = await this.neo4jService.createNode(
      {
        canDelete: true,
        isDeleted: false,
        name: 'moveable',
        isActive: true,
      },
      ['AssetType'],
    );

    await this.neo4jService.addParentRelationByIdAndFilters(
      fixedAssetTypeNode.identity.low,
      {},
      assetTypesNode.identity.low,
      {},
    );

    await this.neo4jService.addParentRelationByIdAndFilters(
      moveableAssetTypeNode.identity.low,
      {},
      assetTypesNode.identity.low,
      {},
    );


    return infraNode;
  }

  importClassificationFromExcel(file: Express.Multer.File, language: string) {
    throw new Error('Method not implemented.');
  }
}
