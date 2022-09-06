import { KafkaConfig } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

export const kafkaConf: KafkaConfig = {
  brokers: [process.env.KAFKA_BROKER],
  clientId: process.env.KAFKA_CLIENT,
};

export function generateUuid() {
  return uuidv4();
}
