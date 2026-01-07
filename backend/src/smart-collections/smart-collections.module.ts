import { Module } from '@nestjs/common';
import { SmartCollectionsController } from './smart-collections.controller';
import { SmartCollectionsService } from './smart-collections.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SmartCollectionsController],
  providers: [SmartCollectionsService],
  exports: [SmartCollectionsService],
})
export class SmartCollectionsModule {}
