import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { BasePersistantDocumentObject } from 'src/common/baseObject/base.object';

export type FacilityDocument = FacilityHistory & Document;

@Schema()
export class FacilityHistory extends BasePersistantDocumentObject {
  @Prop({ type: Object })
  facility: object;
}

export const FaciliyHistorySchema = SchemaFactory.createForClass(FacilityHistory);
