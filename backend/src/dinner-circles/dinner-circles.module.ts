import { Module } from '@nestjs/common';
import { DinnerCirclesController } from './dinner-circles.controller';
import { DinnerCirclesService } from './dinner-circles.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DinnerCirclesController],
  providers: [DinnerCirclesService],
  exports: [DinnerCirclesService],
})
export class DinnerCirclesModule {}
