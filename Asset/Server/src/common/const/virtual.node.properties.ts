import { RelationName } from 'src/common/const/relation.name.enum';

export const createKafkaTopicArray = [
  {
    createdBy: 'createContactRelation',
    kafkaTopic: 'createContactRelation',
    relationName: RelationName.CREATED_OF,
    url: 'CONTACT_URL',
  },
  {
    manufacturer: 'createContactRelation',
    kafkaTopic: 'createContactRelation',
    relationName: RelationName.MANUFACTURED_BY,
    url: 'CONTACT_URL',
  },
  {
    warrantyGuarantorLabor: 'createContactRelation',
    kafkaTopic: 'createContactRelation',
    relationNameForThisDatabase: RelationName.WARRANTY_GUARANTOR_LABOR,
    relationNameForTargetDatabase: RelationName.WARRANTY_GUARANTOR_LABOR,
    url: 'CONTACT_URL',
  },
  {
    warrantyGuarantorParts: 'createContactRelation',
    kafkaTopic: 'createContactRelation',
    relationNameForThisDatabase: RelationName.WARRANTY_GUARANTOR_PARTS,
    url: 'CONTACT_URL',
  },
  {
    space: 'createStructureRelation',
    kafkaTopic: 'createStructureRelation',
    relationName: RelationName.HAS,
    url: 'STRUCTURE_URL',
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
