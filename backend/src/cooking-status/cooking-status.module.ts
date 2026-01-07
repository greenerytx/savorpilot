import { Module } from '@nestjs/common';
import { CookingStatusController } from './cooking-status.controller';
import { CookingStatusService } from './cooking-status.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CookingStatusController],
  providers: [CookingStatusService],
  exports: [CookingStatusService],
})
export class CookingStatusModule {}
