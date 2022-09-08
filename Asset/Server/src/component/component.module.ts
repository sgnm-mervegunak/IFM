import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { ComponentListenerController } from './controllers/component.listener';
import { ComponentController } from './controllers/component.controller';
import { ComponentRepository } from './repositories/component.repository';
import { ComponentService } from './services/component.service';

@Module({
  imports: [HttpModule],
  controllers: [ComponentController, ComponentListenerController],
  providers: [
    ComponentService,
    {
      provide: RepositoryEnums.COMPONENTS,
      useClass: ComponentRepository,
    },
  ],
  exports: [ComponentService],
})
export class ComponentModule {}
