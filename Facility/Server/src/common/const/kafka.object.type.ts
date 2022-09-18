export type CreateKafkaObject = {
  referenceKey: string;
  parentKey: string;
  url: string;
  relationName: string;
  virtualNodeLabels: string[];
};

export type UpdateKafkaObject = {
  referenceKey: string;
  exParentKey: string;
  newParentKey:string;
  url: string;
  relationName: string;
  virtualNodeLabels: string[];
};