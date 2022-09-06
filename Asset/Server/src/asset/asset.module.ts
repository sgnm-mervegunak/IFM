import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AssetListenerController } from './controllers/asset.listener';

@Module({
  imports: [HttpModule],
  controllers: [AssetListenerController],
  providers: [],
  exports: [],
})
export class AssetModule {}
