import { Module } from '@nestjs/common';
import { ForkEnhancementsController } from './fork-enhancements.controller';
import { ForkEnhancementsService } from './fork-enhancements.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ForkEnhancementsController],
  providers: [ForkEnhancementsService],
  exports: [ForkEnhancementsService],
})
export class ForkEnhancementsModule {}
