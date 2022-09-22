import { RelationName } from 'src/common/const/relation.name.enum';
import { Neo4jLabelEnum } from './neo4j.label.enum';

export const createKafkaTopicArray = [
  {
    createdBy: 'createContactRelation',
    kafkaTopic: 'createContactRelation',
    relationNameForThisDatabase: RelationName.CREATED_BY,
    relationNameForTargetDatabase: RelationName.CREATED_BY,
    url: 'CONTACT_URL',
    labels: [Neo4jLabelEnum.CONTACT, Neo4jLabelEnum.VIRTUAL],
  },
  {
    manufacturer: 'createContactRelation',
    kafkaTopic: 'createContactRelation',
    relationNameForThisDatabase: RelationName.MANUFACTURED_BY,
    relationNameForTargetDatabase: RelationName.MANUFACTURED_BY,
    url: 'CONTACT_URL',
    labels: [Neo4jLabelEnum.CONTACT, Neo4jLabelEnum.VIRTUAL],
  },
  {
    warrantyGuarantorLabor: 'createContactRelation',
    kafkaTopic: 'createContactRelation',
    relationNameForThisDatabase: RelationName.WARRANTY_GUARANTOR_LABOR,
    relationNameForTargetDatabase: RelationName.WARRANTY_GUARANTOR_LABOR,
    url: 'CONTACT_URL',
    labels: [Neo4jLabelEnum.CONTACT, Neo4jLabelEnum.VIRTUAL],
  },
  {
    warrantyGuarantorParts: 'createContactRelation',
    kafkaTopic: 'createContactRelation',
    relationNameForThisDatabase: RelationName.WARRANTY_GUARANTOR_PARTS,
    relationNameForTargetDatabase: RelationName.WARRANTY_GUARANTOR_PARTS,
    url: 'CONTACT_URL',
    labels: [Neo4jLabelEnum.CONTACT, Neo4jLabelEnum.VIRTUAL],
  },
  {
    space: 'createStructureRelation',
    kafkaTopic: 'createStructureRelation',
    relationNameForThisDatabase: RelationName.LOCATED_IN,
    relationNameForTargetDatabase: RelationName.HAS,
    url: 'STRUCTURE_URL',
    labels: [Neo4jLabelEnum.STRUCTURE, Neo4jLabelEnum.VIRTUAL],
  },
];

export const updateKafkaTopicArray = [
  {
    createdBy: 'updateContactRelation',
    relationNameForThisDatabase: RelationName.CREATED_BY,
    relationNameForTargetDatabase: RelationName.CREATED_BY,
    url: 'CONTACT_URL',
  },
  {
    manufacturer: 'updateContactRelation',
    kafkaTopic: 'updateContactRelation',
    relationNameForThisDatabase: RelationName.MANUFACTURED_BY,
    relationNameForTargetDatabase: RelationName.WARRANTY_GUARANTOR_LABOR,
    url: 'CONTACT_URL',
  },
  {
    warrantyGuarantorLabor: 'updateContactRelation',
    kafkaTopic: 'updateContactRelation',
    relationNameForThisDatabase: RelationName.WARRANTY_GUARANTOR_LABOR,
    relationNameForTargetDatabase: RelationName.WARRANTY_GUARANTOR_LABOR,
    url: 'CONTACT_URL',
  },
  {
    warrantyGuarantorParts: 'updateContactRelation',
    kafkaTopic: 'updateContactRelation',
    relationNameForThisDatabase: RelationName.WARRANTY_GUARANTOR_PARTS,
    relationNameForTargetDatabase: RelationName.WARRANTY_GUARANTOR_LABOR,
    url: 'CONTACT_URL',
  },
  {
    space: 'updateStructureRelation',
    kafkaTopic: 'updateStructureRelation',
    relationNameForThisDatabase: RelationName.HAS,
    relationNameForTargetDatabase: RelationName.LOCATED_IN,
    url: 'STRUCTURE_URL',
  },
];

export const virtualProps = ['createdBy', 'manufacturer', 'warrantyGuarantorLabor', 'warrantyGuarantorParts', 'space'];
