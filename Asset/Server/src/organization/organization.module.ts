import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { OrganizationListenerController } from './organization.listener';

@Module({
  imports: [HttpModule],
  controllers: [OrganizationListenerController],
})
export class OrganizationModule {}
