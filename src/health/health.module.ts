import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { FirebaseModule } from '../firebase/firebase.module';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FirebaseHealthIndicator } from './indicators/firebase.health';
import { MailHealthIndicator } from './indicators/mail.health';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, FirebaseModule, MailModule, PrismaModule],
  controllers: [HealthController],
  providers: [
    FirebaseHealthIndicator,
    MailHealthIndicator,
    PrismaHealthIndicator,
  ],
})
export class HealthModule {}
