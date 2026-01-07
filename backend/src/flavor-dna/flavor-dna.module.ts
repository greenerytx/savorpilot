import { Module } from '@nestjs/common';
import { FlavorDnaController } from './flavor-dna.controller';
import { FlavorDnaService } from './flavor-dna.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FlavorDnaController],
  providers: [FlavorDnaService],
  exports: [FlavorDnaService],
})
export class FlavorDnaModule {}
