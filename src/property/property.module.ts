import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { MailModule } from '../mail/mail.module';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';

@Module({
  imports: [PrismaModule, FirebaseModule, MailModule],
  providers: [PropertyService],
  controllers: [PropertyController],
})
export class PropertyModule {}
