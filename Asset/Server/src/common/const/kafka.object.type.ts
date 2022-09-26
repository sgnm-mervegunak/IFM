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
  newParentKey: string;
  url: string;
  relationName: string;
  virtualNodeLabels: string[];
};

export type UpdateKafka = {
  kafkaTopic: string;
  relationNameForThisDatabase: string;
  relationNameForTargetDatabase: string;
  url: string;
  newParentKey: string;
};

export type CreateKafka = {
  type: string;
  kafkaTopic: string;
  referenceKey: string;
  url: string;
  relationNameForThisDatabase: string;
  relationNameForTargetDatabase: string;
  labels: string[];
};
