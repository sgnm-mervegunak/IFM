import { Module } from '@nestjs/common';
import { RepositoryEnums } from 'src/common/const/repository.enum';
import { HttpModule } from '@nestjs/axios';
import { ContactController } from './controllers/contact.controller';
import { ContactService } from './services/contact.service';
import { ContactRepository } from './repositories/contact.repository';
import { ContactListenerController } from './controllers/contact.listener';
import { SearchStringRepository } from 'src/common/class/search.string.from.nodes.dealer';

@Module({
  imports: [HttpModule],
  controllers: [ContactController, ContactListenerController],
  providers: [
    ContactService,
    {
      provide: RepositoryEnums.CONTACT,
      useClass: ContactRepository,
    },
    {
      provide:SearchStringRepository,
      useClass: SearchStringRepository,
    },
  ],
  exports: [ContactService],
})
export class ContactModule {}
