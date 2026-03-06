import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [PrismaModule],
  providers: [ListingsService],
  controllers: [ListingsController],
})
export class ListingsModule {}
