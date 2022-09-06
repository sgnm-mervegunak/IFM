import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AssetModule } from 'src/asset/asset.module';
import { OrganizationListenerController } from './organization.listener';

@Module({
  imports: [AssetModule, HttpModule],
  controllers: [OrganizationListenerController],
})
export class OrganizationModule {}
