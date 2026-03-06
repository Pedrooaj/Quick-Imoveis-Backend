import { Module } from '@nestjs/common';
import { CorretoresController } from './corretores.controller';
import { CorretoresService } from './corretores.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CorretoresController],
  providers: [CorretoresService],
})
export class CorretoresModule {}
