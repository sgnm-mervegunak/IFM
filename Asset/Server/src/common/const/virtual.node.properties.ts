import { RelationName } from 'src/common/const/relation.name.enum';
import { Neo4jLabelEnum } from './neo4j.label.enum';

export const createKafkaTopicArray = [
  {
    type: 'createdBy',
    kafkaTopic: 'createContactRelation',
    relationNameForThisDatabase: RelationName.CREATED_BY,
    relationNameForTargetDatabase: RelationName.CREATED_BY,
    url: 'CONTACT_URL',
    labels: [Neo4jLabelEnum.CONTACT, Neo4jLabelEnum.VIRTUAL],
  },
  {
    type: 'manufacturer',
    kafkaTopic: 'createContactRelation',
    relationNameForThisDatabase: RelationName.MANUFACTURED_BY,
    relationNameForTargetDatabase: RelationName.MANUFACTURED_BY,
    url: 'CONTACT_URL',
    labels: [Neo4jLabelEnum.CONTACT, Neo4jLabelEnum.VIRTUAL],
  },
  {
    type: 'warrantyGuarantorLabor',
    kafkaTopic: 'createContactRelation',
    relationNameForThisDatabase: RelationName.WARRANTY_GUARANTOR_LABOR,
    relationNameForTargetDatabase: RelationName.WARRANTY_GUARANTOR_LABOR,
    url: 'CONTACT_URL',
    labels: [Neo4jLabelEnum.CONTACT, Neo4jLabelEnum.VIRTUAL],
  },
  {
    type: 'warrantyGuarantorParts',
    kafkaTopic: 'createContactRelation',
    relationNameForThisDatabase: RelationName.WARRANTY_GUARANTOR_PARTS,
    relationNameForTargetDatabase: RelationName.WARRANTY_GUARANTOR_PARTS,
    url: 'CONTACT_URL',
    labels: [Neo4jLabelEnum.CONTACT, Neo4jLabelEnum.VIRTUAL],
  },
  {
    type: 'space',
    kafkaTopic: 'createStructureRelation',
    relationNameForThisDatabase: RelationName.LOCATED_IN,
    relationNameForTargetDatabase: RelationName.HAS,
    url: 'STRUCTURE_URL',
    labels: [Neo4jLabelEnum.STRUCTURE, Neo4jLabelEnum.VIRTUAL],
  },
];

export const updateKafkaTopicArray = [
  {
    type: 'createdBy',
    kafkaTopic: 'updateContactRelation',
    relationNameForThisDatabase: RelationName.CREATED_BY,
    relationNameForTargetDatabase: RelationName.CREATED_BY,
    url: 'CONTACT_URL',
  },
  {
    type: 'manufacturer',
    kafkaTopic: 'updateContactRelation',
    relationNameForThisDatabase: RelationName.MANUFACTURED_BY,
    relationNameForTargetDatabase: RelationName.MANUFACTURED_BY,
    url: 'CONTACT_URL',
  },
  {
    type: 'warrantyGuarantorLabor',
    kafkaTopic: 'updateContactRelation',
    relationNameForThisDatabase: RelationName.WARRANTY_GUARANTOR_LABOR,
    relationNameForTargetDatabase: RelationName.WARRANTY_GUARANTOR_LABOR,
    url: 'CONTACT_URL',
  },
  {
    type: 'warrantyGuarantorParts',
    kafkaTopic: 'updateContactRelation',
    relationNameForThisDatabase: RelationName.WARRANTY_GUARANTOR_PARTS,
    relationNameForTargetDatabase: RelationName.WARRANTY_GUARANTOR_PARTS,
    url: 'CONTACT_URL',
  },
  {
    type: 'space',
    kafkaTopic: 'updateStructureRelation',
    relationNameForThisDatabase: RelationName.LOCATED_IN,
    relationNameForTargetDatabase: RelationName.HAS,
    url: 'STRUCTURE_URL',
  },
];

export const virtualProps = ['createdBy', 'manufacturer', 'warrantyGuarantorLabor', 'warrantyGuarantorParts', 'space'];
