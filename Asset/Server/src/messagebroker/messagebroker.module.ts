import { Module } from '@nestjs/common';
import { MessagebrokerController } from './messagebroker.controller';


@Module({
  // imports: [HistoryModule],
  controllers: [MessagebrokerController],
})
export class MessagebrokerModule {}
