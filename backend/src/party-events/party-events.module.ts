import { Module } from '@nestjs/common';
import { PartyEventsController } from './party-events.controller';
import { PartyEventsService } from './party-events.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartyEventsController],
  providers: [PartyEventsService],
  exports: [PartyEventsService],
})
export class PartyEventsModule {}
